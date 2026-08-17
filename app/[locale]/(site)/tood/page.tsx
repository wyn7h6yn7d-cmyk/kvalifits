/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import { JobsSearch } from "@/components/jobs/JobsSearch";
import { JobSearchSkeleton } from "@/components/skeletons/JobSearchSkeleton";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Job } from "@/components/jobs/types";
import { enrichJobsWithSeekerMatch } from "@/lib/jobs/enrichJobsWithSeekerMatch";
import { fetchSavedJobIdsForUser } from "@/lib/jobs/savedJobs";
import type { SeekerCertificateInput, SeekerMatchInput } from "@/lib/matching/calculateJobMatch";
import { experienceBackgroundFromDb } from "@/lib/seeker/experienceBackground";
import { formatJobSalaryDisplay, isJobSalaryPeriod, isJobSalaryTax } from "@/lib/jobs/jobSalary";
import {
  jobPassesYoungSeekerAutoEligibility,
  jobWorkConditionsFromJobRow,
} from "@/lib/employmentRules";
import { isEmployerCompanyVerified } from "@/lib/employer/companyVerification";
import { NOINDEX_FOLLOW, publicPageMetadata, searchParamsIndicateDuplicateLanding } from "@/lib/seo/site";
import { deactivateExpiredJobPosts } from "@/lib/jobs/deactivateExpiredJobs";
import { jobAcceptsApplications } from "@/lib/jobs/jobLifecycle";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Always query Supabase at request time (session + RLS); avoids stale empty listings.
export const dynamic = "force-dynamic";

function normFacetValue(s: string) {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\u2011\u2010\u2212]/g, "-");
}

function extractSummary(description: string | null | undefined) {
  const raw = (description ?? "").toString().trim();
  if (!raw) return undefined;

  const firstBlock = raw.split(/\n\s*\n/)[0]?.trim() ?? "";
  if (!firstBlock) return undefined;

  // EmployerNewJobForm prefixes summary like: "Kokkuvõte: ..." or "Summary: ..."
  const cleaned = firstBlock
    .replace(/^(Kokkuvõte|Summary)\s*:\s*/i, "")
    .trim();

  return cleaned || undefined;
}

function foldAscii(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function mapWorkType(raw: string, tJobs: (key: string) => string) {
  const v = raw.trim();
  if (!v) return undefined;
  const key = v.toLowerCase().replace(/-/g, "_");
  if (key === "on_site" || key === "onsite") return tJobs("workTypeOnSite");
  if (key === "hybrid") return tJobs("workTypeHybrid");
  if (key === "remote") return tJobs("workTypeRemote");

  const c = foldAscii(v).replace(/\s+/g, "");
  if (c === "kohapeal" || c === "kohapealne") return tJobs("workTypeOnSite");
  if (c === "hubriid" || c === "hybrid") return tJobs("workTypeHybrid");
  if (c === "kaugtoo" || c === "remote") return tJobs("workTypeRemote");

  return v;
}

function mapJobType(raw: string, tJobs: (key: string) => string) {
  const v = raw.trim();
  if (!v) return undefined;
  const key = v.toLowerCase().replace(/-/g, "_");
  if (key === "full_time") return tJobs("jobTypeFullTime");
  if (key === "part_time") return tJobs("jobTypePartTime");
  if (key === "contract") return tJobs("jobTypeContract");
  if (key === "internship") return tJobs("jobTypeInternship");

  const c = foldAscii(v).replace(/\s+/g, "");
  if (c === "taistooaeg" || c === "fulltime") return tJobs("jobTypeFullTime");
  if (c === "osaline" || c === "parttime") return tJobs("jobTypePartTime");
  if (c === "lepinguline") return tJobs("jobTypeContract");
  if (c === "praktika") return tJobs("jobTypeInternship");

  return v;
}

function formatJobSalary(
  min: number | null,
  max: number | null,
  currency: string,
  locale: string,
  tax: string | null,
  period: string | null,
  tJobs: (key: string) => string,
): string | undefined {
  const taxKey = isJobSalaryTax(tax) ? tax : null;
  const periodKey = isJobSalaryPeriod(period) ? period : null;
  return formatJobSalaryDisplay({
    min,
    max,
    currency,
    tax: taxKey,
    period: periodKey,
    locale,
    taxLabel: taxKey ? tJobs(`jobSalaryTaxShort.${taxKey}`) : "",
    periodLabel: periodKey ? tJobs(`jobSalaryPeriodOption.${periodKey}`) : "",
  });
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: "pages.jobs" });
  return publicPageMetadata({
    locale,
    path: "/tood",
    title: t("title"),
    description: t("description"),
    robots: searchParamsIndicateDuplicateLanding(sp) ? NOINDEX_FOLLOW : undefined,
  });
}

