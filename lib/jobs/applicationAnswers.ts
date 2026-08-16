/** Short in-app apply answers — job-specific; not a duplicate of the seeker profile. */

export const SALARY_MODE_VALUES = ["fixed", "range", "negotiable"] as const;
export type SalaryMode = (typeof SALARY_MODE_VALUES)[number];

export const SALARY_BASIS_VALUES = ["bruto_monthly", "bruto_hourly"] as const;
export type SalaryBasis = (typeof SALARY_BASIS_VALUES)[number];

export const SCHEDULE_FIT_VALUES = ["yes", "no", "partial"] as const;
export type ScheduleFit = (typeof SCHEDULE_FIT_VALUES)[number];

export const INTERVIEW_PREFERENCE_VALUES = [
  "on_site",
  "teams",
  "phone",
  "video",
  "any",
] as const;
export type InterviewPreference = (typeof INTERVIEW_PREFERENCE_VALUES)[number];

/** Structured start-availability for apply answers + future matching. */
export const AVAILABILITY_START_VALUES = [
  "immediate",
  "within_1_week",
  "within_2_weeks",
  "within_1_month",
  "specific_date",
  "by_agreement",
] as const;
export type AvailabilityStart = (typeof AVAILABILITY_START_VALUES)[number];

export type ApplicationAnswers = {
  salaryMode: SalaryMode;
  salaryBasis: SalaryBasis;
  /** Present for fixed + range; null when negotiable. */
  salary_expectation_min: number | null;
  /** Present for range (and equals min for fixed); null when negotiable. */
  salary_expectation_max: number | null;
  /** When the candidate can start (structured for matching). */
  availability_start: AvailabilityStart;
  /** ISO date `YYYY-MM-DD` when availability_start === specific_date; otherwise null. */
  availability_start_date: string | null;
  /** Free short answer: notice period length. */
  noticePeriod: string;
  weeklyHoursDesired: number;
  scheduleFits: ScheduleFit;
  /** One or more interview formats the candidate accepts. */
  interview_preferences: InterviewPreference[];
  /** Candidate prefers the first conversation online (no calendar/Teams integration yet). */
  prefer_first_interview_online: boolean;
  /** Optional note — not a full cover letter / profile dump. */
  noteForEmployer: string | null;
};

export type ApplicationAnswersInput = {
  salaryMode: string;
  salaryBasis: string;
  /** Fixed amount, or range min (also accepts legacy `salaryAmount`). */
  salary_expectation_min: string;
  salary_expectation_max: string;
  /** @deprecated Prefer salary_expectation_min for fixed mode. */
  salaryAmount?: string;
  availability_start: string;
  /** ISO date when mode is specific_date. */
  availability_start_date: string;
  /** @deprecated Free-text start answer from older clients. */
  availableFrom?: string;
  noticePeriod: string;
  weeklyHoursDesired: string;
  scheduleFits: string;
  /** Multi-select list, or legacy single string via interviewPreference. */
  interview_preferences?: string[] | string;
  /** @deprecated Single select from older clients. */
  interviewPreference?: string;
  prefer_first_interview_online?: boolean | string;
  noteForEmployer: string;
};

export function isSalaryMode(v: unknown): v is SalaryMode {
  return typeof v === "string" && (SALARY_MODE_VALUES as readonly string[]).includes(v);
}

export function isSalaryBasis(v: unknown): v is SalaryBasis {
  return typeof v === "string" && (SALARY_BASIS_VALUES as readonly string[]).includes(v);
}

export function isScheduleFit(v: unknown): v is ScheduleFit {
  return typeof v === "string" && (SCHEDULE_FIT_VALUES as readonly string[]).includes(v);
}

export function isInterviewPreference(v: unknown): v is InterviewPreference {
  return typeof v === "string" && (INTERVIEW_PREFERENCE_VALUES as readonly string[]).includes(v);
}

export function isAvailabilityStart(v: unknown): v is AvailabilityStart {
  return typeof v === "string" && (AVAILABILITY_START_VALUES as readonly string[]).includes(v);
}

