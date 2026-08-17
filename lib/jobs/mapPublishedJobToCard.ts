import type { Job } from "@/components/jobs/types";
import { isEmployerCompanyVerified } from "@/lib/employer/companyVerification";
import {
  jobPassesYoungSeekerAutoEligibility,
  jobWorkConditionsFromJobRow,
} from "@/lib/employmentRules";
import { formatJobSalaryDisplay, isJobSalaryPeriod, isJobSalaryTax } from "@/lib/jobs/jobSalary";

export type PublishedJobSearchRow = {
  id?: unknown;
  title?: unknown;
  location?: unknown;
  job_type?: unknown;
  work_type?: unknown;
  short_summary?: unknown;
  required_skills?: unknown;
  keywords?: unknown;
  certificate_requirements?: unknown;
  salary_min?: unknown;
  salary_max?: unknown;
  salary_currency?: unknown;
  salary_tax?: unknown;
  salary_period?: unknown;
  employer_profile_id?: unknown;
  status?: unknown;
  created_at?: unknown;
  published_at?: unknown;
  application_deadline?: unknown;
  expires_at?: unknown;
  experience_level_required?: unknown;
  weekly_hours?: unknown;
  daily_hours?: unknown;
  shift_start?: unknown;
  shift_end?: unknown;
  includes_night_work?: unknown;
  is_hazardous_work?: unknown;
  languages?: unknown;
  company_name?: unknown;
  logo_url?: unknown;
  company_verified?: unknown;
  verification_status?: unknown;
  industry?: unknown;
  public_slug?: unknown;
  description?: unknown;
};

function foldAscii(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

export function normFacetValue(s: string) {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[\u2011\u2010\u2212]/g, "-");
}

export function mapWorkType(raw: string, tJobs: (key: string) => string) {
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

export function mapJobType(raw: string, tJobs: (key: string) => string) {
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

export function canonicalJobTypeKey(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/-/g, "_");
  if (key === "full_time" || key === "part_time" || key === "contract" || key === "internship") return key;
  const c = foldAscii(raw).replace(/[-_\s]/g, "");
  if (c === "fulltime" || c === "taistooaeg" || c === "полнаязанятость") return "full_time";
  if (c === "parttime" || c === "osaline" || c === "частичнаязанятость") return "part_time";
  if (c === "contract" || c === "lepinguline" || c === "контракт") return "contract";
  if (c === "internship" || c === "praktika" || c === "стажировка") return "internship";
  return null;
}

export function canonicalWorkTypeKey(raw: string): string | null {
  const key = raw.trim().toLowerCase().replace(/-/g, "_");
  if (key === "on_site" || key === "onsite") return "on_site";
  if (key === "hybrid" || key === "remote") return key;
  const c = foldAscii(raw).replace(/[-_\s]/g, "");
  if (c === "remote" || c === "kaugtoo" || c === "удалённо" || c === "удаленно") return "remote";
  if (c === "hybrid" || c === "hubriid" || c === "гибрид") return "hybrid";
  if (c === "onsite" || c === "kohapeal" || c === "kohapealne" || c === "наместе") return "on_site";
  return null;
}

function toNumOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function extractSummary(description: string | null | undefined) {
  const raw = (description ?? "").toString().trim();
  if (!raw) return undefined;
  const firstBlock = raw.split(/\n\s*\n/)[0]?.trim() ?? "";
  if (!firstBlock) return undefined;
  const cleaned = firstBlock.replace(/^(Kokkuvõte|Summary)\s*:\s*/i, "").trim();
  return cleaned || undefined;
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

export function mapPublishedJobToCard(
  j: PublishedJobSearchRow,
  locale: string,
  tJobs: (key: string) => string,
): Job {
  const min = toNumOrNull(j.salary_min);
  const max = toNumOrNull(j.salary_max);
  const currency = (j.salary_currency ?? "EUR").toString();
  const salary = formatJobSalary(
    min,
    max,
    currency,
    locale,
    (j.salary_tax ?? null) as string | null,
    (j.salary_period ?? null) as string | null,
    tJobs,
  );

  const jobType = mapJobType((j.job_type ?? "").toString(), tJobs);
  const workType = mapWorkType((j.work_type ?? "").toString(), tJobs);
  const type = [workType, jobType].filter(Boolean).join(" · ") || "—";

  const summary =
    (j.short_summary ?? "").toString().trim() || extractSummary((j.description ?? "").toString()) || undefined;
  const kw = ((j.keywords as string[] | null) ?? []).map((x) => normFacetValue(String(x))).filter(Boolean);
  const skills = ((j.required_skills as string[] | null) ?? [])
    .map((x) => normFacetValue(String(x)))
    .filter(Boolean);
  const tags = Array.from(new Set([...skills, ...kw])).slice(0, 10);

  const certReq = (j.certificate_requirements ?? "").toString().trim();
  const requiredCerts = certReq
    ? certReq
        .split(/[,;\n]/g)
        .map((s) => normFacetValue(s))
        .filter(Boolean)
        .slice(0, 8)
    : [];

  const experienceLevel = (j.experience_level_required ?? "").toString().trim() || null;
  const industry = normFacetValue((j.industry ?? "").toString()) || null;
  const languages = ((j.languages as string[] | null) ?? [])
    .map((x) => normFacetValue(String(x)))
    .filter(Boolean);

  return {
    id: (j.id ?? "").toString(),
    title: (j.title ?? "").toString().trim() || "—",
    company: (j.company_name ?? "—").toString(),
    companyLogoUrl: (j.logo_url ?? "").toString().trim() || null,
    companyVerified: isEmployerCompanyVerified({
      company_verified: Boolean(j.company_verified),
      verification_status: (j.verification_status ?? null) as string | null,
    }),
    companySlug: (j.public_slug ?? "").toString().trim() || null,
    location: normFacetValue((j.location ?? "").toString()) || "—",
    type,
    salary,
    salaryMin: min,
    salaryMax: max,
    workType,
    jobType,
    summary,
    createdAt: (j.created_at as string | undefined) ?? undefined,
    publishedAt: ((j.published_at ?? j.created_at) as string | null) ?? null,
    applicationDeadline: (j.application_deadline as string | null) ?? null,
    tags,
    skills,
    requiredCerts,
    domains: industry ? [industry] : [],
    languages,
    experienceLevel,
    openToFirstJob: experienceLevel === "not_required",
    suitableForYoungSeeker: jobPassesYoungSeekerAutoEligibility(
      jobWorkConditionsFromJobRow({
        job_type: (j.job_type ?? null) as string | null,
        weekly_hours: toNumOrNull(j.weekly_hours),
        daily_hours: toNumOrNull(j.daily_hours),
        shift_start: (j.shift_start ?? null) as string | null,
        shift_end: (j.shift_end ?? null) as string | null,
        includes_night_work:
          j.includes_night_work === null || j.includes_night_work === undefined
            ? null
            : Boolean(j.includes_night_work),
        is_hazardous_work:
          j.is_hazardous_work === null || j.is_hazardous_work === undefined
            ? null
            : Boolean(j.is_hazardous_work),
      }),
    ),
  };
}
