"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/ui/input";
import {
  evaluateWorkPreferencesAgainstEligibility,
  maxWeeklyHoursForSeeker,
  workPreferenceToggleAvailability,
  type WorkPreferenceRestrictionCode,
  type WorkPreferencesInput,
} from "@/lib/employmentRules";
import {
  calculateAgeYears,
  isLearningObligationStatus,
  minorAgeBandFromAge,
  type LearningObligationStatus,
} from "@/lib/seeker/age";

export type WorkPreferencesFormValue = {
  fullTime: boolean;
  partTime: boolean;
  desiredWeeklyHours: string;
  minWeeklyHours: string;
  maxWeeklyHours: string;
  dayWork: boolean;
  eveningWork: boolean;
  nightWork: boolean;
  shiftWork: boolean;
  weekendWork: boolean;
  flexibleHours: boolean;
  remoteWork: boolean;
  hybridWork: boolean;
  onSiteWork: boolean;
};

type Props = {
  value: WorkPreferencesFormValue;
  onChange: (next: WorkPreferencesFormValue) => void;
  dateOfBirth: string;
  learningObligationStatus: LearningObligationStatus | "";
};

const TOGGLE_KEYS = [
  "fullTime",
  "partTime",
  "dayWork",
  "eveningWork",
  "nightWork",
  "shiftWork",
  "weekendWork",
  "flexibleHours",
  "remoteWork",
  "hybridWork",
  "onSiteWork",
] as const;

type ToggleKey = (typeof TOGGLE_KEYS)[number];

