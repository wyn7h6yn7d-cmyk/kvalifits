"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  EXPERIENCE_LEVEL_VALUES,
  employerCoreComplete,
  isLikelyHttpUrl,
  jobMatchingReady,
  parseCommaList,
  parseRequirementLines,
} from "@/lib/matching/profileRules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/routing";
import { errorMessageFromUnknown } from "@/lib/utils";

type Props = {
  locale: string;
};

export function EmployerNewJobForm({ locale }: Props) {
  const t = useTranslations("jobs");
  const tOnb = useTranslations("onboarding");
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
  const [requirementLinesText, setRequirementLinesText] = useState("");
  const [requiredSkillsCsv, setRequiredSkillsCsv] = useState("");
  const [keywordsCsv, setKeywordsCsv] = useState("");
  const [experienceLevelRequired, setExperienceLevelRequired] = useState<
    (typeof EXPERIENCE_LEVEL_VALUES)[number] | ""
  >("");
  const [certificateRequirements, setCertificateRequirements] = useState("");
  const [applicationType, setApplicationType] = useState<"in_app" | "external_url">("in_app");
  const [applicationUrlExternal, setApplicationUrlExternal] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("EUR");
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
          .select("company_name,contact_email,company_description,location,industry")
          .eq("owner_user_id", user.id)
          .maybeSingle();
        if (!mounted) return;
        const name = (employer?.company_name ?? "").toString();
        setCompanyName(name);
        setEmployerProfileOk(employerCoreComplete(employer ?? null));
      } catch {
        // ignore
      }
    }
    void loadCompanyName();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  function validate(): string | null {
    if (!employerProfileOk) return t("employerProfileIncomplete");
    if (!title.trim()) return t("errTitleRequired");
    if (!location.trim()) return t("errLocationRequired");
    if (!workType.trim()) return t("errWorkTypeRequired");
    if (!jobType.trim()) return t("errJobTypeRequired");
    if (!summary.trim()) return t("errSummaryRequired");
    if (summary.trim().length < 20) return t("errShortSummary");
    if (!description.trim()) return t("errDescriptionRequired");
    if (description.trim().length < 40) return t("errDescriptionLength");

    const lines = parseRequirementLines(requirementLinesText);
    if (lines.length < 2) return t("errRequirementLines");

    const requiredSkills = parseCommaList(requiredSkillsCsv);
    if (requiredSkills.length < 1) return t("errRequiredSkills");

    const keywords = parseCommaList(keywordsCsv);
    if (keywords.length < 1) return t("errKeywords");

    if (!experienceLevelRequired) return t("errExperienceRequired");

    if (applicationType === "external_url" && !isLikelyHttpUrl(applicationUrlExternal.trim())) {
      return t("errApplicationUrlInvalid");
    }

    const appUrl =
      applicationType === "external_url"
        ? applicationUrlExternal.trim()
        : "https://www.kvalifits.ee";

    const ready = jobMatchingReady({
      title: title.trim(),
      location: location.trim(),
      work_type: workType,
      job_type: jobType,
      short_summary: summary.trim(),
      description: description.trim(),
      requirement_lines: lines,
      required_skills: requiredSkills,
      keywords,
      experience_level_required: experienceLevelRequired,
      certificate_requirements: certificateRequirements.trim() || null,
      application_type: applicationType,
      application_url: appUrl,
    });
    if (!ready) return t("jobMatchingIncomplete");

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

      const lines = parseRequirementLines(requirementLinesText);
      const requiredSkills = parseCommaList(requiredSkillsCsv);
      const keywords = parseCommaList(keywordsCsv);
      const requirementsJoined = lines.join("\n");

      const fallbackUrl =
        (employer.website ?? "").toString().trim() ||
        ((employer.contact_email ?? "").toString().trim()
          ? `mailto:${(employer.contact_email ?? "").toString().trim()}`
          : "");

      const applicationUrl =
        applicationType === "external_url"
          ? applicationUrlExternal.trim()
          : fallbackUrl || "https://www.kvalifits.ee";

      const nowIso = new Date().toISOString();
      const { error: jobErr } = await supabase.from("job_posts").insert({
        employer_profile_id: employer.id,
        created_by: user.id,
        title: title.trim(),
        slug: slugify(title),
        location: location.trim(),
        work_type: workType,
        job_type: jobType,
        short_summary: summary.trim(),
        description: description.trim(),
        requirements: requirementsJoined,
        requirement_lines: lines,
        required_skills: requiredSkills,
        keywords,
        experience_level_required: experienceLevelRequired,
        certificate_requirements: certificateRequirements.trim() || null,
        salary_min: Number.isFinite(min as number) ? min : null,
        salary_max: Number.isFinite(max as number) ? max : null,
        salary_currency: salaryCurrency,
        application_type: applicationType,
        application_url: applicationUrl,
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
      const raw = errorMessageFromUnknown(err, t("saveFailed"));
      const lower = raw.toLowerCase();
      const withHint =
        lower.includes("schema cache") || lower.includes("column of 'job_posts'")
          ? `${raw}\n\n${t("jobSchemaCacheCertFixHint")}`
          : lower.includes("enum application_type")
            ? `${raw}\n\n${t("jobApplicationTypeEnumFixHint")}`
            : raw;
      setError(withHint);
    } finally {
      setLoading(false);
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
        <div className="mt-3 text-xs leading-relaxed text-white/50">{t("jobFieldGuideIntro")}</div>
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
            required
            className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
            placeholder={t("summaryPlaceholder")}
          />
          <div className="text-xs text-white/45">{t("jobFieldGuideSummary")}</div>
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
        <div className="text-xs text-white/45">{t("jobFieldGuideDescription")}</div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">{t("jobRequirementLines")}</label>
        <textarea
          value={requirementLinesText}
          onChange={(e) => setRequirementLinesText(e.target.value)}
          required
          rows={5}
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
          placeholder={t("jobRequirementLinesHint")}
        />
        <div className="text-xs text-white/45">
          {t("jobRequirementLinesHelp")} {t("jobFieldGuideRequirementsExtra")}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("jobRequiredSkills")}</label>
          <Input
            value={requiredSkillsCsv}
            onChange={(e) => setRequiredSkillsCsv(e.target.value)}
            required
            placeholder={t("csvHintJobs")}
          />
          <div className="text-xs text-white/45">{t("jobFieldGuideSkills")}</div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("jobKeywords")}</label>
          <Input
            value={keywordsCsv}
            onChange={(e) => setKeywordsCsv(e.target.value)}
            required
            placeholder={t("csvHintJobs")}
          />
          <div className="text-xs text-white/45">{t("jobFieldGuideKeywords")}</div>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("jobExperienceRequired")}</label>
          <select
            value={experienceLevelRequired}
            onChange={(e) =>
              setExperienceLevelRequired(e.target.value as (typeof EXPERIENCE_LEVEL_VALUES)[number] | "")
            }
            required
            className="h-11 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/85 outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
          >
            <option value="">{tOnb("experienceLevelPlaceholder")}</option>
            {EXPERIENCE_LEVEL_VALUES.map((v) => (
              <option key={v} value={v}>
                {tOnb(`experienceLevelOption.${v}`)}
              </option>
            ))}
          </select>
          <div className="text-xs text-white/45">{t("jobFieldGuideExperience")}</div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">{t("jobCertRequirements")}</label>
        <textarea
          value={certificateRequirements}
          onChange={(e) => setCertificateRequirements(e.target.value)}
          rows={2}
          placeholder={t("jobCertRequirementsPlaceholder")}
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
        />
        <div className="text-xs text-white/45">{t("jobFieldGuideCert")}</div>
      </div>

      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="text-sm font-medium text-white/85">{t("applicationType")}</div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/75">
            <input
              type="radio"
              name="applicationType"
              checked={applicationType === "in_app"}
              onChange={() => setApplicationType("in_app")}
              className="h-4 w-4 border-white/[0.20] bg-white/[0.03]"
            />
            {t("applicationTypeInApp")}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/75">
            <input
              type="radio"
              name="applicationType"
              checked={applicationType === "external_url"}
              onChange={() => setApplicationType("external_url")}
              className="h-4 w-4 border-white/[0.20] bg-white/[0.03]"
            />
            {t("applicationTypeExternalUrl")}
          </label>
        </div>
        {applicationType === "external_url" ? (
          <div className="mt-4 space-y-2">
            <label className="text-xs font-medium tracking-wide text-white/65">{t("applicationUrl")}</label>
            <Input
              value={applicationUrlExternal}
              onChange={(e) => setApplicationUrlExternal(e.target.value)}
              required
              placeholder="https://…"
              inputMode="url"
            />
          </div>
        ) : null}
        <div className="mt-3 text-xs text-white/45">{t("jobFieldGuideApplication")}</div>
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
        <div className="text-xs text-white/45 sm:col-span-3">{t("jobFieldGuideSalary")}</div>
      </div>

      {error ? (
        <div className="whitespace-pre-wrap rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
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
