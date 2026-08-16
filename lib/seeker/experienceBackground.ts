/** Structured seeker experience background (alongside experience_level). */

export const EXPERIENCE_BACKGROUND_KEYS = [
  "seeking_first_job",
  "is_student",
  "has_internship",
  "has_volunteer",
  "has_project",
  "has_prior_work",
] as const;

export type ExperienceBackgroundKey = (typeof EXPERIENCE_BACKGROUND_KEYS)[number];

export type ExperienceBackgroundFormValue = {
  seeking_first_job: boolean;
  is_student: boolean;
  has_internship: boolean;
  has_volunteer: boolean;
  has_project: boolean;
  has_prior_work: boolean;
  /** Years; empty string in form → null. 0 is valid (first job). */
  duration_years: string;
};

export type ExperienceBackgroundMatchInput = {
  seeking_first_job?: boolean | null;
  is_student?: boolean | null;
  has_internship?: boolean | null;
  has_volunteer?: boolean | null;
  has_project?: boolean | null;
  has_prior_work?: boolean | null;
  experience_duration_years?: number | null;
};

export function emptyExperienceBackgroundFormValue(): ExperienceBackgroundFormValue {
  return {
    seeking_first_job: false,
    is_student: false,
    has_internship: false,
    has_volunteer: false,
    has_project: false,
    has_prior_work: false,
    duration_years: "",
  };
}

export function experienceBackgroundFromDb(row: {
  exp_seeking_first_job?: boolean | null;
  exp_is_student?: boolean | null;
  exp_has_internship?: boolean | null;
  exp_has_volunteer?: boolean | null;
  exp_has_project?: boolean | null;
  exp_has_prior_work?: boolean | null;
  experience_duration_years?: number | null;
} | null): ExperienceBackgroundFormValue {
  if (!row) return emptyExperienceBackgroundFormValue();
  return {
    seeking_first_job: Boolean(row.exp_seeking_first_job),
    is_student: Boolean(row.exp_is_student),
    has_internship: Boolean(row.exp_has_internship),
    has_volunteer: Boolean(row.exp_has_volunteer),
    has_project: Boolean(row.exp_has_project),
    has_prior_work: Boolean(row.exp_has_prior_work),
    duration_years:
      row.experience_duration_years === null || row.experience_duration_years === undefined
        ? ""
        : String(row.experience_duration_years),
  };
}

export function parseExperienceDurationYears(v: string): number | null {
  const trimmed = v.trim().replace(",", ".");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function experienceBackgroundToDbPayload(value: ExperienceBackgroundFormValue) {
  return {
    exp_seeking_first_job: value.seeking_first_job,
    exp_is_student: value.is_student,
    exp_has_internship: value.has_internship,
    exp_has_volunteer: value.has_volunteer,
    exp_has_project: value.has_project,
    exp_has_prior_work: value.has_prior_work,
    experience_duration_years: parseExperienceDurationYears(value.duration_years),
  };
}

export function experienceBackgroundToMatchInput(
  value: ExperienceBackgroundFormValue | ExperienceBackgroundMatchInput | null | undefined
): ExperienceBackgroundMatchInput | null {
  if (!value) return null;
  if ("duration_years" in value) {
    const v = value as ExperienceBackgroundFormValue;
    return {
      seeking_first_job: v.seeking_first_job,
      is_student: v.is_student,
      has_internship: v.has_internship,
      has_volunteer: v.has_volunteer,
      has_project: v.has_project,
      has_prior_work: v.has_prior_work,
      experience_duration_years: parseExperienceDurationYears(v.duration_years),
    };
  }
  return value as ExperienceBackgroundMatchInput;
}