export function SeekerWorkPreferencesFields({
  value,
  onChange,
  dateOfBirth,
  learningObligationStatus,
}: Props) {
  const t = useTranslations("onboarding");

  const seekerInput = useMemo(() => {
    const ageYears = dateOfBirth ? calculateAgeYears(dateOfBirth) : null;
    const learning = isLearningObligationStatus(learningObligationStatus)
      ? learningObligationStatus
      : null;
    return {
      ageYears,
      isMinor: ageYears !== null && ageYears < 18,
      minorAgeBand: minorAgeBandFromAge(ageYears),
      learningObligationStatus: learning,
    };
  }, [dateOfBirth, learningObligationStatus]);

  const prefsInput: WorkPreferencesInput = useMemo(
    () => ({
      fullTime: value.fullTime,
      partTime: value.partTime,
      desiredWeeklyHours: parseHours(value.desiredWeeklyHours),
      minWeeklyHours: parseHours(value.minWeeklyHours),
      maxWeeklyHours: parseHours(value.maxWeeklyHours),
      dayWork: value.dayWork,
      eveningWork: value.eveningWork,
      nightWork: value.nightWork,
      shiftWork: value.shiftWork,
      weekendWork: value.weekendWork,
      flexibleHours: value.flexibleHours,
      remoteWork: value.remoteWork,
      hybridWork: value.hybridWork,
      onSiteWork: value.onSiteWork,
    }),
    [value]
  );

  const blockedToggles = useMemo(
    () => workPreferenceToggleAvailability(seekerInput),
    [seekerInput]
  );

  const activeRestrictions = useMemo(
    () => evaluateWorkPreferencesAgainstEligibility(seekerInput, prefsInput),
    [seekerInput, prefsInput]
  );

  const weeklyCap = maxWeeklyHoursForSeeker(seekerInput);

  function patch(partial: Partial<WorkPreferencesFormValue>) {
    onChange({ ...value, ...partial });
  }

  function restrictionMessage(code: WorkPreferenceRestrictionCode, maxLimit?: number) {
    if (code === "weekly_hours_above_limit") {
      return t("workPrefRestrictWeeklyHours", { max: maxLimit ?? weeklyCap ?? "—" });
    }
    return t(`workPrefRestrict.${code}`);
  }

  function toggleDisabledReason(key: ToggleKey): string | null {
    if (key === "fullTime" && blockedToggles.fullTime) {
      return restrictionMessage(blockedToggles.fullTime);
    }
    if (key === "eveningWork" && blockedToggles.eveningWork) {
      return restrictionMessage(blockedToggles.eveningWork);
    }
    if (key === "nightWork" && blockedToggles.nightWork) {
      return restrictionMessage(blockedToggles.nightWork);
    }
    if (key === "shiftWork" && blockedToggles.shiftWork) {
      return restrictionMessage(blockedToggles.shiftWork);
    }
    return null;
  }

  return (
    <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6 space-y-5">
      <div>
        <div className="text-sm font-medium text-white/85">{t("workPreferencesTitle")}</div>
        <div className="mt-1 text-sm leading-relaxed text-white/60">{t("workPreferencesHint")}</div>
        {weeklyCap !== null ? (
          <div className="mt-2 text-xs leading-relaxed text-white/45">
            {t("workPreferencesMinorCapHint", { max: weeklyCap })}
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {TOGGLE_KEYS.map((key) => {
          const disabledReason = toggleDisabledReason(key);
          const checked = Boolean(value[key]);
          return (
            <div key={key} className="space-y-1.5">
              <label
                className={`flex select-none items-start gap-3 ${
                  disabledReason ? "cursor-not-allowed opacity-70" : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked && !disabledReason}
                  disabled={Boolean(disabledReason)}
                  onChange={(e) => {
                    if (disabledReason) return;
                    patch({ [key]: e.target.checked } as Partial<WorkPreferencesFormValue>);
                  }}
                  className="mt-1 h-4 w-4 rounded border-white/[0.20] bg-white/[0.03]"
                />
                <span className="text-sm font-medium text-white/80">{t(`workPrefToggle.${key}`)}</span>
              </label>
              {disabledReason ? (
                <div className="pl-7 text-xs leading-relaxed text-white/50">{disabledReason}</div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(
          [
            ["desiredWeeklyHours", "desiredWeeklyHours"],
            ["minWeeklyHours", "minWeeklyHours"],
            ["maxWeeklyHours", "maxWeeklyHours"],
          ] as const
        ).map(([field, labelKey]) => {
          const restriction = activeRestrictions.find((r) => r.field === field);
          return (
            <div key={field} className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-white/65" htmlFor={`wp-${field}`}>
                {t(`workPrefHours.${labelKey}`)}
              </label>
              <Input
                id={`wp-${field}`}
                value={value[field]}
                onChange={(e) => patch({ [field]: e.target.value } as Partial<WorkPreferencesFormValue>)}
                inputMode="decimal"
                placeholder={t("workPrefHoursPlaceholder")}
              />
              {restriction ? (
                <div className="text-xs leading-relaxed text-amber-100/80">
                  {restrictionMessage(restriction.code, restriction.maxWeeklyHoursLimit)}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function emptyWorkPreferencesFormValue(): WorkPreferencesFormValue {
  return {
    fullTime: false,
    partTime: false,
    desiredWeeklyHours: "",
    minWeeklyHours: "",
    maxWeeklyHours: "",
    dayWork: false,
    eveningWork: false,
    nightWork: false,
    shiftWork: false,
    weekendWork: false,
    flexibleHours: false,
    remoteWork: false,
    hybridWork: false,
    onSiteWork: false,
  };
}

export function workPreferencesFromDb(row: {
  pref_full_time?: boolean | null;
  pref_part_time?: boolean | null;
  pref_desired_weekly_hours?: number | null;
  pref_min_weekly_hours?: number | null;
  pref_max_weekly_hours?: number | null;
  pref_day_work?: boolean | null;
  pref_evening_work?: boolean | null;
  pref_night_work?: boolean | null;
  pref_shift_work?: boolean | null;
  pref_weekend_work?: boolean | null;
  pref_flexible_hours?: boolean | null;
  pref_remote_work?: boolean | null;
  pref_hybrid_work?: boolean | null;
  pref_on_site_work?: boolean | null;
} | null): WorkPreferencesFormValue {
  if (!row) return emptyWorkPreferencesFormValue();
  return {
    fullTime: Boolean(row.pref_full_time),
    partTime: Boolean(row.pref_part_time),
    desiredWeeklyHours: numToStr(row.pref_desired_weekly_hours),
    minWeeklyHours: numToStr(row.pref_min_weekly_hours),
    maxWeeklyHours: numToStr(row.pref_max_weekly_hours),
    dayWork: Boolean(row.pref_day_work),
    eveningWork: Boolean(row.pref_evening_work),
    nightWork: Boolean(row.pref_night_work),
    shiftWork: Boolean(row.pref_shift_work),
    weekendWork: Boolean(row.pref_weekend_work),
    flexibleHours: Boolean(row.pref_flexible_hours),
    remoteWork: Boolean(row.pref_remote_work),
    hybridWork: Boolean(row.pref_hybrid_work),
    onSiteWork: Boolean(row.pref_on_site_work),
  };
}

export function workPreferencesToDbPayload(value: WorkPreferencesFormValue) {
  return {
    pref_full_time: value.fullTime,
    pref_part_time: value.partTime,
    pref_desired_weekly_hours: parseHours(value.desiredWeeklyHours),
    pref_min_weekly_hours: parseHours(value.minWeeklyHours),
    pref_max_weekly_hours: parseHours(value.maxWeeklyHours),
    pref_day_work: value.dayWork,
    pref_evening_work: value.eveningWork,
    pref_night_work: value.nightWork,
    pref_shift_work: value.shiftWork,
    pref_weekend_work: value.weekendWork,
    pref_flexible_hours: value.flexibleHours,
    pref_remote_work: value.remoteWork,
    pref_hybrid_work: value.hybridWork,
    pref_on_site_work: value.onSiteWork,
  };
}

/** Strip disallowed preference flags before save (minors). */
export function sanitizeWorkPreferencesForSave(
  value: WorkPreferencesFormValue,
  dateOfBirth: string,
  learningObligationStatus: LearningObligationStatus | ""
): WorkPreferencesFormValue {
  const ageYears = dateOfBirth ? calculateAgeYears(dateOfBirth) : null;
  const seeker = {
    ageYears,
    isMinor: ageYears !== null && ageYears < 18,
    minorAgeBand: minorAgeBandFromAge(ageYears),
    learningObligationStatus: isLearningObligationStatus(learningObligationStatus)
      ? learningObligationStatus
      : null,
  };
  const blocked = workPreferenceToggleAvailability(seeker);
  const next = { ...value };
  if (blocked.fullTime) next.fullTime = false;
  if (blocked.eveningWork) next.eveningWork = false;
  if (blocked.nightWork) next.nightWork = false;
  if (blocked.shiftWork) next.shiftWork = false;

  const cap = maxWeeklyHoursForSeeker(seeker);
  if (cap !== null) {
    for (const key of ["desiredWeeklyHours", "minWeeklyHours", "maxWeeklyHours"] as const) {
      const n = parseHours(next[key]);
      if (n !== null && n > cap) next[key] = String(cap);
    }
  }
  return next;
}

function parseHours(v: string): number | null {
  const trimmed = v.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function numToStr(v: number | null | undefined): string {
  if (v === null || v === undefined) return "";
  return String(v);
}
