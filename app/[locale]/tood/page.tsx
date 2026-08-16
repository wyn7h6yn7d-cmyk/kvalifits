/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { PageHero } from "@/components/site/PageHero";
import { JobsSearch } from "@/components/jobs/JobsSearch";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Job } from "@/components/jobs/types";
import { formatJobSalaryDisplay, isJobSalaryPeriod, isJobSalaryTax } from "@/lib/jobs/jobSalary";
import {
  jobPassesYoungSeekerAutoEligibility,
  jobWorkConditionsFromJobRow,
} from "@/lib/employmentRules";
import { isEmployerCompanyVerified } from "@/lib/employer/companyVerification";
import { publicPageMetadata } from "@/lib/seo/site";
import { deactivateExpiredJobPosts } from "@/lib/jobs/deactivateExpiredJobs";
import { jobAcceptsApplications } from "@/lib/jobs/jobLifecycle";

type Props = { params: Promise<{ locale: string }> };

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

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pages.jobs" });
  return publicPageMetadata({
    locale,
    path: "/tood",
    title: t("title"),
    description: t("description"),
  });
}

export default async function ToodPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("pages.jobs");
  const tJobs = await getTranslations({ locale, namespace: "jobs" });
  await deactivateExpiredJobPosts();
  const supabase = await createSupabaseServerClient();

  const selectFull =
    "id,title,location,job_type,work_type,short_summary,description,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,salary_tax,salary_period,employer_profile_id,status,created_at,published_at,application_deadline,expires_at,experience_level_required,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work";
  const selectLegacy =
    "id,title,location,job_type,work_type,short_summary,description,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,employer_profile_id,status,created_at,experience_level_required";
  const selectMid =
    "id,title,location,job_type,work_type,short_summary,description,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,salary_tax,salary_period,employer_profile_id,status,created_at,experience_level_required";

  let { data: jobs, error: jobsErr } = await supabase
    .from("job_posts")
    .select(selectFull)
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
      .select("id,company_name,logo_url,company_verified,verification_status")
      .in("id", employerIds);
    if (withVerif.error) {
      const fallback = await supabase
        .from("employer_profiles")
        .select("id,company_name,logo_url")
        .in("id", employerIds);
      employerRows = (fallback.data ?? []) as any[];
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
      },
    ])
  );

  const mapped: Job[] = (jobs ?? []).map((j: any) => {
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

    const rawDesc = (j.description ?? "").toString();
    const descForSummary = rawDesc.length > 2500 ? rawDesc.slice(0, 2500) : rawDesc;
    const summary =
      (j.short_summary ?? "").toString().trim() || extractSummary(descForSummary);
    const kw = ((j.keywords as string[] | null) ?? []).map((x) => normFacetValue(x)).filter(Boolean);
    const skills = ((j.required_skills as string[] | null) ?? [])
      .map((x) => normFacetValue(x))
      .filter(Boolean);
    const tags = Array.from(new Set([...kw, ...skills])).slice(0, 10);

    const certReq = (j.certificate_requirements ?? "").toString().trim();
    const requiredCerts = certReq
      ? certReq
          .split(/[,;\n]/g)
          .map((s: string) => normFacetValue(s))
          .filter(Boolean)
          .slice(0, 8)
      : [];

    const emp = employerById.get(j.employer_profile_id);
    return {
      id: j.id,
      title: (j.title ?? "").toString().trim() || "—",
      company: emp?.name ?? "—",
      companyLogoUrl: emp?.logoUrl ?? null,
      companyVerified: emp?.verified === true,
      location: normFacetValue((j.location ?? "").toString()) || "—",
      type,
      salary,
      workType,
      jobType,
      summary,
      createdAt: j.created_at ?? undefined,
      tags,
      requiredCerts,
      domains: [],
      languages: [],
      openToFirstJob: (j.experience_level_required ?? "").toString().trim() === "not_required",
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

  return (
    <div className="flex-1 bg-background">
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <PageHero
          eyebrow={t("heroEyebrow")}
          title={t("heroTitle")}
          subtitle={t("heroSubtitle")}
        />
        <JobsSearch jobs={mapped} />
      </main>
      <Footer />
    </div>
  );
}

function toNumOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
