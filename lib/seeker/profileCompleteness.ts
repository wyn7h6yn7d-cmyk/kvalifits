import {
  calculateAgeYears,
  isLearningObligationStatus,
  needsLearningObligationStatus,
} from "@/lib/seeker/age";
import { isExperienceLevel, type SeekerCoreFields } from "@/lib/matching/profileRules";
import { isSeekerAvatarFromStorageUpload } from "@/lib/seeker/seekerAvatarUpload";

export const MIN_SEEKER_ABOUT = 40;
export const MIN_SEEKER_PROFILE_TITLE = 3;
export const MIN_SEEKER_SKILLS = 2;

export const SEEKER_CORE_GAP_KEYS = [
  "avatar",
  "name",
  "title",
  "phone",
  "location",
  "about",
  "skills",
  "experience",
  "jobTypes",
  "locations",
  "dob",
] as const;

export const SEEKER_OPTIONAL_GAP_KEYS = ["certificate"] as const;

export type ProfileGapKey = (typeof SEEKER_CORE_GAP_KEYS)[number] | (typeof SEEKER_OPTIONAL_GAP_KEYS)[number];

export const PROFILE_GAP_HREF: Record<ProfileGapKey, string> = {
  avatar: "/account/seeker/profile",
  name: "/account/seeker/profile",
  title: "/account/seeker/profile",
  phone: "/account/seeker/profile",
  location: "/account/seeker/profile",
  about: "/account/seeker/profile",
  skills: "/account/seeker/profile",
  experience: "/account/seeker/profile",
  jobTypes: "/account/seeker/profile",
  locations: "/account/seeker/profile",
  dob: "/account/seeker/profile",
  certificate: "/account/seeker/certificates",
};

export type SeekerCompletenessInput = {
  avatarOk?: boolean;
  avatarUrl?: string | null;
  fullName?: string | null;
  profileTitle?: string | null;
  phone?: string | null;
  location?: string | null;
  about?: string | null;
  skills?: string[] | null;
  experienceLevel?: string | null;
  preferredJobTypes?: string[] | null;
  preferredLocations?: string[] | null;
  dateOfBirth?: string | null;
  learningObligationStatus?: string | null;
  hasBCategoryDriversLicense?: boolean | null;
  namedCertificateCount?: number;
};

export type SeekerProfileCompletenessSource = {
  avatarOk?: boolean;
  avatarUrl?: string | null;
  seeker:
    | (Partial<SeekerCoreFields> & {
        has_b_category_drivers_license?: boolean | null;
      })
    | null;
  namedCertificateCount?: number;
};

export type ProfileCompleteness = {
  percent: number;
  filled: number;
  total: number;
  coreComplete: boolean;
  completed: ProfileGapKey[];
  missing: ProfileGapKey[];
  /** Alias of `missing` for existing dashboard call sites. */
  gaps: ProfileGapKey[];
};

function hasList(v: string[] | null | undefined, min: number) {
  return (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []).length >= min;
}

function avatarComplete(input: SeekerCompletenessInput): boolean {
  if (typeof input.avatarOk === "boolean") return input.avatarOk;
  return isSeekerAvatarFromStorageUpload(input.avatarUrl);
}

/**
 * Single seeker completeness model.
 *
 * Core items match the apply / onboarding eligibility gate.
 * A named certificate or B-license is optional: it can appear in `missing`
 * and keep percent below 100, but it never flips `coreComplete` to false.
 *
 * UI and gates must use this live calculation. `completion_percent` is a
 * persisted snapshot of `percent` only — never a product source of truth.
 */
