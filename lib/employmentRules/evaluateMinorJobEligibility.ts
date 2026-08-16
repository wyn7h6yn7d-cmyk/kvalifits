import {
  HARD_LEGAL_ISSUE_CODES,
  IMPLIED_NIGHT_WINDOW,
  LEARNING_OBLIGATION_OVERRIDES,
  resolveBandLimits,
} from "@/lib/employmentRules/rules";
import type {
  EligibilityIssueCode,
  JobWorkConditionsInput,
  MinorJobEligibilityResult,
  SeekerEligibilityInput,
} from "@/lib/employmentRules/types";
import { minorAgeBandFromAge } from "@/lib/seeker/age";

/**
 * Evaluate whether a concrete job's work conditions fit a minor seeker's limits.
 *
 * Checks (from configurable `rules.ts`):
 * - weekly / daily hours (tööaeg, tööpäeva pikkus)
 * - shift window + implied duration (vahetuse aeg)
 * - night work + hazardous work (töö iseloom)
 * - learning-obligation overrides for ages 16–17 (vajalikud piirangud)
 *
 * Adults and seekers without age data return null (no eligibility banner).
 * Never fails solely because the seeker is under 18 — only job conditions + rules matter.
 * Not an employer age filter.
 */
export function evaluateMinorJobEligibility(
  seeker: SeekerEligibilityInput,
  job: JobWorkConditionsInput
): MinorJobEligibilityResult | null {
  if (!seeker.isMinor || seeker.ageYears === null) return null;

  const band = seeker.minorAgeBand ?? minorAgeBandFromAge(seeker.ageYears);
  if (!band) return null;

  const limits = resolveBandLimits(band, seeker.learningObligationStatus);
  const issues: EligibilityIssueCode[] = [];

  const weekly = job.weeklyHours;
  const dailyDeclared = job.dailyHours;
  const shiftStart = normalizeTime(job.shiftStart);
  const shiftEnd = normalizeTime(job.shiftEnd);
  const shiftHours =
    shiftStart !== null && shiftEnd !== null ? shiftDurationHours(shiftStart, shiftEnd) : null;
  const dailyEffective =
    dailyDeclared !== null
      ? dailyDeclared
      : shiftHours !== null
        ? shiftHours
        : null;

  const hasScheduleCore =
    weekly !== null || dailyDeclared !== null || (shiftStart !== null && shiftEnd !== null);

  if (!hasScheduleCore) {
    issues.push("missing_schedule_data");
  }

  // Ages 16–17: learning-obligation status is required for a complete suitability check.
  if (
    limits.requiresLearningObligationStatus &&
    seeker.learningObligationStatus !== "subject_to" &&
    seeker.learningObligationStatus !== "not_subject_to"
  ) {
    issues.push("missing_learning_obligation");
  }

  if (dailyEffective !== null && dailyEffective > limits.maxDailyHours) {
    issues.push("daily_hours_exceeded");
  }
  if (weekly !== null && weekly > limits.maxWeeklyHours) {
    issues.push("weekly_hours_exceeded");
  }

  if (shiftStart !== null && shiftEnd !== null) {
    if (
      minutesOf(shiftStart) < minutesOf(limits.earliestShiftStart) ||
      minutesOf(shiftEnd) > minutesOf(limits.latestShiftEnd) ||
      crossesMidnight(shiftStart, shiftEnd)
    ) {
      issues.push("shift_outside_allowed_window");
    }
  }

  const night =
    job.includesNightWork === true ||
    (shiftStart !== null && shiftEnd !== null && impliesNightWork(shiftStart, shiftEnd));
  if (night && !limits.nightWorkAllowed) {
    issues.push("night_work_not_allowed");
  }

  if (job.isHazardousWork === true && !limits.hazardousWorkAllowed) {
    issues.push("hazardous_work_restricted");
  }

  const jobType = (job.jobType ?? "").trim();
  if (
    jobType === "full_time" &&
    seeker.learningObligationStatus === "subject_to" &&
    LEARNING_OBLIGATION_OVERRIDES.fullTimeNeedsReview
  ) {
    issues.push("full_time_with_learning_obligation");
  } else if (jobType === "full_time" && !limits.fullTimeGenerallyOk) {
    // Full-time for younger bands: not an automatic hard no — flag for review
    // unless hours already clearly exceed (those are schedule_not_suitable).
    if (!issues.includes("weekly_hours_exceeded") && !issues.includes("daily_hours_exceeded")) {
      issues.push("full_time_for_age_band");
    }
  }

  // Infer weekly pressure from full_time when hours missing but learning obligation caps apply.
  if (
    weekly === null &&
    jobType === "full_time" &&
    seeker.learningObligationStatus === "subject_to" &&
    !issues.includes("weekly_hours_exceeded")
  ) {
    // Typical full-time (~40h) exceeds learning-obligation weekly cap → hard conflict.
    if (40 > limits.maxWeeklyHours) {
      issues.push("weekly_hours_exceeded");
    }
  }

  return {
    status: statusFromIssues(issues),
    issues,
    limits,
    band,
  };
}

function statusFromIssues(issues: EligibilityIssueCode[]): MinorJobEligibilityResult["status"] {
  if (issues.length === 0) return "suitable";
  if (issues.some((i) => (HARD_LEGAL_ISSUE_CODES as readonly string[]).includes(i))) {
    return "schedule_not_suitable";
  }
  return "needs_review";
}

function normalizeTime(v: string | null | undefined): string | null {
  if (!v) return null;
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(v.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min) || h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function crossesMidnight(start: string, end: string): boolean {
  return minutesOf(end) <= minutesOf(start);
}

/** Same-day shift length in hours; overnight shifts return null (handled as night / window issues). */
function shiftDurationHours(start: string, end: string): number | null {
  if (crossesMidnight(start, end)) return null;
  return (minutesOf(end) - minutesOf(start)) / 60;
}

function impliesNightWork(start: string, end: string): boolean {
  if (crossesMidnight(start, end)) return true;
  const s = minutesOf(start);
  const e = minutesOf(end);
  const { startMinutes, endMinutes } = IMPLIED_NIGHT_WINDOW;
  // Overlaps [22:00, 24:00) or [00:00, 06:00]
  return s >= startMinutes || e > startMinutes || s < endMinutes || e <= endMinutes;
}
