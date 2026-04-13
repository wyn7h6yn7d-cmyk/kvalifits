"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { EXPERIENCE_LEVEL_VALUES, parseCommaList, seekerCoreComplete } from "@/lib/matching/profileRules";
import { isSeekerAvatarFromStorageUpload } from "@/lib/seeker/seekerAvatarUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessageFromUnknown } from "@/lib/utils";

type Certificate = {
  id?: string;
  certificate_name: string;
  certificate_number: string;
  certificate_issuer: string;
  certificate_valid_from: string;
  certificate_valid_until: string;
  certificate_image_url?: string | null;
};

type Props = {
  locale: string;
  initial: {
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
      experience_level: string | null;
      preferred_job_types: string[] | null;
      preferred_locations: string[] | null;
      profile_visible?: boolean | null;
      salary_expectation?: string | null;
      work_authorization_notes?: string | null;
      cv_url?: string | null;
      has_b_category_drivers_license?: boolean | null;
    } | null;
    certificates: Certificate[];
  };
};

export function SeekerProfileForm({ locale, initial }: Props) {
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
  const [cvUrl, setCvUrl] = useState(initial.seeker?.cv_url ?? "");
  const [cvUploading, setCvUploading] = useState(false);
  const [cvFileName, setCvFileName] = useState<string | null>(null);

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
          certificate_image_url: (c as any).certificate_image_url ?? "",
        }))
      : []
  );

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

  async function onCertificateFileChange(idx: number, file: File | null) {
    if (!file) return;
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/certificates/${idx}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type || undefined,
      });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setCertificates((prev) =>
        prev.map((x, i) => (i === idx ? { ...x, certificate_image_url: data.publicUrl } : x))
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
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
      setAvatarPreviewUrl(URL.createObjectURL(file));

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          upsert: true,
          contentType: file.type || undefined,
        });
      if (uploadErr) throw uploadErr;

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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
      if (ext !== "pdf" && file.type !== "application/pdf") {
        throw new Error(t("unknownError"));
      }

      const safeBase = file.name
        .replace(/\.[^.]+$/, "")
        .toLowerCase()
        .replace(/[^a-z0-9-_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 48);
      const path = `${user.id}/cv/${Date.now()}-${safeBase || "cv"}.pdf`;

      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: "application/pdf",
      });
      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setCvUrl(data.publicUrl);
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setCvUploading(false);
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
      if (!isSeekerAvatarFromStorageUpload(avatarUrl)) throw new Error(t("avatarRequired"));

      const fullName = `${firstName} ${lastName}`.trim().replace(/\s+/g, " ");
      const title = profileTitle.trim();
      const skills = parseCommaList(skillsCsv);
      const preferredJobTypes = parseCommaList(preferredJobTypesCsv);
      const preferredLocations = parseCommaList(preferredLocationsCsv);

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

      // Certificates are optional. If provided, only persist reasonably complete rows.
      const validCerts = certificates
        .map((c) => ({
          ...c,
          certificate_name: c.certificate_name.trim(),
          certificate_number: c.certificate_number.trim(),
          certificate_issuer: c.certificate_issuer.trim(),
          certificate_image_url: (c.certificate_image_url ?? "").trim(),
        }))
        .filter((c) => c.certificate_name && c.certificate_issuer);
      const isComplete = seekerCoreComplete({
        avatarOk: isSeekerAvatarFromStorageUpload(avatarUrl),
        seeker: {
          full_name: fullName,
          profile_title: title,
          phone,
          location,
          about,
          skills,
          experience_level: experienceLevel,
          preferred_job_types: preferredJobTypes,
          preferred_locations: preferredLocations,
        },
        certRowsWithImage: 0,
      });

      const { error: metaErr } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl, linkedin_url: linkedinUrl || null },
      });
      if (metaErr) throw metaErr;

      const { error: seekerErr } = await supabase.from("seeker_profiles").upsert({
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
        cv_url: cvUrl.trim() || null,
        is_complete: isComplete,
        profile_visible: profileVisible,
        has_b_category_drivers_license: hasBCategoryDriversLicense,
      });
      if (seekerErr) throw seekerErr;

      // MVP sync: replace user's certificate set
      const { error: delErr } = await supabase.from("seeker_certificates").delete().eq("user_id", user.id);
      if (delErr) throw delErr;

      if (validCerts.length) {
        const rows = validCerts.map((c) => ({
          user_id: user.id,
          certificate_name: c.certificate_name,
          certificate_number: c.certificate_number || null,
          certificate_issuer: c.certificate_issuer,
          certificate_valid_from: c.certificate_valid_from || null,
          certificate_valid_until: c.certificate_valid_until || null,
          // Kept for storage uploads (user never enters URL manually).
          certificate_image_url: c.certificate_image_url || null,
        }));
        const { error: insErr } = await supabase.from("seeker_certificates").insert(rows);
        if (insErr) throw insErr;
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
          l.includes("has_b_category_drivers_license")
        ) {
          shown = `${shown}\n\n${t("seekerProfileStructuredColumnsFixHint")}`;
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
          <div className="whitespace-pre-line rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
            {error}
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-medium text-white/85">{t("visibilityTitle")}</div>
            <div className="mt-1 text-sm leading-relaxed text-white/60">{t("visibilityHint")}</div>
          </div>
          <label className="inline-flex shrink-0 cursor-pointer select-none items-center gap-2">
            <input
              type="checkbox"
              checked={profileVisible}
              onChange={(e) => setProfileVisible(e.target.checked)}
              className="h-4 w-4 rounded border-white/[0.20] bg-white/[0.03]"
            />
            <span className="text-sm font-medium text-white/75">
              {profileVisible ? t("visibilityOn") : t("visibilityOff")}
            </span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">{t("avatar")}</label>
        <div className="text-xs leading-relaxed text-white/45">{t("avatarFileOnlyHint")}</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-white/55">{t("avatarUpload")}</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => void onAvatarFileChange(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-white/65 file:mr-3 file:rounded-xl file:border-0 file:bg-white/[0.06] file:px-3 file:py-2 file:text-xs file:font-medium file:text-white/80 hover:file:bg-white/[0.10] sm:w-auto"
            required={!isSeekerAvatarFromStorageUpload(avatarUrl)}
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
          <div className="flex items-center gap-3 pt-1">
            <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.03]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarPreviewUrl ?? avatarUrl} alt={t("avatar")} className="h-full w-full object-cover" />
            </div>
            <div className="text-xs text-white/55">{t("avatarReady")}</div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">{t("linkedinUrl")}</label>
        <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder={t("linkedinUrlHint")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("firstName")}</label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("lastName")}</label>
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
          <label className="text-xs font-medium tracking-wide text-white/65">{t("location")}</label>
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
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">{t("about")}</label>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          required
          rows={4}
          placeholder={t("aboutHint")}
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
        />
        <div className="text-xs text-white/45">{t("aboutHelp")}</div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("experienceLevel")}</label>
          <select
            value={experienceLevel}
            onChange={(e) =>
              setExperienceLevel(e.target.value as (typeof EXPERIENCE_LEVEL_VALUES)[number] | "")
            }
            required
            className="h-11 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/85 outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
          >
            <option value="">{t("experienceLevelPlaceholder")}</option>
            {EXPERIENCE_LEVEL_VALUES.map((v) => (
              <option key={v} value={v}>
                {t(`experienceLevelOption.${v}`)}
              </option>
            ))}
          </select>
          <div className="text-xs text-white/45">{t("experienceLevelHint")}</div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("skills")}</label>
          <Input value={skillsCsv} onChange={(e) => setSkillsCsv(e.target.value)} required placeholder={t("csvHint")} />
          <div className="text-xs text-white/45">{t("skillsHelp")}</div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("preferredJobTypes")}</label>
          <Input value={preferredJobTypesCsv} onChange={(e) => setPreferredJobTypesCsv(e.target.value)} required placeholder={t("csvHint")} />
          <div className="text-xs text-white/45">{t("preferredJobTypesHelp")}</div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("preferredLocations")}</label>
          <Input value={preferredLocationsCsv} onChange={(e) => setPreferredLocationsCsv(e.target.value)} required placeholder={t("csvHint")} />
          <div className="text-xs text-white/45">{t("preferredLocationsHelp")}</div>
        </div>
      </div>

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
            <div className="text-xs text-white/55">
              {cvFileName ? `${cvFileName} — ` : null}
              <a href={cvUrl} target="_blank" rel="noreferrer" className="underline hover:text-white/80">
                {t("cvOpen")}
              </a>
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
            className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
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
        <div className="mt-2 text-xs leading-relaxed text-white/55">{t("certificateSectionHelp")}</div>

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
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-medium tracking-wide text-white/55">
                  {t("certificate")} #{idx + 1}
                </div>
                {certificates.length > 1 ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-white/55 hover:text-white/75"
                    onClick={() => setCertificates((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    {t("remove")}
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-white/65">{t("certificateName")}</label>
                  <Input value={c.certificate_name} onChange={(e) => setCertificates((prev) => prev.map((x, i) => (i === idx ? { ...x, certificate_name: e.target.value } : x)))} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-white/65">{t("certificateNumber")}</label>
                  <Input value={c.certificate_number} onChange={(e) => setCertificates((prev) => prev.map((x, i) => (i === idx ? { ...x, certificate_number: e.target.value } : x)))} />
                  <div className="text-xs text-white/45">{t("certificateNumberOptionalHint")}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-white/65">{t("certificateIssuer")}</label>
                  <Input value={c.certificate_issuer} onChange={(e) => setCertificates((prev) => prev.map((x, i) => (i === idx ? { ...x, certificate_issuer: e.target.value } : x)))} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-white/65">{t("certificateValidFrom")}</label>
                  <Input type="date" value={c.certificate_valid_from} onChange={(e) => setCertificates((prev) => prev.map((x, i) => (i === idx ? { ...x, certificate_valid_from: e.target.value } : x)))} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium tracking-wide text-white/65">{t("certificateValidUntil")}</label>
                  <Input type="date" value={c.certificate_valid_until} onChange={(e) => setCertificates((prev) => prev.map((x, i) => (i === idx ? { ...x, certificate_valid_until: e.target.value } : x)))} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-medium tracking-wide text-white/65">{t("certificateImage")}</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => void onCertificateFileChange(idx, e.target.files?.[0] ?? null)}
                    className="block w-full text-xs text-white/65 file:mr-3 file:rounded-xl file:border-0 file:bg-white/[0.06] file:px-3 file:py-2 file:text-xs file:font-medium file:text-white/80 hover:file:bg-white/[0.10] sm:w-auto"
                  />
                  <div className="text-xs text-white/45">{t("certificateImageUploadHint")}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

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

      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="text-sm font-medium text-white/85">{t("accountTitle")}</div>
        <div className="mt-1 text-sm leading-relaxed text-white/60">{t("accountHint")}</div>
        <div className="mt-4">
          <a
            href={`mailto:support@kvalifits.ee?subject=${encodeURIComponent(
              t("deleteAccountEmailSubject")
            )}&body=${encodeURIComponent(t("deleteAccountEmailBody"))}`}
            className="text-sm font-medium text-white/75 underline hover:text-white"
          >
            {t("deleteAccountCta")}
          </a>
        </div>
      </div>
    </form>
  );
}

