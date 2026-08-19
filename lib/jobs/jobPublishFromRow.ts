import { employerCoreComplete } from "@/lib/matching/profileRules";
import { isJobSalaryMode, isJobSalaryPeriod, isJobSalaryTax, type JobSalaryInput } from "@/lib/jobs/jobSalary";
import { toCalendarDate } from "@/lib/jobs/jobLifecycle";
import { validateJobForPublish, type JobPublishValidationInput } from "@/lib/jobs/jobPublishValidation";

function str(v: unknown): string {
  return (v ?? "").toString();
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];
}

export function salaryInputFromStoredJob(job: Record<string, unknown>): JobSalaryInput {
  const min = job.salary_min == null ? "" : String(job.salary_min);
  const max = job.salary_max == null ? "" : String(job.salary_max);
  const modeRaw = job.salary_mode;
  const mode = isJobSalaryMode(modeRaw)
    ? modeRaw
    : min && max && min !== max
      ? "range"
      : min || max
        ? "fixed"
        : "";
  return {
    mode,
    min: min || max,
    max: max || min,
    tax: isJobSalaryTax(job.salary_tax) ? job.salary_tax : "bruto",
    period: isJobSalaryPeriod(job.salary_period) ? job.salary_period : "month",
    currency: str(job.salary_currency) || "EUR",
  };
}

export function publishInputFromStoredJob(args: {
  job: Record<string, unknown>;
  companyName: string;
  employerProfileComplete: boolean;
  professionRequired: boolean;
}): JobPublishValidationInput {
  const job = args.job;
  const title = str(job.title).trim();
  const location = str(job.location).trim();
  const workType = str(job.work_type).trim();
  const jobType = str(job.job_type).trim();
  const summary = str(job.short_summary).trim();
  const description = str(job.description).trim();
  const requirementLines = strList(job.requirement_lines);
  const requiredSkills = strList(job.required_skills);
  const keywords = strList(job.keywords);
  const experienceLevelRequired = str(job.experience_level_required).trim();
  const applicationDeadline = toCalendarDate(str(job.application_deadline)) ?? str(job.application_deadline).slice(0, 10);
  return {
    employerProfileComplete: args.employerProfileComplete,
    companyName: args.companyName,
    title,
    location,
    workType,
    jobType,
    summary,
    description,
    requirementLines,
    requiredSkills,
    keywords,
    experienceLevelRequired,
    applicationDeadline,
    professionRequired: args.professionRequired,
    professionId: str(job.profession_id),
    salary: salaryInputFromStoredJob(job),
    matching: {
      title,
      location,
      work_type: workType,
      job_type: jobType,
      short_summary: summary,
      description,
      requirement_lines: requirementLines,
      required_skills: requiredSkills,
      keywords,
      experience_level_required: experienceLevelRequired,
      certificate_requirements: str(job.certificate_requirements) || null,
      application_type: "in_app",
      application_url: null,
    },
  };
}

export function validateStoredJobForPublish(args: {
  job: Record<string, unknown>;
  companyName: string;
  employer: Parameters<typeof employerCoreComplete>[0];
  professionRequired: boolean;
}) {
  return validateJobForPublish(
    publishInputFromStoredJob({
      job: args.job,
      companyName: args.companyName,
      employerProfileComplete: employerCoreComplete(args.employer),
      professionRequired: args.professionRequired,
    }),
  );
}
