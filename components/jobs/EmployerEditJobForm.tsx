"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  JOB_EXPERIENCE_LEVEL_VALUES,
  employerCoreComplete,
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
import { TaxonomyChipField } from "@/components/taxonomy/TaxonomyChipField";
import { TaxonomySelect } from "@/components/taxonomy/TaxonomySelect";
import { jobPassesYoungSeekerAutoEligibility } from "@/lib/employmentRules";
import { JobRequirementsEditor } from "@/components/jobs/JobRequirementsEditor";
import { JobLinesEditor } from "@/components/jobs/JobLinesEditor";
import { EmployerJobFeaturedPromo } from "@/components/jobs/EmployerJobFeaturedPromo";
import {
  isJobContentLinesColumnError,
  jobContentLinesI18nError,
  parseJobContentLines,
  sanitizeJobContentLines,
  stripJobContentLineColumns,
  validateJobContentLines,
} from "@/lib/jobs/jobContentLines";
import {
  calendarDateInTallinn,
  endOfDayTallinnIso,
  inferListingPackageDays,
  toCalendarDate,
  buildPublishLifecycleDates,
} from "@/lib/jobs/jobLifecycle";
import { validateDraftSave, validateJobForPublish } from "@/lib/jobs/jobPublishValidation";
import { isTaxonomyColumnError } from "@/lib/taxonomy/columnMissing";
import { findTerm } from "@/lib/taxonomy/labels";
import { jobTaxonomyWriteColumns, stripTaxonomyWriteColumns } from "@/lib/taxonomy/jobWrite";
import { mergeLegacyText, partitionTaxonomyValues, splitCsv, suggestedSkillIds } from "@/lib/taxonomy/resolve";
import { useTaxonomyCatalog } from "@/lib/taxonomy/useTaxonomyCatalog";

type Job = {
  id: string;
  title: string;
  location: string;
  work_type: string;
  job_type: string;
  short_summary: string | null;
  description: string;
  duty_lines?: string[] | null;
  benefit_lines?: string[] | null;
  requirements: string;
  requirement_lines: string[] | null;
  job_requirements?: unknown;
  required_skills: string[] | null;
  keywords: string[] | null;
  experience_level_required: string | null;
  certificate_requirements: string | null;
  languages?: string[] | null;
  industry_id?: string | null;
  profession_id?: string | null;
  skill_ids?: string[] | null;
  certificate_ids?: string[] | null;
  language_ids?: string[] | null;
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
  is_featured?: boolean | null;
  featured_from?: string | null;
  featured_until?: string | null;
};

type Props = {
  locale: string;
  initialJob: Job;
  publishAttempted?: boolean;
};

function extractSummary(description: string | null | undefined) {
  const raw = (description ?? "").toString().trim();
  if (!raw) return "";
  const firstBlock = raw.split(/\n\s*\n/)[0]?.trim() ?? "";
  const cleaned = firstBlock.replace(/^(Kokkuvõte|Summary)\s*:\s*/i, "").trim();
  return cleaned || "";
}

