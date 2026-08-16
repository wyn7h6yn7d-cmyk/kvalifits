import { resolveBandLimits } from "@/lib/employmentRules/rules";
import type { SeekerEligibilityInput } from "@/lib/employmentRules/types";
import type {
  WorkPreferenceRestriction,
  WorkPreferencesInput,
} from "@/lib/employmentRules/workPreferencesTypes";
import { minorAgeBandFromAge } from "@/lib/seeker/age";

/**
 * Check seeker work-preference selections against minor employment limits.
 * Adults / unknown age → no restrictions.
 * Does not invent legal prose — UI maps restriction codes to friendly copy.
 */
export function evaluateWorkPreferencesAgainstEligibility(
  seeker: SeekerEligibilityInput,
  prefs: WorkPreferencesInput
): WorkPreferenceRestriction[] {
  if (!seeker.isMinor || seeker.ageYears === null) return [];

  const band = seeker.minorAgeBand ?? minorAgeBandFromAge(seeker.ageYears);
  if (!band) return [];

  const limits = resolveBandLimits(band, seeker.learningObligationStatus);
  const restrictions: WorkPreferenceRestriction[] = [];

  if (prefs.fullTime && !limits.fullTimeGenerallyOk) {
    restrictions.push({ field: "fullTime", code: "full_time_not_allowed" });
  }

  if (prefs.nightWork && !limits.nightWorkAllowed) {
    restrictions.push({ field: "nightWork", code: "night_work_not_allowed" });
  }

  // Evening work past typical daytime — not allowed when band ends at/before 18:00.
  if (prefs.eveningWork && minutesOf(limits.latestShiftEnd) <= minutesOf("18:00")) {
    restrictions.push({ field: "eveningWork", code: "evening_work_not_allowed" });
  }

  // Shift work often includes late/night slots; block when night work is not allowed
  // for younger bands (under_15 / age_15). Ages 16–17 may still pick shifts within day window.
  if (prefs.shiftWork && !limits.nightWorkAllowed && (band === "under_15" || band === "age_15")) {
    restrictions.push({ field: "shiftWork", code: "shift_work_not_allowed" });
  }

  const hourFields = [
    { field: "desiredWeeklyHours" as const, value: prefs.desiredWeeklyHours },
    { field: "minWeeklyHours" as const, value: prefs.minWeeklyHours },
    { field: "maxWeeklyHours" as const, value: prefs.maxWeeklyHours },
  ];
  for (const { field, value } of hourFields) {
    if (value !== null && value > limits.maxWeeklyHours) {
      restrictions.push({
        field,
        code: "weekly_hours_above_limit",
        maxWeeklyHoursLimit: limits.maxWeeklyHours,
      });
    }
  }

  return restrictions;
}

/** Which boolean preference toggles are selectable for this seeker (before choosing). */
export function workPreferenceToggleAvailability(
  seeker: SeekerEligibilityInput
): Partial<Record<"fullTime" | "eveningWork" | "nightWork" | "shiftWork", WorkPreferenceRestriction["code"]>> {
  if (!seeker.isMinor || seeker.ageYears === null) return {};

  const band = seeker.minorAgeBand ?? minorAgeBandFromAge(seeker.ageYears);
  if (!band) return {};

  const limits = resolveBandLimits(band, seeker.learningObligationStatus);
  const blocked: Partial<
    Record<"fullTime" | "eveningWork" | "nightWork" | "shiftWork", WorkPreferenceRestriction["code"]>
  > = {};

  if (!limits.fullTimeGenerallyOk) blocked.fullTime = "full_time_not_allowed";
  if (!limits.nightWorkAllowed) blocked.nightWork = "night_work_not_allowed";
  if (minutesOf(limits.latestShiftEnd) <= minutesOf("18:00")) {
    blocked.eveningWork = "evening_work_not_allowed";
  }
  if (!limits.nightWorkAllowed && (band === "under_15" || band === "age_15")) {
    blocked.shiftWork = "shift_work_not_allowed";
  }

  return blocked;
}

export function maxWeeklyHoursForSeeker(seeker: SeekerEligibilityInput): number | null {
  if (!seeker.isMinor || seeker.ageYears === null) return null;
  const band = seeker.minorAgeBand ?? minorAgeBandFromAge(seeker.ageYears);
  if (!band) return null;
  return resolveBandLimits(band, seeker.learningObligationStatus).maxWeeklyHours;
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
