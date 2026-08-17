/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JobApplyForm } from "@/components/jobs/JobApplyForm";
import { JobPostingJsonLd } from "@/components/jobs/JobPostingJsonLd";
import { resolveJobRequirements } from "@/lib/jobs/jobRequirements";
import {
  formatJobSalaryDisplay,
  isJobSalaryPeriod,
  isJobSalaryTax,
} from "@/lib/jobs/jobSalary";
import {
  jobPassesYoungSeekerAutoEligibility,
  jobWorkConditionsFromJobRow,
} from "@/lib/employmentRules";
import { YoungSeekerJobBadge } from "@/components/jobs/YoungSeekerJobBadge";
import { JobPostReportLink } from "@/components/jobs/JobPostReportLink";
import { JobSaveButton } from "@/components/jobs/JobSaveButton";
import { JobDetailApplyPanel, type JobDetailMatchStats } from "@/components/jobs/JobDetailApplyPanel";
import { isEmployerCompanyVerified } from "@/lib/employer/companyVerification";
import {
  buildJobOpenGraph,
  buildJobPostingJsonLd,
  buildJobSeoDescription,
  buildJobSeoTitle,
  jobCanonicalUrl,
  jobLocaleAlternates,
} from "@/lib/jobs/jobSeo";
import { loadPublishedJobForSeo } from "@/lib/jobs/loadPublishedJobForSeo";
import { NOINDEX_FOLLOW, NOINDEX_ROBOTS } from "@/lib/seo/site";
import { deactivateJobIfExpired } from "@/lib/jobs/deactivateExpiredJobs";
import {
  formatApplyUntilLabel,
  jobAcceptsApplications,
} from "@/lib/jobs/jobLifecycle";
import { calculateJobMatch, type SeekerCertificateInput, type SeekerMatchInput } from "@/lib/matching/calculateJobMatch";
import { buildMatchExplanation } from "@/lib/matching/matchExplanation";
import { buildJobMatchInput } from "@/lib/jobs/enrichJobsWithSeekerMatch";
import { seekerCanUseMatchRanking } from "@/lib/jobs/seekerMatchRanking";
import { experienceBackgroundFromDb } from "@/lib/seeker/experienceBackground";
import { MapPin } from "lucide-react";
import { Link } from "@/i18n/routing";
import { SimilarJobsSection } from "@/components/jobs/SimilarJobsSection";
import { loadSimilarJobsForDetail } from "@/lib/jobs/loadSimilarJobsForDetail";
import { CompanyVerifiedBadge } from "@/components/employer/CompanyVerificationBadge";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const loaded = await loadPublishedJobForSeo(id);
  if (!loaded) {
    return { title: "Töökuulutus | Kvalifits", robots: NOINDEX_ROBOTS };
  }

  const titleText = (loaded.job.title ?? "").toString().trim();
  const location = (loaded.job.location ?? "").toString().trim();
  const companyName = (loaded.employer?.company_name ?? "").toString().trim();
  const pageTitle = buildJobSeoTitle({
    locale,
    title: titleText,
    location,
    companyName: companyName || "Kvalifits",
  });
  const description = buildJobSeoDescription({
    title: titleText,
    location,
    companyName,
    shortSummary: (loaded.job.short_summary ?? "").toString(),
    description: (loaded.job.description ?? "").toString(),
  });
  const canonical = jobCanonicalUrl(locale, loaded.job.id);
  const og = buildJobOpenGraph({
    locale,
    title: pageTitle,
    description,
    canonical,
    logoUrl: loaded.employer?.logo_url,
  });

  return {
    title: { absolute: pageTitle },
    description,
    ...(jobAcceptsApplications(loaded.job) ? {} : { robots: NOINDEX_FOLLOW }),
    alternates: jobLocaleAlternates(locale, loaded.job.id),
    openGraph: {
      title: og.title,
      description: og.description,
      url: og.url,
      siteName: og.siteName,
      locale: og.locale,
      alternateLocale: og.alternateLocale,
      type: og.type,
      ...(og.images ? { images: og.images } : {}),
    },
    twitter: {
      card: "summary",
      title: pageTitle,
      description,
    },
  };
}

