/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentAuth } from "@/lib/auth/currentAuth";
import { JobApplyForm } from "@/components/jobs/JobApplyForm";
import { JobPostingJsonLd } from "@/components/jobs/JobPostingJsonLd";
import { JobPostReportLink } from "@/components/jobs/JobPostReportLink";
import { JobSaveButton } from "@/components/jobs/JobSaveButton";
import { JobDetailApplyPanel, type JobDetailMatchStats } from "@/components/jobs/JobDetailApplyPanel";
import { loadEmployerPublicRowById } from "@/lib/companies/loadPublicEmployerFields";
import {
  buildJobDetailPageMetadata,
  buildJobPostingJsonLd,
  formatJobSeoSalaryLabel,
} from "@/lib/jobs/jobSeo";
import { loadPublishedJobForSeo } from "@/lib/jobs/loadPublishedJobForSeo";
import { noindexLocalizedMetadata } from "@/lib/seo/site";
import {
  formatApplyUntilLabel,
  jobAcceptsApplications,
} from "@/lib/jobs/jobLifecycle";
import { SimilarJobsSection } from "@/components/jobs/SimilarJobsSection";
import { JobListingDetailView } from "@/components/jobs/JobListingDetailView";
import { Container } from "@/components/ui/container";
import { loadSimilarJobsForDetail } from "@/lib/jobs/loadSimilarJobsForDetail";
import { getJobMatchesForSeeker } from "@/lib/matching/getJobMatchesForSeeker";
import { loadSeekerMatchContext } from "@/lib/matching/seekerMatchContext";
import { isPublicJobListing } from "@/lib/jobs/jobVisibility";
import { buildScheduleHint, mapWorkTypeLabel, toNum } from "@/lib/jobs/jobDetailPresentation";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const tJobs = await getTranslations({ locale, namespace: "jobs" });
  const loaded = await loadPublishedJobForSeo(id);
  if (!loaded) {
    return noindexLocalizedMetadata({
      locale,
      path: `/tood/${id}`,
      title: t("jobMissingTitle"),
      description: t("jobMissingDescription"),
    });
  }

  const salaryLabel = formatJobSeoSalaryLabel(loaded.job, locale, {
    tax: (key) => tJobs(key as never),
    period: (key) => tJobs(key as never),
  });
  const applyUntilLabel = formatApplyUntilLabel(loaded.job, (key, values) => tJobs(key, values));

  return buildJobDetailPageMetadata({
    locale,
    jobId: loaded.job.id,
    job: loaded.job,
    employer: loaded.employer,
    labels: {
      emptyTitle: t("jobFallbackTitle"),
      emptyDescription: t("jobFallbackDescription"),
      salaryLabel,
      applyUntilLabel: applyUntilLabel ?? undefined,
    },
  });
}

