import { employerCoreComplete, jobMatchingReady, type EmployerCoreFields } from "@/lib/matching/profileRules";
import { parseJobSalaryForPublish, type JobSalaryInput } from "@/lib/jobs/jobSalary";
import { calendarDateInTallinn } from "@/lib/jobs/jobLifecycle";

export type JobPublishValidationInput = {
  employerProfileComplete: boolean;
  companyName: string;
  title: string;
  location: string;
  workType: string;
  jobType: string;
  summary: string;
  description: string;
  requirementLines: string[];
  requiredSkills: string[];
  keywords: string[];
  experienceLevelRequired: string;
  applicationDeadline: string;
  professionRequired: boolean;
  professionId: string;
  salary: JobSalaryInput;
  matching: Parameters<typeof jobMatchingReady>[0];
};

export type JobPublishValidationResult = { ok: true } | { ok: false; error: string };

export function validateJobForPublish(input: JobPublishValidationInput): JobPublishValidationResult {
  if (!input.employerProfileComplete) return { ok: false, error: "employerProfileIncomplete" };
  if (!input.companyName.trim()) return { ok: false, error: "errCompanyRequired" };
  if (!input.title.trim()) return { ok: false, error: "errTitleRequired" };
  if (!input.location.trim()) return { ok: false, error: "errLocationRequired" };
  if (!input.workType.trim()) return { ok: false, error: "errWorkTypeRequired" };
  if (!input.jobType.trim()) return { ok: false, error: "errJobTypeRequired" };
  if (!input.summary.trim()) return { ok: false, error: "errSummaryRequired" };
  if (input.summary.trim().length < 20) return { ok: false, error: "errShortSummary" };
  if (!input.description.trim()) return { ok: false, error: "errDescriptionRequired" };
  if (input.description.trim().length < 40) return { ok: false, error: "errDescriptionLength" };
  if (input.requirementLines.filter(Boolean).length < 2) return { ok: false, error: "errRequirementLines" };
  if (input.requiredSkills.filter(Boolean).length < 1) return { ok: false, error: "errRequiredSkills" };
  if (input.professionRequired && !input.professionId) return { ok: false, error: "errProfessionRequired" };
  if (input.keywords.filter(Boolean).length < 1) return { ok: false, error: "errKeywords" };
  if (!input.experienceLevelRequired) return { ok: false, error: "errExperienceRequired" };
  if (!input.applicationDeadline.trim()) return { ok: false, error: "errApplicationDeadlineRequired" };
  if (input.applicationDeadline < calendarDateInTallinn()) return { ok: false, error: "errApplicationDeadlinePast" };
  if (!jobMatchingReady(input.matching)) return { ok: false, error: "jobMatchingIncomplete" };
  const salaryParsed = parseJobSalaryForPublish(input.salary);
  if (!salaryParsed.ok) return { ok: false, error: salaryParsed.error };
  return { ok: true };
}

export function employerProfileIsPublishReady(
  employer: (EmployerCoreFields & { company_name?: string | null }) | null,
): boolean {
  return employerCoreComplete(employer);
}

export function validateDraftSave(title: string): JobPublishValidationResult {
  if (!title.trim()) return { ok: false, error: "errTitleRequired" };
  return { ok: true };
}
