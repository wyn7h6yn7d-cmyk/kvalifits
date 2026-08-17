import {
  calculateAgeYears,
  isLearningObligationStatus,
  needsLearningObligationStatus,
} from "@/lib/seeker/age";
import { isExperienceLevel } from "@/lib/matching/profileRules";
import { isSeekerAvatarFromStorageUpload } from "@/lib/seeker/seekerAvatarUpload";

const MIN_ABOUT = 40;
const MIN_PROFILE_TITLE = 3;
const MIN_SKILLS = 2;

export type ProfileGapKey =
  | "avatar"
  | "name"
  | "title"
  | "phone"
  | "location"
  | "about"
  | "skills"
  | "experience"
  | "jobTypes"
  | "locations"
  | "dob"
  | "certificate";

export type SeekerCompletenessInput = {
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

export type ProfileCompleteness = {
  percent: number;
  filled: number;
  total: number;
  gaps: ProfileGapKey[];
};

function hasList(v: string[] | null | undefined, min: number) {
  return (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []).length >= min;
}

/**
 * Task-oriented completeness: core matching fields plus one certificate signal.
 * Certificates are optional for “core complete”, but missing them is a useful next action.
 */
export function computeSeekerProfileCompleteness(input: SeekerCompletenessInput): ProfileCompleteness {
  const dob = (input.dateOfBirth ?? "").trim();
  const ageYears = calculateAgeYears(dob);
  const dobOk =
    ageYears !== null &&
    (!needsLearningObligationStatus(ageYears) || isLearningObligationStatus(input.learningObligationStatus));
  const hasCertificate =
    (input.namedCertificateCount ?? 0) > 0 || input.hasBCategoryDriversLicense === true;

  const checks: { key: ProfileGapKey; ok: boolean }[] = [
    { key: "avatar", ok: isSeekerAvatarFromStorageUpload(input.avatarUrl) },
    { key: "name", ok: Boolean((input.fullName ?? "").trim()) },
    { key: "title", ok: (input.profileTitle ?? "").trim().length >= MIN_PROFILE_TITLE },
    { key: "phone", ok: Boolean((input.phone ?? "").trim()) },
    { key: "location", ok: Boolean((input.location ?? "").trim()) },
    { key: "about", ok: (input.about ?? "").trim().length >= MIN_ABOUT },
    { key: "skills", ok: hasList(input.skills, MIN_SKILLS) },
    { key: "experience", ok: isExperienceLevel(input.experienceLevel) },
    { key: "jobTypes", ok: hasList(input.preferredJobTypes, 1) },
    { key: "locations", ok: hasList(input.preferredLocations, 1) },
    { key: "dob", ok: dobOk },
    { key: "certificate", ok: hasCertificate },
  ];

  const filled = checks.filter((c) => c.ok).length;
  const total = checks.length;
  const percent = total === 0 ? 0 : Math.round((filled / total) * 100);
  const gaps = checks.filter((c) => !c.ok).map((c) => c.key);

  return { percent, filled, total, gaps };
}

export function firstNameFromFullName(fullName: string | null | undefined): string {
  const first = (fullName ?? "").trim().split(/\s+/)[0] ?? "";
  return first;
}
