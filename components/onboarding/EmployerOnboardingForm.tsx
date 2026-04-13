"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EMPLOYER_COMPANY_SIZE_DB_ENABLED,
  employerCompanySizeField,
  employerOnboardingSelectColumns,
  type EmployerOnboardingPrefill,
} from "@/lib/employer/employerCompanySizeSync";
import { isEmployerLogoFromStorageUpload } from "@/lib/employer/employerLogoUpload";
import { errorMessageFromUnknown } from "@/lib/utils";

type Props = {
  locale: string;
};

export function EmployerOnboardingForm({ locale }: Props) {
  const t = useTranslations("onboarding");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [registryCode, setRegistryCode] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  // Prefill from existing employer profile / auth email for smoother onboarding.
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        if (mounted && user.email) setContactEmail((prev) => prev || user.email || "");

        const { data: employerRaw, error: prefillErr } = await supabase
          .from("employer_profiles")
          .select(employerOnboardingSelectColumns())
          .eq("owner_user_id", user.id)
          .maybeSingle();
        if (prefillErr) return;
        const employer = employerRaw as EmployerOnboardingPrefill | null;
        if (!mounted || !employer) return;

        setCompanyName((prev) => prev || (employer.company_name ?? "").toString());
        setRegistryCode((prev) => prev || (employer.registry_code ?? "").toString());
        setContactEmail((prev) => prev || (employer.contact_email ?? "").toString());
        setContactPhone((prev) => prev || (employer.contact_phone ?? "").toString());
        setWebsite((prev) => prev || (employer.website ?? "").toString());
        setLocation((prev) => prev || (employer.location ?? "").toString());
        setIndustry((prev) => prev || (employer.industry ?? "").toString());
        if (EMPLOYER_COMPANY_SIZE_DB_ENABLED) {
          setCompanySize((prev) => prev || (employer.company_size ?? "").toString());
        }
        setCompanyDescription((prev) => prev || (employer.company_description ?? "").toString());
        setLogoUrl((prev) => prev || (employer.logo_url ?? "").toString());
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function onLogoFileChange(file: File | null) {
    if (!file) return;
    setLogoUploading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      if (!["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) {
        throw new Error(t("logoUploadError"));
      }
      const path = `${user.id}/employer-logo/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type || undefined,
      });
      if (uploadErr) throw uploadErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
      setLogoPreviewUrl(URL.createObjectURL(file));
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

    try {
      if (industry.trim().length < 2) {
        throw new Error(t("errIndustryRequired"));
      }
      if (companyDescription.trim().length < 40) {
        throw new Error(t("errCompanyDescriptionTooShort"));
      }
      if (logoUrl.trim() && !isEmployerLogoFromStorageUpload(logoUrl)) {
        throw new Error(t("logoUploadError"));
      }

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      const sizeFields = employerCompanySizeField(companySize.trim());

      // Registration already inserts a placeholder row (unique on owner_user_id). Use upsert so we
      // never hit duplicate-key if a prior select returned no row (RLS/race).
      const { error } = await supabase.from("employer_profiles").upsert(
        {
          owner_user_id: user.id,
          company_name: companyName,
          registry_code: registryCode || null,
          contact_email: contactEmail,
          contact_phone: contactPhone || null,
          website: website || null,
          company_description: companyDescription,
          location,
          industry: industry || null,
          logo_url: logoUrl.trim() || null,
          ...sizeFields,
        },
        { onConflict: "owner_user_id" }
      );
      if (error) throw error;

      router.push(`/${locale}/onboarding`);
      router.refresh();
    } catch (err) {
      setError(errorMessageFromUnknown(err, t("unknownError")));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/[0.10] bg-white/[0.04]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoPreviewUrl ?? logoUrl} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="text-xs text-white/55">{t("logoReady")}</div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("companyName")}
          </label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("registryCode")}
          </label>
          <Input value={registryCode} onChange={(e) => setRegistryCode(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("contactEmail")}
          </label>
          <Input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("contactPhone")}
          </label>
          <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("website")}</label>
          <Input value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("location")}
          </label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
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
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">
          {t("companyDescription")}
        </label>
        <textarea
          value={companyDescription}
          onChange={(e) => setCompanyDescription(e.target.value)}
          required
          rows={5}
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
        />
      </div>

      {error ? (
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {error}
        </div>
      ) : null}

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading || logoUploading}>
        {loading ? t("saving") : t("saveAndContinue")}
      </Button>
    </form>
  );
}

