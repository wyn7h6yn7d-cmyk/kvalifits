/** Calendar age and minor-work fields derived from date of birth. */

export const LEARNING_OBLIGATION_VALUES = ["subject_to", "not_subject_to"] as const;
export type LearningObligationStatus = (typeof LEARNING_OBLIGATION_VALUES)[number];

export const MINOR_AGE_BAND_VALUES = ["under_15", "age_15", "age_16_17"] as const;
export type MinorAgeBand = (typeof MINOR_AGE_BAND_VALUES)[number];

/** Profile status for legal-representative consent (minors only). */
export const LEGAL_REPRESENTATIVE_CONSENT_VALUES = ["required", "pending", "confirmed"] as const;
export type LegalRepresentativeConsentStatus = (typeof LEGAL_REPRESENTATIVE_CONSENT_VALUES)[number];

/** Statuses a seeker may set in the UI today (confirmed is workflow-only). */
export const LEGAL_REPRESENTATIVE_CONSENT_SEEKER_EDITABLE = ["required", "pending"] as const;

export function isLegalRepresentativeConsentStatus(v: unknown): v is LegalRepresentativeConsentStatus {
  return typeof v === "string" && (LEGAL_REPRESENTATIVE_CONSENT_VALUES as readonly string[]).includes(v);
}

/** Employer-facing: consent still needed before an employment contract (no PII / no status detail). */
export function requiresLegalRepresentativeConsentNotice(
  args: {
    isMinor: boolean;
    consentStatus: LegalRepresentativeConsentStatus | null | undefined;
  }
): boolean {
  if (!args.isMinor) return false;
  return args.consentStatus !== "confirmed";
}

export function normalizeSeekerEditableConsentStatus(
  v: unknown,
  isMinor: boolean
): LegalRepresentativeConsentStatus | null {
  if (!isMinor) return null;
  if (v === "pending") return "pending";
  if (v === "confirmed") return "confirmed"; // display only if already set by workflow
  return "required";
}

/** YYYY-MM-DD → calendar age in full years as of `asOf` (default: today, local). */
export function calculateAgeYears(dateOfBirth: string, asOf: Date = new Date()): number | null {
  const dob = parseDateOnly(dateOfBirth);
  if (!dob) return null;

  const y = asOf.getFullYear();
  const m = asOf.getMonth();
  const d = asOf.getDate();

  let age = y - dob.year;
  if (m < dob.month || (m === dob.month && d < dob.day)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export function isMinorAge(ageYears: number | null): boolean {
  return ageYears !== null && ageYears < 18;
}

export function minorAgeBandFromAge(ageYears: number | null): MinorAgeBand | null {
  if (ageYears === null || ageYears >= 18) return null;
  if (ageYears < 15) return "under_15";
  if (ageYears === 15) return "age_15";
  if (ageYears === 16 || ageYears === 17) return "age_16_17";
  return null;
}

export function needsLearningObligationStatus(ageYears: number | null): boolean {
  return ageYears === 16 || ageYears === 17;
}

export function isLearningObligationStatus(v: unknown): v is LearningObligationStatus {
  return typeof v === "string" && (LEARNING_OBLIGATION_VALUES as readonly string[]).includes(v);
}

export type SeekerAgeDerivedFields = {
  age_years: number | null;
  is_minor: boolean;
  minor_age_band: MinorAgeBand | null;
  learning_obligation_status: LearningObligationStatus | null;
  parental_consent_required: boolean;
  night_work_restricted: boolean;
  hazardous_work_restricted: boolean;
};

/** Client-side mirror of DB trigger derived fields (DB remains source of truth on save). */
export function deriveSeekerAgeFields(
  dateOfBirth: string | null | undefined,
  learningObligationStatus: LearningObligationStatus | "" | null | undefined = null
): SeekerAgeDerivedFields {
  const age = dateOfBirth ? calculateAgeYears(dateOfBirth) : null;
  const minor = isMinorAge(age);
  const band = minorAgeBandFromAge(age);
  const learning =
    needsLearningObligationStatus(age) && isLearningObligationStatus(learningObligationStatus)
      ? learningObligationStatus
      : null;

  return {
    age_years: age,
    is_minor: minor,
    minor_age_band: band,
    learning_obligation_status: learning,
    parental_consent_required: minor,
    night_work_restricted: minor,
    hazardous_work_restricted: minor,
  };
}

function parseDateOnly(v: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  const day = Number(m[3]);
  const dt = new Date(year, month, day);
  if (dt.getFullYear() !== year || dt.getMonth() !== month || dt.getDate() !== day) return null;
  const today = new Date();
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (dt > todayOnly) return null;
  return { year, month, day };
}