export function computeSeekerProfileCompleteness(input: SeekerCompletenessInput): ProfileCompleteness {
  const dob = (input.dateOfBirth ?? "").trim();
  const ageYears = calculateAgeYears(dob);
  const dobOk =
    ageYears !== null &&
    (!needsLearningObligationStatus(ageYears) || isLearningObligationStatus(input.learningObligationStatus));
  const hasCertificate =
    (input.namedCertificateCount ?? 0) > 0 || input.hasBCategoryDriversLicense === true;

  const checks: { key: ProfileGapKey; ok: boolean; required: boolean }[] = [
    { key: "avatar", ok: avatarComplete(input), required: true },
    { key: "name", ok: Boolean((input.fullName ?? "").trim()), required: true },
    { key: "title", ok: (input.profileTitle ?? "").trim().length >= MIN_SEEKER_PROFILE_TITLE, required: true },
    { key: "phone", ok: Boolean((input.phone ?? "").trim()), required: true },
    { key: "location", ok: Boolean((input.location ?? "").trim()), required: true },
    { key: "about", ok: (input.about ?? "").trim().length >= MIN_SEEKER_ABOUT, required: true },
    { key: "skills", ok: hasList(input.skills, MIN_SEEKER_SKILLS), required: true },
    { key: "experience", ok: isExperienceLevel(input.experienceLevel), required: true },
    { key: "jobTypes", ok: hasList(input.preferredJobTypes, 1), required: true },
    { key: "locations", ok: hasList(input.preferredLocations, 1), required: true },
    { key: "dob", ok: dobOk, required: true },
    { key: "certificate", ok: hasCertificate, required: false },
  ];

  const filled = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const percent = total === 0 ? 0 : Math.round((filled / total) * 100);
  const completed = checks.filter((c) => c.ok).map((c) => c.key);
  const missing = checks.filter((c) => !c.ok).map((c) => c.key);
  const coreComplete = checks.filter((c) => c.required).every((c) => c.ok);

  return { percent, filled, total, coreComplete, completed, missing, gaps: missing };
}

export function computeSeekerProfileCompletenessFromProfile(
  source: SeekerProfileCompletenessSource,
): ProfileCompleteness {
  const s = source.seeker;
  return computeSeekerProfileCompleteness({
    avatarOk: source.avatarOk,
    avatarUrl: source.avatarUrl,
    fullName: s?.full_name,
    profileTitle: s?.profile_title,
    phone: s?.phone,
    location: s?.location,
    about: s?.about,
    skills: s?.skills ?? null,
    experienceLevel: s?.experience_level,
    preferredJobTypes: s?.preferred_job_types ?? null,
    preferredLocations: s?.preferred_locations ?? null,
    dateOfBirth: s?.date_of_birth,
    learningObligationStatus: s?.learning_obligation_status,
    hasBCategoryDriversLicense: s?.has_b_category_drivers_license,
    namedCertificateCount: source.namedCertificateCount,
  });
}

/** Persistable snapshot of the live model. Do not read these columns back for UI or gates. */
export function seekerProfileCompletenessPersistence(result: ProfileCompleteness): {
  is_complete: boolean;
  completion_percent: number;
} {
  return {
    is_complete: result.coreComplete,
    completion_percent: result.percent,
  };
}

export function emptySeekerProfileCompletenessPersistence() {
  return seekerProfileCompletenessPersistence(computeSeekerProfileCompleteness({}));
}

/**
 * Apply / onboarding eligibility. Certificates are optional and ignored.
 * `certRowsWithImage` is kept for call-site compatibility only.
 */
export function seekerCoreComplete(args: {
  avatarOk: boolean;
  seeker: SeekerCoreFields | null;
  certRowsWithImage?: number;
}): boolean {
  return computeSeekerProfileCompletenessFromProfile({
    avatarOk: args.avatarOk,
    seeker: args.seeker,
  }).coreComplete;
}

export function firstNameFromFullName(fullName: string | null | undefined): string {
  const first = (fullName ?? "").trim().split(/\s+/)[0] ?? "";
  return first;
}

export function namedCertificateCountFromRows(
  rows: Array<{ certificate_name?: string | null }> | null | undefined,
): number {
  return (rows ?? []).filter((c) => (c.certificate_name ?? "").toString().trim()).length;
}
