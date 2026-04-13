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
import { isEmployerLogoFromStorageUpload } from "@/lib/employer/employerLogoUpload";
import { prepareRasterImageForUpload } from "@/lib/uploads/prepareUploadFile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessageFromUnknown } from "@/lib/utils";

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
  company_size?: string | null;
  logo_url?: string | null;
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
  const [companySize, setCompanySize] = useState(initial?.company_size ?? "");
  const [companyDescription, setCompanyDescription] = useState(initial?.company_description ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

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
      if (uploadErr) throw uploadErr;
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
      if (industry.trim().length < 2) throw new Error(t("errIndustryRequired"));
      if (companyDescription.trim().length < 40) throw new Error(t("errCompanyDescriptionTooShort"));
      if (logoUrl.trim() && !isEmployerLogoFromStorageUpload(logoUrl)) {
        throw new Error(t("logoUploadError"));
      }

      const payload = {
        company_name: companyName,
        registry_code: registryCode || null,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        website: website || null,
        company_description: companyDescription,
        location: locationValue,
        industry: industry || null,
        logo_url: logoUrl.trim() || null,
        ...employerCompanySizeField(companySize.trim()),
      };

      const { error } = await supabase.from("employer_profiles").upsert(
        { owner_user_id: user.id, ...payload },
        { onConflict: "owner_user_id" }
      );
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
          <Input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            required
            minLength={2}
            placeholder={t("industryHint")}
          />
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
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
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
    </form>
  );
}

