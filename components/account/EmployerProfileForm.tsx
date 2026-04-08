"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EmployerProfile = {
  id: string;
  company_name: string | null;
  registry_code: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  company_description: string | null;
  logo_url: string | null;
  location: string | null;
  industry: string | null;
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
  const [logoUploading, setLogoUploading] = useState(false);

  const [companyName, setCompanyName] = useState(initial?.company_name ?? "");
  const [registryCode, setRegistryCode] = useState(initial?.registry_code ?? "");
  const [contactEmail, setContactEmail] = useState(initial?.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [locationValue, setLocationValue] = useState(initial?.location ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [companyDescription, setCompanyDescription] = useState(initial?.company_description ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "");

  async function onLogoFileChange(file: File | null) {
    if (!file) return;
    setError(null);
    setLogoUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${user.id}/logo-${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage.from("company-logos").upload(path, file, {
        upsert: true,
        contentType: file.type || undefined,
      });
      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
      setLogoUrl(data.publicUrl);
    } catch {
      setError(t("logoUploadError"));
    } finally {
      setLogoUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (logoUploading) return;
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      const { data: existing, error: exErr } = await supabase
        .from("employer_profiles")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (exErr) throw exErr;

      const payload = {
        company_name: companyName,
        registry_code: registryCode || null,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        website: website || null,
        company_description: companyDescription,
        logo_url: logoUrl || null,
        location: locationValue,
        industry: industry || null,
      };

      if (existing?.id) {
        const { error } = await supabase.from("employer_profiles").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("employer_profiles").insert({
          owner_user_id: user.id,
          ...payload,
        });
        if (error) throw error;
      }

      router.push(`/${locale}/account/employer`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unknownError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
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
          <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </div>
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
        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("logoUrl")}</label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-white/55">{t("logoUpload")}</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => void onLogoFileChange(e.target.files?.[0] ?? null)}
              className="block w-full text-xs text-white/65 file:mr-3 file:rounded-xl file:border-0 file:bg-white/[0.06] file:px-3 file:py-2 file:text-xs file:font-medium file:text-white/80 hover:file:bg-white/[0.10] sm:w-auto"
            />
          </div>

          {logoUploading ? (
            <div className="space-y-2">
              <div className="text-xs text-white/55">{t("logoUploading")}</div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-violet-400/70 via-fuchsia-400/60 to-pink-400/60" />
              </div>
            </div>
          ) : null}

          {logoUrl ? (
            <div className="flex items-center gap-3 pt-1">
              <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/[0.10] bg-white/[0.03]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={t("logoUrl")} className="h-full w-full object-cover" />
              </div>
              <div className="text-xs text-white/55">{t("logoReady")}</div>
            </div>
          ) : null}
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

