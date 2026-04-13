import { EXPERIENCE_LEVEL_VALUES, isExperienceLevel } from "@/lib/matching/profileRules";
import {
  tokenizeToCanonSet,
  overlapJaccard,
  jaccardToStrength,
  strengthToScore,
} from "@/lib/matching/normalization";

/** MVP weighted suitability (deterministic). Version bumps when the model changes. */
export const MATCH_MODEL_VERSION = 3 as const;

/** Fixed employer-facing weights (sum = 100). */
export const MATCH_WEIGHTS = {
  skillsKeywords: 38,
  certificates: 22,
  experience: 18,
  roleTitle: 15,
  location: 5,
  workJobType: 2,
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
};

export type SeekerCertificateInput = {
  certificate_name: string | null;
  certificate_issuer: string | null;
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
  required_skills: string[] | null;
  keywords: string[] | null;
  experience_level_required: string | null;
  certificate_requirements: string | null;
};

/**
 * Stored on `job_applications.match_breakdown` (JSON).
 * - `*_raw` are 0–1 sub-scores before applying fixed weights.
 * - `*_contribution` are points (0–weight) added to the final percentage.
 */
export type MatchBreakdown = {
  /** 2 = weighted MVP model; 1 = legacy rows (approximate display). */
  modelVersion: number;
  weights: typeof MATCH_WEIGHTS;

  skills_keywords_raw: number;
  certificate_raw: number;
  experience_raw: number;
  role_title_raw: number;
  location_raw: number;
  work_job_type_raw: number;

  skills_keywords_contribution: number;
  certificate_contribution: number;
  experience_contribution: number;
  role_title_contribution: number;
  location_contribution: number;
  work_job_type_contribution: number;

  /** Structured requirement lines: token overlap (explainability). */
  requirementsMatched: number;
  requirementsTotal: number;

  /** Tags = dedup(required_skills ∪ keywords). */
  tag_total: number;
  tag_matched_full: number;
  tag_matched_partial: number;

  /** Parsed certificate requirement phrases vs seeker evidence. */
  certificate_slots_required: number;
  certificate_slots_matched: number;

  /** Machine codes; UI maps to copy. */
  weak_areas: string[];
  highlights: string[];

  /** Deterministic penalties (v3+). */
  penalty_points?: number;
  penalty_codes?: string[];
};

const EXP_RANK: Record<string, number> = {
  entry: 1,
  mid: 2,
  senior: 3,
  lead: 4,
  executive: 5,
};

function normBlob(parts: (string | null | undefined)[]) {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9äöõüß\s]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(s: string) {
  return s
    .split(/\s+/g)
    .map((w) => w.trim())
    .filter((w) => w.length > 1);
}

function significantWords(s: string) {
  // Only used in a few heuristics; primary matching uses normalization token sets.
  return words(normBlob([s])).filter((w) => w.length > 2);
}

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
    const t = normBlob([raw]);
    if (t.length < 2) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.slice(0, 40);
}

/** 0 / 0.5 / 1 match strength for one tag against seeker skills + profile title blob. */
function tagMatchStrength(
  tag: string,
  seekerSkillNorms: Set<string>,
  titleBlob: string,
  skillsBlob: string
): number {
  if (!tag) return 0;
  // Fast path: exact substring / exact skill tag.
  if (seekerSkillNorms.has(tag)) return 1;
  if (titleBlob.includes(tag) || skillsBlob.includes(tag)) return 1;

  // Generalized token-family overlap (deterministic).
  const tagSet = tokenizeToCanonSet([tag]);
  if (!tagSet.size) return 0;
  const seekerSet = tokenizeToCanonSet([titleBlob, skillsBlob, ...Array.from(seekerSkillNorms)]);
  const j = overlapJaccard(tagSet, seekerSet);
  return strengthToScore(jaccardToStrength(j));
}

/**
 * Blended 0–1: half from tag coverage (required_skills ∪ keywords), half from requirement_lines
 * when both exist; single source if only one; neutral 0.5 when job has neither.
 */
