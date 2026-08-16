import { evaluateMinorJobEligibility } from "@/lib/employmentRules/evaluateMinorJobEligibility";
import { HARD_LEGAL_ISSUE_CODES, MINOR_WORK_LIMITS_BY_BAND } from "@/lib/employmentRules/rules";
import type {
  EligibilityIssueCode,
  JobWorkConditionsInput,
  MinorJobEligibilityResult,
} from "@/lib/employmentRules/types";

/** Hard conflicts that block an automatic “suitable for young seekers” badge. */
export const AGES_16_17_BLOCKING_ISSUES: EligibilityIssueCode[] = [
  "missing_schedule_data",
  ...HARD_LEGAL_ISSUE_CODES,
];

export type Ages16_17JobCheckResult = {
  ok: boolean;
  result: MinorJobEligibilityResult;
  blockingIssues: EligibilityIssueCode[];
};

/**
 * Check whether job work conditions may suit ages 16–17 (base limits).
 * Used for the automatic public badge — never an employer manual toggle.
 */
export function evaluateJobSuitableForAges16_17(job: JobWorkConditionsInput): Ages16_17JobCheckResult {
  const result = evaluateMinorJobEligibility(
    {
      ageYears: 16,
      isMinor: true,
      minorAgeBand: "age_16_17",
      // Base 16–17 limits (not learning-obligation overrides): badge means
      // “may suit a young seeker”, not “suits every 16–17 with learning obligation”.
      learningObligationStatus: "not_subject_to",
    },
    job
  );

  const fallbackLimits = MINOR_WORK_LIMITS_BY_BAND.age_16_17;
  const issues = result?.issues ?? ["missing_schedule_data"];
  const blockingIssues = issues.filter((i) => AGES_16_17_BLOCKING_ISSUES.includes(i));
  const normalized: MinorJobEligibilityResult = result ?? {
    status: "needs_review",
    issues,
    limits: fallbackLimits,
    band: "age_16_17",
  };

  return {
    ok: blockingIssues.length === 0,
    result: normalized,
    blockingIssues,
  };
}

/**
 * Automatic badge eligibility for “Sobib ka noorele tööotsijale”.
 * True only when employment-rules pre-check passes (hours, day length, shift, nature).
 */
export function jobPassesYoungSeekerAutoEligibility(job: JobWorkConditionsInput): boolean {
  return evaluateJobSuitableForAges16_17(job).ok;
}

/** Build work-condition input from a job_posts row (or form-derived values). */
export function jobWorkConditionsFromJobRow(row: {
  job_type?: string | null;
  weekly_hours?: number | null;
  daily_hours?: number | null;
  shift_start?: string | null;
  shift_end?: string | null;
  includes_night_work?: boolean | null;
  is_hazardous_work?: boolean | null;
}): JobWorkConditionsInput {
  return {
    jobType: row.job_type ?? null,
    weeklyHours:
      row.weekly_hours === null || row.weekly_hours === undefined
        ? null
        : Number(row.weekly_hours),
    dailyHours:
      row.daily_hours === null || row.daily_hours === undefined ? null : Number(row.daily_hours),
    shiftStart: row.shift_start ?? null,
    shiftEnd: row.shift_end ?? null,
    includesNightWork:
      row.includes_night_work === null || row.includes_night_work === undefined
        ? null
        : Boolean(row.includes_night_work),
    isHazardousWork:
      row.is_hazardous_work === null || row.is_hazardous_work === undefined
        ? null
        : Boolean(row.is_hazardous_work),
  };
}
