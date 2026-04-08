"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  locale: string;
};

export function SeekerOnboardingForm({ locale }: Props) {
  const t = useTranslations("onboarding");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [profileTitle, setProfileTitle] = useState("");
  const [about, setAbout] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [skillsCsv, setSkillsCsv] = useState("");
  const [preferredJobTypesCsv, setPreferredJobTypesCsv] = useState("");
  const [preferredLocationsCsv, setPreferredLocationsCsv] = useState("");

  const [certificateName, setCertificateName] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [certificateIssuer, setCertificateIssuer] = useState("");
  const [certificateValidFrom, setCertificateValidFrom] = useState("");
  const [certificateValidUntil, setCertificateValidUntil] = useState("");
  const [certificateImageUrl, setCertificateImageUrl] = useState("");

  function parseCsv(v: string) {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
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

      const skills = parseCsv(skillsCsv);
      const preferredJobTypes = parseCsv(preferredJobTypesCsv);
      const preferredLocations = parseCsv(preferredLocationsCsv);

      const { error: seekerErr } = await supabase.from("seeker_profiles").upsert({
        user_id: user.id,
        full_name: fullName,
        phone,
        location,
        profile_title: profileTitle,
        about,
        skills,
        experience_level: experienceLevel,
        preferred_job_types: preferredJobTypes,
        preferred_locations: preferredLocations,
        profile_visible: true,
      });
      if (seekerErr) throw seekerErr;

      const { error: certErr } = await supabase.from("seeker_certificates").insert({
        user_id: user.id,
        certificate_name: certificateName,
        certificate_number: certificateNumber,
        certificate_issuer: certificateIssuer,
        certificate_valid_from: certificateValidFrom,
        certificate_valid_until: certificateValidUntil,
        certificate_image_url: certificateImageUrl,
      });
      if (certErr) throw certErr;

      router.push(`/${locale}/onboarding`);
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
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("fullName")}
          </label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
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
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("profileTitle")}
          </label>
          <Input
            value={profileTitle}
            onChange={(e) => setProfileTitle(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">{t("about")}</label>
        <textarea
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          required
          rows={4}
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("experienceLevel")}
          </label>
          <Input
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            required
            placeholder={t("experienceLevelHint")}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("skills")}</label>
          <Input
            value={skillsCsv}
            onChange={(e) => setSkillsCsv(e.target.value)}
            required
            placeholder={t("csvHint")}
          />
        </div>
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

      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="text-sm font-medium text-white/85">{t("certificateSection")}</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-wide text-white/65">
              {t("certificateName")}
            </label>
            <Input
              value={certificateName}
              onChange={(e) => setCertificateName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-wide text-white/65">
              {t("certificateNumber")}
            </label>
            <Input
              value={certificateNumber}
              onChange={(e) => setCertificateNumber(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-wide text-white/65">
              {t("certificateIssuer")}
            </label>
            <Input
              value={certificateIssuer}
              onChange={(e) => setCertificateIssuer(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-wide text-white/65">
              {t("certificateImageUrl")}
            </label>
            <Input
              value={certificateImageUrl}
              onChange={(e) => setCertificateImageUrl(e.target.value)}
              required
              placeholder={t("certificateImageUrlHint")}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-wide text-white/65">
              {t("certificateValidFrom")}
            </label>
            <Input
              type="date"
              value={certificateValidFrom}
              onChange={(e) => setCertificateValidFrom(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-wide text-white/65">
              {t("certificateValidUntil")}
            </label>
            <Input
              type="date"
              value={certificateValidUntil}
              onChange={(e) => setCertificateValidUntil(e.target.value)}
              required
            />
          </div>
        </div>
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

