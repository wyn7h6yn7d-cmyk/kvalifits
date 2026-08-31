"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { EXPERIENCE_LEVEL_VALUES, parseCommaList } from "@/lib/matching/profileRules";
import { isSeekerAvatarFromStorageUpload } from "@/lib/seeker/seekerAvatarUpload";
import {
  buildCertificateObjectPath,
  CERTIFICATES_BUCKET,
  persistCertificateImageRef,
} from "@/lib/seeker/certificateStorage";
import {
  calculateAgeYears,
  isLearningObligationStatus,
  isLegalRepresentativeConsentStatus,
  normalizeSeekerEditableConsentStatus,
  needsLearningObligationStatus,
  type LearningObligationStatus,
  type LegalRepresentativeConsentStatus,
} from "@/lib/seeker/age";
import { MAX_CV_BYTES, prepareRasterImageForUpload } from "@/lib/uploads/prepareUploadFile";
import { consumeUploadRateLimit } from "@/lib/uploads/consumeUploadRateLimit";
import { persistCvStorageRef } from "@/lib/seeker/cvStorage";
import { removeCvStorageObject, uploadOwnCvPdf } from "@/lib/seeker/cvUpload";
import { reportStorageUploadFailure } from "@/lib/monitoring/report";
import { PrivateCvOpenLink } from "@/components/seeker/PrivateCvOpenLink";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaxonomyChipField } from "@/components/taxonomy/TaxonomyChipField";
import { TaxonomySelect } from "@/components/taxonomy/TaxonomySelect";
import { SeekerExperienceBackgroundFields } from "@/components/seeker/SeekerExperienceBackgroundFields";
import {
  experienceBackgroundFromDb,
  experienceBackgroundToDbPayload,
  type ExperienceBackgroundFormValue,
} from "@/lib/seeker/experienceBackground";
import { SeekerBirthDateFields } from "@/components/seeker/SeekerBirthDateFields";
import {
  SeekerWorkPreferencesFields,
  sanitizeWorkPreferencesForSave,
  workPreferencesFromDb,
  workPreferencesToDbPayload,
  type WorkPreferencesFormValue,
} from "@/components/seeker/SeekerWorkPreferencesFields";
import { SeekerWorkplaceNeedsFields } from "@/components/seeker/SeekerWorkplaceNeedsFields";
import { SeekerWorkCapacityFields } from "@/components/seeker/SeekerWorkCapacityFields";
import {
  workplaceNeedsFromDb,
  workplaceNeedsToDbPayload,
  type WorkplaceNeedsFormValue,
} from "@/lib/seeker/workplaceNeeds";
import {
  workCapacityFromDb,
  workCapacityToDbPayload,
  type WorkCapacityStatus,
} from "@/lib/seeker/workCapacity";
import { errorMessageFromUnknown, omitKeys } from "@/lib/utils";
import { isTaxonomyColumnError } from "@/lib/taxonomy/columnMissing";
import { findTerm, taxonomyLabel } from "@/lib/taxonomy/labels";
import { mergeLegacyText, partitionTaxonomyValues, suggestedSkillIds } from "@/lib/taxonomy/resolve";
import { useTaxonomyCatalog } from "@/lib/taxonomy/useTaxonomyCatalog";
import {
  certificateIdentityKey,
  formatCertificateExpiryWarning,
  parseCertificateVerificationStatus,
  type CertificateVerificationStatus,
} from "@/lib/seeker/certificateVerification";
import {
  CertificateStatusBlock,
  certificateViewLabelsFromT,
} from "@/components/seeker/CertificateVerificationBadge";
import { AccountPrivacySettings } from "@/components/account/AccountPrivacySettings";
import { SeekerCompletenessPanel } from "@/components/account/SeekerCompletenessPanel";
import {
  computeSeekerProfileCompleteness,
  namedCertificateCountFromRows,
  seekerProfileCompletenessPersistence,
} from "@/lib/seeker/profileCompleteness";
import { SeekerEducationSection } from "@/components/account/SeekerEducationSection";
import type { SeekerEducationRow } from "@/lib/seeker/education";

type Certificate = {
  id?: string;
  certificate_id?: string | null;
  certificate_name: string;
  certificate_number: string;
  certificate_issuer: string;
  certificate_valid_from: string;
  certificate_valid_until: string;
  certificate_image_url?: string | null;
  verification_status?: CertificateVerificationStatus;
  verified_at?: string | null;
  verification_source?: string | null;
  verified_by?: string | null;
};

type Props = {
  locale: string;
  /** `profile` hides certificates; `certificates` hides the rest of the form. */
  section?: "full" | "profile" | "certificates";
  initial: {
    userId: string;
    email: string;
    avatar_url: string | null;
    linkedin_url: string | null;
    seeker: {
      full_name: string | null;
      profile_title: string | null;
      phone: string | null;
      location: string | null;
      about: string | null;
      skills: string[] | null;
      skill_ids?: string[] | null;
      profession_id?: string | null;
      languages?: string[] | null;
      language_ids?: string[] | null;
      experience_level: string | null;
      preferred_job_types: string[] | null;
      preferred_locations: string[] | null;
      profile_visible?: boolean | null;
      salary_expectation?: string | null;
      work_authorization_notes?: string | null;
      cv_url?: string | null;
      has_b_category_drivers_license?: boolean | null;
      date_of_birth?: string | null;
      learning_obligation_status?: string | null;
      legal_representative_consent_status?: string | null;
      is_minor?: boolean | null;
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
      exp_seeking_first_job?: boolean | null;
      exp_is_student?: boolean | null;
      exp_has_internship?: boolean | null;
      exp_has_volunteer?: boolean | null;
      exp_has_project?: boolean | null;
      exp_has_prior_work?: boolean | null;
      experience_duration_years?: number | null;
    } | null;
    certificates: Certificate[];
    education: SeekerEducationRow[];
    workplaceNeeds: WorkplaceNeedsFormValue | null;
    workCapacity: WorkCapacityStatus | null;
  };
};

