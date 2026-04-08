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

export function EmployerNewJobForm({ locale }: Props) {
  const t = useTranslations("jobs");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState("on_site");
  const [jobType, setJobType] = useState("full_time");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("EUR");
  const [applicationUrl, setApplicationUrl] = useState("");

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

      const { data: employer, error: employerErr } = await supabase
        .from("employer_profiles")
        .select("id")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (employerErr) throw employerErr;
      if (!employer?.id) throw new Error(t("missingEmployerProfile"));

      const min = salaryMin.trim() ? Number(salaryMin) : null;
      const max = salaryMax.trim() ? Number(salaryMax) : null;

      const { error: jobErr } = await supabase.from("job_posts").insert({
        employer_profile_id: employer.id,
        created_by: user.id,
        title,
        location,
        work_type: workType,
        job_type: jobType,
        description,
        requirements,
        salary_min: Number.isFinite(min as number) ? min : null,
        salary_max: Number.isFinite(max as number) ? max : null,
        salary_currency: salaryCurrency,
        application_type: "external_url",
        application_url: applicationUrl,
        status: "draft",
      });
      if (jobErr) throw jobErr;

      router.push(`/${locale}/tooandjatele`);
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
          <label className="text-xs font-medium tracking-wide text-white/65">{t("title")}</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("location")}
          </label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("applicationUrl")}
          </label>
          <Input
            value={applicationUrl}
            onChange={(e) => setApplicationUrl(e.target.value)}
            required
            placeholder="https://…"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("workType")}</label>
          <Input value={workType} onChange={(e) => setWorkType(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("jobType")}</label>
          <Input value={jobType} onChange={(e) => setJobType(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">
          {t("description")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={6}
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">
          {t("requirements")}
        </label>
        <textarea
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          required
          rows={5}
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("salaryMin")}</label>
          <Input value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} inputMode="numeric" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("salaryMax")}</label>
          <Input value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} inputMode="numeric" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">
            {t("salaryCurrency")}
          </label>
          <Input value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)} />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {error}
        </div>
      ) : null}

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
        {loading ? t("saving") : t("createDraft")}
      </Button>
    </form>
  );
}

