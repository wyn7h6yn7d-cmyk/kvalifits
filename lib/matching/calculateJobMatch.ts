/**
 * Deterministic job–seeker suitability scoring (MATCH_MODEL_VERSION).
 *
 * Role of this score (non-negotiable product rules):
 * - MAY rank and recommend candidates for the employer.
 * - MUST NOT alone auto-reject a candidate, block applying, or make a final hire decision.
 * - Final hiring decisions are always made by the employer.
 *
 * Legal / mandatory work-condition conflicts (e.g. minor hours, night work, hazardous work)
 * are evaluated in `evaluateApplyEligibility` / employment-rules — never folded into this
 * score as a silent reject. Age, disability, health, and work-capacity are not score inputs.
 *
 * Night/hazardous flags on the job are ignored here; they belong to eligibility only.
 */
import {
  isExperienceLevel,
  jobExperienceOpenToBeginners,
} from "@/lib/matching/profileRules";
import type { ExperienceBackgroundMatchInput } from "@/lib/seeker/experienceBackground";
import type { ApplicationAnswers, AvailabilityStart, ScheduleFit } from "@/lib/jobs/applicationAnswers";
import {
  resolveJobRequirements,
  type JobRequirementItem,
} from "@/lib/jobs/jobRequirements";
import { isCertificateValidForMatching } from "@/lib/seeker/certificateVerification";
import {
  normalizeMatchBlob,
  tokenizeToCanonSet,
  overlapJaccard,
  jaccardToStrength,
  strengthToScore,
} from "@/lib/matching/normalization";

/** Weighted suitability model. Bump when weights or dimensions change. */
export const MATCH_MODEL_VERSION = 8 as const;

/**
 * Product contract for consumers of `calculateJobMatch`.
 * Score is advisory ranking only — never an apply gate or auto-reject.
 */
export const MATCH_SCORE_ROLE = {
  ranksAndRecommends: true,
  autoRejects: false,
  blocksApply: false,
  makesFinalHireDecision: false,
  finalDecisionBy: "employer" as const,
} as const;

/**
 * Fixed employer-facing weights (sum = 100).
 * Mandatory structured requirements weigh more than recommended ones.
 */
export const MATCH_WEIGHTS = {
  skillsKeywords: 17,
  certificates: 14,
  requirementsMandatory: 18,
  requirementsRecommended: 3,
  experience: 10,
  location: 7,
  languages: 6,
  workMode: 5,
  arrangement: 5,
  workload: 5,
  workHours: 5,
  availability: 5,
} as const;

export type SeekerMatchInput = {
  profile_title: string | null;
  full_name: string | null;
  location: string | null;
  about: string | null;
  skills: string[] | null;
  experience_level: string | null;
  preferred_job_types: string[] | null;
  preferred_locations: string[] | null;
  has_b_category_drivers_license?: boolean | null;
  experience_background?: ExperienceBackgroundMatchInput | null;
  languages?: string[] | null;
  pref_desired_weekly_hours?: number | null;
  pref_min_weekly_hours?: number | null;
  pref_max_weekly_hours?: number | null;
  pref_full_time?: boolean | null;
  pref_part_time?: boolean | null;
  pref_remote_work?: boolean | null;
  pref_hybrid_work?: boolean | null;
  pref_on_site_work?: boolean | null;
};

export type SeekerCertificateInput = {
  certificate_name: string | null;
  certificate_issuer: string | null;
  /** When set and in the past, certificate is ignored for requirement matching. */
  certificate_valid_until?: string | null;
};

export type JobMatchInput = {
  title: string | null;
  location: string | null;
  work_type: string | null;
  job_type: string | null;
  short_summary: string | null;
  description: string | null;
  requirements: string | null;
  requirement_lines: string[] | null;
  job_requirements?: unknown;
  required_skills: string[] | null;
  keywords: string[] | null;
  experience_level_required: string | null;
  certificate_requirements: string | null;
  weekly_hours?: number | null;
  daily_hours?: number | null;
  shift_start?: string | null;
  shift_end?: string | null;
  includes_night_work?: boolean | null;
  is_hazardous_work?: boolean | null;
};

/** Optional apply-time signals (never health / age / work-capacity). */
export type MatchContextInput = {
  answers?: Pick<
    ApplicationAnswers,
    "weeklyHoursDesired" | "scheduleFits" | "availability_start" | "availability_start_date"
  > | null;
};

/**
 * Stored on `job_applications.match_breakdown` (JSON).
 * - `*_raw` are 0–1 sub-scores before applying fixed weights.
 * - `*_contribution` are points (0–weight) added to the final percentage.
 */
