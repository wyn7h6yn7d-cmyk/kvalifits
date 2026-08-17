"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  EXPERIENCE_LEVEL_VALUES,
  JOB_EXPERIENCE_LEVEL_VALUES,
  employerCoreComplete,
  jobMatchingReady,
  parseCommaList,
} from "@/lib/matching/profileRules";
import { syncRequirementLinesFromStructured, type JobRequirementItem } from "@/lib/jobs/jobRequirements";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/routing";
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
  JOB_SALARY_MODE_VALUES,
  JOB_SALARY_PERIOD_VALUES,
  JOB_SALARY_TAX_VALUES,
  parseJobSalaryForPublish,
  type JobSalaryMode,
  type JobSalaryPeriod,
  type JobSalaryTax,
} from "@/lib/jobs/jobSalary";
import {
  buildPublishLifecycleDates,
  calendarDateInTallinn,
  type ListingPackageDays,
} from "@/lib/jobs/jobLifecycle";

type Props = {
  locale: string;
};

const selectClassName =
  "h-11 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/85 outline-none transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]";

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
  const [requirementItems, setRequirementItems] = useState<JobRequirementItem[]>([
    { text: "", priority: "mandatory" },
    { text: "", priority: "recommended" },
  ]);
  const [requiredSkillsCsv, setRequiredSkillsCsv] = useState("");
  const [keywordsCsv, setKeywordsCsv] = useState("");
  const [experienceLevelRequired, setExperienceLevelRequired] = useState<
    (typeof JOB_EXPERIENCE_LEVEL_VALUES)[number] | ""
  >("");
  const [certificateRequirements, setCertificateRequirements] = useState("");
  const [salaryMode, setSalaryMode] = useState<JobSalaryMode | "">("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [salaryTax, setSalaryTax] = useState<JobSalaryTax>("bruto");
  const [salaryPeriod, setSalaryPeriod] = useState<JobSalaryPeriod>("month");
  const [salaryCurrency] = useState("EUR");
  const [packageDays, setPackageDays] = useState<ListingPackageDays>(30);
  const [applicationDeadline, setApplicationDeadline] = useState(() =>
    // Default: same as 30-day package expiry day
    (() => {
      const { application_deadline } = buildPublishLifecycleDates({ packageDays: 30 });
      return application_deadline;
    })()
  );
  const [employerProfileOk, setEmployerProfileOk] = useState(true);
  const [workConditions, setWorkConditions] = useState<JobWorkConditionsFormValue>({
    weeklyHours: "",
    dailyHours: "",
    shiftStart: "",
    shiftEnd: "",
    includesNightWork: false,
    isHazardousWork: false,
  });

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

    const synced = syncRequirementLinesFromStructured(requirementItems);
    const lines = synced.requirement_lines;
    if (lines.length < 2) return t("errRequirementLines");

    const requiredSkills = parseCommaList(requiredSkillsCsv);
    if (requiredSkills.length < 1) return t("errRequiredSkills");

    const keywords = parseCommaList(keywordsCsv);
    if (keywords.length < 1) return t("errKeywords");

    if (!experienceLevelRequired) return t("errExperienceRequired");

    if (!applicationDeadline.trim()) return t("errApplicationDeadlineRequired");
    if (applicationDeadline < calendarDateInTallinn()) return t("errApplicationDeadlinePast");

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
      application_type: "in_app",
      application_url: null,
    });
    if (!ready) return t("jobMatchingIncomplete");

    const salaryParsed = parseJobSalaryForPublish({
      mode: salaryMode,
      min: salaryMin,
      max: salaryMax,
      tax: salaryTax,
      period: salaryPeriod,
      currency: salaryCurrency,
    });
    if (!salaryParsed.ok) return t(salaryParsed.error as "errSalaryModeRequired");

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

      const salaryParsed = parseJobSalaryForPublish({
        mode: salaryMode,
        min: salaryMin,
        max: salaryMax,
        tax: salaryTax,
        period: salaryPeriod,
        currency: salaryCurrency,
      });
      if (!salaryParsed.ok) throw new Error(t(salaryParsed.error as "errSalaryModeRequired"));
      const salary = salaryParsed.value;

      const synced = syncRequirementLinesFromStructured(requirementItems);
      const lines = synced.requirement_lines;
      const requiredSkills = parseCommaList(requiredSkillsCsv);
      const keywords = parseCommaList(keywordsCsv);

      const lifecycle = buildPublishLifecycleDates({
        publishedAt: new Date(),
        packageDays,
        applicationDeadline,
      });
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
        // Derived from employment rules — never a manual employer toggle.
        suitable_for_ages_16_17: jobPassesYoungSeekerAutoEligibility({
          weeklyHours: parseOptionalHours(workConditions.weeklyHours),
          dailyHours: parseOptionalHours(workConditions.dailyHours),
          shiftStart: timeOrNull(workConditions.shiftStart),
          shiftEnd: timeOrNull(workConditions.shiftEnd),
          includesNightWork: workConditions.includesNightWork,
          isHazardousWork: workConditions.isHazardousWork,
          jobType,
        }),
        salary_mode: salary.mode,
        salary_min: salary.salary_min,
        salary_max: salary.salary_max,
        salary_tax: salary.salary_tax,
        salary_period: salary.salary_period,
        salary_currency: salary.salary_currency,
        application_type: "in_app",
        application_url: null,
        status: "published",
        published_at: lifecycle.published_at,
        application_deadline: lifecycle.application_deadline,
        expires_at: lifecycle.expires_at,
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
          ? `${raw}\n\n${t("jobSchemaCacheCertFixHint")}\n\n${t("jobWorkConditionsFixHint")}\n\n${t("youngSeekerAutoFixHint")}\n\n${t("jobRequirementsPriorityFixHint")}\n\n${t("jobSalaryStructureFixHint")}\n\n${t("jobLifecycleDatesFixHint")}`
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

      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6 space-y-4">
        <div>
          <div className="text-sm font-medium text-white/85">{t("packageTitle")}</div>
          <div className="mt-1 text-sm text-white/60">{t("packageHint")}</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setPackageDays(30);
              const next = buildPublishLifecycleDates({ packageDays: 30 });
              setApplicationDeadline(next.application_deadline);
            }}
            className={
              packageDays === 30
                ? "rounded-2xl border border-white/25 bg-white/[0.08] px-4 py-3 text-left text-sm text-white/90"
                : "rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-left text-sm text-white/70 hover:bg-white/[0.05]"
            }
          >
            {t("package30")}
          </button>
          <button
            type="button"
            onClick={() => {
              setPackageDays(90);
              const next = buildPublishLifecycleDates({ packageDays: 90 });
              setApplicationDeadline(next.application_deadline);
            }}
            className={
              packageDays === 90
                ? "rounded-2xl border border-white/25 bg-white/[0.08] px-4 py-3 text-left text-sm text-white/90"
                : "rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-left text-sm text-white/70 hover:bg-white/[0.05]"
            }
          >
            {t("package90")}
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="job-application-deadline">
            {t("applicationDeadlineLabel")}
          </label>
          <Input
            id="job-application-deadline"
            type="date"
            value={applicationDeadline}
            min={calendarDateInTallinn()}
            onChange={(e) => setApplicationDeadline(e.target.value)}
            required
          />
          <p className="text-xs leading-relaxed text-white/45">{t("applicationDeadlineHint")}</p>
        </div>
        <div>
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            loadingText={t("saving")}
            onClick={() => void saveDraft("payment")}
          >
            {t("publishNow")}
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
            className="h-11 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/85 outline-none transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
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
            className="h-11 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/85 outline-none transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
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
            className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
            placeholder={t("summaryPlaceholder")}
          />
          <div className="text-xs text-white/45">{t("jobFieldGuideSummary")}</div>
        </div>
      </div>

      <JobWorkConditionsFields value={workConditions} onChange={setWorkConditions} />

      <JobYoungSeekerAutoHint workConditions={workConditions} jobType={jobType} />

      <div className="space-y-2">
        <label className="text-xs font-medium tracking-wide text-white/65">
          {t("description")}
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={6}
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
        />
        <div className="text-xs text-white/45">{t("jobFieldGuideDescription")}</div>
      </div>

      <JobRequirementsEditor value={requirementItems} onChange={setRequirementItems} disabled={loading} />

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
              setExperienceLevelRequired(e.target.value as (typeof JOB_EXPERIENCE_LEVEL_VALUES)[number] | "")
            }
            required
            className="h-11 w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 text-sm text-white/85 outline-none transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
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
          className="w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white/85 placeholder:text-white/35 shadow-[0_1px_0_rgba(255,255,255,0.04)] outline-none transition-colors focus:border-white/[0.18] focus:bg-white/[0.04]"
        />
        <div className="text-xs text-white/45">{t("jobFieldGuideCert")}</div>
      </div>

      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6">
        <div className="text-sm font-medium text-white/85">{t("applicationKvalifitsOnlyTitle")}</div>
        <p className="mt-2 text-sm leading-relaxed text-white/60">{t("applicationKvalifitsOnlyBody")}</p>
      </div>

      <div className="rounded-3xl border border-white/[0.10] bg-white/[0.03] p-5 sm:p-6 space-y-4">
        <div>
          <div className="text-sm font-medium text-white/85">{t("jobSalaryTitle")}</div>
          <p className="mt-1 text-sm leading-relaxed text-white/55">{t("jobSalaryRequiredHint")}</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="job-salary-mode">
            {t("jobSalaryMode")}
          </label>
          <select
            id="job-salary-mode"
            value={salaryMode}
            onChange={(e) => setSalaryMode(e.target.value as JobSalaryMode | "")}
            required
            className={selectClassName}
          >
            <option value="">{t("applySelectPlaceholder")}</option>
            {JOB_SALARY_MODE_VALUES.map((v) => (
              <option key={v} value={v}>
                {t(`jobSalaryModeOption.${v}`)}
              </option>
            ))}
          </select>
        </div>

        {salaryMode === "fixed" ? (
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="job-salary-amount">
              {t("jobSalaryAmount")}
            </label>
            <Input
              id="job-salary-amount"
              value={salaryMin}
              onChange={(e) => {
                setSalaryMin(e.target.value);
                setSalaryMax(e.target.value);
              }}
              inputMode="decimal"
              required
              placeholder={t("jobSalaryAmountPlaceholder")}
            />
          </div>
        ) : null}

        {salaryMode === "range" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="job-salary-min">
                {t("jobSalaryMin")}
              </label>
              <Input
                id="job-salary-min"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                inputMode="decimal"
                required
                placeholder={t("jobSalaryMinPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="job-salary-max">
                {t("jobSalaryMax")}
              </label>
              <Input
                id="job-salary-max"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                inputMode="decimal"
                required
                placeholder={t("jobSalaryMaxPlaceholder")}
              />
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="job-salary-tax">
              {t("jobSalaryTax")}
            </label>
            <select
              id="job-salary-tax"
              value={salaryTax}
              onChange={(e) => setSalaryTax(e.target.value as JobSalaryTax)}
              required
              className={selectClassName}
            >
              {JOB_SALARY_TAX_VALUES.map((v) => (
                <option key={v} value={v}>
                  {t(`jobSalaryTaxOption.${v}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-wide text-white/65" htmlFor="job-salary-period">
              {t("jobSalaryPeriod")}
            </label>
            <select
              id="job-salary-period"
              value={salaryPeriod}
              onChange={(e) => setSalaryPeriod(e.target.value as JobSalaryPeriod)}
              required
              className={selectClassName}
            >
              {JOB_SALARY_PERIOD_VALUES.map((v) => (
                <option key={v} value={v}>
                  {t(`jobSalaryPeriodOption.${v}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-white/45">{t("jobFieldGuideSalary")}</div>
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

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={loading}
        loadingText={t("saving")}
      >
        {t("publishNow")}
      </Button>
    </form>
  );
}
