"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  EMPLOYER_COMPANY_SIZE_DB_ENABLED,
  employerCompanySizeField,
} from "@/lib/employer/employerCompanySizeSync";
import { formatEmployerProfileSaveError } from "@/lib/employer/employerProfileSaveError";
import {
  parseEmployerCompanyVerificationFields,
  type EmployerCompanyVerificationFields,
} from "@/lib/employer/companyVerification";
import { CompanyVerificationBadge } from "@/components/employer/CompanyVerificationBadge";
import { AccountPrivacySettings } from "@/components/account/AccountPrivacySettings";
import { isEmployerLogoFromStorageUpload } from "@/lib/employer/employerLogoUpload";
import { prepareRasterImageForUpload } from "@/lib/uploads/prepareUploadFile";
import { reportStorageUploadFailure } from "@/lib/monitoring/report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaxonomySelect } from "@/components/taxonomy/TaxonomySelect";
import { errorMessageFromUnknown, omitKeys } from "@/lib/utils";
import { isTaxonomyColumnError } from "@/lib/taxonomy/columnMissing";
import { taxonomyLabel, findTerm } from "@/lib/taxonomy/labels";
import { resolveTaxonomyId } from "@/lib/taxonomy/resolve";
import { useTaxonomyCatalog } from "@/lib/taxonomy/useTaxonomyCatalog";

const SIMPLE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmployerProfile = {
  id: string;
  company_name: string | null;
  registry_code: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  company_description: string | null;
  location: string | null;
  industry: string | null;
  industry_id?: string | null;
  company_size?: string | null;
  logo_url?: string | null;
  company_verified?: boolean | null;
  verification_status?: string | null;
  verification_source?: string | null;
  verified_at?: string | null;
};

type Props = {
  locale: string;
  initial: EmployerProfile | null;
};