export type MatchBreakdown = {
  modelVersion: number;
  weights: typeof MATCH_WEIGHTS;

  skills_keywords_raw: number;
  certificate_raw: number;
  experience_raw: number;
  /** @deprecated v7 keeps for legacy UI; always mirrors skills overlap with title. */
  role_title_raw: number;
  location_raw: number;
  /** Blend of work mode + arrangement for older UI rows. */
  work_job_type_raw: number;

  requirements_mandatory_raw: number;
  requirements_recommended_raw: number;
  languages_raw: number;
  work_mode_raw: number;
  arrangement_raw: number;
  workload_raw: number;
  work_hours_raw: number;
  availability_raw: number;

  skills_keywords_contribution: number;
  certificate_contribution: number;
  experience_contribution: number;
  role_title_contribution: number;
  location_contribution: number;
  work_job_type_contribution: number;

  requirements_mandatory_contribution: number;
  requirements_recommended_contribution: number;
  languages_contribution: number;
  work_mode_contribution: number;
  arrangement_contribution: number;
  workload_contribution: number;
  work_hours_contribution: number;
  availability_contribution: number;

  requirementsMatched: number;
  requirementsTotal: number;
  requirementsMandatoryMatched: number;
  requirementsMandatoryTotal: number;
  requirementsRecommendedMatched: number;
  requirementsRecommendedTotal: number;

  tag_total: number;
  tag_matched_full: number;
  tag_matched_partial: number;

  certificate_slots_required: number;
  certificate_slots_matched: number;

  weak_areas: string[];
  highlights: string[];
  /** Short machine codes for UI reason lines (always populated when possible). */
  reason_codes: string[];

  penalty_points?: number;
  penalty_codes?: string[];
  score_before_soft_floor?: number;
  soft_floor_applied?: number;
};

const EXP_RANK: Record<string, number> = {
  entry: 1,
  mid: 2,
  senior: 3,
  lead: 4,
  executive: 5,
};

const LANG_HINT =
  /\b(eesti|inglise|vene|soome|saksa|prantsuse|hispaania|rootsi|läti|leedu|estonian|english|russian|finnish|german|french|spanish|swedish|latvian|lithuanian|keeleoskus|language|язык|эстон|англий|русск)\b/i;

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function clampScore(x: number) {
  return Math.max(0, Math.min(100, x));
}

function dedupeNormTags(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const t = normalizeMatchBlob([raw]);
    if (t.length < 2) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.slice(0, 40);
}

function tagMatchStrength(
  tag: string,
  seekerSkillNorms: Set<string>,
  titleBlob: string,
  skillsBlob: string
): number {
  if (!tag) return 0;
  if (seekerSkillNorms.has(tag)) return 1;
  if (titleBlob.includes(tag) || skillsBlob.includes(tag)) return 1;
  const tagSet = tokenizeToCanonSet([tag]);
  if (!tagSet.size) return 0;
  const seekerSet = tokenizeToCanonSet([titleBlob, skillsBlob, ...Array.from(seekerSkillNorms)]);
  const j = overlapJaccard(tagSet, seekerSet);
  return strengthToScore(jaccardToStrength(j));
}

function lineEvidence(line: string, seekerTokenSet: Set<string>): boolean {
  const lineSet = tokenizeToCanonSet([line]);
  if (!lineSet.size) return false;
  return overlapJaccard(lineSet, seekerTokenSet) >= 0.34;
}

function skillsRaw(
  job: JobMatchInput,
  seekerSkills: string[],
  profileTitle: string | null
): {
  raw: number;
  tag_total: number;
  tag_matched_full: number;
  tag_matched_partial: number;
} {
  const skillNorms = new Set(seekerSkills.map((s) => normalizeMatchBlob([s])).filter(Boolean));
  const titleBlob = normalizeMatchBlob([profileTitle]);
  const skillsBlob = normalizeMatchBlob([seekerSkills.join(" ")]);
  const tags = dedupeNormTags([
    ...(job.required_skills ?? []).map((s) => String(s)),
    ...(job.keywords ?? []).map((s) => String(s)),
  ]);

  let tagSum = 0;
  let full = 0;
  let partial = 0;
  for (const tag of tags) {
    const m = tagMatchStrength(tag, skillNorms, titleBlob, skillsBlob);
    tagSum += m;
    if (m >= 1) full++;
    else if (m > 0) partial++;
  }
  const role = roleTitleRaw(profileTitle, job.title);
  const tagPart = tags.length ? tagSum / tags.length : 0.12;
  // Light role blend into skills axis (no separate weight).
  const raw = tags.length ? clamp01(0.85 * tagPart + 0.15 * role) : clamp01(0.55 * role + 0.12);
  return { raw, tag_total: tags.length, tag_matched_full: full, tag_matched_partial: partial };
}

function requirementsScored(
  items: JobRequirementItem[],
  seekerTokenSet: Set<string>
): {
  mandatoryRaw: number;
  recommendedRaw: number;
  matched: number;
  total: number;
  mandatoryMatched: number;
  mandatoryTotal: number;
  recommendedMatched: number;
  recommendedTotal: number;
} {
  let mandTotal = 0;
  let mandMatched = 0;
  let recTotal = 0;
  let recMatched = 0;
  let matched = 0;

  for (const item of items) {
    const ok = lineEvidence(item.text, seekerTokenSet);
    if (ok) matched++;
    if (item.priority === "mandatory") {
      mandTotal++;
      if (ok) mandMatched++;
    } else {
      recTotal++;
      if (ok) recMatched++;
    }
  }

  return {
    mandatoryRaw: mandTotal > 0 ? mandMatched / mandTotal : 1,
    recommendedRaw: recTotal > 0 ? recMatched / recTotal : 1,
    matched,
    total: items.length,
    mandatoryMatched: mandMatched,
    mandatoryTotal: mandTotal,
    recommendedMatched: recMatched,
    recommendedTotal: recTotal,
  };
}