export function EmployerEditJobForm({ locale, initialJob, publishAttempted = false }: Props) {
  const t = useTranslations("jobs");
  const tOnb = useTranslations("onboarding");
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    publishAttempted ? t("publishValidationNeeded") : null,
  );

  const { catalog, available: taxonomyAvailable } = useTaxonomyCatalog();

  const [title, setTitle] = useState(initialJob.title);
  const [location, setLocation] = useState(initialJob.location);
  const [workType, setWorkType] = useState(initialJob.work_type);
  const [jobType, setJobType] = useState(initialJob.job_type);
  const [shortSummary, setShortSummary] = useState(
    (initialJob.short_summary ?? "").trim() || extractSummary(initialJob.description)
  );
  const [description, setDescription] = useState(initialJob.description);
  const [dutyLines, setDutyLines] = useState<string[]>(() => {
    const lines = parseJobContentLines(initialJob.duty_lines);
    return lines.length ? lines : [""];
  });
  const [benefitLines, setBenefitLines] = useState<string[]>(() => parseJobContentLines(initialJob.benefit_lines));
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
  const [industryId, setIndustryId] = useState(initialJob.industry_id ?? "");
  const [professionId, setProfessionId] = useState(initialJob.profession_id ?? "");
  const [skillIds, setSkillIds] = useState<string[]>(initialJob.skill_ids ?? []);
  const [skillLeftover, setSkillLeftover] = useState<string[]>([]);
  const [certificateIds, setCertificateIds] = useState<string[]>(initialJob.certificate_ids ?? []);
  const [certificateLeftover, setCertificateLeftover] = useState<string[]>([]);
  const [languageIds, setLanguageIds] = useState<string[]>(initialJob.language_ids ?? []);
  const [hydratedTaxonomy, setHydratedTaxonomy] = useState(false);
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

  useEffect(() => {
    if (!taxonomyAvailable || hydratedTaxonomy) return;
    const skills = partitionTaxonomyValues(
      catalog,
      "skill",
      initialJob.skill_ids,
      initialJob.required_skills,
    );
    const certs = partitionTaxonomyValues(
      catalog,
      "certificate",
      initialJob.certificate_ids,
      splitCsv(initialJob.certificate_requirements),
    );
    const langs = partitionTaxonomyValues(
      catalog,
      "language",
      initialJob.language_ids,
      initialJob.languages,
    );
    setSkillIds(skills.ids);
    setSkillLeftover(skills.leftover);
    setCertificateIds(certs.ids);
    setCertificateLeftover(certs.leftover);
    setLanguageIds(langs.ids);
    if (!professionId && initialJob.title) {
      const mapped = catalog.aliases.find(
        (a) => a.kind === "profession" && a.alias_norm === initialJob.title.trim().toLowerCase(),
      );
      if (mapped) setProfessionId(mapped.term_id);
    }
    setHydratedTaxonomy(true);
  }, [taxonomyAvailable, hydratedTaxonomy, catalog, initialJob, professionId]);

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
    const requiredSkills = taxonomyAvailable
      ? mergeLegacyText(catalog, "skill", skillIds, skillLeftover, "et")
      : parseCommaList(requiredSkillsCsv);
    if (requiredSkills.length < 1) return t("errRequiredSkills");
    if (taxonomyAvailable && !professionId) return t("errProfessionRequired");
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

  async function persist(intent: "save" | "draft" | "preview" | "publish") {
    const isDraft = initialJob.status !== "published";
    const needsFullValidation =
      intent === "publish" || (!isDraft && (intent === "save" || intent === "preview"));
    if (needsFullValidation) {
      const v = validate();
      if (v) {
        setError(v);
        return;
      }
      const duties = validateJobContentLines(dutyLines);
      if (!duties.ok) {
        setError(t(jobContentLinesI18nError(duties.error)));
        return;
      }
      const benefits = validateJobContentLines(benefitLines);
      if (!benefits.ok) {
        setError(t(jobContentLinesI18nError(benefits.error)));
        return;
      }
    } else {
      const draft = validateDraftSave(title);
      if (!draft.ok) {
        setError(t(draft.error as "errTitleRequired"));
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      if (intent === "publish") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error(t("notAuthed"));
        const { data: employer, error: employerErr } = await supabase
          .from("employer_profiles")
          .select("company_name,contact_email,company_description,location,industry")
          .eq("owner_user_id", user.id)
          .maybeSingle();
        if (employerErr) throw employerErr;
        const syncedPub = syncRequirementLinesFromStructured(requirementItems);
        const requiredSkillsPub = taxonomyAvailable
          ? mergeLegacyText(catalog, "skill", skillIds, skillLeftover, "et")
          : parseCommaList(requiredSkillsCsv);
        const keywordsPub = parseCommaList(keywordsCsv);
        const pub = validateJobForPublish({
          employerProfileComplete: employerCoreComplete(employer ?? null),
          companyName: (employer?.company_name ?? "").toString(),
          title,
          location,
          workType,
          jobType,
          summary: shortSummary,
          description,
          requirementLines: syncedPub.requirement_lines,
          requiredSkills: requiredSkillsPub,
          keywords: keywordsPub,
          experienceLevelRequired,
          applicationDeadline,
          professionRequired: taxonomyAvailable,
          professionId,
          salary: {
            mode: salaryMin && salaryMax && salaryMin !== salaryMax ? "range" : salaryMin || salaryMax ? "fixed" : "",
            min: salaryMin,
            max: salaryMax || salaryMin,
            tax: "bruto",
            period: "month",
            currency: salaryCurrency,
          },
          matching: {
            title: title.trim(),
            location: location.trim(),
            work_type: workType,
            job_type: jobType,
            short_summary: shortSummary.trim(),
            description: description.trim(),
            requirement_lines: syncedPub.requirement_lines,
            required_skills: requiredSkillsPub,
            keywords: keywordsPub,
            experience_level_required: experienceLevelRequired,
            certificate_requirements: certificateRequirements.trim() || null,
            application_type: "in_app",
            application_url: null,
          },
        });
        if (!pub.ok) {
          setError(t(pub.error as "errTitleRequired"));
          setLoading(false);
          return;
        }
      }

      const min = salaryMin.trim() ? Number(salaryMin) : null;
      const max = salaryMax.trim() ? Number(salaryMax) : null;
      const synced = syncRequirementLinesFromStructured(requirementItems);
      const lines = synced.requirement_lines;
      const tax = taxonomyAvailable
        ? jobTaxonomyWriteColumns(catalog, {
            industryId,
            professionId,
            skillIds,
            skillLeftover,
            certificateIds,
            certificateLeftover,
            languageIds,
          })
        : null;
      const requiredSkills = tax?.required_skills ?? parseCommaList(requiredSkillsCsv);
      const keywords = parseCommaList(keywordsCsv);
      const lifecycle =
        intent === "publish"
          ? buildPublishLifecycleDates({
              packageDays: inferListingPackageDays(applicationDeadline),
              applicationDeadline,
            })
          : null;
      const payload = {
          title: title.trim(),
          location: location.trim() || null,
          work_type: workType,
          job_type: jobType,
          short_summary: shortSummary.trim() || null,
          description: description.trim(),
          duty_lines: sanitizeJobContentLines(dutyLines),
          benefit_lines: sanitizeJobContentLines(benefitLines),
          requirements: synced.requirements,
          requirement_lines: lines,
          job_requirements: synced.job_requirements,
          required_skills: requiredSkills,
          keywords,
          experience_level_required: experienceLevelRequired || null,
          certificate_requirements: tax?.certificate_requirements ?? (certificateRequirements.trim() || null),
          languages: tax?.languages,
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
          application_deadline: lifecycle?.application_deadline ?? (applicationDeadline.trim() || null),
          expires_at: lifecycle?.expires_at ?? (expiresOn.trim() ? endOfDayTallinnIso(expiresOn.trim()) : null),
          ...(intent === "publish"
            ? { status: "published", published_at: lifecycle?.published_at }
            : initialJob.status === "draft"
              ? { status: "draft" }
              : {}),
          ...(tax
            ? {
                industry_id: tax.industry_id,
                profession_id: tax.profession_id,
                skill_ids: tax.skill_ids,
                certificate_ids: tax.certificate_ids,
                language_ids: tax.language_ids,
              }
            : {}),
        };
      let writePayload: Record<string, unknown> = payload;
      let { error } = await supabase.from("job_posts").update(writePayload).eq("id", initialJob.id);
      if (error && isTaxonomyColumnError(error.message)) {
        writePayload = stripTaxonomyWriteColumns(writePayload);
        const retry = await supabase
          .from("job_posts")
          .update(writePayload)
          .eq("id", initialJob.id);
        error = retry.error;
      }
      if (error && isJobContentLinesColumnError(error.message)) {
        writePayload = stripJobContentLineColumns(writePayload);
        const retry = await supabase
          .from("job_posts")
          .update(writePayload)
          .eq("id", initialJob.id);
        error = retry.error;
      }
      if (error) throw error;

      if (intent === "preview") {
        router.push(`/${locale}/account/employer/jobs/${initialJob.id}/preview`);
        router.refresh();
        return;
      }

      // If expiry is already past, mark inactive (do not delete).
      if (
        intent !== "publish" &&
        expiresOn.trim() &&
        expiresOn.trim() < calendarDateInTallinn() &&
        initialJob.status === "published"
      ) {
        await supabase.from("job_posts").update({ status: "archived" }).eq("id", initialJob.id);
      }

      if (intent === "publish") {
        router.push(`/${locale}/account/employer/jobs`);
      } else if (intent === "draft") {
        router.refresh();
      } else {
        router.push(`/${locale}/account/employer/jobs`);
      }
      router.refresh();
    } catch (err) {
      const raw = errorMessageFromUnknown(err, t("unknownError"));
      const lower = raw.toLowerCase();
      const withHint =
        lower.includes("schema cache") || lower.includes("column of 'job_posts'")
          ? `${raw}\n\n${t("jobSchemaCacheCertFixHint")}\n\n${t("jobWorkConditionsFixHint")}\n\n${t("youngSeekerAutoFixHint")}\n\n${t("jobRequirementsPriorityFixHint")}\n\n${t("jobDutyBenefitFixHint")}`
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
        void persist(initialJob.status === "published" ? "save" : "draft");
      }}
      className="space-y-6"
    >
      <div className="rounded-2xl border border-border bg-white px-4 py-3 text-xs leading-relaxed text-muted-2">
        {t("jobFieldGuideEditLead")}
        {initialJob.status !== "published" ? <div className="mt-2 text-muted-2">{t("draftHint")}</div> : null}
      </div>
      {initialJob.status === "published" ? (
        <EmployerJobFeaturedPromo locale={locale} job={initialJob} />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("title")}</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        {taxonomyAvailable ? (
          <>
            <div className="space-y-2">
              <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("jobIndustry")}</label>
              <TaxonomySelect
                value={industryId}
                terms={catalog.industries}
                locale={locale}
                placeholder={t("taxonomyPlaceholder")}
                onChange={(id) => {
                  setIndustryId(id);
                  const current = findTerm(catalog, "profession", professionId);
                  if (id && current?.industry_id && current.industry_id !== id) setProfessionId("");
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("jobProfession")}</label>
              <TaxonomySelect
                value={professionId}
                required
                terms={
                  industryId
                    ? catalog.professions.filter((p) => p.industry_id === industryId)
                    : catalog.professions
                }
                locale={locale}
                placeholder={t("taxonomyPlaceholder")}
                onChange={(id) => {
                  setProfessionId(id);
                  const prof = findTerm(catalog, "profession", id);
                  if (prof?.industry_id) setIndustryId(prof.industry_id);
                }}
              />
              <div className="text-xs text-muted-2">{t("jobProfessionHint")}</div>
            </div>
          </>
        ) : null}
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("location")}</label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("workType")}</label>
          <select
            value={workType}
            onChange={(e) => setWorkType(e.target.value)}
            className="h-11 w-full rounded-2xl border border-border bg-[#f8fafc] px-4 text-sm text-foreground/80 outline-none transition-colors focus:border-[rgba(37,99,235,0.35)] focus:bg-[#f8fafc]"
          >
            <option value="on_site">{t("workTypeOnSite")}</option>
            <option value="hybrid">{t("workTypeHybrid")}</option>
            <option value="remote">{t("workTypeRemote")}</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("jobType")}</label>
          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="h-11 w-full rounded-2xl border border-border bg-[#f8fafc] px-4 text-sm text-foreground/80 outline-none transition-colors focus:border-[rgba(37,99,235,0.35)] focus:bg-[#f8fafc]"
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
        <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("summary")}</label>
        <textarea
          value={shortSummary}
          onChange={(e) => setShortSummary(e.target.value)}
          rows={2}
          required
          className="w-full rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-sm text-foreground/80 placeholder:text-muted-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-colors focus:border-[rgba(37,99,235,0.35)] focus:bg-[#f8fafc]"
          placeholder={t("summaryPlaceholder")}
        />
        <div className="text-xs text-muted-2">{t("jobFieldGuideSummary")}</div>
      </div>

      <div className="space-y-2">
        <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("jobSectionDescription")}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={6}
          className="w-full rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-sm text-foreground/80 placeholder:text-muted-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-colors focus:border-[rgba(37,99,235,0.35)] focus:bg-[#f8fafc]"
        />
        <div className="text-xs text-muted-2">{t("jobFieldGuideDescription")}</div>
      </div>

      <JobLinesEditor
        title={t("jobSectionDuties")}
        help={t("jobFieldGuideDuties")}
        addLabel={t("jobDutyAdd")}
        addFirstLabel={t("jobDutyAddFirst")}
        placeholder={t("jobDutyPlaceholder")}
        itemLabel={(n) => t("jobDutyItemLabel", { n })}
        value={dutyLines}
        onChange={setDutyLines}
        disabled={loading}
      />

      <JobLinesEditor
        title={t("jobSectionBenefits")}
        help={t("jobFieldGuideBenefits")}
        addLabel={t("jobBenefitAdd")}
        addFirstLabel={t("jobBenefitAddFirst")}
        placeholder={t("jobBenefitPlaceholder")}
        itemLabel={(n) => t("jobBenefitItemLabel", { n })}
        value={benefitLines}
        onChange={setBenefitLines}
        disabled={loading}
      />

      <JobRequirementsEditor value={requirementItems} onChange={setRequirementItems} disabled={loading} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("jobRequiredSkills")}</label>
          {taxonomyAvailable ? (
            <>
              <TaxonomyChipField
                terms={catalog.skills}
                selectedIds={skillIds}
                leftover={skillLeftover}
                onChangeIds={setSkillIds}
                onChangeLeftover={setSkillLeftover}
                locale={locale}
                suggestedIds={suggestedSkillIds(catalog, professionId)}
              />
              {skillLeftover.length ? <div className="text-xs text-muted-2">{t("leftoverTaxonomyHint")}</div> : null}
            </>
          ) : (
            <>
              <Input value={requiredSkillsCsv} onChange={(e) => setRequiredSkillsCsv(e.target.value)} required />
              <div className="text-xs text-muted-2">{t("jobFieldGuideSkills")}</div>
            </>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("jobKeywords")}</label>
          <Input value={keywordsCsv} onChange={(e) => setKeywordsCsv(e.target.value)} required />
          <div className="text-xs text-muted-2">{t("jobFieldGuideKeywords")}</div>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("jobExperienceRequired")}</label>
          <select
            value={experienceLevelRequired}
            onChange={(e) =>
              setExperienceLevelRequired(e.target.value as (typeof JOB_EXPERIENCE_LEVEL_VALUES)[number] | "")
            }
            required
            className="h-11 w-full rounded-2xl border border-border bg-[#f8fafc] px-4 text-sm text-foreground/80 outline-none transition-colors focus:border-[rgba(37,99,235,0.35)] focus:bg-[#f8fafc]"
          >
            <option value="">{tOnb("experienceLevelPlaceholder")}</option>
            {JOB_EXPERIENCE_LEVEL_VALUES.map((v) => (
              <option key={v} value={v}>
                {tOnb(`experienceLevelOption.${v}`)}
              </option>
            ))}
          </select>
          <div className="text-xs text-muted-2">{t("jobFieldGuideExperience")}</div>
          {experienceLevelRequired === "not_required" ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs leading-relaxed text-emerald-800">
              {t("jobExperienceNotRequiredHint")}
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("jobCertRequirements")}</label>
        {taxonomyAvailable ? (
          <TaxonomyChipField
            terms={catalog.certificates}
            selectedIds={certificateIds}
            leftover={certificateLeftover}
            onChangeIds={setCertificateIds}
            onChangeLeftover={setCertificateLeftover}
            locale={locale}
          />
        ) : (
          <textarea
            value={certificateRequirements}
            onChange={(e) => setCertificateRequirements(e.target.value)}
            rows={2}
            placeholder={t("jobCertRequirementsPlaceholder")}
            className="w-full rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-sm text-foreground/80 placeholder:text-muted-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-colors focus:border-[rgba(37,99,235,0.35)] focus:bg-[#f8fafc]"
          />
        )}
        <div className="text-xs text-muted-2">{t("jobFieldGuideCert")}</div>
      </div>
      {taxonomyAvailable ? (
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("jobLanguages")}</label>
          <TaxonomyChipField
            terms={catalog.languages}
            selectedIds={languageIds}
            leftover={[]}
            onChangeIds={setLanguageIds}
            onChangeLeftover={() => undefined}
            locale={locale}
          />
        </div>
      ) : null}

      <div className="rounded-3xl border border-border bg-[#f8fafc] p-5 sm:p-6">
        <div className="text-sm font-medium text-foreground/80">{t("applicationKvalifitsOnlyTitle")}</div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{t("applicationKvalifitsOnlyBody")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground" htmlFor="edit-application-deadline">
            {t("applicationDeadlineLabel")}
          </label>
          <Input
            id="edit-application-deadline"
            type="date"
            value={applicationDeadline}
            onChange={(e) => setApplicationDeadline(e.target.value)}
            required
          />
          <p className="text-xs leading-relaxed text-muted-2">{t("applicationDeadlineHint")}</p>
        </div>
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground" htmlFor="edit-expires-on">
            {t("expiresOnLabel")}
          </label>
          <Input
            id="edit-expires-on"
            type="date"
            value={expiresOn}
            onChange={(e) => setExpiresOn(e.target.value)}
            required
          />
          <p className="text-xs leading-relaxed text-muted-2">{t("expiresOnHint")}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("salaryMin")}</label>
          <Input value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} inputMode="numeric" />
        </div>
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("salaryMax")}</label>
          <Input value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} inputMode="numeric" />
        </div>
        <div className="space-y-2">
          <label className="text-[0.9375rem] font-medium leading-snug text-foreground">{t("salaryCurrency")}</label>
          <Input value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)} />
        </div>
        <div className="text-xs text-muted-2 sm:col-span-3">{t("jobFieldGuideSalary")}</div>
      </div>

      {error ? (
        <div className="whitespace-pre-wrap rounded-2xl border border-border bg-[#f8fafc] px-4 py-3 text-sm text-muted">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Button type="submit" variant="outline" size="lg" className="w-full" loading={loading} loadingText={t("saving")}>
          {initialJob.status === "published" ? t("save") : t("saveDraft")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          loading={loading}
          loadingText={t("saving")}
          onClick={() => void persist("preview")}
        >
          {t("previewJob")}
        </Button>
        {initialJob.status !== "published" ? (
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full"
            loading={loading}
            loadingText={t("saving")}
            onClick={() => void persist("publish")}
          >
            {t("publishNow")}
          </Button>
        ) : (
          <div />
        )}
      </div>
    </form>
  );
}