function skillsKeywordsRaw(
  job: JobMatchInput,
  seekerSkills: string[],
  profileTitle: string | null
): {
  raw: number;
  tag_total: number;
  tag_matched_full: number;
  tag_matched_partial: number;
  requirementsMatched: number;
  requirementsTotal: number;
} {
  const skillNorms = new Set(seekerSkills.map((s) => normBlob([s])).filter(Boolean));
  const titleBlob = normBlob([profileTitle]);
  const skillsBlob = normBlob([seekerSkills.join(" ")]);
  const seekerTokenSet = tokenizeToCanonSet([profileTitle, seekerSkills.join(" "), ...seekerSkills]);

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
  const tagRaw = tags.length ? tagSum / tags.length : NaN;

  const lines =
    Array.isArray(job.requirement_lines) && job.requirement_lines.length
      ? job.requirement_lines.map((s) => String(s).trim()).filter(Boolean)
      : (job.requirements ?? "")
          .split(/\r?\n/g)
          .map((s) => s.trim())
          .filter(Boolean);

  let matched = 0;
  const total = lines.length;
  for (const line of lines) {
    const lineSet = tokenizeToCanonSet([line]);
    if (!lineSet.size) continue;
    const j = overlapJaccard(lineSet, seekerTokenSet);
    // Evidence thresholds:
    // - >=0.34: meaningful evidence
    // - >=0.55: strong evidence
    if (j >= 0.34) matched++;
  }
  const lineRaw = total > 0 ? matched / total : NaN;

  let raw: number;
  // Stricter: missing structured signals should not award neutral 0.5.
  // - If job provides neither tags nor requirement lines → low confidence baseline.
  // - If one side is missing, use the available signal but keep it strict.
  if (!Number.isFinite(tagRaw) && !Number.isFinite(lineRaw)) raw = 0.12;
  else if (!Number.isFinite(tagRaw)) raw = clamp01(lineRaw as number);
  else if (!Number.isFinite(lineRaw)) raw = clamp01(tagRaw);
  else raw = clamp01(0.55 * (tagRaw as number) + 0.45 * (lineRaw as number));

  return {
    raw,
    tag_total: tags.length,
    tag_matched_full: full,
    tag_matched_partial: partial,
    requirementsMatched: matched,
    requirementsTotal: total,
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

/** 0–1: strong penalty when job specifies certs and seeker has none or no overlap. */
function certificateRaw(
  certs: SeekerCertificateInput[],
  jobCertText: string | null,
  jobKeywords: string[] | null
): { raw: number; slots: number; matched: number } {
  const slots = parseCertificateSlots(jobCertText);
  const seekerBlob = normBlob(certs.map((c) => `${c.certificate_name ?? ""} ${c.certificate_issuer ?? ""}`));
  const seekerCertSet = tokenizeToCanonSet(
    certs.map((c) => `${c.certificate_name ?? ""} ${c.certificate_issuer ?? ""}`)
  );

  if (!slots.length) {
    const kw = dedupeNormTags((jobKeywords ?? []).map(String));
    const kwNeedle = kw.filter((k) => k.length > 3);
    // Stricter: don't reward neutral if there's no certificate signal.
    if (!kwNeedle.length) return { raw: 0.15, slots: 0, matched: 0 };
    if (!certs.length) return { raw: 0.08, slots: kwNeedle.length, matched: 0 };
    let h = 0;
    for (const k of kwNeedle) {
      const kwSet = tokenizeToCanonSet([k]);
      const j = overlapJaccard(kwSet, seekerCertSet);
      if (j >= 0.34 || seekerBlob.includes(k)) h++;
    }
    // If we can only infer from keywords, keep the ceiling modest.
    return { raw: clamp01(0.18 + (h / kwNeedle.length) * 0.62), slots: kwNeedle.length, matched: h };
  }

  if (!certs.length) return { raw: 0, slots: slots.length, matched: 0 };

  let matched = 0;
  for (const slot of slots) {
    const slotNorm = normBlob([slot]);
    if (!slotNorm) continue;
    if (seekerBlob.includes(slotNorm)) {
      matched++;
      continue;
    }
    const slotSet = tokenizeToCanonSet([slot]);
    const j = overlapJaccard(slotSet, seekerCertSet);
    if (j >= 0.34) matched++;
  }
  return { raw: clamp01(matched / slots.length), slots: slots.length, matched };
}

function experienceRaw(seekerExp: string | null, jobExp: string | null): number {
  // Stricter: missing experience shouldn't award neutral points.
  if (!jobExp || !isExperienceLevel(jobExp)) return 0.28;
  if (!seekerExp || !isExperienceLevel(seekerExp)) return 0.08;
  const sj = EXP_RANK[seekerExp] ?? 0;
  const jj = EXP_RANK[jobExp] ?? 0;
  if (sj <= 0 || jj <= 0) return 0.18;
  if (sj >= jj) return 1;
  const gap = jj - sj;
  if (gap === 1) return 0.62;
  if (gap === 2) return 0.38;
  return 0.16;
}

/** Jaccard-like overlap on significant words between profile title and job title. */
function roleTitleRaw(seekerTitle: string | null, jobTitle: string | null): number {
  const a = tokenizeToCanonSet([seekerTitle]);
  const b = tokenizeToCanonSet([jobTitle]);
  // Stricter: missing/empty titles shouldn't produce neutral score.
  if (!a.size && !b.size) return 0.18;
  if (!a.size || !b.size) return 0.08;
  const j = overlapJaccard(a, b);
  const sub =
    normBlob([seekerTitle]).length > 4 &&
    normBlob([jobTitle]).length > 4 &&
    (normBlob([seekerTitle]).includes(normBlob([jobTitle])) ||
      normBlob([jobTitle]).includes(normBlob([seekerTitle])));
  // Boost substring alignment modestly, but still deterministic.
  return clamp01(Math.max(j, sub ? 0.6 : j));
}

function locationRaw(
  jobLoc: string | null,
  jobWork: string | null,
  seekerLoc: string | null,
  preferredLocs: string[] | null
): number {
  const jw = (jobWork ?? "").toLowerCase();
  // With location weight reduced, keep remote sensible but not a free boost.
  if (jw === "remote") return 0.72;
  const jl = (jobLoc ?? "").toLowerCase().trim();
  if (!jl) return 0.18;
  const sl = (seekerLoc ?? "").toLowerCase().trim();
  const prefs = (preferredLocs ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  if (sl && (sl.includes(jl) || jl.includes(sl))) return 1;
  if (prefs.some((p) => p && (jl.includes(p) || p.includes(jl)))) return 0.82;
  if (jw === "hybrid") return 0.32;
  return 0.08;
}

function workJobTypeRaw(
  jobType: string | null,
  workType: string | null,
  preferredTypes: string[] | null
): number {
  const jt = (jobType ?? "").toLowerCase().trim();
  const pj = (preferredTypes ?? []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  let typePart = 0.22;
  if (jt && pj.length) {
    const hit = pj.some((p) => p && (jt === p || jt.includes(p) || p.includes(jt)));
    typePart = hit ? 1 : 0.08;
  } else if (jt && !pj.length) typePart = 0.18;
  else if (!jt) typePart = 0.18;

  const wt = (workType ?? "").toLowerCase();
  let workPart = 0.22;
  if (wt === "remote") workPart = 0.9;
  else if (wt === "hybrid") workPart = 0.55;
  else if (wt === "on_site") workPart = 0.35;

  return clamp01(0.58 * typePart + 0.42 * workPart);
}

function weakAreasFrom(args: {
  skillsKw: number;
  cert: number;
  certSlots: number;
  exp: number;
  role: number;
  loc: number;
  wjt: number;
}): string[] {
  const w: string[] = [];
  if (args.skillsKw < 0.38) w.push("skills_keywords");
  if (args.certSlots > 0 && args.cert < 0.42) w.push("certificates");
  if (args.exp < 0.45) w.push("experience");
  if (args.role < 0.35) w.push("role_title");
  if (args.loc < 0.45) w.push("location");
  if (args.wjt < 0.42) w.push("work_job_type");
  return w;
}

export function calculateJobMatch(
  seeker: SeekerMatchInput,
  certs: SeekerCertificateInput[],
  job: JobMatchInput
): { score: number; breakdown: MatchBreakdown } {
  const seekerSkills = (seeker.skills ?? []).map((s) => String(s).trim()).filter(Boolean);

  const sk = skillsKeywordsRaw(job, seekerSkills, seeker.profile_title);
  const cert = certificateRaw(certs, job.certificate_requirements, job.keywords ?? []);
  const ex = experienceRaw(seeker.experience_level, job.experience_level_required);
  const role = roleTitleRaw(seeker.profile_title, job.title);
  const loc = locationRaw(job.location, job.work_type, seeker.location, seeker.preferred_locations);
  const wjt = workJobTypeRaw(job.job_type, job.work_type, seeker.preferred_job_types);

  const w = MATCH_WEIGHTS;
  const cSkills = Math.round(sk.raw * w.skillsKeywords);
  const cCert = Math.round(cert.raw * w.certificates);
  const cEx = Math.round(ex * w.experience);
  const cRole = Math.round(role * w.roleTitle);
  const cLoc = Math.round(loc * w.location);
  const cWjt = Math.round(wjt * w.workJobType);

  let score = cSkills + cCert + cEx + cRole + cLoc + cWjt;

  // Deterministic penalties + explainable caps (v3+).
  // Goal: strict & professional, but not absurdly punitive for candidates who have some strengths.
  // - Penalties reduce the score additively.
  // - Caps (knockout-style) limit the maximum possible score for clear mismatches.
  //   Caps are implemented by converting the reduction into extra "penalty points" so the breakdown stays consistent.
  const penaltyCodes: string[] = [];
  let penaltyPoints = 0;

  const reqRatio = sk.requirementsTotal > 0 ? sk.requirementsMatched / sk.requirementsTotal : 0;

  // No meaningful professional overlap (skills+requirements).
  if (sk.raw < 0.18) {
    penaltyCodes.push("no_skill_requirements_overlap");
    penaltyPoints += 8;
  } else if (sk.raw < 0.3) {
    penaltyCodes.push("weak_skill_requirements_overlap");
    penaltyPoints += 4;
  }

  // Role/title mismatch should matter.
  if (role < 0.14) {
    penaltyCodes.push("role_title_mismatch");
    penaltyPoints += 8;
  } else if (role < 0.28) {
    penaltyCodes.push("weak_role_title_alignment");
    penaltyPoints += 3;
  }

  // Certificates: if job specifies certs, missing overlap is a strong negative.
  if (cert.slots > 0) {
    if (cert.raw < 0.34) {
      penaltyCodes.push("missing_required_certificates");
      penaltyPoints += 10;
    } else if (cert.raw < 0.6) {
      penaltyCodes.push("partial_certificates");
      penaltyPoints += 4;
    }
  }

  // Requirements: if job has multiple lines but match is near-zero, penalize.
  if (sk.requirementsTotal >= 3 && reqRatio < 0.2) {
    penaltyCodes.push("requirements_mismatch");
    penaltyPoints += 5;
  }

  // If both core professional signals are weak, apply an extra damping.
  if (sk.raw < 0.22 && role < 0.22) {
    penaltyCodes.push("professional_alignment_missing");
    penaltyPoints += 6;
  }

  // First apply additive penalties.
  score = score - penaltyPoints;

  // Apply strict, explainable caps for clear mismatches (converted into extra penalty points).
  function applyCap(code: string, cap: number) {
    if (score > cap) {
      const delta = score - cap;
      penaltyCodes.push(code);
      penaltyPoints += delta;
      score = cap;
    }
  }

  // If there's essentially no skills/requirements overlap, don't let other signals inflate the score.
  if (sk.raw < 0.18) applyCap("cap_no_skill_overlap", 25);

  // If role/title is a clear mismatch, cap the score.
  if (role < 0.14) applyCap("cap_role_title_mismatch", 30);

  // If job explicitly requires certificates and there's no meaningful evidence, cap the score.
  if (cert.slots > 0 && cert.raw < 0.34) applyCap("cap_missing_required_certificates", 35);

  // If both core professional signals are weak at the same time, apply a stricter cap.
  if (sk.raw < 0.22 && role < 0.22) applyCap("cap_professional_alignment_missing", 20);

  // Final clamp (0–100).
  score = clampScore(score);

  const weak = weakAreasFrom({
    skillsKw: sk.raw,
    cert: cert.raw,
    certSlots: cert.slots,
    exp: ex,
    role,
    loc,
    wjt,
  });

  const highlights: string[] = [];
  if (sk.raw >= 0.72) highlights.push("skillsStrong");
  else if (sk.raw >= 0.42) highlights.push("skillsPartial");
  if (sk.requirementsTotal && sk.requirementsMatched / sk.requirementsTotal >= 0.62) highlights.push("requirementsStrong");
  else if (sk.requirementsTotal && sk.requirementsMatched > 0) highlights.push("requirementsPartial");
  if (ex >= 0.9) highlights.push("experienceFit");
  if (loc >= 0.85) highlights.push("locationFit");
  if (cert.raw >= 0.72 && cert.slots > 0) highlights.push("certificatesStrong");
  else if (cert.raw >= 0.55) highlights.push("certificatesSignal");
  if (cert.slots > 0 && cert.raw < 0.35) highlights.push("certificateGap");
  if (role >= 0.45) highlights.push("roleAlignment");

  const breakdown: MatchBreakdown = {
    modelVersion: MATCH_MODEL_VERSION as number,
    weights: { ...MATCH_WEIGHTS },
    skills_keywords_raw: sk.raw,
    certificate_raw: cert.raw,
    experience_raw: ex,
    role_title_raw: role,
    location_raw: loc,
    work_job_type_raw: wjt,
    skills_keywords_contribution: cSkills,
    certificate_contribution: cCert,
    experience_contribution: cEx,
    role_title_contribution: cRole,
    location_contribution: cLoc,
    work_job_type_contribution: cWjt,
    requirementsMatched: sk.requirementsMatched,
    requirementsTotal: sk.requirementsTotal,
    tag_total: sk.tag_total,
    tag_matched_full: sk.tag_matched_full,
    tag_matched_partial: sk.tag_matched_partial,
    certificate_slots_required: cert.slots,
    certificate_slots_matched: cert.matched,
    weak_areas: weak,
    highlights,
    penalty_points: penaltyPoints,
    penalty_codes: penaltyCodes,
  };

  return { score, breakdown };
}