function parseCertificateSlots(text: string | null): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/[,;\n\r]+/g)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2)
    .slice(0, 14);
}

function certificateRaw(
  certs: SeekerCertificateInput[],
  jobCertText: string | null,
  jobKeywords: string[] | null,
  asOf: Date = new Date()
): { raw: number; slots: number; matched: number } {
  // Expired certificates must not fulfil required certificate slots.
  const active = certs.filter((c) =>
    isCertificateValidForMatching(c.certificate_valid_until ?? null, asOf)
  );
  const slots = parseCertificateSlots(jobCertText);
  const seekerBlob = normalizeMatchBlob(
    active.map((c) => `${c.certificate_name ?? ""} ${c.certificate_issuer ?? ""}`)
  );
  const seekerCertSet = tokenizeToCanonSet(
    active.map((c) => `${c.certificate_name ?? ""} ${c.certificate_issuer ?? ""}`)
  );

  if (!slots.length) {
    const kw = dedupeNormTags((jobKeywords ?? []).map(String));
    const kwNeedle = kw.filter((k) => k.length > 3 && LANG_HINT.test(k) === false);
    if (!kwNeedle.length) return { raw: 0.55, slots: 0, matched: 0 };
    if (!active.length) return { raw: 0.2, slots: 0, matched: 0 };
    let h = 0;
    for (const k of kwNeedle) {
      const j = overlapJaccard(tokenizeToCanonSet([k]), seekerCertSet);
      if (j >= 0.34 || seekerBlob.includes(k)) h++;
    }
    return { raw: clamp01(0.25 + (h / kwNeedle.length) * 0.55), slots: 0, matched: h };
  }

  if (!active.length) return { raw: 0, slots: slots.length, matched: 0 };

  let matched = 0;
  for (const slot of slots) {
    const slotNorm = normalizeMatchBlob([slot]);
    if (!slotNorm) continue;
    if (seekerBlob.includes(slotNorm)) {
      matched++;
      continue;
    }
    const j = overlapJaccard(tokenizeToCanonSet([slot]), seekerCertSet);
    if (j >= 0.34) matched++;
  }
  return { raw: clamp01(matched / slots.length), slots: slots.length, matched };
}

function experienceRaw(
  seekerExp: string | null,
  jobExp: string | null,
  bg?: ExperienceBackgroundMatchInput | null
): number {
  if (jobExp === "not_required") return 1;

  const duration =
    bg?.experience_duration_years !== null &&
    bg?.experience_duration_years !== undefined &&
    Number.isFinite(Number(bg.experience_duration_years))
      ? Number(bg.experience_duration_years)
      : null;
  const zeroYears = duration !== null && duration <= 0;
  const firstJob = Boolean(bg?.seeking_first_job) || zeroYears;
  const altExperience =
    Boolean(bg?.has_internship) ||
    Boolean(bg?.has_volunteer) ||
    Boolean(bg?.has_project) ||
    Boolean(bg?.has_prior_work);
  const openToBeginners = jobExperienceOpenToBeginners(jobExp);

  if (openToBeginners) {
    if (firstJob || Boolean(bg?.is_student)) return 1;
    if (altExperience) return 0.95;
  }

  if (!jobExp || !isExperienceLevel(jobExp)) return 0.28;

  if ((!seekerExp || !isExperienceLevel(seekerExp)) && altExperience) {
    if (jobExp === "entry") return 0.92;
    if (jobExp === "mid") return 0.42;
    return 0.22;
  }

  if (!seekerExp || !isExperienceLevel(seekerExp)) {
    if (zeroYears && jobExp === "entry") return 1;
    return 0.08;
  }

  const sj = EXP_RANK[seekerExp] ?? 0;
  const jj = EXP_RANK[jobExp] ?? 0;
  if (sj <= 0 || jj <= 0) return 0.18;
  if (sj >= jj) return 1;
  const gap = jj - sj;
  if (gap === 1) return 0.62;
  if (gap === 2) return 0.38;
  return 0.16;
}

function roleTitleRaw(seekerTitle: string | null, jobTitle: string | null): number {
  const a = tokenizeToCanonSet([seekerTitle]);
  const b = tokenizeToCanonSet([jobTitle]);
  if (!a.size && !b.size) return 0.18;
  if (!a.size || !b.size) return 0.08;
  const j = overlapJaccard(a, b);
  const sn = normalizeMatchBlob([seekerTitle]);
  const jn = normalizeMatchBlob([jobTitle]);
  const sub =
    sn.length > 4 && jn.length > 4 && (sn.includes(jn) || jn.includes(sn));
  return clamp01(Math.max(j, sub ? 0.6 : j));
}

