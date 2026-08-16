import {
  applicationAnswersFromUnknown,
  parseApplicationAnswers,
  type ApplicationAnswers,
  type ApplicationAnswersInput,
  type SalaryBasis,
  type SalaryMode,
} from "@/lib/jobs/applicationAnswers";

export type QuickApplyProfileHints = {
  salaryExpectationText: string | null;
  preferredWeeklyHours: number | null;
  prefFullTime: boolean;
  prefPartTime: boolean;
  hasCv: boolean;
};

/**
 * Try to parse free-text profile salary_expectation into structured apply fields.
 * Returns null when the text is empty or ambiguous.
 */
export function parseProfileSalaryExpectation(text: string | null | undefined): {
  salaryMode: SalaryMode;
  salaryBasis: SalaryBasis;
  salary_expectation_min: string;
  salary_expectation_max: string;
} | null {
  const raw = (text ?? "").trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  const basis: SalaryBasis =
    /tunnis|\/h\b|hour|hourly|в час/.test(lower) ? "bruto_hourly" : "bruto_monthly";

  if (/läbiräägitav|negotiable|kokkuleppel|обсужд/.test(lower)) {
    return {
      salaryMode: "negotiable",
      salaryBasis: basis,
      salary_expectation_min: "",
      salary_expectation_max: "",
    };
  }

  const nums = Array.from(raw.matchAll(/(\d+(?:[.,]\d+)?)/g)).map((m) => m[1]!.replace(",", "."));
  if (nums.length >= 2) {
    const a = Number(nums[0]);
    const b = Number(nums[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return {
      salaryMode: "range",
      salaryBasis: basis,
      salary_expectation_min: String(min),
      salary_expectation_max: String(max),
    };
  }
  if (nums.length === 1) {
    const n = Number(nums[0]);
    if (!Number.isFinite(n) || n <= 0) return null;
    return {
      salaryMode: "fixed",
      salaryBasis: basis,
      salary_expectation_min: String(n),
      salary_expectation_max: String(n),
    };
  }
  return null;
}

function answersToInput(a: ApplicationAnswers): ApplicationAnswersInput {
  return {
    salaryMode: a.salaryMode,
    salaryBasis: a.salaryBasis,
    salary_expectation_min:
      a.salary_expectation_min !== null ? String(a.salary_expectation_min) : "",
    salary_expectation_max:
      a.salary_expectation_max !== null ? String(a.salary_expectation_max) : "",
    availability_start: a.availability_start,
    availability_start_date: a.availability_start_date ?? "",
    noticePeriod: a.noticePeriod,
    weeklyHoursDesired: String(a.weeklyHoursDesired),
    scheduleFits: a.scheduleFits,
    interview_preferences: a.interview_preferences,
    prefer_first_interview_online: a.prefer_first_interview_online,
    noteForEmployer: a.noteForEmployer ?? "",
  };
}

/**
 * Build a complete apply-answers draft for one-step quick apply.
 * Prefers last application answers; fills gaps from profile hints.
 * Returns null when a full draft cannot be formed without asking the user.
 */
export function buildQuickApplyDraft(args: {
  lastAnswers: unknown | null;
  profile: QuickApplyProfileHints;
  /** Localized fallback notice period when profile/history has none. */
  defaultNoticePeriod: string;
}): ApplicationAnswers | null {
  const last = applicationAnswersFromUnknown(args.lastAnswers);
  const salaryFromProfile = parseProfileSalaryExpectation(args.profile.salaryExpectationText);
  const hoursFromProfile = args.profile.preferredWeeklyHours;

  // Need either a prior structured apply or enough profile salary + hours to draft.
  if (!last && !salaryFromProfile && (hoursFromProfile === null || hoursFromProfile === undefined)) {
    return null;
  }
  if (!last && !salaryFromProfile) return null;
  if (!last && (hoursFromProfile === null || hoursFromProfile === undefined)) return null;

  const draftInput: ApplicationAnswersInput = {
    salaryMode: last?.salaryMode ?? salaryFromProfile?.salaryMode ?? "",
    salaryBasis: last?.salaryBasis ?? salaryFromProfile?.salaryBasis ?? "bruto_monthly",
    salary_expectation_min:
      last?.salary_expectation_min !== null && last?.salary_expectation_min !== undefined
        ? String(last.salary_expectation_min)
        : salaryFromProfile?.salary_expectation_min ?? "",
    salary_expectation_max:
      last?.salary_expectation_max !== null && last?.salary_expectation_max !== undefined
        ? String(last.salary_expectation_max)
        : salaryFromProfile?.salary_expectation_max ?? "",
    availability_start: last?.availability_start ?? "by_agreement",
    availability_start_date: last?.availability_start_date ?? "",
    noticePeriod: (last?.noticePeriod ?? "").trim() || args.defaultNoticePeriod,
    weeklyHoursDesired:
      last?.weeklyHoursDesired !== undefined && last?.weeklyHoursDesired !== null
        ? String(last.weeklyHoursDesired)
        : hoursFromProfile !== null && hoursFromProfile !== undefined
          ? String(hoursFromProfile)
          : "",
    scheduleFits: last?.scheduleFits ?? "yes",
    interview_preferences: last?.interview_preferences?.length
      ? last.interview_preferences
      : ["any"],
    prefer_first_interview_online: last?.prefer_first_interview_online ?? false,
    noteForEmployer: last?.noteForEmployer ?? "",
  };

  const parsed = parseApplicationAnswers(draftInput);
  return parsed.ok ? parsed.value : null;
}

export function isQuickApplyReady(draft: ApplicationAnswers | null): boolean {
  if (!draft) return false;
  return parseApplicationAnswers(answersToInput(draft)).ok;
}

/** Human workload line for summary (hours + optional full/part flags). */
export function formatWorkloadSummary(
  weeklyHours: number,
  profile: Pick<QuickApplyProfileHints, "prefFullTime" | "prefPartTime">,
  labels: { hours: (n: number) => string; fullTime: string; partTime: string }
): string {
  const parts = [labels.hours(weeklyHours)];
  if (profile.prefFullTime) parts.push(labels.fullTime);
  if (profile.prefPartTime) parts.push(labels.partTime);
  return parts.join(" · ");
}
