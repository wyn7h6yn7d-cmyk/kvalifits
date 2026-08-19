/** Structured seeker work-preference choices (Töösoovid). */
export type WorkPreferencesInput = {
  fullTime: boolean;
  partTime: boolean;
  desiredWeeklyHours: number | null;
  minWeeklyHours: number | null;
  maxWeeklyHours: number | null;
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

export type WorkPreferenceFieldKey =
  | "fullTime"
  | "partTime"
  | "desiredWeeklyHours"
  | "minWeeklyHours"
  | "maxWeeklyHours"
  | "dayWork"
  | "eveningWork"
  | "nightWork"
  | "shiftWork"
  | "weekendWork"
  | "flexibleHours"
  | "remoteWork"
  | "hybridWork"
  | "onSiteWork";

/** Machine codes — map to friendly copy in UI, not legal text in React. */
export type WorkPreferenceRestrictionCode =
  | "full_time_not_allowed"
  | "night_work_not_allowed"
  | "evening_work_not_allowed"
  | "shift_work_not_allowed"
  | "weekly_hours_above_limit";

export type WorkPreferenceRestriction = {
  field: WorkPreferenceFieldKey;
  code: WorkPreferenceRestrictionCode;
  /** Band max weekly hours when code is weekly_hours_above_limit. */
  maxWeeklyHoursLimit?: number;
};
