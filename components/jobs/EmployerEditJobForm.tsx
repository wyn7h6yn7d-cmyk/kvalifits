"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  EXPERIENCE_LEVEL_VALUES,
  isLikelyHttpUrl,
  jobMatchingReady,
  parseCommaList,
  parseRequirementLines,
} from "@/lib/matching/profileRules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessageFromUnknown } from "@/lib/utils";

type Job = {
  id: string;
  title: string;
  location: string;
  work_type: string;
  job_type: string;
  short_summary: string | null;
  description: string;
  requirements: string;
  requirement_lines: string[] | null;
  required_skills: string[] | null;
  keywords: string[] | null;
  experience_level_required: string | null;
  certificate_requirements: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  application_url: string;
  application_type: string | null;
  status: string;
};

type Props = {
  locale: string;
  initialJob: Job;
};

function extractSummary(description: string | null | undefined) {
  const raw = (description ?? "").toString().trim();
  if (!raw) return "";
  const firstBlock = raw.split(/\n\s*\n/)[0]?.trim() ?? "";
  const cleaned = firstBlock.replace(/^(Kokkuvõte|Summary)\s*:\s*/i, "").trim();
  return cleaned || "";
}

export function EmployerEditJobForm({ locale, initialJob }: Props) {
  const t = useTranslations("jobs");
  const tOnb = useTranslations("onboarding");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const linesFromDb =
    Array.isArray(initialJob.requirement_lines) && initialJob.requirement_lines.length
      ? initialJob.requirement_lines.join("\n")
      : parseRequirementLines(initialJob.requirements ?? "").join("\n") ||
        (initialJob.requirements ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initialJob.title);
  const [location, setLocation] = useState(initialJob.location);
  const [workType, setWorkType] = useState(initialJob.work_type);
  const [jobType, setJobType] = useState(initialJob.job_type);
  const [shortSummary, setShortSummary] = useState(
    (initialJob.short_summary ?? "").trim() || extractSummary(initialJob.description)
  );
  const [description, setDescription] = useState(initialJob.description);
  const [requirementLinesText, setRequirementLinesText] = useState(linesFromDb);
  const [requiredSkillsCsv, setRequiredSkillsCsv] = useState(
    (initialJob.required_skills ?? []).filter(Boolean).join(", ")
  );
  const [keywordsCsv, setKeywordsCsv] = useState((initialJob.keywords ?? []).filter(Boolean).join(", "));
  const [experienceLevelRequired, setExperienceLevelRequired] = useState<
    (typeof EXPERIENCE_LEVEL_VALUES)[number] | ""
  >(() => {
    const v = initialJob.experience_level_required ?? "";
    return (EXPERIENCE_LEVEL_VALUES as readonly string[]).includes(v)
      ? (v as (typeof EXPERIENCE_LEVEL_VALUES)[number])
      : "";
  });
  const [certificateRequirements, setCertificateRequirements] = useState(
    initialJob.certificate_requirements ?? ""
  );
  const [applicationType, setApplicationType] = useState<"in_app" | "external_url">(
    initialJob.application_type === "external_url" ? "external_url" : "in_app"
  );
  const [applicationUrlExternal, setApplicationUrlExternal] = useState(
    initialJob.application_type === "external_url" ? initialJob.application_url ?? "" : ""
  );
  const [salaryMin, setSalaryMin] = useState(initialJob.salary_min?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(initialJob.salary_max?.toString() ?? "");
  const [salaryCurrency, setSalaryCurrency] = useState(initialJob.salary_currency ?? "EUR");

  function validate(): string | null {
    if (!title.trim()) return t("errTitleRequired");
    if (!location.trim()) return t("errLocationRequired");
    if (!shortSummary.trim()) return t("errSummaryRequired");
    if (shortSummary.trim().length < 20) return t("errShortSummary");
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
      applicationType === "external_url" ? applicationUrlExternal.trim() : "https://www.kvalifits.ee";
    const ok = jobMatchingReady({
      title: title.trim(),
      location: location.trim(),
      work_type: workType,
      job_type: jobType,
      short_summary: shortSummary.trim(),
      description: description.trim(),
      requirement_lines: lines,
      required_skills: requiredSkills,
      keywords,
      experience_level_required: experienceLevelRequired,
      certificate_requirements: certificateRequirements.trim() || null,
      application_type: applicationType,
      application_url: appUrl,
    });
    if (!ok) return t("jobMatchingIncomplete");
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const min = salaryMin.trim() ? Number(salaryMin) : null;
      const max = salaryMax.trim() ? Number(salaryMax) : null;
      const lines = parseRequirementLines(requirementLinesText);
      const requiredSkills = parseCommaList(requiredSkillsCsv);
      const keywords = parseCommaList(keywordsCsv);
      const requirementsJoined = lines.join("\n");
      const appUrl =
        applicationType === "external_url" ? applicationUrlExternal.trim() : "https://www.kvalifits.ee";

      const { error } = await supabase
        .from("job_posts")
        .update({
          title: title.trim(),
          location: location.trim(),
          work_type: workType,
          job_type: jobType,
          short_summary: shortSummary.trim(),
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
          application_url: appUrl,
        })
        .eq("id", initialJob.id);
      if (error) throw error;

      router.push(`/${locale}/account/employer`);
      router.refresh();
    } catch (err) {
      const raw = errorMessageFromUnknown(err, t("unknownError"));
      const lower = raw.toLowerCase();
      const withHint =
        lower.includes("schema cache") || lower.includes("column of 'job_posts'")
          ? `${raw}\n\n${t("jobSchemaCacheCertFixHint")}`
          : raw;
      setError(withHint);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-xs leading-relaxed text-white/50">
        {t("jobFieldGuideEditLead")}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("title")}</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("location")}</label>
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
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">{t("summary")}</label>
        <textarea
          value={shortSummary}
          onChange={(e) => setShortSummary(e.target.value)}
          rows={2}
          required
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
          placeholder={t("summaryPlaceholder")}
        />
        <div className="text-xs text-white/45">{t("jobFieldGuideSummary")}</div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">{t("description")}</label>
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
          <Input value={requiredSkillsCsv} onChange={(e) => setRequiredSkillsCsv(e.target.value)} required />
          <div className="text-xs text-white/45">{t("jobFieldGuideSkills")}</div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65">{t("jobKeywords")}</label>
          <Input value={keywordsCsv} onChange={(e) => setKeywordsCsv(e.target.value)} required />
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
              name="applicationTypeEdit"
              checked={applicationType === "in_app"}
              onChange={() => setApplicationType("in_app")}
              className="h-4 w-4 border-white/[0.20] bg-white/[0.03]"
            />
            {t("applicationTypeInApp")}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/75">
            <input
              type="radio"
              name="applicationTypeEdit"
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
          <label className="text-xs font-medium tracking-wide text-white/65">{t("salaryCurrency")}</label>
          <Input value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)} />
        </div>
        <div className="text-xs text-white/45 sm:col-span-3">{t("jobFieldGuideSalary")}</div>
      </div>

      {error ? (
        <div className="whitespace-pre-wrap rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-sm text-white/75">
          {error}
        </div>
      ) : null}

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
        {loading ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
