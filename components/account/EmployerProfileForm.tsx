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
  location: string | null;
  industry: string | null;
  company_size: string | null;
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

  const [companyName, setCompanyName] = useState(initial?.company_name ?? "");
  const [registryCode, setRegistryCode] = useState(initial?.registry_code ?? "");
  const [contactEmail, setContactEmail] = useState(initial?.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [locationValue, setLocationValue] = useState(initial?.location ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [companySize, setCompanySize] = useState(initial?.company_size ?? "");
  const [companyDescription, setCompanyDescription] = useState(initial?.company_description ?? "");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      if (industry.trim().length < 2) throw new Error(t("errIndustryRequired"));
      if (companyDescription.trim().length < 40) throw new Error(t("errCompanyDescriptionTooShort"));

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
        location: locationValue,
        industry: industry || null,
        company_size: companySize.trim() || null,
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
          <Input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            required
            minLength={2}
            placeholder={t("industryHint")}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("companySize")}</label>
          <Input
            value={companySize}
            onChange={(e) => setCompanySize(e.target.value)}
            placeholder={t("companySizeHint")}
          />
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

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
        {loading ? t("saving") : t("saveAndContinue")}
      </Button>
    </form>
  );
}

