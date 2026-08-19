import { getEmployerJobIfOwned, type EmployerSupabase } from "@/lib/employer/getEmployerJobIfOwned";
import {
  jobPassesYoungSeekerAutoEligibility,
  jobWorkConditionsFromJobRow,
} from "@/lib/employmentRules";
import {
  addCalendarDays,
  calendarDateInTallinn,
  toCalendarDate,
} from "@/lib/jobs/jobLifecycle";
import { toNum } from "@/lib/jobs/jobDetailPresentation";
import { canAccessEmployerJobPreview } from "@/lib/jobs/jobVisibility";

/** Content columns copied into a new draft. Identity and listing lifecycle are never copied. */
export const DUPLICATE_CONTENT_KEYS = [
  "title",
  "location",
  "work_type",
  "job_type",
  "short_summary",
  "description",
  "duty_lines",
  "benefit_lines",
  "requirements",
  "requirement_lines",
  "job_requirements",
  "required_skills",
  "keywords",
  "experience_level_required",
  "certificate_requirements",
  "languages",
  "industry_id",
  "profession_id",
  "skill_ids",
  "certificate_ids",
  "language_ids",
  "weekly_hours",
  "daily_hours",
  "shift_start",
  "shift_end",
  "includes_night_work",
  "is_hazardous_work",
  "salary_mode",
  "salary_min",
  "salary_max",
  "salary_tax",
  "salary_period",
  "salary_currency",
  "start_date",
] as const;

export const DUPLICATE_STRIP_KEYS = [
  "id",
  "created_at",
  "updated_at",
  "published_at",
  "status",
  "expires_at",
  "slug",
  "search_text",
  "search_tsv",
  "view_count",
  "impressions",
  "moderation_status",
  "hidden_at",
  "removed_at",
] as const;

export const DUPLICATE_JOB_SELECT_FULL =
  "id,title,location,work_type,job_type,short_summary,description,duty_lines,benefit_lines,requirements,requirement_lines,job_requirements,required_skills,keywords,experience_level_required,certificate_requirements,languages,industry_id,profession_id,skill_ids,certificate_ids,language_ids,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,salary_mode,salary_min,salary_max,salary_tax,salary_period,salary_currency,start_date,application_deadline,expires_at,published_at,status,employer_profile_id,created_by,slug";

export const DUPLICATE_JOB_SELECT_MID =
  "id,title,location,work_type,job_type,short_summary,description,requirements,requirement_lines,job_requirements,required_skills,keywords,experience_level_required,certificate_requirements,languages,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work,salary_min,salary_max,salary_currency,application_deadline,expires_at,published_at,status,employer_profile_id,created_by,slug";

export const DUPLICATE_JOB_SELECT_MIN =
  "id,title,location,work_type,job_type,short_summary,description,requirements,requirement_lines,required_skills,keywords,certificate_requirements,salary_min,salary_max,salary_currency,application_deadline,status,employer_profile_id,created_by";

export function canDuplicateEmployerJob(args: {
  viewerUserId: string | null | undefined;
  ownerUserId: string | null | undefined;
}): boolean {
  return canAccessEmployerJobPreview(args);
}

export function generateJobSlug(title: string, suffix?: string): string {
  const token = (suffix ?? Math.random().toString(36).slice(2, 8)).replace(/[^a-z0-9]/gi, "") || "copy";
  const base = title
    .trim()
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/õ/g, "o")
    .replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
  return `${base || "job"}-${token}`;
}

/** Future deadline for the new draft. Never reuse a past or missing source deadline. */
export function safeDuplicateApplicationDeadline(
  existing: string | null | undefined,
  asOf: Date = new Date(),
  fallbackDays = 30,
): string {
  const today = calendarDateInTallinn(asOf);
  const existingDay = toCalendarDate(existing);
  if (existingDay && existingDay >= today) return existingDay;
  return addCalendarDays(today, fallbackDays);
}

function copyIfPresent(source: Record<string, unknown>, key: string): unknown {
  if (!(key in source)) return undefined;
  return source[key];
}

export function buildDuplicatedJobPost(args: {
  source: Record<string, unknown>;
  createdBy: string;
  now?: Date;
  slugSuffix?: string;
}): Record<string, unknown> {
  const now = args.now ?? new Date();
  const source = args.source;
  const employerProfileId = (source.employer_profile_id ?? "").toString();
  const title = (source.title ?? "").toString();

  const payload: Record<string, unknown> = {
    employer_profile_id: employerProfileId || null,
    created_by: args.createdBy,
    status: "draft",
    published_at: null,
    expires_at: null,
    application_deadline: safeDuplicateApplicationDeadline(
      (source.application_deadline ?? null) as string | null,
      now,
    ),
    application_type: "in_app",
    application_url: null,
  };

  for (const key of DUPLICATE_CONTENT_KEYS) {
    const value = copyIfPresent(source, key);
    if (value === undefined) continue;
    payload[key] = value;
  }

  payload.description = ((source.description ?? "") as string).toString();
  payload.title = title;

  payload.suitable_for_ages_16_17 = jobPassesYoungSeekerAutoEligibility(
    jobWorkConditionsFromJobRow({
      job_type: (source.job_type ?? null) as string | null,
      weekly_hours: toNum(source.weekly_hours),
      daily_hours: toNum(source.daily_hours),
      shift_start: (source.shift_start ?? null) as string | null,
      shift_end: (source.shift_end ?? null) as string | null,
      includes_night_work:
        source.includes_night_work === null || source.includes_night_work === undefined
          ? null
          : Boolean(source.includes_night_work),
      is_hazardous_work:
        source.is_hazardous_work === null || source.is_hazardous_work === undefined
          ? null
          : Boolean(source.is_hazardous_work),
    }),
  );

  for (const key of DUPLICATE_STRIP_KEYS) {
    delete payload[key];
  }

  payload.status = "draft";
  payload.published_at = null;
  payload.expires_at = null;
  payload.slug = generateJobSlug(title, args.slugSuffix);

  return payload;
}

export async function loadOwnedJobForDuplicate(
  supabase: EmployerSupabase,
  userId: string,
  jobId: string,
): Promise<Record<string, unknown> | null> {
  for (const select of [DUPLICATE_JOB_SELECT_FULL, DUPLICATE_JOB_SELECT_MID, DUPLICATE_JOB_SELECT_MIN]) {
    const job = await getEmployerJobIfOwned(supabase, userId, jobId, select);
    if (job) return job as unknown as Record<string, unknown>;
  }
  return null;
}
