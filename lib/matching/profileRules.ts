/** Shared rules for structured profile/job data used by matching later. */

export const EXPERIENCE_LEVEL_VALUES = ["entry", "mid", "senior", "lead", "executive"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVEL_VALUES)[number];

export function isExperienceLevel(v: unknown): v is ExperienceLevel {
  return typeof v === "string" && (EXPERIENCE_LEVEL_VALUES as readonly string[]).includes(v);
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

const MIN_ABOUT = 40;
const MIN_PROFILE_TITLE = 3;
const MIN_SKILLS = 2;
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
};

export function seekerCoreComplete(args: {
  avatarOk: boolean;
  seeker: SeekerCoreFields | null;
  /** Legacy param kept for compatibility; certificates are optional now. */
  certRowsWithImage: number;
}): boolean {
  const s = args.seeker;
  if (!args.avatarOk) return false;
  if (!s) return false;
  const about = (s.about ?? "").trim();
  const title = (s.profile_title ?? "").trim();
  const name = (s.full_name ?? "").trim();
  if (!name || !title || title.length < MIN_PROFILE_TITLE) return false;
  if (!isExperienceLevel(s.experience_level)) return false;
  if (!(s.phone ?? "").trim() || !(s.location ?? "").trim()) return false;
  if (about.length < MIN_ABOUT) return false;
  const skills = Array.isArray(s.skills) ? s.skills.filter(Boolean) : [];
  if (skills.length < MIN_SKILLS) return false;
  const jt = Array.isArray(s.preferred_job_types) ? s.preferred_job_types.filter(Boolean) : [];
  const loc = Array.isArray(s.preferred_locations) ? s.preferred_locations.filter(Boolean) : [];
  if (jt.length < 1 || loc.length < 1) return false;
  return true;
}

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
  if (!isExperienceLevel(j.experience_level_required)) return false;
  if (j.application_type === "external_url") {
    const url = (j.application_url ?? "").trim();
    if (!url || !isLikelyHttpUrl(url)) return false;
  }
  return true;
}
