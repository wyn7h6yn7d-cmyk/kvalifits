"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import {
  CertificateStatusBlock,
  certificateViewLabelsFromT,
} from "@/components/seeker/CertificateVerificationBadge";
import { SeekerExperienceBackgroundFields } from "@/components/seeker/SeekerExperienceBackgroundFields";
import {
  emptyExperienceBackgroundFormValue,
  experienceBackgroundToDbPayload,
  type ExperienceBackgroundFormValue,
} from "@/lib/seeker/experienceBackground";
import { SeekerBirthDateFields } from "@/components/seeker/SeekerBirthDateFields";
import {
  SeekerWorkPreferencesFields,
  emptyWorkPreferencesFormValue,
  sanitizeWorkPreferencesForSave,
  workPreferencesToDbPayload,
  type WorkPreferencesFormValue,
} from "@/components/seeker/SeekerWorkPreferencesFields";
import { SeekerWorkplaceNeedsFields } from "@/components/seeker/SeekerWorkplaceNeedsFields";
import { SeekerWorkCapacityFields } from "@/components/seeker/SeekerWorkCapacityFields";
import {
  emptyWorkplaceNeedsFormValue,
  workplaceNeedsToDbPayload,
  type WorkplaceNeedsFormValue,
} from "@/lib/seeker/workplaceNeeds";
import {
  workCapacityToDbPayload,
  type WorkCapacityStatus,
} from "@/lib/seeker/workCapacity";
import { isTaxonomyColumnError } from "@/lib/taxonomy/columnMissing";
import { mergeLegacyText, suggestedSkillIds } from "@/lib/taxonomy/resolve";
import { useTaxonomyCatalog } from "@/lib/taxonomy/useTaxonomyCatalog";
import { omitKeys } from "@/lib/utils";
import { SeekerCompletenessPanel } from "@/components/account/SeekerCompletenessPanel";
import {
  computeSeekerProfileCompleteness,
  namedCertificateCountFromRows,
  seekerProfileCompletenessPersistence,
} from "@/lib/seeker/profileCompleteness";

type Props = {
  locale: string;
};