export default async function ToodPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("pages.jobs");
  const tJobs = await getTranslations({ locale, namespace: "jobs" });
  await deactivateExpiredJobPosts();
  const supabase = await createSupabaseServerClient();

  const selectCard =
    "id,title,location,job_type,work_type,short_summary,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,salary_tax,salary_period,employer_profile_id,status,created_at,published_at,application_deadline,expires_at,experience_level_required,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work";
  const selectLegacy =
    "id,title,location,job_type,work_type,short_summary,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,employer_profile_id,status,created_at,experience_level_required";
  const selectMid =
    "id,title,location,job_type,work_type,short_summary,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,salary_tax,salary_period,employer_profile_id,status,created_at,experience_level_required";

  let { data: jobs, error: jobsErr } = await supabase
    .from("job_posts")
    .select(selectCard)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(200);

  if (jobsErr && /published_at|application_deadline|expires_at|column/i.test(jobsErr.message ?? "")) {
    const mid = await supabase
      .from("job_posts")
      .select(selectMid)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(200);
    jobs = mid.data as typeof jobs;
    jobsErr = mid.error;
  }
  if (jobsErr && /weekly_hours|daily_hours|shift_|includes_night|is_hazardous|column/i.test(jobsErr.message ?? "")) {
    const mid = await supabase
      .from("job_posts")
      .select(selectMid)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(200);
    jobs = mid.data as typeof jobs;
    jobsErr = mid.error;
  }
  if (jobsErr && /salary_tax|salary_period|column/i.test(jobsErr.message ?? "")) {
    const fallback = await supabase
      .from("job_posts")
      .select(selectLegacy)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(200);
    jobs = fallback.data as typeof jobs;
    jobsErr = fallback.error;
  }
  if (jobsErr) throw jobsErr;

  jobs = (jobs ?? []).filter((j: any) =>
    jobAcceptsApplications({
      status: j.status,
      published_at: j.published_at ?? null,
      application_deadline: j.application_deadline ?? null,
      expires_at: j.expires_at ?? null,
    })
  );

  const employerIds = Array.from(
    new Set((jobs ?? []).map((j: any) => j.employer_profile_id).filter(Boolean))
  ) as string[];

  let employerRows: any[] = [];
  if (employerIds.length) {
    const withVerif = await supabase
      .from("employer_profiles")
      .select("id,company_name,logo_url,company_verified,verification_status,industry,public_slug")
      .in("id", employerIds);
    if (withVerif.error && /public_slug/i.test(withVerif.error.message ?? "")) {
      const noSlug = await supabase
        .from("employer_profiles")
        .select("id,company_name,logo_url,company_verified,verification_status,industry")
        .in("id", employerIds);
      if (noSlug.error) {
        const mid = await supabase
          .from("employer_profiles")
          .select("id,company_name,logo_url,industry")
          .in("id", employerIds);
        if (mid.error) {
          const fallback = await supabase
            .from("employer_profiles")
            .select("id,company_name,logo_url")
            .in("id", employerIds);
          employerRows = (fallback.data ?? []) as any[];
        } else {
          employerRows = (mid.data ?? []) as any[];
        }
      } else {
        employerRows = (noSlug.data ?? []) as any[];
      }
    } else if (withVerif.error) {
      const mid = await supabase
        .from("employer_profiles")
        .select("id,company_name,logo_url,industry")
        .in("id", employerIds);
      if (mid.error) {
        const fallback = await supabase
          .from("employer_profiles")
          .select("id,company_name,logo_url")
          .in("id", employerIds);
        employerRows = (fallback.data ?? []) as any[];
      } else {
        employerRows = (mid.data ?? []) as any[];
      }
    } else {
      employerRows = (withVerif.data ?? []) as any[];
    }
  }

  const employerById = new Map(
    employerRows.map((e: any) => [
      e.id,
      {
        name: (e.company_name ?? "—").toString(),
        logoUrl: (e.logo_url ?? "").toString().trim() || null,
        verified: isEmployerCompanyVerified({
          company_verified: e.company_verified,
          verification_status: e.verification_status,
        }),
        industry: normFacetValue((e.industry ?? "").toString()) || null,
        slug: (e.public_slug ?? "").toString().trim() || null,
      },
    ])
  );

  let mapped: Job[] = (jobs ?? []).map((j: any) => {
    const min = typeof j.salary_min === "number" ? j.salary_min : null;
    const max = typeof j.salary_max === "number" ? j.salary_max : null;
    const currency = (j.salary_currency ?? "EUR").toString();
    const salary = formatJobSalary(
      min,
      max,
      currency,
      locale,
      (j.salary_tax ?? null) as string | null,
      (j.salary_period ?? null) as string | null,
      tJobs
    );

    const jobType = mapJobType((j.job_type ?? "").toString(), tJobs);
    const workType = mapWorkType((j.work_type ?? "").toString(), tJobs);
    const type = [workType, jobType].filter(Boolean).join(" · ") || "—";

    const summary = (j.short_summary ?? "").toString().trim() || undefined;
    const kw = ((j.keywords as string[] | null) ?? []).map((x) => normFacetValue(x)).filter(Boolean);
    const skills = ((j.required_skills as string[] | null) ?? [])
      .map((x) => normFacetValue(x))
      .filter(Boolean);
    // Card tags may include keywords for display; skill facets use `skills` only.
    const tags = Array.from(new Set([...skills, ...kw])).slice(0, 10);

    const certReq = (j.certificate_requirements ?? "").toString().trim();
    const requiredCerts = certReq
      ? certReq
          .split(/[,;\n]/g)
          .map((s: string) => normFacetValue(s))
          .filter(Boolean)
          .slice(0, 8)
      : [];

    const emp = employerById.get(j.employer_profile_id);
    const experienceLevel = (j.experience_level_required ?? "").toString().trim() || null;
    const domains = emp?.industry ? [emp.industry] : [];

    return {
      id: j.id,
      title: (j.title ?? "").toString().trim() || "—",
      company: emp?.name ?? "—",
      companyLogoUrl: emp?.logoUrl ?? null,
      companyVerified: emp?.verified === true,
      companySlug: emp?.slug ?? null,
      location: normFacetValue((j.location ?? "").toString()) || "—",
      type,
      salary,
      salaryMin: min,
      salaryMax: max,
      workType,
      jobType,
      summary,
      createdAt: j.created_at ?? undefined,
      publishedAt: j.published_at ?? j.created_at ?? null,
      applicationDeadline: j.application_deadline ?? null,
      tags,
      skills,
      requiredCerts,
      domains,
      languages: [],
      experienceLevel,
      openToFirstJob: experienceLevel === "not_required",
      suitableForYoungSeeker: jobPassesYoungSeekerAutoEligibility(
        jobWorkConditionsFromJobRow({
          job_type: j.job_type ?? null,
          weekly_hours: toNumOrNull(j.weekly_hours),
          daily_hours: toNumOrNull(j.daily_hours),
          shift_start: j.shift_start ?? null,
          shift_end: j.shift_end ?? null,
          includes_night_work:
            j.includes_night_work === null || j.includes_night_work === undefined
              ? null
              : Boolean(j.includes_night_work),
          is_hazardous_work:
            j.is_hazardous_work === null || j.is_hazardous_work === undefined
              ? null
              : Boolean(j.is_hazardous_work),
        })
      ),
    };
  });

  const missingSummaryIds = mapped.filter((j) => !j.summary).map((j) => j.id);
  if (missingSummaryIds.length) {
    const { data: descRows } = await supabase
      .from("job_posts")
      .select("id,description")
      .in("id", missingSummaryIds);
    const summaryById = new Map(
      (descRows ?? []).map((row: { id: string; description?: string | null }) => {
        const raw = (row.description ?? "").toString();
        const clipped = raw.length > 2500 ? raw.slice(0, 2500) : raw;
        return [row.id, extractSummary(clipped)] as const;
      }),
    );
    mapped = mapped.map((job) =>
      job.summary ? job : { ...job, summary: summaryById.get(job.id) },
    );
  }

  const rawById = new Map((jobs ?? []).map((j: any) => [j.id as string, j as Record<string, unknown>]));

  let matchSortAvailable = false;
  let jobsForSearch = mapped;
  let savedJobIds: string[] = [];
  let canSaveJobs = true;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const role = profile?.role ?? user.user_metadata?.role ?? null;

    if (role && role !== "seeker") canSaveJobs = false;

    if (role === "seeker") {
      const { data: seekerRow } = await supabase
        .from("seeker_profiles")
        .select(
          "full_name,profile_title,location,about,skills,experience_level,preferred_job_types,preferred_locations,has_b_category_drivers_license,pref_full_time,pref_part_time,pref_remote_work,pref_hybrid_work,pref_on_site_work,pref_desired_weekly_hours,pref_min_weekly_hours,pref_max_weekly_hours,exp_seeking_first_job,exp_is_student,exp_has_internship,exp_has_volunteer,exp_has_project,exp_has_prior_work,experience_duration_years,languages",
        )
        .eq("user_id", user.id)
        .maybeSingle();

      const seekerInput: SeekerMatchInput | null = seekerRow
        ? {
            profile_title: (seekerRow.profile_title ?? null) as string | null,
            full_name: (seekerRow.full_name ?? null) as string | null,
            location: (seekerRow.location ?? null) as string | null,
            about: (seekerRow.about ?? null) as string | null,
            skills: (seekerRow.skills as string[] | null) ?? null,
            experience_level: (seekerRow.experience_level ?? null) as string | null,
            preferred_job_types: (seekerRow.preferred_job_types as string[] | null) ?? null,
            preferred_locations: (seekerRow.preferred_locations as string[] | null) ?? null,
            has_b_category_drivers_license: seekerRow.has_b_category_drivers_license ?? null,
            experience_background: experienceBackgroundFromDb(seekerRow),
            languages: (seekerRow.languages as string[] | null) ?? null,
            pref_desired_weekly_hours: seekerRow.pref_desired_weekly_hours ?? null,
            pref_min_weekly_hours: seekerRow.pref_min_weekly_hours ?? null,
            pref_max_weekly_hours: seekerRow.pref_max_weekly_hours ?? null,
            pref_full_time: seekerRow.pref_full_time ?? null,
            pref_part_time: seekerRow.pref_part_time ?? null,
            pref_remote_work: seekerRow.pref_remote_work ?? null,
            pref_hybrid_work: seekerRow.pref_hybrid_work ?? null,
            pref_on_site_work: seekerRow.pref_on_site_work ?? null,
          }
        : null;

      const { data: certRows } = await supabase
        .from("seeker_certificates")
        .select("certificate_name,certificate_issuer,certificate_valid_until")
        .eq("user_id", user.id);

      const certs: SeekerCertificateInput[] = (certRows ?? []).map((c) => ({
        certificate_name: c.certificate_name ?? null,
        certificate_issuer: c.certificate_issuer ?? null,
        certificate_valid_until: c.certificate_valid_until ?? null,
      }));

      const jobIds = mapped.map((j) => j.id);
      if (jobIds.length) {
        const matchFull = await supabase
          .from("job_posts")
          .select("id,description,requirements,requirement_lines,job_requirements")
          .in("id", jobIds);
        const matchRows =
          matchFull.error && /job_requirements|requirement_lines|column/i.test(matchFull.error.message ?? "")
            ? await supabase.from("job_posts").select("id,description,requirements").in("id", jobIds)
            : matchFull;
        if (!matchRows.error) {
          for (const row of matchRows.data ?? []) {
            const id = (row as { id: string }).id;
            const prev = rawById.get(id) ?? {};
            rawById.set(id, { ...prev, ...(row as Record<string, unknown>) });
          }
        }
      }

      const enriched = enrichJobsWithSeekerMatch(mapped, rawById, seekerInput, certs);
      jobsForSearch = enriched.jobs;
      matchSortAvailable = enriched.matchSortAvailable;
      savedJobIds = await fetchSavedJobIdsForUser(supabase, user.id);
    }
  }

  return (
    <>
      <Suspense fallback={<JobSearchSkeleton />}>
        <JobsSearch
          jobs={jobsForSearch}
          pageTitle={t("title")}
          matchSortAvailable={matchSortAvailable}
          savedJobIds={savedJobIds}
          canSaveJobs={canSaveJobs}
        />
      </Suspense>
    </>
  );
}

function toNumOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
