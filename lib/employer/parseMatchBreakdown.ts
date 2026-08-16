import type { MatchBreakdown } from "@/lib/matching/calculateJobMatch";
import { MATCH_WEIGHTS } from "@/lib/matching/calculateJobMatch";

function num(v: unknown, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** Parses `job_applications.match_breakdown` (v7 preferred; older versions mapped). */
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
  const reason_codes = Array.isArray(o.reason_codes)
    ? (o.reason_codes as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  if (version >= 2) {
    const weights = (o.weights as MatchBreakdown["weights"]) ?? { ...MATCH_WEIGHTS };
    return {
      modelVersion: version,
      weights: {
        ...MATCH_WEIGHTS,
        ...weights,
      },
      skills_keywords_raw: num(o.skills_keywords_raw),
      certificate_raw: num(o.certificate_raw),
      experience_raw: num(o.experience_raw),
      role_title_raw: num(o.role_title_raw),
      location_raw: num(o.location_raw),
      work_job_type_raw: num(o.work_job_type_raw),
      requirements_mandatory_raw: num(o.requirements_mandatory_raw, num(o.skills_keywords_raw, 0.5)),
      requirements_recommended_raw: num(o.requirements_recommended_raw, 1),
      languages_raw: num(o.languages_raw, 0.55),
      work_mode_raw: num(o.work_mode_raw, num(o.work_job_type_raw, 0.45)),
      arrangement_raw: num(o.arrangement_raw, num(o.work_job_type_raw, 0.45)),
      workload_raw: num(o.workload_raw, 0.55),
      work_hours_raw: num(o.work_hours_raw, 0.55),
      availability_raw: num(o.availability_raw, 0.55),
      skills_keywords_contribution: num(o.skills_keywords_contribution),
      certificate_contribution: num(o.certificate_contribution),
      experience_contribution: num(o.experience_contribution),
      role_title_contribution: num(o.role_title_contribution),
      location_contribution: num(o.location_contribution),
      work_job_type_contribution: num(o.work_job_type_contribution),
      requirements_mandatory_contribution: num(o.requirements_mandatory_contribution),
      requirements_recommended_contribution: num(o.requirements_recommended_contribution),
      languages_contribution: num(o.languages_contribution),
      work_mode_contribution: num(o.work_mode_contribution),
      arrangement_contribution: num(o.arrangement_contribution),
      workload_contribution: num(o.workload_contribution),
      work_hours_contribution: num(o.work_hours_contribution),
      availability_contribution: num(o.availability_contribution),
      requirementsMatched: num(o.requirementsMatched),
      requirementsTotal: num(o.requirementsTotal),
      requirementsMandatoryMatched: num(o.requirementsMandatoryMatched, num(o.requirementsMatched)),
      requirementsMandatoryTotal: num(o.requirementsMandatoryTotal, num(o.requirementsTotal)),
      requirementsRecommendedMatched: num(o.requirementsRecommendedMatched),
      requirementsRecommendedTotal: num(o.requirementsRecommendedTotal),
      tag_total: num(o.tag_total),
      tag_matched_full: num(o.tag_matched_full),
      tag_matched_partial: num(o.tag_matched_partial),
      certificate_slots_required: num(o.certificate_slots_required),
      certificate_slots_matched: num(o.certificate_slots_matched),
      weak_areas,
      highlights,
      reason_codes,
      penalty_points: num(o.penalty_points),
      penalty_codes: Array.isArray(o.penalty_codes)
        ? (o.penalty_codes as unknown[]).filter((x): x is string => typeof x === "string")
        : [],
      score_before_soft_floor: num(o.score_before_soft_floor),
      soft_floor_applied: num(o.soft_floor_applied),
    };
  }

  // Legacy v1
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
  const legacyRaw =
    legacyTotal > 0
      ? (skillsPoints + requirementsPoints + experiencePoints + locationPoints + certificatePoints) /
        legacyTotal
      : 0.5;

  return {
    modelVersion: 1,
    weights: { ...MATCH_WEIGHTS },
    skills_keywords_raw: skillsMax ? skillsPoints / skillsMax : 0.5,
    certificate_raw: certificateMax ? certificatePoints / certificateMax : 0.5,
    experience_raw: experienceMax ? experiencePoints / experienceMax : 0.5,
    role_title_raw: 0.45,
    location_raw: locationMax ? locationPoints / locationMax : 0.5,
    work_job_type_raw: 0.5,
    requirements_mandatory_raw: requirementsMax ? requirementsPoints / requirementsMax : 0.5,
    requirements_recommended_raw: 1,
    languages_raw: 0.55,
    work_mode_raw: 0.5,
    arrangement_raw: 0.5,
    workload_raw: 0.55,
    work_hours_raw: 0.55,
    availability_raw: 0.55,
    skills_keywords_contribution: Math.round(legacyRaw * w.skillsKeywords),
    certificate_contribution: Math.round(
      (certificateMax ? certificatePoints / certificateMax : 0.5) * w.certificates
    ),
    experience_contribution: Math.round(
      (experienceMax ? experiencePoints / experienceMax : 0.5) * w.experience
    ),
    role_title_contribution: 0,
    location_contribution: Math.round((locationMax ? locationPoints / locationMax : 0.5) * w.location),
    work_job_type_contribution: Math.round(0.5 * ((w.workMode + w.arrangement) / 2)),
    requirements_mandatory_contribution: Math.round(
      (requirementsMax ? requirementsPoints / requirementsMax : 0.5) * w.requirementsMandatory
    ),
    requirements_recommended_contribution: w.requirementsRecommended,
    languages_contribution: Math.round(0.55 * w.languages),
    work_mode_contribution: Math.round(0.5 * w.workMode),
    arrangement_contribution: Math.round(0.5 * w.arrangement),
    workload_contribution: Math.round(0.55 * w.workload),
    work_hours_contribution: Math.round(0.55 * w.workHours),
    availability_contribution: Math.round(0.55 * w.availability),
    requirementsMatched: num(o.requirementsMatched),
    requirementsTotal: num(o.requirementsTotal),
    requirementsMandatoryMatched: num(o.requirementsMatched),
    requirementsMandatoryTotal: num(o.requirementsTotal),
    requirementsRecommendedMatched: 0,
    requirementsRecommendedTotal: 0,
    tag_total: 0,
    tag_matched_full: 0,
    tag_matched_partial: 0,
    certificate_slots_required: 0,
    certificate_slots_matched: 0,
    weak_areas: [],
    highlights,
    reason_codes: [],
  };
}