export default async function JobDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const tJobs = await getTranslations({ locale, namespace: "jobs" });
  const supabase = await createSupabaseServerClient();

  const selectFull =
    "id,title,location,job_type,work_type,short_summary,description,duty_lines,benefit_lines,requirements,requirement_lines,job_requirements,required_skills,keywords,experience_level_required,certificate_requirements,employer_profile_id,status,created_at,published_at,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,salary_min,salary_max,salary_currency,salary_tax,salary_period,start_date,application_deadline,expires_at";
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

  if (!isPublicJobListing(job)) redirect(`/${locale}/tood`);

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
  let seekerUserId: string | null = null;
  let seekerContext: Awaited<ReturnType<typeof loadSeekerMatchContext>> | undefined;
  {
    const auth = await getCurrentAuth();
    if (auth.authenticated && auth.userId) {
      const role = auth.role;
      if (role && role !== "seeker") {
        canSaveJobs = false;
        showCreateProfileCta = false;
      }
      if (role === "seeker") {
        isSeeker = true;
        seekerUserId = auth.userId;
        const { data: savedRow, error: savedErr } = await supabase
          .from("saved_jobs")
          .select("id")
          .eq("seeker_user_id", auth.userId)
          .eq("job_post_id", job.id)
          .maybeSingle();
        if (!savedErr) initialSaved = Boolean(savedRow);

        seekerContext = await loadSeekerMatchContext(auth.userId);
        const compact = await getJobMatchesForSeeker({
          supabase,
          userId: auth.userId,
          jobIds: [String(job.id)],
          context: seekerContext,
          jobInputs: new Map([[String(job.id), job as Record<string, unknown>]]),
          includeExplanation: true,
          maxCriteria: null,
        });
        const m = compact.byId.get(String(job.id));
        if (m) {
          match = {
            score: m.matchScore,
            reqsFilled: m.reqsTotal > 0 ? m.reqsMet : null,
            reqsTotal: m.reqsTotal > 0 ? m.reqsTotal : null,
            mandFilled: m.mandatoryTotal > 0 ? m.mandatoryMet : null,
            mandTotal: m.mandatoryTotal > 0 ? m.mandatoryTotal : null,
            recFilled: m.preferredTotal > 0 ? m.preferredMet : null,
            recTotal: m.preferredTotal > 0 ? m.preferredTotal : null,
            explanation: m.explanation ?? null,
          };
          showCreateProfileCta = false;
        }
      }
    }
  }

  const employer = job.employer_profile_id
    ? await loadEmployerPublicRowById(supabase, String(job.employer_profile_id))
    : null;

  const companyName = ((employer?.company_name ?? "") as string).toString().trim();
  const companySlug = ((employer as { public_slug?: string | null } | null)?.public_slug ?? "")
    .toString()
    .trim();
  const profileHref = isSeeker ? "/account/seeker/profile" : "/auth/register";

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
          requirements: job.requirements,
          requirement_lines: (job.requirement_lines as string[] | null) ?? null,
          job_requirements: job.job_requirements,
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
              company_name: (employer.company_name ?? null) as string | null,
              website: (employer.website ?? null) as string | null,
              logo_url: (employer.logo_url ?? null) as string | null,
              location: (employer.location ?? null) as string | null,
              public_slug: companySlug || null,
            }
          : null,
      })
    : null;

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
    userId: seekerUserId,
    context: seekerContext,
  });

  const applyPanelProps = {
    jobId: job.id as string,
    initialSaved,
    canSave: canSaveJobs,
    acceptsApplications,
    match,
    showCreateProfileCta,
    profileHref,
    applyClosedBody: tJobs("applyClosedBody"),
    applyUntilLabel,
  };

  return (
    <article>
      <JobPostingJsonLd data={jobPostingLd} />
      <JobListingDetailView
        locale={locale}
        job={job}
        acceptsApplications={acceptsApplications}
        employer={
          employer
            ? {
                company_name: (employer.company_name ?? null) as string | null,
                logo_url: (employer.logo_url ?? null) as string | null,
                website: (employer.website ?? null) as string | null,
                public_slug: companySlug || null,
                company_description: ((employer as { company_description?: string | null }).company_description ??
                  null) as string | null,
                company_verified: (employer as { company_verified?: boolean | null }).company_verified ?? null,
                verification_status: (employer as { verification_status?: string | null }).verification_status ?? null,
              }
            : null
        }
        toolbar={
          <>
            {canSaveJobs ? (
              <JobSaveButton jobId={job.id} initialSaved={initialSaved} variant="labeled" />
            ) : null}
            <JobPostReportLink jobPostId={job.id} variant="toolbar" />
          </>
        }
        mobileLead={
          <>
            <JobDetailApplyPanel variant="inline" {...applyPanelProps} />
            <div className="mt-4">
              <JobPostReportLink jobPostId={job.id} variant="toolbar" />
            </div>
          </>
        }
        applySection={
          <div id="kandideeri" className="scroll-mt-[calc(var(--site-header-offset)+1rem)] border-t border-border pt-8">
            <JobApplyForm {...applyFormProps} />
          </div>
        }
        sidebar={<JobDetailApplyPanel variant="sidebar" {...applyPanelProps} />}
      />
      <Container className="pb-12 lg:pb-16">
        <SimilarJobsSection
          jobs={similarJobs}
          title={tJobs("similarJobsTitle")}
          matchLabel={(score) => tJobs("jobDetailMatchPercent", { score })}
        />
      </Container>
      <JobDetailApplyPanel variant="mobileBar" {...applyPanelProps} />
    </article>
  );
}
