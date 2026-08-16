/**
 * Configurable employment rules for minors (especially ages 16–17).
 *
 * Change numeric limits / windows here when legislation changes.
 * Keep React components free of rule numbers — they only map issue codes to copy.
 *
 * Notes are operational (not legal advice). Times use 24h "HH:MM".
 */

import type { LearningObligationStatus, MinorAgeBand } from "@/lib/seeker/age";
import type { EligibilityIssueCode } from "@/lib/employmentRules/types";

export type BandWorkLimits = {
  /** Max continuous / typical workday length in hours. */
  maxDailyHours: number;
  /** Max weekly hours. */
  maxWeeklyHours: number;
  /** Earliest allowed shift start (inclusive). */
  earliestShiftStart: string;
  /** Latest allowed shift end (inclusive). */
  latestShiftEnd: string;
  nightWorkAllowed: boolean;
  hazardousWorkAllowed: boolean;
  /** Whether full_time job_type is generally within band without extra review. */
  fullTimeGenerallyOk: boolean;
  /** Ages 16–17 must declare learning-obligation status for a complete check. */
  requiresLearningObligationStatus: boolean;
};

export type LearningObligationOverrides = {
  /** Stricter weekly cap while learning obligation applies. */
  maxWeeklyHours: number;
  maxDailyHours: number;
  /** full_time while subject_to → needs_review (not an automatic hard block). */
  fullTimeNeedsReview: boolean;
};

/**
 * Limits keyed by minor_age_band.
 * Adults are outside this table (evaluator returns null).
 */
export const MINOR_WORK_LIMITS_BY_BAND: Record<MinorAgeBand, BandWorkLimits> = {
  under_15: {
    maxDailyHours: 4,
    maxWeeklyHours: 20,
    earliestShiftStart: "08:00",
    latestShiftEnd: "18:00",
    nightWorkAllowed: false,
    hazardousWorkAllowed: false,
    fullTimeGenerallyOk: false,
    requiresLearningObligationStatus: false,
  },
  age_15: {
    maxDailyHours: 6,
    maxWeeklyHours: 25,
    earliestShiftStart: "06:00",
    latestShiftEnd: "20:00",
    nightWorkAllowed: false,
    hazardousWorkAllowed: false,
    fullTimeGenerallyOk: false,
    requiresLearningObligationStatus: false,
  },
  /** Primary product focus: 16–17 work-condition suitability. */
  age_16_17: {
    maxDailyHours: 8,
    maxWeeklyHours: 40,
    earliestShiftStart: "06:00",
    latestShiftEnd: "22:00",
    nightWorkAllowed: false,
    hazardousWorkAllowed: false,
    fullTimeGenerallyOk: true,
    requiresLearningObligationStatus: true,
  },
};

/** Extra constraints when learning_obligation_status === subject_to (ages 16–17). */
export const LEARNING_OBLIGATION_OVERRIDES: LearningObligationOverrides = {
  maxWeeklyHours: 20,
  maxDailyHours: 4,
  fullTimeNeedsReview: true,
};

/** Night window used when includes_night_work is unset but shift times imply night work. */
export const IMPLIED_NIGHT_WINDOW = {
  startMinutes: 22 * 60, // 22:00
  endMinutes: 6 * 60, // 06:00
} as const;

/**
 * Mandatory legal work-condition conflicts → schedule_not_suitable.
 * Soft / incomplete data → needs_review (listed separately in evaluator).
 */
export const HARD_LEGAL_ISSUE_CODES: readonly EligibilityIssueCode[] = [
  "daily_hours_exceeded",
  "weekly_hours_exceeded",
  "shift_outside_allowed_window",
  "night_work_not_allowed",
  "hazardous_work_restricted",
] as const;

export function resolveBandLimits(
  band: MinorAgeBand,
  learningObligationStatus: LearningObligationStatus | null
): BandWorkLimits {
  const base = MINOR_WORK_LIMITS_BY_BAND[band];
  if (band !== "age_16_17" || learningObligationStatus !== "subject_to") {
    return base;
  }
  return {
    ...base,
    maxDailyHours: Math.min(base.maxDailyHours, LEARNING_OBLIGATION_OVERRIDES.maxDailyHours),
    maxWeeklyHours: Math.min(base.maxWeeklyHours, LEARNING_OBLIGATION_OVERRIDES.maxWeeklyHours),
    fullTimeGenerallyOk: false,
  };
}

/** i18n interpolation values derived from resolved limits (never hardcode in React). */
export function eligibilityIssueMessageParams(limits: BandWorkLimits): {
  maxDaily: number;
  maxWeekly: number;
  earliest: string;
  latest: string;
} {
  return {
    maxDaily: limits.maxDailyHours,
    maxWeekly: limits.maxWeeklyHours,
    earliest: limits.earliestShiftStart,
    latest: limits.latestShiftEnd,
  };
}