export function EmployerProfileForm({ locale, initial }: Props) {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const statusRef = useRef<HTMLDivElement | null>(null);
  const successHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [companyName, setCompanyName] = useState(initial?.company_name ?? "");
  const [registryCode, setRegistryCode] = useState(initial?.registry_code ?? "");
  const [contactEmail, setContactEmail] = useState(initial?.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [locationValue, setLocationValue] = useState(initial?.location ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [industryId, setIndustryId] = useState(initial?.industry_id ?? "");
  const { catalog, available: taxonomyAvailable } = useTaxonomyCatalog();
  const [companySize, setCompanySize] = useState(initial?.company_size ?? "");
  const [companyDescription, setCompanyDescription] = useState(initial?.company_description ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  const verification: EmployerCompanyVerificationFields = parseEmployerCompanyVerificationFields({
    company_verified: initial?.company_verified ?? false,
    verification_status: initial?.verification_status,
    verification_source: initial?.verification_source ?? null,
    verified_at: initial?.verified_at ?? null,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (!taxonomyAvailable || industryId) return;
    const mapped = resolveTaxonomyId(catalog, "industry", initial?.industry_id || industry);
    if (mapped) setIndustryId(mapped);
  }, [taxonomyAvailable, catalog, industryId, industry, initial?.industry_id]);

  useEffect(() => {
    setLogoUrl(initial?.logo_url ?? "");
  }, [initial?.logo_url]);

  useEffect(
    () => () => {
      if (successHideTimeoutRef.current) clearTimeout(successHideTimeoutRef.current);
    },
    []
  );

  async function onLogoFileChange(file: File | null) {
    if (!file) return;
    setError(null);
    setLogoUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));
      const prepared = await prepareRasterImageForUpload(file, "employerLogo");
      const ext = (prepared.name.split(".").pop() || "png").toLowerCase();
      if (!["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
        throw new Error(t("logoUploadError"));
      }
      const path = `${user.id}/employer-logo/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, prepared, {
        upsert: true,
        contentType: prepared.type || undefined,
      });
      if (uploadErr) {
        reportStorageUploadFailure(uploadErr, "avatar");
        throw uploadErr;
      }
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      setLogoPreviewUrl(URL.createObjectURL(prepared));
      setLogoUrl(data.publicUrl);
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("logoUploadError")));
    } finally {
      setLogoUploading(false);
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
    setSaveSuccess(false);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      if (!companyName.trim()) throw new Error(t("errCompanyNameRequired"));
      if (!contactEmail.trim()) throw new Error(t("errContactEmailRequired"));
      if (!SIMPLE_EMAIL_RE.test(contactEmail.trim())) throw new Error(t("errContactEmailFormat"));
      if (!locationValue.trim()) throw new Error(t("errLocationRequired"));
      if (taxonomyAvailable) {
        if (!industryId) throw new Error(t("errIndustryRequired"));
      } else if (industry.trim().length < 2) throw new Error(t("errIndustryRequired"));
      if (companyDescription.trim().length < 40) throw new Error(t("errCompanyDescriptionTooShort"));
      if (logoUrl.trim() && !isEmployerLogoFromStorageUpload(logoUrl)) {
        throw new Error(t("logoUploadError"));
      }

      const selectedIndustry = findTerm(catalog, "industry", industryId);
      const industryLabel = selectedIndustry ? taxonomyLabel(selectedIndustry, "et") : industry;
      const payload = {
        company_name: companyName,
        registry_code: registryCode || null,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        website: website || null,
        company_description: companyDescription,
        location: locationValue,
        industry: industryLabel || null,
        industry_id: taxonomyAvailable ? industryId || null : undefined,
        logo_url: logoUrl.trim() || null,
        ...employerCompanySizeField(companySize.trim()),
        // Never send verification fields — name/registry alone must not mark company verified.
      };

      let { error } = await supabase.from("employer_profiles").upsert(
        { owner_user_id: user.id, ...payload },
        { onConflict: "owner_user_id" }
      );
      if (error && isTaxonomyColumnError(error.message)) {
        const retry = await supabase.from("employer_profiles").upsert(
          { owner_user_id: user.id, ...omitKeys(payload, ["industry_id"]) },
          { onConflict: "owner_user_id" }
        );
        error = retry.error;
      }
      if (error) throw error;

      setSaveSuccess(true);
      if (successHideTimeoutRef.current) clearTimeout(successHideTimeoutRef.current);
      successHideTimeoutRef.current = setTimeout(() => {
        setSaveSuccess(false);
        successHideTimeoutRef.current = null;
      }, 10_000);
      router.refresh();
      queueMicrotask(() => {
        statusRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (err) {
      setError(formatEmployerProfileSaveError(err, t));
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
        {saveSuccess ? (
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-100/95">
            {t("profileSavedSuccess")}
          </div>
        ) : null}
        {error ? (
          <div className="whitespace-pre-line rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
            {error}
          </div>
        ) : null}
      </div>
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <label className="text-xs font-medium tracking-wide text-white/65">{t("logoUrl")}</label>
        <div className="mt-2 text-xs leading-relaxed text-white/45">{t("logoVisibleOnJobsHint")}</div>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => void onLogoFileChange(e.target.files?.[0] ?? null)}
          className="mt-3 block w-full text-xs text-white/65 file:mr-3 file:rounded-xl file:border-0 file:bg-white/[0.06] file:px-3 file:py-2 file:text-xs file:font-medium file:text-white/80 hover:file:bg-white/[0.10] sm:w-auto"
        />
        {logoUploading ? <div className="mt-2 text-xs text-white/55">{t("logoUploading")}</div> : null}
        {!logoUploading && (logoPreviewUrl || logoUrl) ? (
          <div className="mt-4 flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/[0.10] bg-white/[0.04]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoPreviewUrl ?? logoUrl} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="text-xs text-white/55">{t("logoReady")}</div>
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="text-xs font-medium tracking-wide text-white/65">{t("companyVerificationTitle")}</div>
        <div className="mt-3">
          <CompanyVerificationBadge
            status={verification.verification_status}
            statusLine={t(`companyVerificationStatus.${verification.verification_status}`)}
            hintLine={t("companyVerificationHint")}
            metaLine={
              verification.verification_status === "verified" && verification.verified_at
                ? t("companyVerifiedAt", {
                    date: new Date(verification.verified_at).toLocaleDateString(locale === "en" ? "en-GB" : locale === "ru" ? "ru-RU" : "et-EE"),
                  })
                : null
            }
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("companyName")}</label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("registryCode")}</label>
          <Input value={registryCode} onChange={(e) => setRegistryCode(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("industry")}</label>
          {taxonomyAvailable ? (
            <TaxonomySelect
              value={industryId}
              required
              terms={catalog.industries}
              locale={locale}
              placeholder={t("taxonomyPlaceholder")}
              onChange={(id) => {
                setIndustryId(id);
                const term = findTerm(catalog, "industry", id);
                if (term) setIndustry(taxonomyLabel(term, "et"));
              }}
            />
          ) : (
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              required
              minLength={2}
              placeholder={t("industryHint")}
            />
          )}
        </div>
        {EMPLOYER_COMPANY_SIZE_DB_ENABLED ? (
          <div className="space-y-2 sm:col-span-2">
            <label className="text-xs font-medium tracking-wide text-white/65">{t("companySize")}</label>
            <Input
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              placeholder={t("companySizeHint")}
            />
          </div>
        ) : null}
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("contactEmail")}</label>
          <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("contactPhone")}</label>
          <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("website")}</label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} inputMode="url" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("location")}</label>
          <Input value={locationValue} onChange={(e) => setLocationValue(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">{t("companyDescription")}</label>
        <textarea
          value={companyDescription}
          onChange={(e) => setCompanyDescription(e.target.value)}
          required
          rows={5}
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={logoUploading}
        loading={loading}
        loadingText={t("saving")}
      >
        {t("saveAndContinue")}
      </Button>

      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="text-sm font-medium text-white/85">{t("passwordChangeTitle")}</div>
        <div className="mt-1 text-xs leading-relaxed text-white/55">{t("passwordChangeHint")}</div>

        {passwordSuccess ? (
          <div className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-500/[0.08] px-3 py-2 text-xs text-emerald-100/95">
            {t("passwordChangedSuccess")}
          </div>
        ) : null}
        {passwordError ? (
          <div className="mt-3 rounded-xl border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-xs text-white/75">
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

      <AccountPrivacySettings locale={locale} />
    </form>
  );
}

