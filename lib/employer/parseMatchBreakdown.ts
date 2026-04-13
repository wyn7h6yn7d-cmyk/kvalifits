import type { MatchBreakdown } from "@/lib/matching/calculateJobMatch";
import { MATCH_MODEL_VERSION, MATCH_WEIGHTS } from "@/lib/matching/calculateJobMatch";

function num(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Parses `job_applications.match_breakdown` (v2 preferred, v1 legacy). */
export function parseMatchBreakdown(raw: unknown): Partial<MatchBreakdown> | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const version = num(o.modelVersion, 0);

  const highlights = Array.isArray(o.highlights)
    ? (o.highlights as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  const weak_areas = Array.isArray(o.weak_areas)
    ? (o.weak_areas as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  // v2 and v3 share the same core field names; v3 adds penalty_* fields.
  if (version >= 2) {
    return {
      modelVersion: version,
      weights: (o.weights as MatchBreakdown["weights"]) ?? { ...MATCH_WEIGHTS },
      skills_keywords_raw: num(o.skills_keywords_raw),
      certificate_raw: num(o.certificate_raw),
      experience_raw: num(o.experience_raw),
      role_title_raw: num(o.role_title_raw),
      location_raw: num(o.location_raw),
      work_job_type_raw: num(o.work_job_type_raw),
      skills_keywords_contribution: num(o.skills_keywords_contribution),
      certificate_contribution: num(o.certificate_contribution),
      experience_contribution: num(o.experience_contribution),
      role_title_contribution: num(o.role_title_contribution),
      location_contribution: num(o.location_contribution),
      work_job_type_contribution: num(o.work_job_type_contribution),
      requirementsMatched: num(o.requirementsMatched),
      requirementsTotal: num(o.requirementsTotal),
      tag_total: num(o.tag_total),
      tag_matched_full: num(o.tag_matched_full),
      tag_matched_partial: num(o.tag_matched_partial),
      certificate_slots_required: num(o.certificate_slots_required),
      certificate_slots_matched: num(o.certificate_slots_matched),
      weak_areas,
      highlights,
      penalty_points: num(o.penalty_points),
      penalty_codes: Array.isArray(o.penalty_codes)
        ? (o.penalty_codes as unknown[]).filter((x): x is string => typeof x === "string")
        : [],
      score_before_soft_floor: num(o.score_before_soft_floor),
      soft_floor_applied: num(o.soft_floor_applied),
    };
  }

  // Legacy v1 (old point buckets) — approximate display for stored rows.
  const skillsPoints = num(o.skillsPoints);
  const skillsMax = num(o.skillsMax, 32);
  const requirementsPoints = num(o.requirementsPoints);
  const requirementsMax = num(o.requirementsMax, 28);
  const experiencePoints = num(o.experiencePoints);
  const experienceMax = num(o.experienceMax, 20);
  const locationPoints = num(o.locationPoints);
  const locationMax = num(o.locationMax, 18);
  const certificatePoints = num(o.certificatePoints);
  const certificateMax = num(o.certificateMax, 12);

  const w = MATCH_WEIGHTS;
  const legacyTotal = skillsMax + requirementsMax + experienceMax + locationMax + certificateMax;
  const legacyRaw = legacyTotal > 0 ? (skillsPoints + requirementsPoints + experiencePoints + locationPoints + certificatePoints) / legacyTotal : 0.5;

  const cSkills = Math.round(legacyRaw * w.skillsKeywords);
  const cCert = Math.round((certificateMax ? certificatePoints / certificateMax : 0.5) * w.certificates);
  const cEx = Math.round((experienceMax ? experiencePoints / experienceMax : 0.5) * w.experience);
  const cRole = Math.round(0.45 * w.roleTitle);
  const cLoc = Math.round((locationMax ? locationPoints / locationMax : 0.5) * w.location);
  const cWjt = Math.round(0.5 * w.workJobType);

  return {
    modelVersion: 1,
    weights: { ...MATCH_WEIGHTS },
    skills_keywords_raw: skillsMax ? skillsPoints / skillsMax : 0.5,
    certificate_raw: certificateMax ? certificatePoints / certificateMax : 0.5,
    experience_raw: experienceMax ? experiencePoints / experienceMax : 0.5,
    role_title_raw: 0.45,
    location_raw: locationMax ? locationPoints / locationMax : 0.5,
    work_job_type_raw: 0.5,
    skills_keywords_contribution: cSkills,
    certificate_contribution: cCert,
    experience_contribution: cEx,
    role_title_contribution: cRole,
    location_contribution: cLoc,
    work_job_type_contribution: cWjt,
    requirementsMatched: num(o.requirementsMatched),
    requirementsTotal: num(o.requirementsTotal),
    tag_total: 0,
    tag_matched_full: 0,
    tag_matched_partial: 0,
    certificate_slots_required: 0,
    certificate_slots_matched: 0,
    weak_areas: [],
    highlights,
  };
}