export function SeekerOnboardingForm({ locale }: Props) {
  const t = useTranslations("onboarding");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [profileTitle, setProfileTitle] = useState("");
  const [about, setAbout] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<(typeof EXPERIENCE_LEVEL_VALUES)[number] | "">("");
  const [skillsCsv, setSkillsCsv] = useState("");
  const [professionId, setProfessionId] = useState("");
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [skillLeftover, setSkillLeftover] = useState<string[]>([]);
  const [languageIds, setLanguageIds] = useState<string[]>([]);
  const { catalog, available: taxonomyAvailable } = useTaxonomyCatalog();
  const [preferredJobTypesCsv, setPreferredJobTypesCsv] = useState("");
  const [preferredLocationsCsv, setPreferredLocationsCsv] = useState("");
  const [salaryExpectation, setSalaryExpectation] = useState("");
  const [workAuthNotes, setWorkAuthNotes] = useState("");
  const [cvUrl, setCvUrl] = useState("");
  const [cvUploading, setCvUploading] = useState(false);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [learningObligationStatus, setLearningObligationStatus] = useState<LearningObligationStatus | "">("");
  const [legalRepresentativeConsentStatus, setLegalRepresentativeConsentStatus] = useState<
    LegalRepresentativeConsentStatus | ""
  >("");
  const [workPreferences, setWorkPreferences] = useState<WorkPreferencesFormValue>(() =>
    emptyWorkPreferencesFormValue()
  );
  const [workplaceNeeds, setWorkplaceNeeds] = useState<WorkplaceNeedsFormValue>(() =>
    emptyWorkplaceNeedsFormValue()
  );
  const [workCapacity, setWorkCapacity] = useState<WorkCapacityStatus>("prefer_not_to_say");
  const [experienceBackground, setExperienceBackground] = useState<ExperienceBackgroundFormValue>(() =>
    emptyExperienceBackgroundFormValue()
  );

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [hasBCategoryDriversLicense, setHasBCategoryDriversLicense] = useState(false);

  function getErrorMessage(err: unknown) {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    if (err && typeof err === "object" && "message" in err) {
      const m = (err as { message?: unknown }).message;
      return typeof m === "string" ? m : "";
    }
    if (err && typeof err === "object") {
      // Supabase errors sometimes come back as plain objects
      for (const key of ["error", "error_description", "msg", "hint"]) {
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

  // Prefill readonly email (nice UX)
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (mounted) setEmail(user?.email ?? "");
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const [certificates, setCertificates] = useState<
    Array<{
      certificate_name: string;
      certificate_number: string;
      certificate_issuer: string;
      certificate_valid_from: string;
      certificate_valid_until: string;
      certificate_image_url: string;
    }>
  >([]);

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

  async function onCertificateFileChange(idx: number, file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
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
      const message = getErrorMessage(err);
      setError(message || t("unknownError"));
    }
  }

  async function onAvatarFileChange(file: File | null) {
    if (!file) return;
    setError(null);
    setAvatarUploadError(null);
    setAvatarUploading(true);
    try {
      const uploadFile = await prepareRasterImageForUpload(file, "avatar");
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(URL.createObjectURL(uploadFile));

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      setEmail(user.email ?? "");

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
      const publicUrl = data.publicUrl;
      setAvatarUrl(publicUrl);
    } catch (err) {
      const message = getErrorMessage(err);
      const lower = message.toLowerCase();
      if (
        lower.includes("row level security") ||
        lower.includes("row-level security") ||
        lower.includes("new row violates") ||
        lower.includes("permission denied")
      ) {
        const msg = t("rlsError");
        setAvatarUploadError(msg);
        setError(msg);
      } else {
        const msg = message || t("unknownError");
        setAvatarUploadError(msg);
        setError(msg);
      }
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
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
      if (ext !== "pdf" && file.type !== "application/pdf") throw new Error(t("unknownError"));

      const path = await uploadOwnCvPdf({
        supabase,
        userId: user.id,
        file,
        previous: cvUrl,
      });
      setCvUrl(path);
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message || t("unknownError"));
    } finally {
      setCvUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      if (avatarUploading) {
        throw new Error(t("avatarUploadInProgress"));
      }
      if (cvUploading) {
        throw new Error(t("cvUploadInProgress"));
      }
      if (!isSeekerAvatarFromStorageUpload(avatarUrl)) {
        if (avatarUploadError) throw new Error(avatarUploadError);
        throw new Error(t("avatarRequired"));
      }

      const { error: avatarErr } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl, linkedin_url: linkedinUrl || null },
      });
      if (avatarErr) throw avatarErr;

      const skills = taxonomyAvailable
        ? mergeLegacyText(catalog, "skill", skillIds, skillLeftover, "et")
        : parseCommaList(skillsCsv);
      const preferredJobTypes = parseCommaList(preferredJobTypesCsv);
      const preferredLocations = parseCommaList(preferredLocationsCsv);
      const fullName = `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");
      const title = profileTitle.trim();

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

      const ageYears = calculateAgeYears(dateOfBirth);
      if (ageYears === null) throw new Error(t("errDateOfBirthRequired"));
      const learningStatus = needsLearningObligationStatus(ageYears)
        ? learningObligationStatus
        : "";
      if (needsLearningObligationStatus(ageYears) && !isLearningObligationStatus(learningStatus)) {
        throw new Error(t("errLearningObligationRequired"));
      }
      const isMinor = ageYears < 18;
      const consentToSave = isMinor
        ? legalRepresentativeConsentStatus === "pending"
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
        // Privacy-by-default: keep profile hidden until seeker explicitly enables visibility in their account.
        profile_visible: false,
        has_b_category_drivers_license: hasBCategoryDriversLicense,
        profession_id: taxonomyAvailable ? professionId || null : undefined,
        skill_ids: taxonomyAvailable ? skillIds : undefined,
        language_ids: taxonomyAvailable ? languageIds : undefined,
        languages,
      };
      let { error: seekerErr } = await supabase.from("seeker_profiles").upsert(seekerPayload);
      if (seekerErr && isTaxonomyColumnError(seekerErr.message)) {
        const retry = await supabase
          .from("seeker_profiles")
          .upsert(omitKeys(seekerPayload, ["profession_id", "skill_ids", "language_ids", "languages"]));
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

      // MVP sync: avoid duplicate certificate rows if user resubmits onboarding.
      const { error: delErr } = await supabase
        .from("seeker_certificates")
        .delete()
        .eq("user_id", user.id);
      if (delErr) throw delErr;

      if (validCerts.length) {
        const rows = validCerts.map((c) => ({
          user_id: user.id,
          certificate_name: c.certificate_name,
          certificate_number: c.certificate_number || null,
          certificate_issuer: c.certificate_issuer,
          certificate_valid_from: c.certificate_valid_from || null,
          certificate_valid_until: c.certificate_valid_until || null,
          certificate_image_url: persistCertificateImageRef(c.certificate_image_url),
          verification_status: "submitted" as const,
          verified_at: null,
          verification_source: null,
          verified_by: null,
        }));
        const { error: certErr } = await supabase.from("seeker_certificates").insert(rows);
        if (certErr) throw certErr;
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
          l.includes("is_minor")
        ) {
          shown = `${shown}\n\n${t("seekerProfileStructuredColumnsFixHint")}`;
        }
        setError(shown);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-6">
      <SeekerCompletenessPanel completeness={completeness} linkGaps={false} />
      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">{t("avatar")}</label>
        <div className="text-xs leading-relaxed text-white/45">{t("avatarFileOnlyHint")}</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-xs font-medium tracking-wide text-white/55">
            {t("avatarUpload")}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => void onAvatarFileChange(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-white/65 file:mr-3 file:rounded-xl file:border-0 file:bg-white/[0.06] file:px-3 file:py-2 file:text-xs file:font-medium file:text-white/80 hover:file:bg-white/[0.10] sm:w-auto"
            required
          />
        </div>
        {avatarUploading ? (
          <div className="space-y-2">
            <div className="text-xs text-white/55">{t("avatarUploading")}</div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-violet-400/70 via-fuchsia-400/60 to-pink-400/60" />
            </div>
          </div>
        ) : null}
        {avatarUrl ? (
          <div className="space-y-3">
            <div className="text-xs text-white/55">{t("avatarReady")}</div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.03]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarPreviewUrl ?? avatarUrl}
                  alt={t("avatar")}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="text-xs text-white/45">{t("avatarPreviewHint")}</div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">
          {t("linkedinUrl")}
        </label>
        <Input
          value={linkedinUrl}
          onChange={(e) => setLinkedinUrl(e.target.value)}
          placeholder={t("linkedinUrlHint")}
          inputMode="url"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("firstName")}
          </label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("lastName")}
          </label>
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("email")}</label>
          <Input value={email} readOnly aria-readonly="true" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("phone")}</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("location")}
          </label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("profileTitle")}</label>
          <Input
            value={profileTitle}
            onChange={(e) => setProfileTitle(e.target.value)}
            required
            placeholder={t("profileTitleHint")}
          />
          <div className="text-xs text-white/45">{t("profileTitleHelp")}</div>
        </div>
        {taxonomyAvailable ? (
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-wide text-white/65">{t("profession")}</label>
            <TaxonomySelect
              value={professionId}
              terms={catalog.professions}
              locale={locale}
              placeholder={t("taxonomyPlaceholder")}
              onChange={setProfessionId}
            />
            <div className="text-xs text-white/45">{t("professionHint")}</div>
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
        <label className="text-xs font-medium tracking-wide text-white/65">{t("about")}</label>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          required
          rows={4}
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("experienceLevel")}
          </label>
          <select
            value={experienceLevel}
            onChange={(e) =>
              setExperienceLevel(e.target.value as (typeof EXPERIENCE_LEVEL_VALUES)[number] | "")
            }
            required
            className="h-11 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/85 outline-none transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
          >
            <option value="">{t("experienceLevelPlaceholder")}</option>
            {EXPERIENCE_LEVEL_VALUES.map((v) => (
              <option key={v} value={v}>
                {t(`experienceLevelOption.${v}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("skills")}</label>
          {taxonomyAvailable ? (
            <TaxonomyChipField
              terms={catalog.skills}
              selectedIds={skillIds}
              leftover={skillLeftover}
              onChangeIds={setSkillIds}
              onChangeLeftover={setSkillLeftover}
              locale={locale}
              suggestedIds={suggestedSkillIds(catalog, professionId)}
            />
          ) : (
            <Input
              value={skillsCsv}
              onChange={(e) => setSkillsCsv(e.target.value)}
              required
              placeholder={t("csvHint")}
            />
          )}
        </div>
        {taxonomyAvailable ? (
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-medium tracking-wide text-white/65">{t("languages")}</label>
            <TaxonomyChipField
              terms={catalog.languages}
              selectedIds={languageIds}
              leftover={[]}
              onChangeIds={setLanguageIds}
              onChangeLeftover={() => undefined}
              locale={locale}
            />
          </div>
        ) : null}
        <SeekerExperienceBackgroundFields value={experienceBackground} onChange={setExperienceBackground} />
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("preferredJobTypes")}
          </label>
          <Input
            value={preferredJobTypesCsv}
            onChange={(e) => setPreferredJobTypesCsv(e.target.value)}
            required
            placeholder={t("csvHint")}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("preferredLocations")}
          </label>
          <Input
            value={preferredLocationsCsv}
            onChange={(e) => setPreferredLocationsCsv(e.target.value)}
            required
            placeholder={t("csvHint")}
          />
        </div>
      </div>

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
          <label className="text-xs font-medium tracking-wide text-white/65">{t("salaryExpectation")}</label>
          <Input
            value={salaryExpectation}
            onChange={(e) => setSalaryExpectation(e.target.value)}
            placeholder={t("salaryExpectationHint")}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("cvUrl")}</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => void onCvFileChange(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-white/65 file:mr-3 file:rounded-xl file:border-0 file:bg-white/[0.06] file:px-3 file:py-2 file:text-xs file:font-medium file:text-white/80 hover:file:bg-white/[0.10] sm:w-auto"
          />
          <div className="text-xs text-white/45">{t("cvUrlHint")}</div>
          {cvUploading ? <div className="text-xs text-white/55">{t("cvUploading")}</div> : null}
          {!cvUploading && cvUrl ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/55">
              {cvFileName ? <span>{cvFileName}</span> : null}
              <PrivateCvOpenLink
                cvRef={cvUrl}
                errorLabel={t("cvOpenFailed")}
                className="underline hover:text-white/80 disabled:opacity-60"
              >
                {t("cvOpen")}
              </PrivateCvOpenLink>
              <button
                type="button"
                className="underline hover:text-white/80"
                onClick={() => {
                  void (async () => {
                    const supabase = createSupabaseBrowserClient();
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
          <label className="text-xs font-medium tracking-wide text-white/65">{t("workAuthorization")}</label>
          <textarea
            value={workAuthNotes}
            onChange={(e) => setWorkAuthNotes(e.target.value)}
            rows={2}
            placeholder={t("workAuthorizationHint")}
            className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium text-white/85">{t("certificateSection")}</div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-xl px-3 text-[13px]"
            onClick={() =>
              setCertificates((prev) => [
                ...prev,
                {
                  certificate_name: "",
                  certificate_number: "",
                  certificate_issuer: "",
                  certificate_valid_from: "",
                  certificate_valid_until: "",
                  certificate_image_url: "",
                },
              ])
            }
          >
            {t("addCertificate")}
          </Button>
        </div>

        <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
          <label className="flex cursor-pointer select-none items-start gap-3">
            <input
              type="checkbox"
              checked={hasBCategoryDriversLicense}
              onChange={(e) => setHasBCategoryDriversLicense(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/[0.20] bg-white/[0.03]"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-white/80">{t("bCategoryDriversLicense")}</span>
              <span className="mt-1 block text-xs leading-relaxed text-white/50">{t("bCategoryDriversLicenseHint")}</span>
            </span>
          </label>
        </div>

        <div className="mt-4 space-y-6">
          {certificates.map((c, idx) => (
            <div key={idx} className="rounded-2xl border border-white/[0.10] bg-white/[0.02] p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1.5">
                  <div className="text-xs font-medium tracking-wide text-white/55">
                    {t("certificate")} #{idx + 1}
                  </div>
                  <CertificateStatusBlock
                    name={(c.certificate_name ?? "").trim() || null}
                    fields={{
                      verification_status: "submitted",
                      verified_at: null,
                      verification_source: null,
                      certificate_valid_until: c.certificate_valid_until || null,
                      certificate_issuer: c.certificate_issuer || null,
                    }}
                    labels={certificateViewLabelsFromT((key, values) => t(key, values))}
                    locale={locale}
                  />
                </div>
                {certificates.length > 1 ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-white/55 hover:text-white/75"
                    onClick={() =>
                      setCertificates((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    {t("remove")}
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-white/65">
                    {t("certificateName")}
                  </label>
                  <Input
                    value={c.certificate_name}
                    onChange={(e) =>
                      setCertificates((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, certificate_name: e.target.value } : x
                        )
                      )
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-white/65">
                    {t("certificateNumber")}
                  </label>
                  <Input
                    value={c.certificate_number}
                    onChange={(e) =>
                      setCertificates((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, certificate_number: e.target.value } : x
                        )
                      )
                    }
                  />
                  <div className="text-xs text-white/45">{t("certificateNumberOptionalHint")}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-white/65">
                    {t("certificateIssuer")}
                  </label>
                  <Input
                    value={c.certificate_issuer}
                    onChange={(e) =>
                      setCertificates((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, certificate_issuer: e.target.value } : x
                        )
                      )
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-white/65">
                    {t("certificateValidFrom")}
                  </label>
                  <Input
                    type="date"
                    value={c.certificate_valid_from}
                    onChange={(e) =>
                      setCertificates((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, certificate_valid_from: e.target.value } : x
                        )
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-white/65">
                    {t("certificateValidUntil")}
                  </label>
                  <Input
                    type="date"
                    value={c.certificate_valid_until}
                    onChange={(e) =>
                      setCertificates((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, certificate_valid_until: e.target.value } : x
                        )
                      )
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-medium tracking-wide text-white/65">
                    {t("certificateImage")}
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) =>
                      void onCertificateFileChange(idx, e.target.files?.[0] ?? null)
                    }
                    className="block w-full text-xs text-white/65 file:mr-3 file:rounded-xl file:border-0 file:bg-white/[0.06] file:px-3 file:py-2 file:text-xs file:font-medium file:text-white/80 hover:file:bg-white/[0.10] sm:w-auto"
                  />
                  <div className="text-xs text-white/45">{t("certificateImageUploadHint")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {error}
        </div>
      ) : null}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={loading || avatarUploading}
      >
        {loading ? t("saving") : t("saveAndContinue")}
      </Button>
    </form>
  );
}

