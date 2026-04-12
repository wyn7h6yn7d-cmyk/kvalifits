"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

        const { data: employer } = await supabase
          .from("employer_profiles")
          .select(
            "company_name,registry_code,contact_email,contact_phone,website,location,industry,company_description,company_size"
          )
          .eq("owner_user_id", user.id)
          .maybeSingle();
        if (!mounted || !employer) return;

        setCompanyName((prev) => prev || (employer.company_name ?? "").toString());
        setRegistryCode((prev) => prev || (employer.registry_code ?? "").toString());
        setContactEmail((prev) => prev || (employer.contact_email ?? "").toString());
        setContactPhone((prev) => prev || (employer.contact_phone ?? "").toString());
        setWebsite((prev) => prev || (employer.website ?? "").toString());
        setLocation((prev) => prev || (employer.location ?? "").toString());
        setIndustry((prev) => prev || (employer.industry ?? "").toString());
        setCompanySize((prev) => prev || (employer.company_size ?? "").toString());
        setCompanyDescription((prev) => prev || (employer.company_description ?? "").toString());
      } catch {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      const { data: existing } = await supabase
        .from("employer_profiles")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from("employer_profiles")
          .update({
            company_name: companyName,
            registry_code: registryCode || null,
            contact_email: contactEmail,
            contact_phone: contactPhone || null,
            website: website || null,
            company_description: companyDescription,
            location,
            industry: industry || null,
            company_size: companySize.trim() || null,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("employer_profiles").insert({
          owner_user_id: user.id,
          company_name: companyName,
          registry_code: registryCode || null,
          contact_email: contactEmail,
          contact_phone: contactPhone || null,
          website: website || null,
          company_description: companyDescription,
          location,
          industry: industry || null,
          company_size: companySize.trim() || null,
        });
        if (error) throw error;
      }

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
        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("companySize")}</label>
          <Input
            value={companySize}
            onChange={(e) => setCompanySize(e.target.value)}
            placeholder={t("companySizeHint")}
          />
        </div>
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

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
        {loading ? t("saving") : t("saveAndContinue")}
      </Button>
    </form>
  );
}

