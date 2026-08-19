import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CompanyVerifiedBadge } from "@/components/employer/CompanyVerificationBadge";
import { YoungSeekerJobBadge } from "@/components/jobs/YoungSeekerJobBadge";
import { Link } from "@/i18n/routing";
import {
  jobPassesYoungSeekerAutoEligibility,
  jobWorkConditionsFromJobRow,
} from "@/lib/employmentRules";
import { isEmployerCompanyVerified } from "@/lib/employer/companyVerification";
import { resolveJobRequirements } from "@/lib/jobs/jobRequirements";
import { parseJobContentLines } from "@/lib/jobs/jobContentLines";
import {
  formatJobSalaryDisplay,
  isJobSalaryPeriod,
  isJobSalaryTax,
} from "@/lib/jobs/jobSalary";
import { formatApplyUntilLabel } from "@/lib/jobs/jobLifecycle";
import {
  buildScheduleLines,
  collectLanguageLines,
  collectSkillLines,
  formatOptionalDate,
  mapJobTypeLabel,
  mapWorkTypeLabel,
  splitCertLines,
  toNum,
} from "@/lib/jobs/jobDetailPresentation";

export type JobListingDetailJob = {
  id: string;
  title?: string | null;
  location?: string | null;
  job_type?: string | null;
  work_type?: string | null;
  short_summary?: string | null;
  description?: string | null;
  duty_lines?: unknown;
  benefit_lines?: unknown;
  requirements?: string | null;
  requirement_lines?: string[] | null;
  job_requirements?: unknown;
  required_skills?: string[] | null;
  keywords?: string[] | null;
  experience_level_required?: string | null;
  certificate_requirements?: string | null;
  status?: string | null;
  published_at?: string | null;
  application_deadline?: string | null;
  expires_at?: string | null;
  weekly_hours?: unknown;
  daily_hours?: unknown;
  shift_start?: unknown;
  shift_end?: unknown;
  includes_night_work?: boolean | null;
  is_hazardous_work?: boolean | null;
  salary_min?: unknown;
  salary_max?: unknown;
  salary_currency?: string | null;
  salary_tax?: string | null;
  salary_period?: string | null;
  start_date?: unknown;
};

export type JobListingDetailEmployer = {
  company_name?: string | null;
  logo_url?: string | null;
  website?: string | null;
  public_slug?: string | null;
  company_description?: string | null;
  company_verified?: boolean | null;
  verification_status?: string | null;
} | null;

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

