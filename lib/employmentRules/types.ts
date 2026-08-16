import type { LearningObligationStatus, MinorAgeBand } from "@/lib/seeker/age";
import type { BandWorkLimits } from "@/lib/employmentRules/rules";

/** Outcome shown to the seeker for a specific job (never age-only blocking). */
export type MinorJobEligibilityStatus =
  | "suitable"
  | "needs_review"
  | "schedule_not_suitable";

export type SeekerEligibilityInput = {
  ageYears: number | null;
  isMinor: boolean;
  minorAgeBand: MinorAgeBand | null;
  learningObligationStatus: LearningObligationStatus | null;
};

export type JobWorkConditionsInput = {
  jobType: string | null;
  weeklyHours: number | null;
  dailyHours: number | null;
  /** "HH:MM" or "HH:MM:SS" */
  shiftStart: string | null;
  /** "HH:MM" or "HH:MM:SS" */
  shiftEnd: string | null;
  includesNightWork: boolean | null;
  isHazardousWork: boolean | null;
};

/**
 * Machine codes from the employment-rules engine.
 * UI maps codes → copy; limit numbers come from `rules.ts` via message params.
 */
export type EligibilityIssueCode =
  | "missing_schedule_data"
  | "missing_learning_obligation"
  | "daily_hours_exceeded"
  | "weekly_hours_exceeded"
  | "shift_outside_allowed_window"
  | "night_work_not_allowed"
  | "hazardous_work_restricted"
  | "full_time_with_learning_obligation"
  | "full_time_for_age_band";

export type MinorJobEligibilityResult = {
  status: MinorJobEligibilityStatus;
  /** Machine codes for tests / UI detail; not legal text. */
  issues: EligibilityIssueCode[];
  /** Resolved configurable limits used for this check (null only if no evaluation). */
  limits: BandWorkLimits;
  /** Age band used after resolving from DOB / profile. */
  band: MinorAgeBand;
};
