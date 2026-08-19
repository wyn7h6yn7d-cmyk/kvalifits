/** Shared rules for structured profile/job data used by matching later. */

export const EXPERIENCE_LEVEL_VALUES = ["entry", "mid", "senior", "lead", "executive"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVEL_VALUES)[number];

/** Job-side levels include “experience not required” for beginner-friendly matching. */
export const JOB_EXPERIENCE_LEVEL_VALUES = ["not_required", ...EXPERIENCE_LEVEL_VALUES] as const;
export type JobExperienceLevel = (typeof JOB_EXPERIENCE_LEVEL_VALUES)[number];

export function isExperienceLevel(v: unknown): v is ExperienceLevel {
  return typeof v === "string" && (EXPERIENCE_LEVEL_VALUES as readonly string[]).includes(v);
}

export function isJobExperienceLevel(v: unknown): v is JobExperienceLevel {
  return typeof v === "string" && (JOB_EXPERIENCE_LEVEL_VALUES as readonly string[]).includes(v);
}

/** Roles open to first-job / 0-year seekers. */
export function jobExperienceOpenToBeginners(jobExp: string | null | undefined): boolean {
  if (!jobExp || !String(jobExp).trim()) return true;
  const v = String(jobExp).trim();
  return v === "not_required" || v === "entry";
}

export function parseCommaList(v: string): string[] {
  return v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** One non-empty requirement per line. */
export function parseRequirementLines(v: string): string[] {
  return v
    .split(/\r?\n/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseTagList(v: string): string[] {
  const fromComma = parseCommaList(v);
  if (fromComma.length) return fromComma;
  return v
    .split(/\r?\n/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isLikelyHttpUrl(v: string) {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

const MIN_REQ_LINES = 2;
const MIN_SKILLS_JOB = 1;
const MIN_KEYWORDS_JOB = 1;
const MIN_SHORT_SUMMARY = 20;
const MIN_DESCRIPTION = 40;

export type SeekerCoreFields = {
  full_name: string | null;
  profile_title: string | null;
  phone: string | null;
  location: string | null;
  about: string | null;
  skills: string[] | null;
  experience_level: string | null;
  preferred_job_types: string[] | null;
  preferred_locations: string[] | null;
  date_of_birth?: string | null;
  learning_obligation_status?: string | null;
};

export type EmployerCoreFields = {
  company_name: string | null;
  contact_email: string | null;
  company_description: string | null;
  location: string | null;
  industry: string | null;
};

export function employerCoreComplete(e: EmployerCoreFields | null): boolean {
  if (!e) return false;
  const ind = (e.industry ?? "").trim();
  return (
    !!(e.company_name ?? "").trim() &&
    !!(e.contact_email ?? "").trim() &&
    (e.company_description ?? "").trim().length >= 40 &&
    !!(e.location ?? "").trim() &&
    ind.length >= 2
  );
}

export type JobMatchingFields = {
  title: string;
  location: string;
  work_type: string;
  job_type: string;
  short_summary: string | null;
  description: string;
  requirement_lines: string[] | null;
  required_skills: string[] | null;
  keywords: string[] | null;
  experience_level_required: string | null;
  certificate_requirements?: string | null;
  application_type: string;
  application_url: string | null;
};

export function jobMatchingReady(j: JobMatchingFields): boolean {
  if (!(j.title ?? "").trim() || !(j.location ?? "").trim()) return false;
  if (!(j.work_type ?? "").trim() || !(j.job_type ?? "").trim()) return false;
  const sum = (j.short_summary ?? "").trim();
  const desc = (j.description ?? "").trim();
  if (sum.length < MIN_SHORT_SUMMARY || desc.length < MIN_DESCRIPTION) return false;
  const lines = Array.isArray(j.requirement_lines) ? j.requirement_lines.filter(Boolean) : [];
  if (lines.length < MIN_REQ_LINES) return false;
  const skills = Array.isArray(j.required_skills) ? j.required_skills.filter(Boolean) : [];
  const kw = Array.isArray(j.keywords) ? j.keywords.filter(Boolean) : [];
  if (skills.length < MIN_SKILLS_JOB || kw.length < MIN_KEYWORDS_JOB) return false;
  if (!isJobExperienceLevel(j.experience_level_required)) return false;
  return true;
}
