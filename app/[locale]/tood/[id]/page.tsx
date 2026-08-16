/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
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
import { NOINDEX_ROBOTS } from "@/lib/seo/site";
import { deactivateJobIfExpired } from "@/lib/jobs/deactivateExpiredJobs";
import {
  formatApplyUntilLabel,
  formatJobDateDdMmYyyy,
  jobAcceptsApplications,
} from "@/lib/jobs/jobLifecycle";

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

function MetaCell({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</dt>
      <dd
        className={
          emphasize
            ? "mt-1 text-[15px] font-semibold tabular-nums leading-snug tracking-tight text-white/92"
            : "mt-1 text-sm leading-snug text-white/78"
        }
      >
        {value}
      </dd>
    </div>
  );
}

export default async function JobDetailPage({ params }: Props) {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "pages.jobs" });
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
  const publishedLabel = formatJobDateDdMmYyyy(lifecycle.published_at);
  const expiresLabel = formatJobDateDdMmYyyy(lifecycle.expires_at);

  let { data: employer, error: employerErr } = await supabase
    .from("employer_profiles")
    .select(
      "company_name,location,website,logo_url,company_description,company_verified,verification_status,verified_at"
    )
    .eq("id", job.employer_profile_id)
    .maybeSingle();

  if (employerErr && /company_description|column/i.test(employerErr.message ?? "")) {
    const fallback = await supabase
      .from("employer_profiles")
      .select("company_name,location,website,logo_url,company_verified,verification_status,verified_at")
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
  const companyWebsite = ((employer?.website ?? "") as string).toString().trim();

  const jobPostingLd = buildJobPostingJsonLd({
    locale,
    job: {
      id: job.id,
      title: job.title,
      location: job.location,
      job_type: job.job_type,
      work_type: job.work_type,
      short_summary: job.short_summary,
      description: job.description,
      created_at: job.created_at,
      published_at: job.published_at ?? null,
      application_deadline: job.application_deadline ?? null,
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
        }
      : null,
  });

  const location = ((job.location ?? "") as string).toString().trim();
  const workMode = mapWorkTypeLabel((job.work_type ?? "").toString(), tJobs);
  const workload = buildWorkloadLabel(job, tJobs);
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

  const scheduleLines = buildScheduleLines(job, tJobs, startLabel);

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

  const showCompanyBlock = Boolean(companyName || location || (employer?.logo_url ?? "").toString().trim());
  const showWorkloadMode = Boolean(workload || workMode);

  const applyFormProps = {
    locale,
    jobPostId: job.id as string,
    scheduleHint: buildScheduleHint(job, tJobs),
    acceptsApplications,
    applyUntilLabel,
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

  return (
    <div className="flex-1 bg-background">
      <JobPostingJsonLd data={jobPostingLd} />
      <Navbar />
      <main className="pt-[var(--site-header-offset)]">
        <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 sm:px-6">
          {/* 1. Ametinimetus */}
          <div className="text-sm text-white/60">{t("heroEyebrow")}</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white/92">{job.title}</h1>
          {(job.experience_level_required ?? "").toString().trim() === "not_required" ||
          suitableForYoungSeeker ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {(job.experience_level_required ?? "").toString().trim() === "not_required" ? (
                <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-emerald-100/90">
                  {tJobs("jobOpenToFirstJobBadge")}
                </span>
              ) : null}
              {suitableForYoungSeeker ? <YoungSeekerJobBadge /> : null}
            </div>
          ) : null}

          <div className="mt-6 space-y-6">
            {/* 2. Ettevõte + asukoht */}
            {showCompanyBlock ? (
              <div className="flex items-start gap-3">
                {(employer?.logo_url ?? "").toString().trim() ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(employer?.logo_url ?? "").toString().trim()}
                    alt=""
                    className="mt-0.5 h-10 w-10 shrink-0 rounded-xl border border-white/[0.10] bg-white/[0.04] object-contain"
                  />
                ) : null}
                <dl className="grid min-w-0 flex-1 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  {companyName ? (
                    <div className="min-w-0">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        {tJobs("jobDetailMetaCompany")}
                      </dt>
                      <dd className="mt-1 flex flex-wrap items-center gap-2 text-sm leading-snug text-white/78">
                        <span>{companyName}</span>
                        {companyVerified ? (
                          <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-100/90">
                            {tJobs("companyVerifiedBadge")}
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  ) : null}
                  {location ? <MetaCell label={tJobs("jobDetailMetaLocation")} value={location} /> : null}
                </dl>
              </div>
            ) : null}

            {/* 3. Palk */}
            {salary ? <MetaCell label={tJobs("jobDetailMetaSalary")} value={salary} emphasize /> : null}

            {/* 4. Töökoormus ja tööviis */}
            {showWorkloadMode ? (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                {workload ? <MetaCell label={tJobs("jobDetailMetaWorkload")} value={workload} /> : null}
                {workMode ? <MetaCell label={tJobs("jobDetailMetaWorkMode")} value={workMode} /> : null}
              </dl>
            ) : null}

            {/* Dates + 5. Kandideeri CTA */}
            {(publishedLabel || applyUntilLabel || expiresLabel) && (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-3">
                {publishedLabel ? (
                  <MetaCell label={tJobs("jobDetailMetaPublished")} value={publishedLabel} />
                ) : null}
                {applyUntilLabel ? (
                  <div className="min-w-0 sm:col-span-2">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                      {tJobs("jobDetailMetaDeadline")}
                    </dt>
                    <dd className="mt-1 text-[15px] font-semibold leading-snug tracking-tight text-white/92">
                      {applyUntilLabel}
                    </dd>
                  </div>
                ) : null}
                {expiresLabel ? (
                  <MetaCell label={tJobs("jobDetailMetaExpires")} value={expiresLabel} />
                ) : null}
              </dl>
            )}

            <div>
              {acceptsApplications ? (
                <a
                  href="#kandideeri"
                  className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-white/90 sm:w-auto"
                >
                  {tJobs("jobDetailApplyTopCta")}
                </a>
              ) : (
                <div className="rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                  {tJobs("applyClosedBody")}
                  {applyUntilLabel ? (
                    <span className="mt-1 block font-medium text-white/85">{applyUntilLabel}</span>
                  ) : null}
                </div>
              )}
            </div>

            {/* 6. Lühikokkuvõte */}
            {shortSummary ? (
              <DetailSection title={tJobs("jobDetailSectionSummary")}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">{shortSummary}</p>
              </DetailSection>
            ) : null}

            {/* 7. Tööülesanded */}
            {duties ? (
              <DetailSection title={tJobs("jobDetailSectionDuties")}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">{duties}</p>
              </DetailSection>
            ) : null}

            {/* 8. Kohustuslikud nõuded */}
            {mandatoryReqs.length ? (
              <DetailSection title={tJobs("jobDetailSectionMandatory")}>
                <RequirementList items={mandatoryReqs} variant="mandatory" />
              </DetailSection>
            ) : legacyRequirements ? (
              <DetailSection title={tJobs("jobDetailSectionMandatory")}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">{legacyRequirements}</p>
              </DetailSection>
            ) : null}

            {/* 9. Soovituslikud nõuded */}
            {recommendedReqs.length ? (
              <DetailSection title={tJobs("jobDetailSectionRecommended")}>
                <RequirementList items={recommendedReqs} variant="recommended" />
              </DetailSection>
            ) : null}

            {/* 10. Sertifikaadid */}
            {certRequirements ? (
              <DetailSection title={tJobs("jobDetailSectionCertificates")}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">{certRequirements}</p>
              </DetailSection>
            ) : null}

            {/* 11. Keeled */}
            {languageLines.length ? (
              <DetailSection title={tJobs("jobDetailSectionLanguages")}>
                <ul className="list-none space-y-1.5">
                  {languageLines.map((line) => (
                    <li key={line} className="flex gap-2 text-sm leading-snug text-white/78">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" aria-hidden />
                      <span className="min-w-0">{line}</span>
                    </li>
                  ))}
                </ul>
              </DetailSection>
            ) : null}

            {/* 12. Tööaeg */}
            {scheduleLines.length ? (
              <DetailSection title={tJobs("jobDetailSectionSchedule")}>
                <ul className="list-none space-y-1.5">
                  {scheduleLines.map((line) => (
                    <li key={line} className="flex gap-2 text-sm leading-snug text-white/78">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/35" aria-hidden />
                      <span className="min-w-0">{line}</span>
                    </li>
                  ))}
                </ul>
              </DetailSection>
            ) : null}

            {/* 13. Hüved — ainult kui tööandja on täitnud (praegu eraldi välja pole) */}

            {/* 14. Ettevõttest */}
            {companyDescription ? (
              <DetailSection title={tJobs("jobDetailSectionAboutCompany")}>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">{companyDescription}</p>
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

            {/* 15. Kandideerimise CTA uuesti */}
            <div id="kandideeri" className="scroll-mt-[calc(var(--site-header-offset)+1rem)]">
              <JobApplyForm {...applyFormProps} />
            </div>

            <JobPostReportLink jobPostId={job.id} className="pt-2" />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
      <h2 className="text-sm font-medium text-white/85">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function RequirementList({
  items,
  variant,
}: {
  items: { text: string; priority: string }[];
  variant: "mandatory" | "recommended";
}) {
  return (
    <ul
      className={
        variant === "mandatory"
          ? "list-none space-y-1.5 rounded-2xl border border-rose-400/20 bg-rose-500/[0.06] p-3"
          : "list-none space-y-1.5 rounded-2xl border border-sky-400/18 bg-sky-500/[0.05] p-3"
      }
    >
      {items.map((item, i) => (
        <li key={`${variant}-${i}-${item.text.slice(0, 24)}`} className="flex gap-2 text-sm leading-snug text-white/78">
          <span
            className={
              variant === "mandatory"
                ? "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-300/80"
                : "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300/70"
            }
            aria-hidden
          />
          <span className="min-w-0">{item.text}</span>
        </li>
      ))}
    </ul>
  );
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

function buildWorkloadLabel(
  job: { job_type?: unknown },
  tJobs: (key: string, values?: Record<string, number | string>) => string
): string {
  return mapJobTypeLabel((job.job_type ?? "").toString(), tJobs);
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