function parsePositiveNumber(raw: string): number | null {
  const n = Number(String(raw).trim().replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Accepts `YYYY-MM-DD` only. */
function parseIsoDate(raw: string): string | null {
  const s = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m! - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return s;
}

export type ParseApplicationAnswersResult =
  | { ok: true; value: ApplicationAnswers }
  | { ok: false; error: string };

/**
 * Validate and normalize apply-form answers.
 * Error codes are stable for i18n mapping in the UI/API.
 */
export function parseApplicationAnswers(input: ApplicationAnswersInput): ParseApplicationAnswersResult {
  if (!isSalaryMode(input.salaryMode)) return { ok: false, error: "invalid_salary_mode" };
  if (!isSalaryBasis(input.salaryBasis)) return { ok: false, error: "invalid_salary_basis" };

  let salary_expectation_min: number | null = null;
  let salary_expectation_max: number | null = null;

  if (input.salaryMode === "negotiable") {
    salary_expectation_min = null;
    salary_expectation_max = null;
  } else if (input.salaryMode === "fixed") {
    const amount =
      parsePositiveNumber(input.salary_expectation_min) ??
      parsePositiveNumber(input.salaryAmount ?? "");
    if (amount === null) return { ok: false, error: "invalid_salary" };
    salary_expectation_min = amount;
    salary_expectation_max = amount;
  } else {
    const min =
      parsePositiveNumber(input.salary_expectation_min) ??
      parsePositiveNumber(input.salaryAmount ?? "");
    const max = parsePositiveNumber(input.salary_expectation_max);
    if (min === null || max === null) return { ok: false, error: "invalid_salary_range" };
    if (max < min) return { ok: false, error: "invalid_salary_range_order" };
    salary_expectation_min = min;
    salary_expectation_max = max;
  }

  const availability = normalizeAvailabilityInput(input);
  if (!availability.ok) return { ok: false, error: availability.error };

  const noticePeriod = input.noticePeriod.trim().slice(0, 120);
  if (!noticePeriod) return { ok: false, error: "missing_notice_period" };

  const weeklyHoursDesired = parsePositiveNumber(input.weeklyHoursDesired);
  if (weeklyHoursDesired === null || weeklyHoursDesired > 168) {
    return { ok: false, error: "invalid_weekly_hours" };
  }

  if (!isScheduleFit(input.scheduleFits)) return { ok: false, error: "invalid_schedule_fit" };

  const interviewPrefs = normalizeInterviewPreferences(input);
  if (!interviewPrefs.ok) return { ok: false, error: interviewPrefs.error };

  const preferOnline = parsePreferFirstInterviewOnline(input.prefer_first_interview_online);

  const noteRaw = input.noteForEmployer.trim().slice(0, 500);
  return {
    ok: true,
    value: {
      salaryMode: input.salaryMode,
      salaryBasis: input.salaryBasis,
      salary_expectation_min,
      salary_expectation_max,
      availability_start: availability.value.availability_start,
      availability_start_date: availability.value.availability_start_date,
      noticePeriod,
      weeklyHoursDesired,
      scheduleFits: input.scheduleFits,
      interview_preferences: interviewPrefs.value,
      prefer_first_interview_online: preferOnline,
      noteForEmployer: noteRaw ? noteRaw : null,
    },
  };
}

function parsePreferFirstInterviewOnline(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return false;
}

function normalizeInterviewPreferences(input: ApplicationAnswersInput):
  | { ok: true; value: InterviewPreference[] }
  | { ok: false; error: string } {
  const raw: unknown[] = [];
  if (Array.isArray(input.interview_preferences)) {
    raw.push(...input.interview_preferences);
  } else if (typeof input.interview_preferences === "string" && input.interview_preferences.trim()) {
    raw.push(
      ...input.interview_preferences
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
    );
  } else if (input.interviewPreference) {
    raw.push(input.interviewPreference);
  }

  const unique: InterviewPreference[] = [];
  for (const item of raw) {
    if (!isInterviewPreference(item)) continue;
    if (!unique.includes(item)) unique.push(item);
  }

  if (!unique.length) return { ok: false, error: "invalid_interview_preference" };

  // "any" means all formats work — keep only that token for matching clarity.
  if (unique.includes("any")) {
    return { ok: true, value: ["any"] };
  }

  return { ok: true, value: unique };
}

function normalizeAvailabilityInput(input: ApplicationAnswersInput):
  | { ok: true; value: { availability_start: AvailabilityStart; availability_start_date: string | null } }
  | { ok: false; error: string } {
  if (isAvailabilityStart(input.availability_start)) {
    if (input.availability_start === "specific_date") {
      const date = parseIsoDate(input.availability_start_date);
      if (!date) return { ok: false, error: "invalid_availability_start_date" };
      return {
        ok: true,
        value: { availability_start: "specific_date", availability_start_date: date },
      };
    }
    return {
      ok: true,
      value: { availability_start: input.availability_start, availability_start_date: null },
    };
  }

  // Legacy free-text `availableFrom`
  const legacy = (input.availableFrom ?? "").trim();
  if (!legacy) return { ok: false, error: "missing_availability_start" };

  const asDate = parseIsoDate(legacy);
  if (asDate) {
    return {
      ok: true,
      value: { availability_start: "specific_date", availability_start_date: asDate },
    };
  }

  const lower = legacy.toLowerCase();
  if (/^(kohe|immediate|asap|сразу)$/i.test(lower)) {
    return { ok: true, value: { availability_start: "immediate", availability_start_date: null } };
  }
  if (/kokkuleppel|by agreement|по договорённости|по договоренности/i.test(lower)) {
    return { ok: true, value: { availability_start: "by_agreement", availability_start_date: null } };
  }

  // Preserve old free-text applications as by_agreement so employer view still loads.
  return { ok: true, value: { availability_start: "by_agreement", availability_start_date: null } };
}

/** Infer salary fields from legacy snapshots that only had `salaryAmount`. */
function normalizeLegacySalaryFields(o: Record<string, unknown>): {
  salaryMode: string;
  salary_expectation_min: string;
  salary_expectation_max: string;
} {
  if (isSalaryMode(o.salaryMode)) {
    return {
      salaryMode: o.salaryMode,
      salary_expectation_min: String(
        o.salary_expectation_min ?? o.salaryAmount ?? ""
      ),
      salary_expectation_max: String(o.salary_expectation_max ?? ""),
    };
  }

  // Legacy: single amount only
  const legacy = o.salaryAmount;
  if (legacy !== null && legacy !== undefined && String(legacy).trim() !== "") {
    const n = String(legacy);
    return {
      salaryMode: "fixed",
      salary_expectation_min: n,
      salary_expectation_max: n,
    };
  }

  return {
    salaryMode: "",
    salary_expectation_min: String(o.salary_expectation_min ?? ""),
    salary_expectation_max: String(o.salary_expectation_max ?? ""),
  };
}

export function applicationAnswersFromUnknown(v: unknown): ApplicationAnswers | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const salary = normalizeLegacySalaryFields(o);
  const parsed = parseApplicationAnswers({
    salaryMode: salary.salaryMode,
    salaryBasis: String(o.salaryBasis ?? ""),
    salary_expectation_min: salary.salary_expectation_min,
    salary_expectation_max: salary.salary_expectation_max,
    availability_start: String(o.availability_start ?? ""),
    availability_start_date: String(o.availability_start_date ?? ""),
    availableFrom: String(o.availableFrom ?? ""),
    noticePeriod: String(o.noticePeriod ?? ""),
    weeklyHoursDesired: String(o.weeklyHoursDesired ?? ""),
    scheduleFits: String(o.scheduleFits ?? ""),
    interview_preferences: Array.isArray(o.interview_preferences)
      ? (o.interview_preferences as string[])
      : String(o.interview_preferences ?? ""),
    interviewPreference: String(o.interviewPreference ?? ""),
    prefer_first_interview_online: o.prefer_first_interview_online as boolean | string | undefined,
    noteForEmployer: String(o.noteForEmployer ?? ""),
  });
  return parsed.ok ? parsed.value : null;
}

function formatAmount(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(n);
}

/**
 * Compact employer-facing salary line (numbers first for scanning).
 * Labels come from the caller (i18n).
 */
export function formatSalaryExpectationScan(
  answers: Pick<
    ApplicationAnswers,
    "salaryMode" | "salaryBasis" | "salary_expectation_min" | "salary_expectation_max"
  >,
  labels: {
    negotiable: string;
    brutoMonthly: string;
    brutoHourly: string;
  }
): { primary: string; basis: string } {
  const basis = answers.salaryBasis === "bruto_hourly" ? labels.brutoHourly : labels.brutoMonthly;

  if (answers.salaryMode === "negotiable") {
    return { primary: labels.negotiable, basis };
  }

  const min = answers.salary_expectation_min;
  const max = answers.salary_expectation_max;
  if (answers.salaryMode === "range" && min !== null && max !== null) {
    return { primary: `${formatAmount(min)}–${formatAmount(max)}`, basis };
  }

  const amount = min ?? max;
  return { primary: amount !== null ? formatAmount(amount) : "—", basis };
}

/** Plain-text salary for email / logs. Pass localized labels from the i18n layer. */
export function formatSalaryExpectationPlain(
  answers: ApplicationAnswers,
  labels: { negotiable: string; brutoMonthly: string; brutoHourly: string }
): string {
  const basis = answers.salaryBasis === "bruto_hourly" ? labels.brutoHourly : labels.brutoMonthly;
  if (answers.salaryMode === "negotiable") return `${labels.negotiable} (${basis})`;
  if (
    answers.salaryMode === "range" &&
    answers.salary_expectation_min !== null &&
    answers.salary_expectation_max !== null
  ) {
    return `${formatAmount(answers.salary_expectation_min)}–${formatAmount(answers.salary_expectation_max)} (${basis})`;
  }
  const amount = answers.salary_expectation_min ?? answers.salary_expectation_max;
  return amount !== null ? `${formatAmount(amount)} (${basis})` : `— (${basis})`;
}

/** @deprecated Prefer formatSalaryExpectationPlain with i18n labels. */
export function formatSalaryExpectationPlainEt(answers: ApplicationAnswers): string {
  return formatSalaryExpectationPlain(answers, {
    negotiable: "Läbiräägitav",
    brutoMonthly: "bruto kuus",
    brutoHourly: "bruto tunnis",
  });
}

/**
 * Employer / email display for structured start availability.
 * `optionLabel` should already be localized for the enum (except specific_date uses the ISO date).
 */
export function formatAvailabilityStartDisplay(
  answers: Pick<ApplicationAnswers, "availability_start" | "availability_start_date">,
  optionLabel: (code: AvailabilityStart) => string
): string {
  if (answers.availability_start === "specific_date" && answers.availability_start_date) {
    return `${optionLabel("specific_date")}: ${answers.availability_start_date}`;
  }
  return optionLabel(answers.availability_start);
}

/** Approximate earliest start date for matching heuristics (local calendar days). */
export function earliestAvailabilityDate(
  answers: Pick<ApplicationAnswers, "availability_start" | "availability_start_date">,
  fromDate: Date = new Date()
): Date | null {
  const base = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  switch (answers.availability_start) {
    case "immediate":
      return base;
    case "within_1_week": {
      const d = new Date(base);
      d.setDate(d.getDate() + 7);
      return d;
    }
    case "within_2_weeks": {
      const d = new Date(base);
      d.setDate(d.getDate() + 14);
      return d;
    }
    case "within_1_month": {
      const d = new Date(base);
      d.setMonth(d.getMonth() + 1);
      return d;
    }
    case "specific_date": {
      if (!answers.availability_start_date) return null;
      const [y, m, day] = answers.availability_start_date.split("-").map(Number);
      return new Date(y!, m! - 1, day!);
    }
    case "by_agreement":
      return null;
    default:
      return null;
  }
}

/** Localized interview preference summary for employer UI / email. */
export function formatInterviewPreferencesDisplay(
  answers: Pick<ApplicationAnswers, "interview_preferences" | "prefer_first_interview_online">,
  optionLabel: (code: InterviewPreference) => string,
  preferOnlineLabel: string
): { formats: string; preferOnline: boolean; preferOnlineLabel: string } {
  const formats = answers.interview_preferences.map(optionLabel).join(" · ");
  return {
    formats: formats || "—",
    preferOnline: Boolean(answers.prefer_first_interview_online),
    preferOnlineLabel,
  };
}