export function SeekerProfileForm({ locale, initial, section = "full" }: Props) {
  const showProfile = section !== "certificates";
  const showCertificates = section !== "profile";
  const t = useTranslations("onboarding");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email] = useState(initial.email);
  const [phone, setPhone] = useState(initial.seeker?.phone ?? "");
  const [location, setLocation] = useState(initial.seeker?.location ?? "");
  const [about, setAbout] = useState(initial.seeker?.about ?? "");
  const [profileTitle, setProfileTitle] = useState(initial.seeker?.profile_title ?? "");
  const [experienceLevel, setExperienceLevel] = useState<(typeof EXPERIENCE_LEVEL_VALUES)[number] | "">(() => {
    const v = initial.seeker?.experience_level ?? "";
    return (EXPERIENCE_LEVEL_VALUES as readonly string[]).includes(v) ? (v as (typeof EXPERIENCE_LEVEL_VALUES)[number]) : "";
  });
  const [skillsCsv, setSkillsCsv] = useState((initial.seeker?.skills ?? []).join(", "));
  const [professionId, setProfessionId] = useState(initial.seeker?.profession_id ?? "");
  const [skillIds, setSkillIds] = useState<string[]>(initial.seeker?.skill_ids ?? []);
  const [skillLeftover, setSkillLeftover] = useState<string[]>([]);
  const [languageIds, setLanguageIds] = useState<string[]>(initial.seeker?.language_ids ?? []);
  const [hydratedTaxonomy, setHydratedTaxonomy] = useState(false);
  const { catalog, available: taxonomyAvailable } = useTaxonomyCatalog();
  const [preferredJobTypesCsv, setPreferredJobTypesCsv] = useState(
    (initial.seeker?.preferred_job_types ?? []).join(", ")
  );
  const [preferredLocationsCsv, setPreferredLocationsCsv] = useState(
    (initial.seeker?.preferred_locations ?? []).join(", ")
  );
  const [profileVisible, setProfileVisible] = useState(Boolean(initial.seeker?.profile_visible));
  const [hasBCategoryDriversLicense, setHasBCategoryDriversLicense] = useState(
    Boolean(initial.seeker?.has_b_category_drivers_license)
  );
  const [linkedinUrl, setLinkedinUrl] = useState(initial.linkedin_url ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url ?? "");
  const [salaryExpectation, setSalaryExpectation] = useState(initial.seeker?.salary_expectation ?? "");
  const [workAuthNotes, setWorkAuthNotes] = useState(initial.seeker?.work_authorization_notes ?? "");
  const [cvUrl, setCvUrl] = useState(() => persistCvStorageRef(initial.seeker?.cv_url) ?? "");
  const [cvUploading, setCvUploading] = useState(false);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState(initial.seeker?.date_of_birth ?? "");
  const [learningObligationStatus, setLearningObligationStatus] = useState<LearningObligationStatus | "">(
    () => {
      const v = initial.seeker?.learning_obligation_status ?? "";
      return isLearningObligationStatus(v) ? v : "";
    }
  );
  const [legalRepresentativeConsentStatus, setLegalRepresentativeConsentStatus] = useState<
    LegalRepresentativeConsentStatus | ""
  >(() => {
    const v = initial.seeker?.legal_representative_consent_status ?? "";
    return isLegalRepresentativeConsentStatus(v) ? v : "";
  });
  const [workPreferences, setWorkPreferences] = useState<WorkPreferencesFormValue>(() =>
    workPreferencesFromDb(initial.seeker)
  );
  const [workplaceNeeds, setWorkplaceNeeds] = useState<WorkplaceNeedsFormValue>(() =>
    workplaceNeedsFromDb(initial.workplaceNeeds)
  );
  const [workCapacity, setWorkCapacity] = useState<WorkCapacityStatus>(() =>
    workCapacityFromDb(initial.workCapacity ? { status: initial.workCapacity } : null)
  );
  const [experienceBackground, setExperienceBackground] = useState<ExperienceBackgroundFormValue>(() =>
    experienceBackgroundFromDb(initial.seeker)
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  function getErrorMessage(err: unknown) {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    if (err && typeof err === "object" && "message" in err) {
      const m = (err as { message?: unknown }).message;
      return typeof m === "string" ? m : "";
    }
    if (err && typeof err === "object") {
      for (const key of ["error", "error_description", "msg", "hint", "details"]) {
        if (key in err) {
          const v = (err as Record<string, unknown>)[key];
          if (typeof v === "string" && v.trim()) return v;
        }
      }
      try {
        const s = JSON.stringify(err);
        return s === "{}" ? "" : s;
      } catch {
        // ignore
      }
    }
    return "";
  }

  const [certificates, setCertificates] = useState<Certificate[]>(
    initial.certificates.length
      ? initial.certificates.map((c) => ({
          ...c,
          certificate_image_url: (c as Certificate).certificate_image_url ?? "",
          verification_status: parseCertificateVerificationStatus(
            (c as Certificate).verification_status
          ),
          verified_at: (c as Certificate).verified_at ?? null,
          verification_source: (c as Certificate).verification_source ?? null,
          verified_by: (c as Certificate).verified_by ?? null,
        }))
      : []
  );

  const completeness = useMemo(
    () =>
      computeSeekerProfileCompleteness({
        avatarUrl,
        fullName: `${firstName} ${lastName}`.trim().replace(/\s+/g, " "),
        profileTitle,
        phone,
        location,
        about,
        skills: taxonomyAvailable
          ? mergeLegacyText(catalog, "skill", skillIds, skillLeftover, "et")
          : parseCommaList(skillsCsv),
        experienceLevel,
        preferredJobTypes: parseCommaList(preferredJobTypesCsv),
        preferredLocations: parseCommaList(preferredLocationsCsv),
        dateOfBirth,
        learningObligationStatus,
        hasBCategoryDriversLicense,
        namedCertificateCount: namedCertificateCountFromRows(certificates),
      }),
    [
      about,
      avatarUrl,
      catalog,
      certificates,
      dateOfBirth,
      experienceLevel,
      firstName,
      hasBCategoryDriversLicense,
      lastName,
      learningObligationStatus,
      location,
      phone,
      preferredJobTypesCsv,
      preferredLocationsCsv,
      profileTitle,
      skillIds,
      skillLeftover,
      skillsCsv,
      taxonomyAvailable,
    ],
  );

  useEffect(() => {
    if (!taxonomyAvailable || hydratedTaxonomy) return;
    const skills = partitionTaxonomyValues(
      catalog,
      "skill",
      initial.seeker?.skill_ids,
      initial.seeker?.skills,
    );
    const langs = partitionTaxonomyValues(
      catalog,
      "language",
      initial.seeker?.language_ids,
      initial.seeker?.languages,
    );
    setSkillIds(skills.ids);
    setSkillLeftover(skills.leftover);
    setLanguageIds(langs.ids);
    if (!professionId && initial.seeker?.profile_title) {
      const mapped = catalog.aliases.find(
        (a) =>
          a.kind === "profession" &&
          a.alias_norm === (initial.seeker?.profile_title ?? "").trim().toLowerCase(),
      );
      if (mapped) setProfessionId(mapped.term_id);
    }
    setCertificates((prev) =>
      prev.map((c) => {
        if (c.certificate_id) return c;
        const mapped = catalog.aliases.find(
          (a) => a.kind === "certificate" && a.alias_norm === (c.certificate_name ?? "").trim().toLowerCase(),
        );
        return mapped ? { ...c, certificate_id: mapped.term_id } : c;
      }),
    );
    setHydratedTaxonomy(true);
  }, [taxonomyAvailable, hydratedTaxonomy, catalog, initial.seeker, professionId]);

  useEffect(() => {
    const full = (initial.seeker?.full_name ?? "").trim();
    if (!full) return;
    const parts = full.split(/\s+/g);
    if (parts.length === 1) {
      setFirstName(parts[0] ?? "");
      return;
    }
    setFirstName(parts.slice(0, -1).join(" "));
    setLastName(parts[parts.length - 1] ?? "");
  }, [initial.seeker?.full_name]);

  useEffect(() => {
    const pt = (initial.seeker?.profile_title ?? "").trim();
    if (pt) setProfileTitle(pt);
  }, [initial.seeker?.profile_title]);

  useEffect(() => {
    setHasBCategoryDriversLicense(Boolean(initial.seeker?.has_b_category_drivers_license));
  }, [initial.seeker?.has_b_category_drivers_license]);

  useEffect(() => {
    setDateOfBirth(initial.seeker?.date_of_birth ?? "");
    const v = initial.seeker?.learning_obligation_status ?? "";
    setLearningObligationStatus(isLearningObligationStatus(v) ? v : "");
    const c = initial.seeker?.legal_representative_consent_status ?? "";
    setLegalRepresentativeConsentStatus(isLegalRepresentativeConsentStatus(c) ? c : "");
    setWorkPreferences(workPreferencesFromDb(initial.seeker));
    setWorkplaceNeeds(workplaceNeedsFromDb(initial.workplaceNeeds));
    setWorkCapacity(workCapacityFromDb(initial.workCapacity ? { status: initial.workCapacity } : null));
    setExperienceBackground(experienceBackgroundFromDb(initial.seeker));
  }, [
    initial.seeker?.date_of_birth,
    initial.seeker?.learning_obligation_status,
    initial.seeker?.legal_representative_consent_status,
    initial.seeker,
    initial.workplaceNeeds,
    initial.workCapacity,
  ]);

  async function onCertificateFileChange(idx: number, file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));
      if (file.type === "application/pdf" && file.size > MAX_CV_BYTES) {
        setError(t("cvFileTooLarge", { maxMb: Math.floor(MAX_CV_BYTES / 1024 / 1024) }));
        return;
      }
      const uploadFile = file.type.startsWith("image/")
        ? await prepareRasterImageForUpload(file, "certificate")
        : file;
      const ext = (uploadFile.name.split(".").pop() || "jpg").toLowerCase();
      // Private bucket — store object path only (never a permanent public URL).
      const path = buildCertificateObjectPath(user.id, idx, ext);
      await consumeUploadRateLimit("certificate");
      const { error: uploadErr } = await supabase.storage
        .from(CERTIFICATES_BUCKET)
        .upload(path, uploadFile, {
          upsert: true,
          contentType: uploadFile.type || undefined,
        });
      if (uploadErr) {
        reportStorageUploadFailure(uploadErr, "certificate");
        throw uploadErr;
      }
      setCertificates((prev) =>
        prev.map((x, i) => (i === idx ? { ...x, certificate_image_url: path } : x))
      );
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    }
  }

  async function onAvatarFileChange(file: File | null) {
    if (!file) return;
    setError(null);
    setAvatarUploading(true);
    try {
      const uploadFile = await prepareRasterImageForUpload(file, "avatar");
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(URL.createObjectURL(uploadFile));

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      const ext = (uploadFile.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, uploadFile, {
          upsert: true,
          contentType: uploadFile.type || undefined,
        });
      if (uploadErr) {
        reportStorageUploadFailure(uploadErr, "avatar");
        throw uploadErr;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setAvatarUploading(false);
    }
  }

  async function onCvFileChange(file: File | null) {
    if (!file) return;
    setError(null);
    setCvUploading(true);
    setCvFileName(file.name);
    try {
      if (file.size > MAX_CV_BYTES) {
        setError(t("cvFileTooLarge", { maxMb: Math.floor(MAX_CV_BYTES / 1024 / 1024) }));
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
      if (ext !== "pdf" && file.type !== "application/pdf") {
        throw new Error(t("unknownError"));
      }

      const path = await uploadOwnCvPdf({
        supabase,
        userId: user.id,
        file,
        previous: cvUrl,
      });
      setCvUrl(path);
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setCvUploading(false);
    }
  }

  async function onPasswordChange() {
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError(t("passwordChangeFillAll"));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(t("passwordChangeMismatch"));
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(t("passwordChangeTooShort"));
      return;
    }

    setPasswordLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) throw new Error(t("notAuthed"));

      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInErr) throw new Error(t("passwordChangeCurrentWrong"));

      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
      if (updateErr) throw updateErr;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setPasswordLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      if (avatarUploading) throw new Error(t("avatarUploadInProgress"));
      if (cvUploading) throw new Error(t("cvUploadInProgress"));
      if (section !== "certificates") {
        if (!isSeekerAvatarFromStorageUpload(avatarUrl)) throw new Error(t("avatarRequired"));
      }

      const fullName = `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");
      const title = profileTitle.trim();
      const skills = taxonomyAvailable
        ? mergeLegacyText(catalog, "skill", skillIds, skillLeftover, "et")
        : parseCommaList(skillsCsv);
      const preferredJobTypes = parseCommaList(preferredJobTypesCsv);
      const preferredLocations = parseCommaList(preferredLocationsCsv);

      if (section !== "certificates") {
        if (!firstName.trim()) throw new Error(t("errFirstNameRequired"));
        if (!lastName.trim()) throw new Error(t("errLastNameRequired"));
        if (!phone.trim()) throw new Error(t("errPhoneRequired"));
        if (!location.trim()) throw new Error(t("errLocationRequired"));
        if (!experienceLevel) throw new Error(t("errExperienceLevelRequired"));
        if (title.length < 3) throw new Error(t("errProfileTitleTooShort"));
        if (about.trim().length < 40) throw new Error(t("errAboutTooShort"));
        if (skills.length < 2) throw new Error(t("errSkillsTooFew"));
        if (preferredJobTypes.length < 1) throw new Error(t("errPreferredJobTypesRequired"));
        if (preferredLocations.length < 1) throw new Error(t("errPreferredLocationsRequired"));
      }

      const ageYears = calculateAgeYears(dateOfBirth);
      if (section !== "certificates") {
        if (ageYears === null) throw new Error(t("errDateOfBirthRequired"));
        if (needsLearningObligationStatus(ageYears) && !isLearningObligationStatus(learningObligationStatus)) {
          throw new Error(t("errLearningObligationRequired"));
        }
      }
      const learningStatus = needsLearningObligationStatus(ageYears)
        ? learningObligationStatus
        : "";
      const isMinor = ageYears !== null && ageYears < 18;
      const consentStatus = normalizeSeekerEditableConsentStatus(
        legalRepresentativeConsentStatus || "required",
        isMinor
      );
      // Never send confirmed from the client unless already confirmed (workflow); coerce self-serve to pending/required.
      const consentToSave =
        consentStatus === "confirmed" &&
        initial.seeker?.legal_representative_consent_status === "confirmed"
          ? "confirmed"
          : isMinor
            ? consentStatus === "pending"
              ? "pending"
              : "required"
            : null;

      const sanitizedPrefs = sanitizeWorkPreferencesForSave(
        workPreferences,
        dateOfBirth,
        learningObligationStatus
      );

      // Certificates are optional. If provided, only persist reasonably complete rows.
      const validCerts = certificates
        .map((c) => ({
          ...c,
            certificate_name: c.certificate_name.trim(),
            certificate_id: c.certificate_id ?? null,
          certificate_number: c.certificate_number.trim(),
          certificate_issuer: c.certificate_issuer.trim(),
          certificate_image_url: persistCertificateImageRef(c.certificate_image_url) ?? "",
        }))
        .filter((c) => c.certificate_name && c.certificate_issuer);
      const completeness = computeSeekerProfileCompleteness({
        avatarOk: isSeekerAvatarFromStorageUpload(avatarUrl),
        fullName,
        profileTitle: title,
        phone,
        location,
        about,
        skills,
        experienceLevel,
        preferredJobTypes,
        preferredLocations,
        dateOfBirth,
        learningObligationStatus: isLearningObligationStatus(learningStatus) ? learningStatus : null,
        hasBCategoryDriversLicense,
        namedCertificateCount: validCerts.length,
      });

      const { error: metaErr } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl, linkedin_url: linkedinUrl || null },
      });
      if (metaErr) throw metaErr;

      const languages = taxonomyAvailable
        ? mergeLegacyText(catalog, "language", languageIds, [], "et")
        : undefined;
      const seekerPayload = {
        user_id: user.id,
        full_name: fullName,
        profile_title: title,
        phone,
        location,
        about,
        skills,
        experience_level: experienceLevel,
        preferred_job_types: preferredJobTypes,
        preferred_locations: preferredLocations,
        salary_expectation: salaryExpectation.trim() || null,
        work_authorization_notes: workAuthNotes.trim() || null,
        cv_url: persistCvStorageRef(cvUrl),
        date_of_birth: dateOfBirth,
        learning_obligation_status: isLearningObligationStatus(learningStatus) ? learningStatus : null,
        legal_representative_consent_status: consentToSave,
        ...workPreferencesToDbPayload(sanitizedPrefs),
        ...experienceBackgroundToDbPayload(experienceBackground),
        ...seekerProfileCompletenessPersistence(completeness),
        profile_visible: profileVisible,
        has_b_category_drivers_license: hasBCategoryDriversLicense,
        profession_id: taxonomyAvailable ? professionId || null : undefined,
        skill_ids: taxonomyAvailable ? skillIds : undefined,
        language_ids: taxonomyAvailable ? languageIds : undefined,
        languages,
      };
      let { error: seekerErr } = await supabase.from("seeker_profiles").upsert(seekerPayload);
      if (seekerErr && isTaxonomyColumnError(seekerErr.message)) {
        const retry = await supabase.from("seeker_profiles").upsert(
          omitKeys(seekerPayload, ["profession_id", "skill_ids", "language_ids", "languages"]),
        );
        seekerErr = retry.error;
      }
      if (seekerErr) throw seekerErr;

      const { error: needsErr } = await supabase.from("seeker_workplace_needs").upsert({
        user_id: user.id,
        ...workplaceNeedsToDbPayload(workplaceNeeds),
      });
      if (needsErr) throw needsErr;

      const { error: capacityErr } = await supabase.from("seeker_work_capacity").upsert({
        user_id: user.id,
        ...workCapacityToDbPayload(workCapacity),
      });
      if (capacityErr) throw capacityErr;

      // MVP sync: replace user's certificate set, preserving verification for same name+issuer.
      let existingCerts: unknown[] | null = null;
      {
        const existingRes = await supabase
          .from("seeker_certificates")
          .select(
            "certificate_name,certificate_issuer,verification_status,verified_at,verification_source,verified_by"
          )
          .eq("user_id", user.id);
        if (existingRes.error && /verification_|column/i.test(existingRes.error.message ?? "")) {
          const fallback = await supabase
            .from("seeker_certificates")
            .select("certificate_name,certificate_issuer")
            .eq("user_id", user.id);
          existingCerts = fallback.data;
        } else if (existingRes.error) {
          throw existingRes.error;
        } else {
          existingCerts = existingRes.data;
        }
      }

      const verificationByKey = new Map<
        string,
        {
          verification_status: CertificateVerificationStatus;
          verified_at: string | null;
          verification_source: string | null;
          verified_by: string | null;
        }
      >();
      for (const row of existingCerts ?? []) {
        const name = (row as { certificate_name?: string | null }).certificate_name ?? "";
        const issuer = (row as { certificate_issuer?: string | null }).certificate_issuer ?? "";
        if (!name.trim() || !issuer.trim()) continue;
        verificationByKey.set(certificateIdentityKey(name, issuer), {
          verification_status: parseCertificateVerificationStatus(
            (row as { verification_status?: unknown }).verification_status
          ),
          verified_at: ((row as { verified_at?: string | null }).verified_at ?? null) as string | null,
          verification_source: ((row as { verification_source?: string | null }).verification_source ??
            null) as string | null,
          verified_by: ((row as { verified_by?: string | null }).verified_by ?? null) as string | null,
        });
      }

      const { error: delErr } = await supabase.from("seeker_certificates").delete().eq("user_id", user.id);
      if (delErr) throw delErr;

      if (validCerts.length) {
        const rows = validCerts.map((c) => {
          const prev = verificationByKey.get(
            certificateIdentityKey(c.certificate_name, c.certificate_issuer)
          );
          const status = prev?.verification_status ?? "submitted";
          return {
            user_id: user.id,
            certificate_id: c.certificate_id || null,
            certificate_name: c.certificate_name,
            certificate_number: c.certificate_number || null,
            certificate_issuer: c.certificate_issuer,
            certificate_valid_from: c.certificate_valid_from || null,
            certificate_valid_until: c.certificate_valid_until || null,
            certificate_image_url: persistCertificateImageRef(c.certificate_image_url),
            verification_status: status,
            verified_at: status === "verified" ? prev?.verified_at ?? null : null,
            verification_source: status === "verified" ? prev?.verification_source ?? null : null,
            verified_by: status === "verified" ? prev?.verified_by ?? null : null,
          };
        });
        let { error: insErr } = await supabase.from("seeker_certificates").insert(rows);
        if (insErr && /verification_|column/i.test(insErr.message ?? "")) {
          const legacyRows = rows.map((row) =>
            omitKeys(row, [
              "verification_status",
              "verified_at",
              "verification_source",
              "verified_by",
              "certificate_id",
            ]),
          );
          const retry = await supabase.from("seeker_certificates").insert(legacyRows);
          insErr = retry.error;
          if (insErr) {
            throw new Error(`${insErr.message}\n\n${t("certificateVerificationFixHint")}`);
          }
        } else if (insErr) {
          throw insErr;
        }
      }

      router.push(`/${locale}/tood`);
      router.refresh();
    } catch (err) {
      const message = getErrorMessage(err);
      const lower = message.toLowerCase();
      if (
        lower.includes("row level security") ||
        lower.includes("row-level security") ||
        lower.includes("new row violates") ||
        lower.includes("permission denied")
      ) {
        setError(t("rlsError"));
      } else {
        let shown = message || t("unknownError");
        const l = shown.toLowerCase();
        if (
          (l.includes("seeker_profiles") &&
            (l.includes("schema cache") || l.includes("could not find"))) ||
          l.includes("salary_expectation") ||
          l.includes("work_authorization_notes") ||
          l.includes("has_b_category_drivers_license") ||
          l.includes("date_of_birth") ||
          l.includes("learning_obligation_status") ||
          l.includes("legal_representative_consent_status") ||
          l.includes("pref_full_time") ||
          l.includes("pref_desired_weekly_hours") ||
          l.includes("seeker_workplace_needs") ||
          l.includes("seeker_work_capacity") ||
          l.includes("exp_seeking_first_job") ||
          l.includes("experience_duration_years") ||
          l.includes("shared_with_employer") ||
          l.includes("is_minor") ||
          l.includes("verification_status") ||
          l.includes("verified_at") ||
          l.includes("verification_source") ||
          l.includes("verified_by")
        ) {
          shown = `${shown}\n\n${t("seekerProfileStructuredColumnsFixHint")}\n\n${t("certificateVerificationFixHint")}`;
        }
        setError(shown);
      }
      queueMicrotask(() => {
        statusRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-6">
      <div ref={statusRef} className="scroll-mt-24 space-y-3" aria-live="polite">
        {error ? (
          <div className="whitespace-pre-line rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-sm text-muted">
            {error}
          </div>
        ) : null}
      </div>

      <SeekerCompletenessPanel completeness={completeness} />

      {showProfile ? (
      <>
      <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground/80">{t("visibilityTitle")}</div>
            <div className="mt-1 text-sm leading-relaxed text-muted">{t("visibilityHint")}</div>
          </div>
          <label className="inline-flex shrink-0 cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={profileVisible}
              onChange={(e) => setProfileVisible(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong bg-[#f8fafc]"
            />
            <span className="text-sm font-medium text-muted">
              {profileVisible ? t("visibilityOn") : t("visibilityOff")}
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("avatar")}</label>
        <div className="text-xs leading-relaxed text-muted-2">{t("avatarFileOnlyHint")}</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-muted-2">{t("avatarUpload")}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => void onAvatarFileChange(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-[#f8fafc] file:px-3 file:py-2 file:text-xs file:font-medium file:text-foreground/80 hover:file:bg-[#f8fafc] sm:w-auto"
            required={!isSeekerAvatarFromStorageUpload(avatarUrl)}
          />
        </div>
        {avatarUploading ? (
          <div className="space-y-2">
            <div className="text-xs text-muted-2">{t("avatarUploading")}</div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#f8fafc]">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-primary/70" />
            </div>
          </div>
        ) : null}
        {avatarUrl ? (
          <div className="flex items-center gap-3 pt-1">
            <div className="h-12 w-12 overflow-hidden rounded-2xl border border-border bg-[#f8fafc]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarPreviewUrl ?? avatarUrl} alt={t("avatar")} className="h-full w-full object-cover" />
            </div>
            <div className="text-xs text-muted-2">{t("avatarReady")}</div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("linkedinUrl")}</label>
        <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder={t("linkedinUrlHint")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("firstName")}</label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("lastName")}</label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("email")}</label>
          <Input value={email} readOnly aria-readonly="true" />
        </div>
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("phone")}</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("location")}</label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("profileTitle")}</label>
          <Input
            value={profileTitle}
            onChange={(e) => setProfileTitle(e.target.value)}
            required
            placeholder={t("profileTitleHint")}
          />
          <div className="text-xs text-muted-2">{t("profileTitleHelp")}</div>
        </div>
        {taxonomyAvailable ? (
          <div className="space-y-2 sm:col-span-2">
            <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("profession")}</label>
            <TaxonomySelect
              value={professionId}
              terms={catalog.professions}
              locale={locale}
              placeholder={t("taxonomyPlaceholder")}
              onChange={setProfessionId}
            />
            <div className="text-xs text-muted-2">{t("professionHint")}</div>
          </div>
        ) : null}
      </div>

      <SeekerBirthDateFields
        dateOfBirth={dateOfBirth}
        learningObligationStatus={learningObligationStatus}
        legalRepresentativeConsentStatus={legalRepresentativeConsentStatus}
        onDateOfBirthChange={setDateOfBirth}
        onLearningObligationChange={setLearningObligationStatus}
        onLegalRepresentativeConsentChange={setLegalRepresentativeConsentStatus}
      />

      <div className="space-y-2">
        <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("about")}</label>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          required
          rows={4}
          placeholder={t("aboutHint")}
          className="w-full rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-sm text-foreground/80 placeholder:text-muted-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-colors focus:border-[rgba(37,99,235,0.35)] focus:bg-[#f8fafc]"
        />
        <div className="text-xs text-muted-2">{t("aboutHelp")}</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("experienceLevel")}</label>
          <select
            value={experienceLevel}
            onChange={(e) =>
              setExperienceLevel(e.target.value as (typeof EXPERIENCE_LEVEL_VALUES)[number] | "")
            }
            required
            className="h-11 w-full rounded-2xl border border-border bg-[#f8fafc] px-4 text-sm text-foreground/80 outline-none transition-colors focus:border-[rgba(37,99,235,0.35)] focus:bg-[#f8fafc]"
          >
            <option value="">{t("experienceLevelPlaceholder")}</option>
            {EXPERIENCE_LEVEL_VALUES.map((v) => (
              <option key={v} value={v}>
                {t(`experienceLevelOption.${v}`)}
              </option>
            ))}
          </select>
          <div className="text-xs text-muted-2">{t("experienceLevelHint")}</div>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("skills")}</label>
          {taxonomyAvailable ? (
            <>
              <TaxonomyChipField
                terms={catalog.skills}
                selectedIds={skillIds}
                leftover={skillLeftover}
                onChangeIds={setSkillIds}
                onChangeLeftover={setSkillLeftover}
                locale={locale}
                suggestedIds={suggestedSkillIds(catalog, professionId)}
              />
              <div className="text-xs text-muted-2">{t("skillsHelp")}</div>
            </>
          ) : (
            <>
              <Input value={skillsCsv} onChange={(e) => setSkillsCsv(e.target.value)} required placeholder={t("csvHint")} />
              <div className="text-xs text-muted-2">{t("skillsHelp")}</div>
            </>
          )}
        </div>
        {taxonomyAvailable ? (
          <div className="space-y-2 sm:col-span-2">
            <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("languages")}</label>
            <TaxonomyChipField
              terms={catalog.languages}
              selectedIds={languageIds}
              leftover={[]}
              onChangeIds={setLanguageIds}
              onChangeLeftover={() => undefined}
              locale={locale}
            />
            <div className="text-xs text-muted-2">{t("languagesHint")}</div>
          </div>
        ) : null}
        <SeekerExperienceBackgroundFields value={experienceBackground} onChange={setExperienceBackground} />
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("preferredJobTypes")}</label>
          <Input value={preferredJobTypesCsv} onChange={(e) => setPreferredJobTypesCsv(e.target.value)} required placeholder={t("csvHint")} />
          <div className="text-xs text-muted-2">{t("preferredJobTypesHelp")}</div>
        </div>
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("preferredLocations")}</label>
          <Input value={preferredLocationsCsv} onChange={(e) => setPreferredLocationsCsv(e.target.value)} required placeholder={t("csvHint")} />
          <div className="text-xs text-muted-2">{t("preferredLocationsHelp")}</div>
        </div>
      </div>

      <SeekerEducationSection seekerUserId={initial.userId} initialRows={initial.education ?? []} />

      <SeekerWorkPreferencesFields
        value={workPreferences}
        onChange={setWorkPreferences}
        dateOfBirth={dateOfBirth}
        learningObligationStatus={learningObligationStatus}
      />

      <SeekerWorkCapacityFields value={workCapacity} onChange={setWorkCapacity} />

      <SeekerWorkplaceNeedsFields value={workplaceNeeds} onChange={setWorkplaceNeeds} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("salaryExpectation")}</label>
          <Input
            value={salaryExpectation}
            onChange={(e) => setSalaryExpectation(e.target.value)}
            placeholder={t("salaryExpectationHint")}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("cvUrl")}</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => void onCvFileChange(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-[#f8fafc] file:px-3 file:py-2 file:text-xs file:font-medium file:text-foreground/80 hover:file:bg-[#f8fafc] sm:w-auto"
          />
          <div className="text-xs text-muted-2">{t("cvUrlHint")}</div>
          {cvUploading ? <div className="text-xs text-muted-2">{t("cvUploading")}</div> : null}
          {!cvUploading && cvUrl ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-2">
              {cvFileName ? <span>{cvFileName}</span> : null}
              <PrivateCvOpenLink
                cvRef={cvUrl}
                errorLabel={t("cvOpenFailed")}
                className="underline hover:text-foreground disabled:opacity-60"
              >
                {t("cvOpen")}
              </PrivateCvOpenLink>
              <button
                type="button"
                className="underline hover:text-foreground"
                onClick={() => {
                  void (async () => {
                    await removeCvStorageObject(supabase, cvUrl);
                    setCvUrl("");
                    setCvFileName(null);
                  })();
                }}
              >
                {t("cvRemove")}
              </button>
            </div>
          ) : null}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("workAuthorization")}</label>
          <textarea
            value={workAuthNotes}
            onChange={(e) => setWorkAuthNotes(e.target.value)}
            rows={2}
            placeholder={t("workAuthorizationHint")}
            className="w-full rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-sm text-foreground/80 placeholder:text-muted-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-colors focus:border-[rgba(37,99,235,0.35)] focus:bg-[#f8fafc]"
          />
        </div>
      </div>
      </>
      ) : null}

      {showCertificates ? (
      <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-foreground/80">{t("certificateSection")}</div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl px-3 text-[13px]"
            onClick={() =>
              setCertificates((prev) => [
                ...prev,
                {
                  certificate_id: "",
                  certificate_name: "",
                  certificate_number: "",
                  certificate_issuer: "",
                  certificate_valid_from: "",
                  certificate_valid_until: "",
                  certificate_image_url: "",
                  verification_status: "submitted",
                  verified_at: null,
                  verification_source: null,
                  verified_by: null,
                },
              ])
            }
          >
            {t("addCertificate")}
          </Button>
        </div>
        <div className="mt-2 text-xs leading-relaxed text-muted-2">{t("certificateSectionHelp")}</div>

        <div className="mt-4 rounded-2xl border border-border bg-white p-4">
          <label className="flex cursor-pointer select-none items-start gap-3">
            <input
              type="checkbox"
              checked={hasBCategoryDriversLicense}
              onChange={(e) => setHasBCategoryDriversLicense(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-strong bg-[#f8fafc]"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-foreground/80">{t("bCategoryDriversLicense")}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-2">{t("bCategoryDriversLicenseHint")}</span>
            </span>
          </label>
        </div>

        <div className="mt-4 space-y-6">
          {certificates.map((c, idx) => {
            const fields = {
              verification_status: parseCertificateVerificationStatus(c.verification_status),
              verified_at: c.verified_at ?? null,
              verification_source: c.verification_source ?? null,
              certificate_valid_until: c.certificate_valid_until || null,
              certificate_issuer: c.certificate_issuer || null,
            };
            const warningLine = formatCertificateExpiryWarning(c.certificate_valid_until || null, {
              expiresToday: t("certificateExpiresToday"),
              expiresInDays: (days) => t("certificateExpiresInDays", { days }),
            });
            return (
            <div key={idx} className="rounded-2xl border border-border bg-white p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1.5">
                  <div className="text-[0.9375rem] font-medium leading-snug text-foreground-2">
                    {t("certificate")} #{idx + 1}
                  </div>
                  <CertificateStatusBlock
                    name={(c.certificate_name ?? "").trim() || null}
                    fields={fields}
                    labels={certificateViewLabelsFromT((key, values) => t(key, values))}
                    locale={locale}
                    warningLine={warningLine}
                  />
                </div>
                {certificates.length > 1 ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-2 hover:text-foreground"
                    onClick={() => setCertificates((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    {t("remove")}
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("certificateName")}</label>
                  {taxonomyAvailable ? (
                    <TaxonomySelect
                      value={c.certificate_id ?? ""}
                      terms={catalog.certificates}
                      locale={locale}
                      placeholder={t("taxonomyPlaceholder")}
                      onChange={(id) =>
                        setCertificates((prev) =>
                          prev.map((x, i) => {
                            if (i !== idx) return x;
                            const term = findTerm(catalog, "certificate", id);
                            return {
                              ...x,
                              certificate_id: id || null,
                              certificate_name: term ? taxonomyLabel(term, "et") : x.certificate_name,
                            };
                          }),
                        )
                      }
                    />
                  ) : (
                    <Input value={c.certificate_name} onChange={(e) => setCertificates((prev) => prev.map((x, i) => (i === idx ? { ...x, certificate_name: e.target.value } : x)))} />
                  )}
                  {taxonomyAvailable && !(c.certificate_id ?? "") ? (
                    <Input
                      value={c.certificate_name}
                      onChange={(e) =>
                        setCertificates((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, certificate_name: e.target.value, certificate_id: null } : x)),
                        )
                      }
                      placeholder={t("certificateName")}
                    />
                  ) : null}
                </div>
                <div className="space-y-2">
                  <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("certificateNumber")}</label>
                  <Input value={c.certificate_number} onChange={(e) => setCertificates((prev) => prev.map((x, i) => (i === idx ? { ...x, certificate_number: e.target.value } : x)))} />
                  <div className="text-xs text-muted-2">{t("certificateNumberOptionalHint")}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("certificateIssuer")}</label>
                  <Input value={c.certificate_issuer} onChange={(e) => setCertificates((prev) => prev.map((x, i) => (i === idx ? { ...x, certificate_issuer: e.target.value } : x)))} />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("certificateValidFrom")}</label>
                  <Input type="date" value={c.certificate_valid_from} onChange={(e) => setCertificates((prev) => prev.map((x, i) => (i === idx ? { ...x, certificate_valid_from: e.target.value } : x)))} />
                </div>
                <div className="space-y-2">
                  <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("certificateValidUntil")}</label>
                  <Input type="date" value={c.certificate_valid_until} onChange={(e) => setCertificates((prev) => prev.map((x, i) => (i === idx ? { ...x, certificate_valid_until: e.target.value } : x)))} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("certificateImage")}</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => void onCertificateFileChange(idx, e.target.files?.[0] ?? null)}
                    className="block w-full text-xs text-muted file:mr-3 file:rounded-xl file:border-0 file:bg-[#f8fafc] file:px-3 file:py-2 file:text-xs file:font-medium file:text-foreground/80 hover:file:bg-[#f8fafc] sm:w-auto"
                  />
                  <div className="text-xs text-muted-2">{t("certificateImageUploadHint")}</div>
                  {(c.certificate_image_url ?? "").toString().trim() ? (
                    <div className="text-xs text-emerald-200/80">{t("certificateImageReady")}</div>
                  ) : null}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={avatarUploading || cvUploading}
        loading={loading}
        loadingText={t("saving")}
      >
        {t("saveAndContinue")}
      </Button>

      {showProfile ? (
      <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 sm:p-6">
        <div className="text-sm font-medium text-foreground/80">{t("accountTitle")}</div>
        <div className="mt-1 text-sm leading-relaxed text-muted">{t("accountHint")}</div>

        <div className="mt-5 rounded-2xl border border-border bg-white p-4">
          <div className="text-sm font-medium text-foreground/80">{t("passwordChangeTitle")}</div>
          <div className="mt-1 text-xs leading-relaxed text-muted-2">{t("passwordChangeHint")}</div>

          {passwordSuccess ? (
            <div className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] px-3 py-2 text-xs text-emerald-800/95">
              {t("passwordChangedSuccess")}
            </div>
          ) : null}
          {passwordError ? (
            <div className="mt-3 rounded-xl border border-border bg-[#f8fafc] px-3 py-2 text-xs text-muted">
              {passwordError}
            </div>
          ) : null}

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={t("currentPassword")}
            />
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("newPassword")}
            />
            <Input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder={t("confirmNewPassword")}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 h-9 rounded-xl px-3 text-[13px]"
            onClick={() => void onPasswordChange()}
            loading={passwordLoading}
            loadingText={t("changingPassword")}
          >
            {t("changePasswordCta")}
          </Button>
        </div>

        <AccountPrivacySettings locale={locale} className="mt-4" />
      </div>
      ) : null}
    </form>
  );
}