export async function JobListingDetailView({
  locale,
  job,
  employer,
  preview = false,
  toolbar,
  mobileLead,
  applySection,
  sidebar,
}: {
  locale: string;
  job: JobListingDetailJob;
  employer: JobListingDetailEmployer;
  preview?: boolean;
  toolbar?: ReactNode;
  mobileLead?: ReactNode;
  applySection?: ReactNode;
  sidebar?: ReactNode;
}) {
  const tJobs = await getTranslations({ locale, namespace: "jobs" });
  const lifecycle = {
    status: (job.status ?? "") as string,
    published_at: (job.published_at ?? null) as string | null,
    application_deadline: (job.application_deadline ?? null) as string | null,
    expires_at: (job.expires_at ?? null) as string | null,
  };
  const applyUntilLabel = formatApplyUntilLabel(lifecycle, (key, values) => tJobs(key, values));

  const companyName = (employer?.company_name ?? "").toString().trim();
  const companyVerified = isEmployerCompanyVerified({
    company_verified: employer?.company_verified ?? false,
    verification_status: employer?.verification_status ?? null,
  });
  const companyDescription = (employer?.company_description ?? "").toString().trim();
  const companySlug = (employer?.public_slug ?? "").toString().trim();
  const companyWebsite = (employer?.website ?? "").toString().trim();
  const location = (job.location ?? "").toString().trim();
  const workMode = mapWorkTypeLabel((job.work_type ?? "").toString(), tJobs);
  const shortSummary = (job.short_summary ?? "").toString().trim();
  const description = (job.description ?? "").toString().trim();
  const dutyLines = parseJobContentLines(job.duty_lines);
  const benefitLines = parseJobContentLines(job.benefit_lines);
  const certRequirements = (job.certificate_requirements ?? "").toString().trim();

  const salaryMin = typeof job.salary_min === "number" ? job.salary_min : toNum(job.salary_min);
  const salaryMax = typeof job.salary_max === "number" ? job.salary_max : toNum(job.salary_max);
  const taxRaw = job.salary_tax ?? null;
  const periodRaw = job.salary_period ?? null;
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
    requirement_lines: job.requirement_lines ?? null,
    requirements: job.requirements ?? null,
  });
  const mandatoryReqs = requirementItems.filter((x) => x.priority === "mandatory");
  const recommendedReqs = requirementItems.filter((x) => x.priority === "recommended");
  const legacyRequirements = !requirementItems.length ? (job.requirements ?? "").toString().trim() : "";
  const languageLines = collectLanguageLines({
    required_skills: job.required_skills ?? null,
    keywords: job.keywords ?? null,
  });
  const skillLines = collectSkillLines({
    required_skills: job.required_skills ?? null,
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
    }),
  );
  const showBadges =
    (job.experience_level_required ?? "").toString().trim() === "not_required" || suitableForYoungSeeker;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-[calc(5.75rem+var(--site-bottom-nav-offset,0px)+env(safe-area-inset-bottom,0px))] pt-6 sm:px-6 lg:pb-16 lg:pt-10">
      {preview ? (
        <div className="mb-6 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3">
          <div className="text-sm font-semibold tracking-wide text-amber-100">{tJobs("previewBanner")}</div>
          <p className="mt-1 text-sm leading-relaxed text-amber-100/80">{tJobs("previewBannerBody")}</p>
        </div>
      ) : null}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_19.5rem] lg:items-start lg:gap-10">
        <div className="min-w-0">
          <header>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="min-w-0 text-[1.65rem] font-semibold leading-tight tracking-tight text-white/94 sm:text-3xl">
                {job.title}
              </h1>
              {toolbar ? <div className="hidden shrink-0 items-center gap-2 lg:flex">{toolbar}</div> : null}
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
                    {companySlug && !preview ? (
                      <Link href={`/ettevotted/${companySlug}`} className="font-medium text-white/88 hover:underline">
                        {companyName}
                      </Link>
                    ) : (
                      <span className="font-medium text-white/88">{companyName}</span>
                    )}
                    {companyVerified ? <CompanyVerifiedBadge label={tJobs("companyVerifiedBadge")} /> : null}
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
            {salary ? (
              <p className="mt-4 text-[1.15rem] font-semibold tabular-nums tracking-tight text-white lg:hidden">
                {salary}
              </p>
            ) : null}
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

          {mobileLead ? <div className="mt-5 lg:hidden">{mobileLead}</div> : null}

          <div className="mt-2">
            {shortSummary ? (
              <DetailSection title={tJobs("jobDetailSectionSummary")}>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/75">{shortSummary}</p>
              </DetailSection>
            ) : null}

            {description ? (
              <DetailSection title={tJobs("jobDetailSectionDescription")}>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/75">{description}</p>
              </DetailSection>
            ) : null}

            {dutyLines.length ? (
              <DetailSection title={tJobs("jobDetailSectionDuties")}>
                <RequirementList items={dutyLines.map((text) => ({ text }))} />
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

            {benefitLines.length ? (
              <DetailSection title={tJobs("jobDetailSectionBenefits")}>
                <RequirementList items={benefitLines.map((text) => ({ text }))} />
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

            {applySection}
          </div>
        </div>
        {sidebar ? (
          <div className="hidden lg:sticky lg:top-[calc(var(--site-header-offset)+0.75rem)] lg:block">{sidebar}</div>
        ) : null}
      </div>
    </div>
  );
}
