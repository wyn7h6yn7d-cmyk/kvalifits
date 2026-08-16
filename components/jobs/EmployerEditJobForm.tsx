"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  EXPERIENCE_LEVEL_VALUES,
  JOB_EXPERIENCE_LEVEL_VALUES,
  jobMatchingReady,
  parseCommaList,
} from "@/lib/matching/profileRules";
import { resolveJobRequirements, syncRequirementLinesFromStructured, type JobRequirementItem } from "@/lib/jobs/jobRequirements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessageFromUnknown } from "@/lib/utils";
import {
  JobWorkConditionsFields,
  parseOptionalHours,
  timeOrNull,
  type JobWorkConditionsFormValue,
} from "@/components/jobs/JobWorkConditionsFields";
import { JobYoungSeekerAutoHint } from "@/components/jobs/JobYoungSeekerAutoHint";
import { jobPassesYoungSeekerAutoEligibility } from "@/lib/employmentRules";
import { JobRequirementsEditor } from "@/components/jobs/JobRequirementsEditor";
import {
  calendarDateInTallinn,
  endOfDayTallinnIso,
  toCalendarDate,
} from "@/lib/jobs/jobLifecycle";

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
  job_requirements?: unknown;
  required_skills: string[] | null;
  keywords: string[] | null;
  experience_level_required: string | null;
  certificate_requirements: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  application_url: string | null;
  application_type: string | null;
  status: string;
  weekly_hours?: number | null;
  daily_hours?: number | null;
  shift_start?: string | null;
  shift_end?: string | null;
  includes_night_work?: boolean | null;
  is_hazardous_work?: boolean | null;
  published_at?: string | null;
  application_deadline?: string | null;
  expires_at?: string | null;
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
  const [requirementItems, setRequirementItems] = useState<JobRequirementItem[]>(() => {
    const resolved = resolveJobRequirements({
      job_requirements: initialJob.job_requirements,
      requirement_lines: initialJob.requirement_lines,
      requirements: initialJob.requirements,
    });
    return resolved.length
      ? resolved
      : [
          { text: "", priority: "mandatory" },
          { text: "", priority: "recommended" },
        ];
  });
  const [requiredSkillsCsv, setRequiredSkillsCsv] = useState(
    (initialJob.required_skills ?? []).filter(Boolean).join(", ")
  );
  const [keywordsCsv, setKeywordsCsv] = useState((initialJob.keywords ?? []).filter(Boolean).join(", "));
  const [experienceLevelRequired, setExperienceLevelRequired] = useState<
    (typeof JOB_EXPERIENCE_LEVEL_VALUES)[number] | ""
  >(() => {
    const v = initialJob.experience_level_required ?? "";
    return (JOB_EXPERIENCE_LEVEL_VALUES as readonly string[]).includes(v)
      ? (v as (typeof JOB_EXPERIENCE_LEVEL_VALUES)[number])
      : "";
  });
  const [certificateRequirements, setCertificateRequirements] = useState(
    initialJob.certificate_requirements ?? ""
  );
  const [salaryMin, setSalaryMin] = useState(initialJob.salary_min?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(initialJob.salary_max?.toString() ?? "");
  const [salaryCurrency, setSalaryCurrency] = useState(initialJob.salary_currency ?? "EUR");
  const [workConditions, setWorkConditions] = useState<JobWorkConditionsFormValue>(() => ({
    weeklyHours: initialJob.weekly_hours != null ? String(initialJob.weekly_hours) : "",
    dailyHours: initialJob.daily_hours != null ? String(initialJob.daily_hours) : "",
    shiftStart: (initialJob.shift_start ?? "").toString().slice(0, 5),
    shiftEnd: (initialJob.shift_end ?? "").toString().slice(0, 5),
    includesNightWork: Boolean(initialJob.includes_night_work),
    isHazardousWork: Boolean(initialJob.is_hazardous_work),
  }));
  const [applicationDeadline, setApplicationDeadline] = useState(
    () => toCalendarDate(initialJob.application_deadline) ?? ""
  );
  const [expiresOn, setExpiresOn] = useState(() => toCalendarDate(initialJob.expires_at) ?? "");

  function validate(): string | null {
    if (!title.trim()) return t("errTitleRequired");
    if (!location.trim()) return t("errLocationRequired");
    if (!shortSummary.trim()) return t("errSummaryRequired");
    if (shortSummary.trim().length < 20) return t("errShortSummary");
    if (!description.trim()) return t("errDescriptionRequired");
    if (description.trim().length < 40) return t("errDescriptionLength");
    const synced = syncRequirementLinesFromStructured(requirementItems);
    const lines = synced.requirement_lines;
    if (lines.length < 2) return t("errRequirementLines");
    const requiredSkills = parseCommaList(requiredSkillsCsv);
    if (requiredSkills.length < 1) return t("errRequiredSkills");
    const keywords = parseCommaList(keywordsCsv);
    if (keywords.length < 1) return t("errKeywords");
    if (!experienceLevelRequired) return t("errExperienceRequired");
    if (!applicationDeadline.trim()) return t("errApplicationDeadlineRequired");
    if (!expiresOn.trim()) return t("errExpiresRequired");
    if (applicationDeadline > expiresOn) return t("errDeadlineAfterExpiry");
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
      application_type: "in_app",
      application_url: null,
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
      const synced = syncRequirementLinesFromStructured(requirementItems);
      const lines = synced.requirement_lines;
      const requiredSkills = parseCommaList(requiredSkillsCsv);
      const keywords = parseCommaList(keywordsCsv);
      const { error } = await supabase
        .from("job_posts")
        .update({
          title: title.trim(),
          location: location.trim(),
          work_type: workType,
          job_type: jobType,
          short_summary: shortSummary.trim(),
          description: description.trim(),
          requirements: synced.requirements,
          requirement_lines: lines,
          job_requirements: synced.job_requirements,
          required_skills: requiredSkills,
          keywords,
          experience_level_required: experienceLevelRequired,
          certificate_requirements: certificateRequirements.trim() || null,
          weekly_hours: parseOptionalHours(workConditions.weeklyHours),
          daily_hours: parseOptionalHours(workConditions.dailyHours),
          shift_start: timeOrNull(workConditions.shiftStart),
          shift_end: timeOrNull(workConditions.shiftEnd),
          includes_night_work: workConditions.includesNightWork,
          is_hazardous_work: workConditions.isHazardousWork,
          suitable_for_ages_16_17: jobPassesYoungSeekerAutoEligibility({
            weeklyHours: parseOptionalHours(workConditions.weeklyHours),
            dailyHours: parseOptionalHours(workConditions.dailyHours),
            shiftStart: timeOrNull(workConditions.shiftStart),
            shiftEnd: timeOrNull(workConditions.shiftEnd),
            includesNightWork: workConditions.includesNightWork,
            isHazardousWork: workConditions.isHazardousWork,
            jobType,
          }),
          salary_min: Number.isFinite(min as number) ? min : null,
          salary_max: Number.isFinite(max as number) ? max : null,
          salary_currency: salaryCurrency,
          application_type: "in_app",
          application_url: null,
          application_deadline: applicationDeadline.trim(),
          expires_at: endOfDayTallinnIso(expiresOn.trim()),
        })
        .eq("id", initialJob.id);
      if (error) throw error;

      // If expiry is already past, mark inactive (do not delete).
      if (expiresOn.trim() < calendarDateInTallinn() && initialJob.status === "published") {
        await supabase.from("job_posts").update({ status: "archived" }).eq("id", initialJob.id);
      }

      router.push(`/${locale}/account/employer`);
      router.refresh();
    } catch (err) {
      const raw = errorMessageFromUnknown(err, t("unknownError"));
      const lower = raw.toLowerCase();
      const withHint =
        lower.includes("schema cache") || lower.includes("column of 'job_posts'")
          ? `${raw}\n\n${t("jobSchemaCacheCertFixHint")}\n\n${t("jobWorkConditionsFixHint")}\n\n${t("youngSeekerAutoFixHint")}\n\n${t("jobRequirementsPriorityFixHint")}`
          : lower.includes("enum application_type")
            ? `${raw}\n\n${t("jobApplicationTypeEnumFixHint")}`
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

      <JobWorkConditionsFields value={workConditions} onChange={setWorkConditions} />

      <JobYoungSeekerAutoHint workConditions={workConditions} jobType={jobType} />

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

      <JobRequirementsEditor value={requirementItems} onChange={setRequirementItems} disabled={loading} />

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
              setExperienceLevelRequired(e.target.value as (typeof JOB_EXPERIENCE_LEVEL_VALUES)[number] | "")
            }
            required
            className="h-11 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/85 outline-none backdrop-blur-md transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
          >
            <option value="">{tOnb("experienceLevelPlaceholder")}</option>
            {JOB_EXPERIENCE_LEVEL_VALUES.map((v) => (
              <option key={v} value={v}>
                {tOnb(`experienceLevelOption.${v}`)}
              </option>
            ))}
          </select>
          <div className="text-xs text-white/45">{t("jobFieldGuideExperience")}</div>
          {experienceLevelRequired === "not_required" ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs leading-relaxed text-emerald-100/90">
              {t("jobExperienceNotRequiredHint")}
            </div>
          ) : null}
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
        <div className="text-sm font-medium text-white/85">{t("applicationKvalifitsOnlyTitle")}</div>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{t("applicationKvalifitsOnlyBody")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="edit-application-deadline">
            {t("applicationDeadlineLabel")}
          </label>
          <Input
            id="edit-application-deadline"
            type="date"
            value={applicationDeadline}
            onChange={(e) => setApplicationDeadline(e.target.value)}
            required
          />
          <p className="text-xs leading-relaxed text-white/45">{t("applicationDeadlineHint")}</p>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="edit-expires-on">
            {t("expiresOnLabel")}
          </label>
          <Input
            id="edit-expires-on"
            type="date"
            value={expiresOn}
            onChange={(e) => setExpiresOn(e.target.value)}
            required
          />
          <p className="text-xs leading-relaxed text-white/45">{t("expiresOnHint")}</p>
        </div>
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

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={loading}
        loadingText={t("saving")}
      >
        {t("save")}
      </Button>
    </form>
  );
}
