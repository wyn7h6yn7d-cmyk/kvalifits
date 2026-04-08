"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/routing";

type Props = {
  locale: string;
};

export function EmployerNewJobForm({ locale }: Props) {
  const t = useTranslations("jobs");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState<string>("");
  const [location, setLocation] = useState("");
  const [workType, setWorkType] = useState("on_site");
  const [jobType, setJobType] = useState("full_time");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("EUR");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [packageDays, setPackageDays] = useState<30 | 90>(30);
  const [employerProfileOk, setEmployerProfileOk] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadCompanyName() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: employer } = await supabase
          .from("employer_profiles")
          .select("company_name,contact_email,company_description,location")
          .eq("owner_user_id", user.id)
          .maybeSingle();
        if (!mounted) return;
        const name = (employer?.company_name ?? "").toString();
        setCompanyName(name);
        const ok =
          Boolean(name.trim()) &&
          Boolean((employer?.contact_email ?? "").toString().trim()) &&
          Boolean((employer?.company_description ?? "").toString().trim()) &&
          Boolean((employer?.location ?? "").toString().trim());
        setEmployerProfileOk(ok);
      } catch {
        // ignore
      }
    }
    void loadCompanyName();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  function isValidHttpUrl(v: string) {
    try {
      const u = new URL(v);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  function validate(): string | null {
    if (!employerProfileOk) return t("employerProfileIncomplete");
    if (!title.trim()) return t("errTitleRequired");
    if (!location.trim()) return t("errLocationRequired");
    if (!workType.trim()) return t("errWorkTypeRequired");
    if (!jobType.trim()) return t("errJobTypeRequired");
    if (!summary.trim()) return t("errSummaryRequired");
    if (!description.trim()) return t("errDescriptionRequired");
    if (!requirements.trim()) return t("errRequirementsRequired");
    return null;
  }

  function slugify(value: string) {
    const base = value
      .trim()
      .toLowerCase()
      .replace(/ä/g, "a")
      .replace(/ö/g, "o")
      .replace(/õ/g, "o")
      .replace(/ü/g, "u")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 60);
    const suffix = Math.random().toString(36).slice(2, 8);
    return `${base || "job"}-${suffix}`;
  }

  async function saveDraft(mode: "publish" | "payment") {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(t("notAuthed"));

      const { data: employer, error: employerErr } = await supabase
        .from("employer_profiles")
        .select("id,company_name,website,contact_email")
        .eq("owner_user_id", user.id)
        .maybeSingle();
      if (employerErr) throw employerErr;
      if (!employer?.id) throw new Error(t("missingEmployerProfile"));
      setCompanyName((employer.company_name ?? "").toString());

      const min = salaryMin.trim() ? Number(salaryMin) : null;
      const max = salaryMax.trim() ? Number(salaryMax) : null;

      const fullDescription = summary.trim()
        ? `${t("summaryLabel")}: ${summary.trim()}\n\n${description}`
        : description;

      const fallbackUrl =
        (employer.website ?? "").toString().trim() ||
        ((employer.contact_email ?? "").toString().trim()
          ? `mailto:${(employer.contact_email ?? "").toString().trim()}`
          : "");

      const nowIso = new Date().toISOString();
      const { error: jobErr } = await supabase.from("job_posts").insert({
        employer_profile_id: employer.id,
        created_by: user.id,
        title,
        slug: slugify(title),
        location,
        work_type: workType,
        job_type: jobType,
        description: fullDescription,
        requirements,
        salary_min: Number.isFinite(min as number) ? min : null,
        salary_max: Number.isFinite(max as number) ? max : null,
        salary_currency: salaryCurrency,
        application_type: "external_url",
        // We don't show an application link in the UI right now.
        // Keep DB happy with a non-empty fallback if there are NOT NULL / CHECK constraints.
        application_url: fallbackUrl || "https://www.kvalifits.ee",
        status: "published",
        published_at: nowIso,
      });
      if (jobErr) throw jobErr;

      if (mode === "payment") {
        setInfo(t("publishSuccess"));
        router.push(`/${locale}/account/employer/jobs`);
        router.refresh();
        return;
      }

      setInfo(t("publishSuccess"));
      router.push(`/${locale}/account/employer/jobs`);
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err, t("saveFailed")));
    } finally {
      setLoading(false);
    }
  }

  function getErrorMessage(err: unknown, fallback: string) {
    if (!err) return fallback;
    if (err instanceof Error) return err.message || fallback;
    if (typeof err === "string") return err || fallback;
    try {
      const anyErr = err as any;
      return (
        anyErr?.message ||
        anyErr?.error_description ||
        anyErr?.error?.message ||
        fallback
      );
    } catch {
      return fallback;
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void saveDraft("publish");
      }}
      className="space-y-6"
    >
      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="text-sm font-medium text-white/85">{t("introTitle")}</div>
        <div className="mt-1 text-sm leading-relaxed text-white/60">{t("introBody")}</div>
      </div>

      {!employerProfileOk ? (
        <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 text-sm text-white/70">
          <div className="font-medium text-white/85">{t("employerProfileIncompleteTitle")}</div>
          <div className="mt-1 leading-relaxed text-white/60">{t("employerProfileIncompleteBody")}</div>
          <div className="mt-3">
            <Link href="/account/employer" className="text-sm font-medium text-white/80 underline hover:text-white">
              {t("goToCompanyProfile")}
            </Link>
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="text-sm font-medium text-white/85">{t("packageTitle")}</div>
        <div className="mt-1 text-sm text-white/60">{t("packageHint")}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.02] px-4 py-3">
            <div className="text-sm text-white/80">{t("package30")}</div>
            <input
              type="radio"
              name="package"
              value="30"
              checked={packageDays === 30}
              onChange={() => setPackageDays(30)}
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-white/[0.10] bg-white/[0.02] px-4 py-3">
            <div className="text-sm text-white/80">{t("package90")}</div>
            <input
              type="radio"
              name="package"
              value="90"
              checked={packageDays === 90}
              onChange={() => setPackageDays(90)}
            />
          </label>
        </div>
        <div className="mt-4">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
            onClick={() => void saveDraft("payment")}
          >
            {loading ? t("saving") : t("publishNow")}
          </Button>
          <div className="mt-2 text-xs text-white/50">{t("publishHint")}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("companyNameLabel")}</label>
          <Input value={companyName} readOnly aria-readonly="true" placeholder={t("companyNameAuto")} />
        </div>
        <div className="space-y-2">
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
          <label className="text-xs font-medium tracking-wide text-white/65">{t("workType")}</label>
          <select
            value={workType}
            onChange={(e) => setWorkType(e.target.value)}
            className="h-11 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/85 outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
          >
            <option value="on_site">{t("workTypeOnSite")}</option>
            <option value="hybrid">{t("workTypeHybrid")}</option>
            <option value="remote">{t("workTypeRemote")}</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("jobType")}</label>
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="h-11 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/85 outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
          >
            <option value="full_time">{t("jobTypeFullTime")}</option>
            <option value="part_time">{t("jobTypePartTime")}</option>
            <option value="contract">{t("jobTypeContract")}</option>
            <option value="internship">{t("jobTypeInternship")}</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("summary")}</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
            placeholder={t("summaryPlaceholder")}
          />
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
      {info ? (
        <div className="rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {info}
        </div>
      ) : null}

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
        {loading ? t("saving") : t("publishNow")}
      </Button>
    </form>
  );
}