export default async function JobDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const tJobs = await getTranslations({ locale, namespace: "jobs" });
  const supabase = await createSupabaseServerClient();

  const selectFull =
    "id,title,location,job_type,work_type,short_summary,description,requirements,requirement_lines,job_requirements,required_skills,keywords,experience_level_required,certificate_requirements,employer_profile_id,status,created_at,published_at,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,salary_min,salary_max,salary_currency,salary_tax,salary_period,start_date,application_deadline,expires_at";
  const selectMid =
    "id,title,location,job_type,work_type,short_summary,description,requirements,requirement_lines,job_requirements,required_skills,keywords,experience_level_required,certificate_requirements,employer_profile_id,status,created_at,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,salary_min,salary_max,salary_currency,salary_tax,salary_period";
  const selectLegacy =
    "id,title,location,job_type,work_type,short_summary,description,requirements,requirement_lines,required_skills,keywords,certificate_requirements,employer_profile_id,status,created_at,salary_min,salary_max,salary_currency";

  let { data: jobRaw, error: jobSelectErr } = await supabase
    .from("job_posts")
    .select(selectFull)
    .eq("id", id)
    .maybeSingle();

  if (jobSelectErr && /start_date|application_deadline|expires_at|published_at|column/i.test(jobSelectErr.message ?? "")) {
    const mid = await supabase.from("job_posts").select(selectMid).eq("id", id).maybeSingle();
    jobRaw = mid.data as typeof jobRaw;
    jobSelectErr = mid.error;
  }
  if (jobSelectErr && /salary_|column/i.test(jobSelectErr.message ?? "")) {
    const legacy = await supabase.from("job_posts").select(selectLegacy).eq("id", id).maybeSingle();
    jobRaw = legacy.data as typeof jobRaw;
    jobSelectErr = legacy.error;
  }
  if (jobSelectErr) {
    const { data: fallback } = await supabase
      .from("job_posts")
      .select(
        "id,title,location,job_type,work_type,short_summary,description,requirements,requirement_lines,required_skills,keywords,certificate_requirements,employer_profile_id,status,created_at"
      )
      .eq("id", id)
      .maybeSingle();
    jobRaw = fallback as typeof jobRaw;
  }

  const job = jobRaw as any;
  if (!job) redirect(`/${locale}/tood`);

  const expiredNow = await deactivateJobIfExpired({
    id: job.id,
    status: job.status,
    expires_at: job.expires_at ?? null,
  });
  if (expiredNow) job.status = "archived";

  const isPublicListing = job.status === "published";
  const isArchivedPublicHistory = job.status === "archived" && Boolean(job.published_at);
  if (!isPublicListing && !isArchivedPublicHistory) redirect(`/${locale}/tood`);

  const lifecycle = {
    status: job.status as string,
    published_at: (job.published_at ?? null) as string | null,
    application_deadline: (job.application_deadline ?? null) as string | null,
    expires_at: (job.expires_at ?? null) as string | null,
  };
  const acceptsApplications = jobAcceptsApplications(lifecycle);
  const applyUntilLabel = formatApplyUntilLabel(lifecycle, (key, values) => tJobs(key, values));

  let initialSaved = false;
  let canSaveJobs = true;
  let match: JobDetailMatchStats | null = null;
  let showCreateProfileCta = true;
  let isSeeker = false;
  let seekerInput: SeekerMatchInput | null = null;
  let seekerCerts: SeekerCertificateInput[] = [];
  {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
      const role = (profile?.role ?? null) as string | null;
      if (role && role !== "seeker") {
        canSaveJobs = false;
        showCreateProfileCta = false;
      }
      if (role === "seeker") {
        isSeeker = true;
        const { data: savedRow, error: savedErr } = await supabase
          .from("saved_jobs")
          .select("id")
          .eq("seeker_user_id", user.id)
          .eq("job_post_id", job.id)
          .maybeSingle();
        if (!savedErr) initialSaved = Boolean(savedRow);

        const { data: seekerRow } = await supabase
          .from("seeker_profiles")
          .select(
            "full_name,profile_title,location,about,skills,experience_level,preferred_job_types,preferred_locations,has_b_category_drivers_license,pref_full_time,pref_part_time,pref_remote_work,pref_hybrid_work,pref_on_site_work,pref_desired_weekly_hours,pref_min_weekly_hours,pref_max_weekly_hours,exp_seeking_first_job,exp_is_student,exp_has_internship,exp_has_volunteer,exp_has_project,exp_has_prior_work,experience_duration_years,languages",
          )
          .eq("user_id", user.id)
          .maybeSingle();

        seekerInput = seekerRow
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

        seekerCerts = (certRows ?? []).map((c) => ({
          certificate_name: c.certificate_name ?? null,
          certificate_issuer: c.certificate_issuer ?? null,
          certificate_valid_until: c.certificate_valid_until ?? null,
        }));

        if (seekerInput && seekerCanUseMatchRanking(seekerInput)) {
          const { score, breakdown } = calculateJobMatch(seekerInput, seekerCerts, buildJobMatchInput(job));
          match = {
            score,
            reqsFilled: breakdown.requirementsTotal > 0 ? breakdown.requirementsMatched : null,
            reqsTotal: breakdown.requirementsTotal > 0 ? breakdown.requirementsTotal : null,
            mandFilled: breakdown.requirementsMandatoryTotal > 0 ? breakdown.requirementsMandatoryMatched : null,
            mandTotal: breakdown.requirementsMandatoryTotal > 0 ? breakdown.requirementsMandatoryTotal : null,
            recFilled: breakdown.requirementsRecommendedTotal > 0 ? breakdown.requirementsRecommendedMatched : null,
            recTotal: breakdown.requirementsRecommendedTotal > 0 ? breakdown.requirementsRecommendedTotal : null,
            explanation: buildMatchExplanation({
              breakdown,
              job: buildJobMatchInput(job),
              seeker: seekerInput,
              certs: seekerCerts,
            }),
          };
          showCreateProfileCta = false;
        }
      }
    }
  }

  let { data: employer, error: employerErr } = await supabase
    .from("employer_profiles")
    .select(
      "company_name,location,website,logo_url,company_description,company_verified,verification_status,public_slug"
    )
    .eq("id", job.employer_profile_id)
    .maybeSingle();

  if (employerErr && /public_slug/i.test(employerErr.message ?? "")) {
    const noSlug = await supabase
      .from("employer_profiles")
      .select(
        "company_name,location,website,logo_url,company_description,company_verified,verification_status"
      )
      .eq("id", job.employer_profile_id)
      .maybeSingle();
    employer = noSlug.data as typeof employer;
    employerErr = noSlug.error;
  }
  if (employerErr && /company_description|column/i.test(employerErr.message ?? "")) {
    const fallback = await supabase
      .from("employer_profiles")
      .select("company_name,location,website,logo_url,company_verified,verification_status")
      .eq("id", job.employer_profile_id)
      .maybeSingle();
    employer = fallback.data as typeof employer;
  }

  const companyName = ((employer?.company_name ?? "") as string).toString().trim();
  const companyVerified = isEmployerCompanyVerified({
    company_verified: (employer as { company_verified?: boolean | null } | null)?.company_verified ?? false,
    verification_status: (employer as { verification_status?: string | null } | null)?.verification_status ?? null,
  });
  const companyDescription = ((employer as { company_description?: string | null } | null)?.company_description ?? "")
    .toString()
    .trim();
  const companySlug = ((employer as { public_slug?: string | null } | null)?.public_slug ?? "")
    .toString()
    .trim();
  const companyWebsite = ((employer?.website ?? "") as string).toString().trim();

  const jobPostingLd = acceptsApplications
    ? buildJobPostingJsonLd({
        locale,
        job: {
          id: job.id,
          title: job.title,
          location: job.location,
          job_type: job.job_type,
          work_type: job.work_type,
          short_summary: job.short_summary,
          description: job.description,
          status: job.status,
          created_at: job.created_at,
          published_at: job.published_at ?? null,
          application_deadline: job.application_deadline ?? null,
          expires_at: job.expires_at ?? null,
          salary_min: typeof job.salary_min === "number" ? job.salary_min : toNum(job.salary_min),
          salary_max: typeof job.salary_max === "number" ? job.salary_max : toNum(job.salary_max),
          salary_currency: job.salary_currency,
          salary_period: job.salary_period,
          salary_tax: job.salary_tax,
        },
        employer: employer
          ? {
              company_name: employer.company_name,
              website: employer.website,
              logo_url: employer.logo_url,
              location: employer.location,
              public_slug: companySlug || null,
            }
          : null,
      })
    : null;

  const location = ((job.location ?? "") as string).toString().trim();
  const workMode = mapWorkTypeLabel((job.work_type ?? "").toString(), tJobs);
  const shortSummary = ((job.short_summary ?? "") as string).toString().trim();
  const duties = ((job.description ?? "") as string).toString().trim();
  const certRequirements = ((job.certificate_requirements ?? "") as string).toString().trim();

  const salaryMin = typeof job.salary_min === "number" ? job.salary_min : toNum(job.salary_min);
  const salaryMax = typeof job.salary_max === "number" ? job.salary_max : toNum(job.salary_max);
  const taxRaw = (job.salary_tax ?? null) as string | null;
  const periodRaw = (job.salary_period ?? null) as string | null;
  const taxKey = isJobSalaryTax(taxRaw) ? taxRaw : null;
  const periodKey = isJobSalaryPeriod(periodRaw) ? periodRaw : null;
  const salary =
    formatJobSalaryDisplay({
      min: salaryMin,
      max: salaryMax,
      currency: (job.salary_currency ?? "EUR").toString(),
      tax: taxKey,
      period: periodKey,
      locale,
      taxLabel: taxKey ? tJobs(`jobSalaryTaxShort.${taxKey}`) : "",
      periodLabel: periodKey ? tJobs(`jobSalaryPeriodOption.${periodKey}`) : "",
    }) || "";

  const startLabel = formatOptionalDate(job.start_date, locale);

  const requirementItems = resolveJobRequirements({
    job_requirements: job.job_requirements,
    requirement_lines: job.requirement_lines as string[] | null,
    requirements: job.requirements ?? null,
  });
  const mandatoryReqs = requirementItems.filter((x) => x.priority === "mandatory");
  const recommendedReqs = requirementItems.filter((x) => x.priority === "recommended");
  const legacyRequirements =
    !requirementItems.length ? ((job.requirements ?? "") as string).toString().trim() : "";

  const languageLines = collectLanguageLines({
    required_skills: (job.required_skills as string[] | null) ?? null,
    keywords: (job.keywords as string[] | null) ?? null,
  });
  const skillLines = collectSkillLines({
    required_skills: (job.required_skills as string[] | null) ?? null,
    exclude: languageLines,
  });
  const certLines = splitCertLines(certRequirements);

  const scheduleLines = buildScheduleLines(job, tJobs, startLabel);

  const employmentType = mapJobTypeLabel((job.job_type ?? "").toString(), tJobs);
  const weeklyHours = toNum(job.weekly_hours);
  const workloadHours = weeklyHours !== null ? tJobs("jobScheduleWeeklyHours", { hours: weeklyHours }) : "";

  const facts: { label: string; value: string }[] = [];
  if (salary) facts.push({ label: tJobs("jobDetailMetaSalary"), value: salary });
  if (employmentType) facts.push({ label: tJobs("jobDetailMetaEmploymentType"), value: employmentType });
  if (workloadHours) facts.push({ label: tJobs("jobDetailMetaWorkload"), value: workloadHours });
  if (workMode) facts.push({ label: tJobs("jobDetailMetaArrangement"), value: workMode });
  if (location) facts.push({ label: tJobs("jobDetailMetaLocation"), value: location });
  if (applyUntilLabel) facts.push({ label: tJobs("jobDetailMetaDeadline"), value: applyUntilLabel });

  const suitableForYoungSeeker = jobPassesYoungSeekerAutoEligibility(
    jobWorkConditionsFromJobRow({
      job_type: job.job_type ?? null,
      weekly_hours: toNum(job.weekly_hours),
      daily_hours: toNum(job.daily_hours),
      shift_start: (job.shift_start ?? null) as string | null,
      shift_end: (job.shift_end ?? null) as string | null,
      includes_night_work:
        job.includes_night_work === null || job.includes_night_work === undefined
          ? null
          : Boolean(job.includes_night_work),
      is_hazardous_work:
        job.is_hazardous_work === null || job.is_hazardous_work === undefined
          ? null
          : Boolean(job.is_hazardous_work),
    })
  );

  const showBadges =
    (job.experience_level_required ?? "").toString().trim() === "not_required" || suitableForYoungSeeker;
  const profileHref = isSeeker ? "/account/seeker/profile" : "/auth/register";

  const applyFormProps = {
    locale,
    jobPostId: job.id as string,
    scheduleHint: buildScheduleHint(job, tJobs),
    acceptsApplications,
    applyUntilLabel,
    jobTitle: (job.title ?? "").toString().trim() || null,
    employerName: companyName || null,
    jobMatch: {
      title: job.title ?? null,
      location: job.location ?? null,
      work_type: job.work_type ?? null,
      job_type: job.job_type ?? null,
      short_summary: job.short_summary ?? null,
      description: job.description ?? null,
      requirements: job.requirements ?? null,
      requirement_lines: (job.requirement_lines as string[] | null) ?? null,
      job_requirements: job.job_requirements ?? null,
      required_skills: (job.required_skills as string[] | null) ?? null,
      keywords: (job.keywords as string[] | null) ?? null,
      experience_level_required: job.experience_level_required ?? null,
      certificate_requirements: job.certificate_requirements ?? null,
      weekly_hours: toNum(job.weekly_hours),
      daily_hours: toNum(job.daily_hours),
      shift_start: (job.shift_start ?? null) as string | null,
      shift_end: (job.shift_end ?? null) as string | null,
      includes_night_work:
        job.includes_night_work === null || job.includes_night_work === undefined
          ? null
          : Boolean(job.includes_night_work),
      is_hazardous_work:
        job.is_hazardous_work === null || job.is_hazardous_work === undefined
          ? null
          : Boolean(job.is_hazardous_work),
    },
  };

  const similarJobs = await loadSimilarJobsForDetail({
    supabase,
    currentJob: job,
    locale,
    workTypeLabel: (raw) => mapWorkTypeLabel(raw, tJobs),
    tJobs: (key) => tJobs(key as never),
    seeker: seekerInput,
    certs: seekerCerts,
  });

  return (
    <>
      <JobPostingJsonLd data={jobPostingLd} />
      <div className="mx-auto w-full max-w-6xl px-4 pb-[calc(5.75rem+var(--site-bottom-nav-offset,0px))] pt-8 sm:px-6 lg:pb-16 lg:pt-10">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_19.5rem] lg:items-start lg:gap-10">
          <div className="min-w-0">
            <header>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-white/94 sm:text-3xl">{job.title}</h1>
                <div className="flex shrink-0 items-center gap-2">
                  {canSaveJobs ? (
                    <JobSaveButton jobId={job.id} initialSaved={initialSaved} variant="labeled" />
                  ) : null}
                  <JobPostReportLink jobPostId={job.id} variant="toolbar" />
                </div>
              </div>

              <div className="mt-3 flex items-start gap-3">
                {(employer?.logo_url ?? "").toString().trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(employer?.logo_url ?? "").toString().trim()}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-xl border border-white/[0.10] bg-white/[0.04] object-contain"
                  />
                ) : null}
                <div className="min-w-0">
                  {companyName ? (
                    <div className="flex flex-wrap items-center gap-2 text-[15px] text-white/80">
                      {companySlug ? (
                        <Link href={`/ettevotted/${companySlug}`} className="font-medium text-white/88 hover:underline">
                          {companyName}
                        </Link>
                      ) : (
                        <span className="font-medium text-white/88">{companyName}</span>
                      )}
                      {companyVerified ? (
                        <CompanyVerifiedBadge label={tJobs("companyVerifiedBadge")} />
                      ) : null}
                    </div>
                  ) : null}
                  {location ? (
                    <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-white/55">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden />
                      <span className="truncate">{location}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </header>

            {facts.length ? (
              <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-white/[0.08] py-5 sm:grid-cols-3 lg:grid-cols-5">
                {facts.map((fact) => (
                  <div key={fact.label} className="min-w-0">
                    <dt className="text-[11px] text-white/40">{fact.label}</dt>
                    <dd className="mt-1 break-words text-[15px] font-medium leading-snug tracking-tight text-white/90">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {showBadges ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {(job.experience_level_required ?? "").toString().trim() === "not_required" ? (
                  <span className="inline-flex rounded-full border border-white/[0.10] px-2.5 py-0.5 text-[11px] text-white/60">
                    {tJobs("jobOpenToFirstJobBadge")}
                  </span>
                ) : null}
                {suitableForYoungSeeker ? <YoungSeekerJobBadge /> : null}
              </div>
            ) : null}

            <div className="mt-5 lg:hidden">
              <JobDetailApplyPanel
                variant="inline"
                jobId={job.id}
                initialSaved={initialSaved}
                canSave={canSaveJobs}
                acceptsApplications={acceptsApplications}
                match={match}
                showCreateProfileCta={showCreateProfileCta}
                profileHref={profileHref}
                applyClosedBody={tJobs("applyClosedBody")}
                applyUntilLabel={applyUntilLabel}
              />
            </div>

            <div className="mt-2">
              {shortSummary ? (
                <DetailSection title={tJobs("jobDetailSectionSummary")}>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/75">{shortSummary}</p>
                </DetailSection>
              ) : null}

              {duties ? (
                <DetailSection title={tJobs("jobDetailSectionDuties")}>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/75">{duties}</p>
                </DetailSection>
              ) : null}

              {mandatoryReqs.length ? (
                <DetailSection title={tJobs("jobDetailSectionMandatory")}>
                  <RequirementList items={mandatoryReqs} />
                </DetailSection>
              ) : legacyRequirements ? (
                <DetailSection title={tJobs("jobDetailSectionMandatory")}>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/75">{legacyRequirements}</p>
                </DetailSection>
              ) : null}

              {recommendedReqs.length ? (
                <DetailSection title={tJobs("jobDetailSectionRecommended")}>
                  <RequirementList items={recommendedReqs} />
                </DetailSection>
              ) : null}

              {skillLines.length ? (
                <DetailSection title={tJobs("jobDetailSectionSkills")}>
                  <ChipList items={skillLines} />
                </DetailSection>
              ) : null}

              {certLines.length ? (
                <DetailSection title={tJobs("jobDetailSectionCertificates")}>
                  <RequirementList items={certLines.map((text) => ({ text, priority: "mandatory" }))} />
                </DetailSection>
              ) : null}

              {languageLines.length ? (
                <DetailSection title={tJobs("jobDetailSectionLanguages")}>
                  <ChipList items={languageLines} />
                </DetailSection>
              ) : null}

              {scheduleLines.length ? (
                <DetailSection title={tJobs("jobDetailSectionSchedule")}>
                  <RequirementList items={scheduleLines.map((text) => ({ text, priority: "recommended" }))} />
                </DetailSection>
              ) : null}

              {companyDescription ? (
                <DetailSection title={tJobs("jobDetailSectionAboutCompany")}>
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/75">{companyDescription}</p>
                  {companyWebsite ? (
                    <p className="mt-3 text-sm">
                      <a
                        href={companyWebsite.startsWith("http") ? companyWebsite : `https://${companyWebsite}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/70 underline-offset-4 hover:text-white/90 hover:underline"
                      >
                        {companyWebsite}
                      </a>
                    </p>
                  ) : null}
                </DetailSection>
              ) : null}

              <div id="kandideeri" className="scroll-mt-[calc(var(--site-header-offset)+1rem)] border-t border-white/[0.08] pt-8">
                <JobApplyForm {...applyFormProps} />
              </div>
            </div>
          </div>

          <div className="hidden lg:sticky lg:top-[calc(var(--site-header-offset)+0.75rem)] lg:block">
            <JobDetailApplyPanel
              variant="sidebar"
              jobId={job.id}
              initialSaved={initialSaved}
              canSave={canSaveJobs}
              acceptsApplications={acceptsApplications}
              match={match}
              showCreateProfileCta={showCreateProfileCta}
              profileHref={profileHref}
              applyClosedBody={tJobs("applyClosedBody")}
              applyUntilLabel={applyUntilLabel}
            />
          </div>
        </div>
        <SimilarJobsSection
          jobs={similarJobs}
          title={tJobs("similarJobsTitle")}
          matchLabel={(score) => tJobs("jobDetailMatchPercent", { score })}
        />
      </div>
      <JobDetailApplyPanel
        variant="mobileBar"
        jobId={job.id}
        initialSaved={initialSaved}
        canSave={canSaveJobs}
        acceptsApplications={acceptsApplications}
        match={match}
        showCreateProfileCta={showCreateProfileCta}
        profileHref={profileHref}
        applyClosedBody={tJobs("applyClosedBody")}
        applyUntilLabel={applyUntilLabel}
      />
    </>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-white/[0.08] py-8">
      <h2 className="text-[15px] font-semibold tracking-tight text-white/90">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function RequirementList({ items }: { items: { text: string; priority?: string }[] }) {
  return (
    <ul className="list-none space-y-2 p-0">
      {items.map((item, i) => (
        <li key={`${i}-${item.text.slice(0, 32)}`} className="flex gap-2.5 text-[15px] leading-snug text-white/75">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-white/35" aria-hidden />
          <span className="min-w-0">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

function ChipList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2 p-0">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[13px] text-white/72"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function collectSkillLines(input: { required_skills: string[] | null; exclude: string[] }): string[] {
  const skip = new Set(input.exclude.map((x) => x.trim().toLowerCase()).filter(Boolean));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input.required_skills ?? []) {
    const line = String(raw).trim();
    if (!line) continue;
    const key = line.toLowerCase();
    if (skip.has(key) || LANG_LINE_HINT.test(line) || seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

function splitCertLines(raw: string): string[] {
  const parts = raw
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of parts) {
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

const LANG_LINE_HINT =
  /\b(eesti|inglise|vene|soome|saksa|prantsuse|hispaania|rootsi|läti|leedu|estonian|english|russian|finnish|german|french|spanish|swedish|latvian|lithuanian|keeleoskus|language|язык|эстон|англий|русск)\b/i;

function collectLanguageLines(input: {
  required_skills: string[] | null;
  keywords: string[] | null;
}): string[] {
  const pool = [...(input.required_skills ?? []), ...(input.keywords ?? [])]
    .map((x) => String(x).trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of pool) {
    if (!LANG_LINE_HINT.test(line)) continue;
    const key = line.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(line);
  }
  return out;
}

function buildScheduleLines(
  job: {
    weekly_hours?: unknown;
    daily_hours?: unknown;
    shift_start?: unknown;
    shift_end?: unknown;
    includes_night_work?: unknown;
    is_hazardous_work?: unknown;
  },
  tJobs: (key: string, values?: Record<string, number | string>) => string,
  startLabel: string | null
): string[] {
  const lines: string[] = [];
  const weekly = toNum(job.weekly_hours);
  const daily = toNum(job.daily_hours);
  const start = job.shift_start ? String(job.shift_start).slice(0, 5) : "";
  const end = job.shift_end ? String(job.shift_end).slice(0, 5) : "";
  if (weekly !== null) lines.push(tJobs("jobScheduleWeeklyHours", { hours: weekly }));
  if (daily !== null) lines.push(tJobs("jobScheduleDailyHours", { hours: daily }));
  if (start && end) lines.push(tJobs("jobDetailShiftRange", { start, end }));
  else if (start) lines.push(start);
  else if (end) lines.push(end);
  if (job.includes_night_work === true) lines.push(tJobs("includesNightWork"));
  if (job.is_hazardous_work === true) lines.push(tJobs("isHazardousWork"));
  if (startLabel) lines.push(`${tJobs("jobDetailMetaStart")}: ${startLabel}`);
  return lines;
}

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function mapWorkTypeLabel(raw: string, tJobs: (key: string) => string) {
  const v = raw.trim().toLowerCase().replace(/-/g, "_");
  if (!v) return "";
  if (v === "on_site" || v === "onsite") return tJobs("workTypeOnSite");
  if (v === "hybrid") return tJobs("workTypeHybrid");
  if (v === "remote") return tJobs("workTypeRemote");
  return raw.trim();
}

function mapJobTypeLabel(raw: string, tJobs: (key: string) => string) {
  const v = raw.trim();
  if (v === "full_time") return tJobs("jobTypeFullTime");
  if (v === "part_time") return tJobs("jobTypePartTime");
  if (v === "contract") return tJobs("jobTypeContract");
  if (v === "internship") return tJobs("jobTypeInternship");
  return v.replaceAll("_", " ");
}

function formatOptionalDate(raw: unknown, locale: string): string | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;
  const d = new Date(s.length <= 10 ? `${s}T12:00:00` : s);
  if (Number.isNaN(d.getTime())) return s.slice(0, 10);
  const tag = locale === "en" ? "en-GB" : locale === "ru" ? "ru-RU" : "et-EE";
  return d.toLocaleDateString(tag, { year: "numeric", month: "short", day: "numeric" });
}

function buildScheduleHint(
  job: {
    weekly_hours?: unknown;
    daily_hours?: unknown;
    shift_start?: unknown;
    shift_end?: unknown;
    job_type?: unknown;
  },
  tJobs: (key: string, values?: Record<string, number | string>) => string
): string | null {
  const parts: string[] = [];
  const weekly = toNum(job.weekly_hours);
  const daily = toNum(job.daily_hours);
  const start = job.shift_start ? String(job.shift_start).slice(0, 5) : "";
  const end = job.shift_end ? String(job.shift_end).slice(0, 5) : "";
  if (weekly !== null) parts.push(tJobs("jobScheduleWeeklyHours", { hours: weekly }));
  if (daily !== null) parts.push(tJobs("jobScheduleDailyHours", { hours: daily }));
  if (start && end) parts.push(`${start}–${end}`);
  if (job.job_type) parts.push(mapJobTypeLabel(String(job.job_type), tJobs));
  return parts.length ? parts.join(" · ") : null;
}