function locationRaw(
  jobLoc: string | null,
  jobWork: string | null,
  seekerLoc: string | null,
  preferredLocs: string[] | null
): number {
  const jw = (jobWork ?? "").toLowerCase();
  if (jw === "remote") return 0.85;
  const jl = (jobLoc ?? "").toLowerCase().trim();
  if (!jl) return 0.35;
  const sl = (seekerLoc ?? "").toLowerCase().trim();
  const prefs = (preferredLocs ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  if (sl && (sl.includes(jl) || jl.includes(sl))) return 1;
  if (prefs.some((p) => p && (jl.includes(p) || p.includes(jl)))) return 0.82;
  if (jw === "hybrid") return 0.42;
  return 0.08;
}

function languagesRaw(job: JobMatchInput, seekerLangs: string[] | null | undefined): number {
  const hints = [
    ...(job.requirement_lines ?? []).map(String),
    ...(job.required_skills ?? []).map(String),
    ...(job.keywords ?? []).map(String),
    String(job.certificate_requirements ?? ""),
    String(job.short_summary ?? ""),
    String(job.title ?? ""),
  ].filter(Boolean);

  const langHints = hints.filter((h) => LANG_HINT.test(h));
  const langs = (seekerLangs ?? []).map((x) => String(x).trim()).filter(Boolean);

  if (!langHints.length) {
    // No language expectation on the job — neutral, not a free 100%.
    return langs.length ? 0.72 : 0.55;
  }
  if (!langs.length) return 0.12;

  const hay = langHints.join(" ").toLowerCase();
  let hits = 0;
  for (const l of langs) {
    const n = l.toLowerCase();
    if (hay.includes(n) || LANG_HINT.test(l)) hits++;
  }
  if (hits === 0) return 0.18;
  return clamp01(0.45 + (hits / Math.max(langs.length, langHints.length)) * 0.55);
}

function workModeRaw(
  jobWork: string | null,
  seeker: SeekerMatchInput
): number {
  const wt = (jobWork ?? "").toLowerCase().trim();
  const remote = Boolean(seeker.pref_remote_work);
  const hybrid = Boolean(seeker.pref_hybrid_work);
  const onSite = Boolean(seeker.pref_on_site_work);
  const anyPref = remote || hybrid || onSite;

  if (!wt) return 0.45;
  if (!anyPref) {
    if (wt === "remote") return 0.7;
    if (wt === "hybrid") return 0.55;
    return 0.4;
  }
  if (wt === "remote") return remote ? 1 : hybrid ? 0.55 : 0.12;
  if (wt === "hybrid") return hybrid ? 1 : remote || onSite ? 0.62 : 0.2;
  if (wt === "on_site") return onSite ? 1 : hybrid ? 0.45 : 0.15;
  return 0.4;
}

function arrangementRaw(
  jobType: string | null,
  preferredTypes: string[] | null,
  scheduleFits: ScheduleFit | null | undefined,
  seeker: SeekerMatchInput
): number {
  const jt = (jobType ?? "").toLowerCase().trim();
  const pj = (preferredTypes ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  let typePart = 0.4;
  if (jt && pj.length) {
    typePart = pj.some((p) => p && (jt === p || jt.includes(p) || p.includes(jt))) ? 1 : 0.12;
  } else if (jt === "full_time" && seeker.pref_full_time) typePart = 1;
  else if (jt === "part_time" && seeker.pref_part_time) typePart = 1;
  else if (jt && (seeker.pref_full_time || seeker.pref_part_time)) {
    if (jt === "full_time") typePart = seeker.pref_full_time ? 1 : 0.2;
    else if (jt === "part_time") typePart = seeker.pref_part_time ? 1 : 0.25;
  }

  let schedulePart = 0.55;
  if (scheduleFits === "yes") schedulePart = 1;
  else if (scheduleFits === "partial") schedulePart = 0.55;
  else if (scheduleFits === "no") schedulePart = 0.08;

  return clamp01(0.55 * typePart + 0.45 * schedulePart);
}

function expectedJobWeeklyHours(job: JobMatchInput): number | null {
  const wh = job.weekly_hours;
  if (wh !== null && wh !== undefined && Number.isFinite(Number(wh)) && Number(wh) > 0) {
    return Number(wh);
  }
  const jt = (job.job_type ?? "").toLowerCase();
  if (jt === "full_time") return 40;
  if (jt === "part_time") return 20;
  return null;
}

function workloadRaw(
  job: JobMatchInput,
  seeker: SeekerMatchInput,
  answersHours: number | null | undefined
): number {
  const jobHours = expectedJobWeeklyHours(job);
  const desired =
    answersHours !== null && answersHours !== undefined && Number.isFinite(answersHours)
      ? Number(answersHours)
      : seeker.pref_desired_weekly_hours !== null &&
          seeker.pref_desired_weekly_hours !== undefined &&
          Number.isFinite(Number(seeker.pref_desired_weekly_hours))
        ? Number(seeker.pref_desired_weekly_hours)
        : null;

  if (jobHours === null || desired === null) {
    const jt = (job.job_type ?? "").toLowerCase();
    if (jt === "full_time" && seeker.pref_full_time) return 0.9;
    if (jt === "part_time" && seeker.pref_part_time) return 0.9;
    return 0.5;
  }

  const delta = Math.abs(desired - jobHours);
  if (delta <= 2) return 1;
  if (delta <= 6) return 0.78;
  if (delta <= 12) return 0.45;
  if (delta <= 20) return 0.22;
  return 0.08;
}

function workHoursRaw(
  job: JobMatchInput,
  seeker: SeekerMatchInput,
  scheduleFits: ScheduleFit | null | undefined
): number {
  const jobHours = expectedJobWeeklyHours(job);
  const min =
    seeker.pref_min_weekly_hours !== null && seeker.pref_min_weekly_hours !== undefined
      ? Number(seeker.pref_min_weekly_hours)
      : null;
  const max =
    seeker.pref_max_weekly_hours !== null && seeker.pref_max_weekly_hours !== undefined
      ? Number(seeker.pref_max_weekly_hours)
      : null;

  let rangePart = 0.55;
  if (jobHours !== null && (min !== null || max !== null)) {
    const lo = min !== null && Number.isFinite(min) ? min : 0;
    const hi = max !== null && Number.isFinite(max) ? max : 60;
    if (jobHours >= lo && jobHours <= hi) rangePart = 1;
    else if (jobHours < lo) rangePart = clamp01(1 - (lo - jobHours) / 20);
    else rangePart = clamp01(1 - (jobHours - hi) / 20);
  }

  let schedulePart = 0.55;
  if (scheduleFits === "yes") schedulePart = 1;
  else if (scheduleFits === "partial") schedulePart = 0.5;
  else if (scheduleFits === "no") schedulePart = 0.1;

  return clamp01(0.6 * rangePart + 0.4 * schedulePart);
}

function availabilityRaw(start: AvailabilityStart | null | undefined): number {
  if (!start) return 0.55;
  switch (start) {
    case "immediate":
      return 1;
    case "within_1_week":
      return 0.95;
    case "within_2_weeks":
      return 0.88;
    case "within_1_month":
      return 0.7;
    case "by_agreement":
      return 0.75;
    case "specific_date":
      return 0.55;
    default:
      return 0.5;
  }
}

function weakAreasFrom(args: {
  skills: number;
  cert: number;
  certSlots: number;
  mandReq: number;
  mandTotal: number;
  exp: number;
  loc: number;
  languages: number;
  workMode: number;
  arrangement: number;
  workload: number;
  availability: number;
}): string[] {
  const w: string[] = [];
  if (args.skills < 0.38) w.push("skills_keywords");
  if (args.certSlots > 0 && args.cert < 0.42) w.push("certificates");
  if (args.mandTotal > 0 && args.mandReq < 0.5) w.push("requirements_mandatory");
  if (args.exp < 0.45) w.push("experience");
  if (args.loc < 0.45) w.push("location");
  if (args.languages < 0.4) w.push("languages");
  if (args.workMode < 0.4) w.push("work_mode");
  if (args.arrangement < 0.4) w.push("arrangement");
  if (args.workload < 0.4) w.push("workload");
  if (args.availability < 0.4) w.push("availability");
  return w;
}

function computeSoftFloorPercent(args: {
  skRaw: number;
  expRaw: number;
  roleRaw: number;
  locRaw: number;
  mandRaw: number;
  cSkills: number;
  cEx: number;
  cLoc: number;
  cCert: number;
  cMand: number;
}): number {
  const { skRaw, expRaw, roleRaw, locRaw, mandRaw, cSkills, cEx, cLoc, cCert, cMand } = args;
  if (skRaw < 0.12 && roleRaw < 0.12 && locRaw < 0.42 && expRaw < 0.38 && mandRaw < 0.25) return 0;

  const anyProfessional = skRaw >= 0.16 || roleRaw >= 0.14 || mandRaw >= 0.4;
  const contextOk = locRaw >= 0.55 || expRaw >= 0.45;
  const expLocStrong = expRaw >= 0.58 && locRaw >= 0.72;

  let f = 0;
  if (expLocStrong) f = Math.max(f, 15);
  if (expRaw >= 0.45 && locRaw >= 0.8) f = Math.max(f, 13);
  if ((skRaw >= 0.22 || roleRaw >= 0.18) && (expRaw >= 0.45 || locRaw >= 0.55)) f = Math.max(f, 14);
  if (skRaw >= 0.28 && roleRaw >= 0.18) f = Math.max(f, 17);
  if (cSkills + cMand >= 10 && cEx + cLoc >= 7) f = Math.max(f, 16);
  if (cCert >= 6 && (skRaw >= 0.2 || roleRaw >= 0.16)) f = Math.max(f, 12);
  if (f === 0 && anyProfessional && contextOk) f = Math.max(f, 10);
  if (f === 0 && skRaw >= 0.16 && locRaw >= 0.68) f = Math.max(f, 9);
  if (skRaw < 0.14 && roleRaw < 0.14 && mandRaw < 0.25 && !expLocStrong) return Math.min(f, 6);
  return Math.min(Math.round(f), 32);
}

function buildReasonCodes(args: {
  cert: { raw: number; slots: number };
  loc: number;
  arrangement: number;
  scheduleFits?: ScheduleFit | null;
  languages: number;
  langRelevant: boolean;
  availability: number;
  hasAvailability: boolean;
  exp: number;
  experienceNotRequired: boolean;
  mand: { raw: number; total: number };
  rec: { raw: number; total: number };
  skills: number;
  workMode: number;
  workload: number;
  workHours: number;
}): string[] {
  const codes: string[] = [];
  const push = (code: string) => {
    if (!codes.includes(code)) codes.push(code);
  };

  if (args.cert.slots > 0) {
    if (args.cert.raw >= 0.72) push("matchReasonCertPass");
    else if (args.cert.raw >= 0.42) push("matchReasonCertPartial");
    else push("matchReasonCertGap");
  }

  if (args.loc >= 0.72) push("matchReasonLocPass");
  else if (args.loc >= 0.45) push("matchReasonLocPartial");
  else push("matchReasonLocGap");

  if (args.scheduleFits === "yes" || args.arrangement >= 0.72) push("matchReasonSchedulePass");
  else if (args.scheduleFits === "partial" || args.arrangement >= 0.42) push("matchReasonSchedulePartial");
  else push("matchReasonScheduleGap");

  if (args.langRelevant) {
    if (args.languages >= 0.72) push("matchReasonLangPass");
    else if (args.languages >= 0.4) push("matchReasonLangPartial");
    else push("matchReasonLangGap");
  }

  if (args.hasAvailability) {
    if (args.availability >= 0.85) push("matchReasonStartPass");
    else if (args.availability >= 0.55) push("matchReasonStartPartial");
    else push("matchReasonStartGap");
  }

  if (args.experienceNotRequired || args.exp >= 0.75) push("matchReasonExpPass");
  else if (args.exp >= 0.45) push("matchReasonExpPartial");
  else push("matchReasonExpGap");

  if (args.mand.total > 0) {
    if (args.mand.raw >= 0.7) push("matchReasonMandReqPass");
    else if (args.mand.raw >= 0.35) push("matchReasonMandReqPartial");
    else push("matchReasonMandReqGap");
  }
  if (args.rec.total > 0) {
    if (args.rec.raw >= 0.7) push("matchReasonRecReqPass");
    else if (args.rec.raw >= 0.35) push("matchReasonRecReqPartial");
    else push("matchReasonRecReqGap");
  }

  if (args.skills >= 0.72) push("matchReasonSkillsPass");
  else if (args.skills >= 0.38) push("matchReasonSkillsPartial");
  else push("matchReasonSkillsGap");

  if (args.workMode >= 0.72) push("matchReasonWorkModePass");
  else if (args.workMode >= 0.4) push("matchReasonWorkModePartial");
  else push("matchReasonWorkModeGap");

  if (args.workload >= 0.72) push("matchReasonWorkloadPass");
  else if (args.workload >= 0.4) push("matchReasonWorkloadPartial");
  else push("matchReasonWorkloadGap");

  if (args.workHours >= 0.72) push("matchReasonHoursPass");
  else if (args.workHours >= 0.4) push("matchReasonHoursPartial");
  else push("matchReasonHoursGap");

  // Prefer gaps + passes balance: keep first 8 unique in priority order.
  const priority = [
    "matchReasonMandReqGap",
    "matchReasonCertGap",
    "matchReasonMandReqPass",
    "matchReasonCertPass",
    "matchReasonSkillsPass",
    "matchReasonSkillsGap",
    "matchReasonLocPass",
    "matchReasonLocGap",
    "matchReasonExpPass",
    "matchReasonExpPartial",
    "matchReasonExpGap",
    "matchReasonSchedulePass",
    "matchReasonScheduleGap",
    "matchReasonLangPass",
    "matchReasonLangGap",
    "matchReasonStartPass",
    "matchReasonWorkloadPass",
    "matchReasonWorkModePass",
    "matchReasonHoursPass",
    "matchReasonRecReqPass",
    "matchReasonRecReqGap",
    "matchReasonMandReqPartial",
    "matchReasonSkillsPartial",
    "matchReasonSchedulePartial",
    "matchReasonLangPartial",
    "matchReasonStartPartial",
    "matchReasonWorkloadPartial",
    "matchReasonWorkModePartial",
    "matchReasonHoursPartial",
    "matchReasonRecReqPartial",
    "matchReasonCertPartial",
    "matchReasonLocPartial",
  ];
  const ordered: string[] = [];
  for (const p of priority) {
    if (codes.includes(p)) ordered.push(p);
    if (ordered.length >= 8) break;
  }
  for (const c of codes) {
    if (!ordered.includes(c)) ordered.push(c);
    if (ordered.length >= 8) break;
  }
  return ordered;
}

export function calculateJobMatch(
  seeker: SeekerMatchInput,
  certs: SeekerCertificateInput[],
  job: JobMatchInput,
  context?: MatchContextInput | null
): { score: number; breakdown: MatchBreakdown } {
  const answers = context?.answers ?? null;
  const seekerSkills = (seeker.skills ?? []).map((s) => String(s).trim()).filter(Boolean);
  const seekerTokenSet = tokenizeToCanonSet([
    seeker.profile_title,
    seeker.about,
    seekerSkills.join(" "),
    ...seekerSkills,
    ...(seeker.languages ?? []).map(String),
  ]);

  const reqItems = resolveJobRequirements({
    job_requirements: job.job_requirements,
    requirement_lines: job.requirement_lines,
    requirements: job.requirements,
  });

  const sk = skillsRaw(job, seekerSkills, seeker.profile_title);
  const req = requirementsScored(reqItems, seekerTokenSet);

  const certInputs: SeekerCertificateInput[] = [...certs];
  if (seeker.has_b_category_drivers_license) {
    certInputs.push({
      certificate_name: "B-kategooria juhiluba",
      certificate_issuer: "juhiluba",
    });
  }
  const cert = certificateRaw(certInputs, job.certificate_requirements, job.keywords ?? []);
  const ex = experienceRaw(seeker.experience_level, job.experience_level_required, seeker.experience_background);
  const role = roleTitleRaw(seeker.profile_title, job.title);
  const loc = locationRaw(job.location, job.work_type, seeker.location, seeker.preferred_locations);
  const languages = languagesRaw(job, seeker.languages);
  const workMode = workModeRaw(job.work_type, seeker);
  const arrangement = arrangementRaw(
    job.job_type,
    seeker.preferred_job_types,
    answers?.scheduleFits,
    seeker
  );
  const workload = workloadRaw(job, seeker, answers?.weeklyHoursDesired ?? null);
  const workHours = workHoursRaw(job, seeker, answers?.scheduleFits);
  const availability = availabilityRaw(answers?.availability_start);

  const w = MATCH_WEIGHTS;
  const cSkills = Math.round(sk.raw * w.skillsKeywords);
  const cCert = Math.round(cert.raw * w.certificates);
  const cMand = Math.round(req.mandatoryRaw * w.requirementsMandatory);
  const cRec = Math.round(req.recommendedRaw * w.requirementsRecommended);
  const cEx = Math.round(ex * w.experience);
  const cLoc = Math.round(loc * w.location);
  const cLang = Math.round(languages * w.languages);
  const cMode = Math.round(workMode * w.workMode);
  const cArr = Math.round(arrangement * w.arrangement);
  const cLoad = Math.round(workload * w.workload);
  const cHours = Math.round(workHours * w.workHours);
  const cAvail = Math.round(availability * w.availability);

  let score =
    cSkills + cCert + cMand + cRec + cEx + cLoc + cLang + cMode + cArr + cLoad + cHours + cAvail;

  const penaltyCodes: string[] = [];
  let penaltyPoints = 0;

  if (sk.raw < 0.18) {
    penaltyCodes.push("no_skill_requirements_overlap");
    penaltyPoints += 3;
  } else if (sk.raw < 0.3) {
    penaltyCodes.push("weak_skill_requirements_overlap");
    penaltyPoints += 2;
  }

  if (req.mandatoryTotal > 0) {
    if (req.mandatoryRaw < 0.34) {
      penaltyCodes.push("missing_mandatory_requirements");
      penaltyPoints += 8;
    } else if (req.mandatoryRaw < 0.6) {
      penaltyCodes.push("partial_mandatory_requirements");
      penaltyPoints += 4;
    }
  }

  if (req.recommendedTotal > 0 && req.recommendedRaw < 0.34) {
    penaltyCodes.push("missing_recommended_requirements");
    penaltyPoints += 2;
  }

  if (cert.slots > 0) {
    if (cert.raw < 0.34) {
      penaltyCodes.push("missing_required_certificates");
      penaltyPoints += 7;
    } else if (cert.raw < 0.6) {
      penaltyCodes.push("partial_certificates");
      penaltyPoints += 3;
    }
  }

  if (sk.raw < 0.22 && req.mandatoryRaw < 0.35 && role < 0.22) {
    penaltyCodes.push("professional_alignment_missing");
    penaltyPoints += 3;
  }

  score = score - penaltyPoints;

  function applyCap(code: string, cap: number) {
    if (score > cap) {
      const delta = score - cap;
      penaltyCodes.push(code);
      penaltyPoints += delta;
      score = cap;
    }
  }

  if (sk.raw < 0.18) applyCap("cap_no_skill_overlap", 48);
  if (req.mandatoryTotal > 0 && req.mandatoryRaw < 0.34) applyCap("cap_missing_mandatory_requirements", 42);
  if (cert.slots > 0 && cert.raw < 0.34) applyCap("cap_missing_required_certificates", 50);
  if (sk.raw < 0.22 && req.mandatoryRaw < 0.35 && role < 0.22) applyCap("cap_professional_alignment_missing", 38);

  const scoreBeforeSoftFloor = clampScore(score);
  const softFloor = computeSoftFloorPercent({
    skRaw: sk.raw,
    expRaw: ex,
    roleRaw: role,
    locRaw: loc,
    mandRaw: req.mandatoryRaw,
    cSkills,
    cEx,
    cLoc,
    cCert,
    cMand,
  });
  const finalScore = clampScore(Math.max(scoreBeforeSoftFloor, softFloor));
  const softFloorApplied = finalScore - scoreBeforeSoftFloor;
  score = finalScore;

  const weak = weakAreasFrom({
    skills: sk.raw,
    cert: cert.raw,
    certSlots: cert.slots,
    mandReq: req.mandatoryRaw,
    mandTotal: req.mandatoryTotal,
    exp: ex,
    loc,
    languages,
    workMode,
    arrangement,
    workload,
    availability,
  });

  const highlights: string[] = [];
  if (sk.raw >= 0.72) highlights.push("skillsStrong");
  else if (sk.raw >= 0.38) highlights.push("skillsPartial");
  if (req.mandatoryTotal && req.mandatoryRaw >= 0.7) highlights.push("requirementsStrong");
  else if (req.total && req.matched > 0) highlights.push("requirementsPartial");
  if (ex >= 0.75) highlights.push("experienceFit");
  if (loc >= 0.72) highlights.push("locationFit");
  if (cert.raw >= 0.72 && cert.slots > 0) highlights.push("certificatesStrong");
  else if (cert.raw >= 0.55) highlights.push("certificatesSignal");
  if (cert.slots > 0 && cert.raw < 0.35) highlights.push("certificateGap");
  if (role >= 0.45) highlights.push("roleAlignment");

  const langRelevant = [
    ...(job.requirement_lines ?? []),
    ...(job.required_skills ?? []),
    ...(job.keywords ?? []),
    String(job.short_summary ?? ""),
  ].some((h) => LANG_HINT.test(String(h)));

  const reason_codes = buildReasonCodes({
    cert,
    loc,
    arrangement,
    scheduleFits: answers?.scheduleFits,
    languages,
    langRelevant,
    availability,
    hasAvailability: Boolean(answers?.availability_start),
    exp: ex,
    experienceNotRequired: job.experience_level_required === "not_required",
    mand: { raw: req.mandatoryRaw, total: req.mandatoryTotal },
    rec: { raw: req.recommendedRaw, total: req.recommendedTotal },
    skills: sk.raw,
    workMode,
    workload,
    workHours,
  });

  const wjtBlend = clamp01(0.5 * workMode + 0.5 * arrangement);

  const breakdown: MatchBreakdown = {
    modelVersion: MATCH_MODEL_VERSION as number,
    weights: { ...MATCH_WEIGHTS },
    skills_keywords_raw: sk.raw,
    certificate_raw: cert.raw,
    experience_raw: ex,
    role_title_raw: role,
    location_raw: loc,
    work_job_type_raw: wjtBlend,
    requirements_mandatory_raw: req.mandatoryRaw,
    requirements_recommended_raw: req.recommendedRaw,
    languages_raw: languages,
    work_mode_raw: workMode,
    arrangement_raw: arrangement,
    workload_raw: workload,
    work_hours_raw: workHours,
    availability_raw: availability,
    skills_keywords_contribution: cSkills,
    certificate_contribution: cCert,
    experience_contribution: cEx,
    role_title_contribution: 0,
    location_contribution: cLoc,
    work_job_type_contribution: Math.round((cMode + cArr) / 2),
    requirements_mandatory_contribution: cMand,
    requirements_recommended_contribution: cRec,
    languages_contribution: cLang,
    work_mode_contribution: cMode,
    arrangement_contribution: cArr,
    workload_contribution: cLoad,
    work_hours_contribution: cHours,
    availability_contribution: cAvail,
    requirementsMatched: req.matched,
    requirementsTotal: req.total,
    requirementsMandatoryMatched: req.mandatoryMatched,
    requirementsMandatoryTotal: req.mandatoryTotal,
    requirementsRecommendedMatched: req.recommendedMatched,
    requirementsRecommendedTotal: req.recommendedTotal,
    tag_total: sk.tag_total,
    tag_matched_full: sk.tag_matched_full,
    tag_matched_partial: sk.tag_matched_partial,
    certificate_slots_required: cert.slots,
    certificate_slots_matched: cert.matched,
    weak_areas: weak,
    highlights,
    reason_codes,
    penalty_points: penaltyPoints,
    penalty_codes: penaltyCodes,
    score_before_soft_floor: scoreBeforeSoftFloor,
    soft_floor_applied: softFloorApplied,
  };

  return { score, breakdown };
}
