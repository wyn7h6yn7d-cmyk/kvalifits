export { evaluateMinorJobEligibility } from "@/lib/employmentRules/evaluateMinorJobEligibility";
export {
  evaluateJobSuitableForAges16_17,
  jobPassesYoungSeekerAutoEligibility,
  jobWorkConditionsFromJobRow,
  AGES_16_17_BLOCKING_ISSUES,
} from "@/lib/employmentRules/evaluateJobSuitableForAges16_17";
export type { Ages16_17JobCheckResult } from "@/lib/employmentRules/evaluateJobSuitableForAges16_17";

export {
  evaluateWorkPreferencesAgainstEligibility,
  maxWeeklyHoursForSeeker,
  workPreferenceToggleAvailability,
} from "@/lib/employmentRules/evaluateWorkPreferences";
export {
  IMPLIED_NIGHT_WINDOW,
  LEARNING_OBLIGATION_OVERRIDES,
  MINOR_WORK_LIMITS_BY_BAND,
  HARD_LEGAL_ISSUE_CODES,
  resolveBandLimits,
  eligibilityIssueMessageParams,
} from "@/lib/employmentRules/rules";
export type { BandWorkLimits, LearningObligationOverrides } from "@/lib/employmentRules/rules";
export type {
  EligibilityIssueCode,
  JobWorkConditionsInput,
  MinorJobEligibilityResult,
  MinorJobEligibilityStatus,
  SeekerEligibilityInput,
} from "@/lib/employmentRules/types";
export type {
  WorkPreferenceFieldKey,
  WorkPreferenceRestriction,
  WorkPreferenceRestrictionCode,
  WorkPreferencesInput,
} from "@/lib/employmentRules/workPreferencesTypes";
