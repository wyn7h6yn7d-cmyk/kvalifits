/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";

import { jobAcceptsApplications } from "@/lib/jobs/jobLifecycle";
import {
  formatJobSalaryDisplay,
  isJobSalaryPeriod,
  isJobSalaryTax,
} from "@/lib/jobs/jobSalary";
import { pickSimilarJobs, type SimilarJobSource } from "@/lib/jobs/similarJobs";
import { loadEmployerPublicRowsByIds } from "@/lib/companies/loadPublicEmployerFields";
import { getJobMatchesForSeeker } from "@/lib/matching/getJobMatchesForSeeker";
import type { SeekerMatchContext } from "@/lib/matching/seekerMatchContext";

export type SimilarJobCardData = {
  id: string;
  title: string;
  company: string;
  location: string;
  workType?: string;
  salary?: string;
  /** Real seeker–job match only. Omitted when ranking is unavailable. */
  matchScore?: number;
};

const SELECT_FULL =
  "id,title,location,job_type,work_type,short_summary,required_skills,keywords,certificate_requirements,requirement_lines,job_requirements,requirements,employer_profile_id,status,created_at,published_at,application_deadline,expires_at,salary_min,salary_max,salary_currency,salary_tax,salary_period,experience_level_required,weekly_hours,daily_hours,shift_start,shift_end,includes_night_work,is_hazardous_work";
const SELECT_MID =
  "id,title,location,job_type,work_type,short_summary,required_skills,keywords,certificate_requirements,employer_profile_id,status,created_at,salary_min,salary_max,salary_currency,salary_tax,salary_period";
const SELECT_LEGACY =
  "id,title,location,job_type,work_type,short_summary,required_skills,keywords,certificate_requirements,employer_profile_id,status,created_at";

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function asSource(row: Record<string, unknown>): SimilarJobSource {
  return {
    id: String(row.id),
    title: (row.title ?? null) as string | null,
    location: (row.location ?? null) as string | null,
    job_type: (row.job_type ?? null) as string | null,
    work_type: (row.work_type ?? null) as string | null,
    required_skills: (row.required_skills as string[] | null) ?? null,
    keywords: (row.keywords as string[] | null) ?? null,
    certificate_requirements: (row.certificate_requirements ?? null) as string | null,
    salary_min: toNum(row.salary_min),
    salary_max: toNum(row.salary_max),
  };
}

export async function loadSimilarJobsForDetail(opts: {
  supabase: SupabaseClient;
  currentJob: Record<string, unknown>;
  locale: string;
  workTypeLabel: (raw: string) => string;
  tJobs: (key: string) => string;
  userId?: string | null;
  context?: SeekerMatchContext;
}): Promise<SimilarJobCardData[]> {
  const currentId = String(opts.currentJob.id ?? "");
  if (!currentId) return [];

  let { data, error } = await opts.supabase
    .from("job_posts")
    .select(SELECT_FULL)
    .eq("status", "published")
    .neq("id", currentId)
    .order("published_at", { ascending: false })
    .limit(60);

  if (error && /published_at|application_deadline|expires_at|column/i.test(error.message ?? "")) {
    const mid = await opts.supabase
      .from("job_posts")
      .select(SELECT_MID)
      .eq("status", "published")
      .neq("id", currentId)
      .order("created_at", { ascending: false })
      .limit(60);
    data = mid.data as typeof data;
    error = mid.error;
  }
  if (error && /salary_|column/i.test(error.message ?? "")) {
    const legacy = await opts.supabase
      .from("job_posts")
      .select(SELECT_LEGACY)
      .eq("status", "published")
      .neq("id", currentId)
      .order("created_at", { ascending: false })
      .limit(60);
    data = legacy.data as typeof data;
    error = legacy.error;
  }
  if (error || !data) return [];

  const open = (data ?? []).filter((row: any) =>
    jobAcceptsApplications({
      status: row.status,
      published_at: row.published_at ?? null,
      application_deadline: row.application_deadline ?? null,
      expires_at: row.expires_at ?? null,
    }),
  ) as Record<string, unknown>[];

  const picked = pickSimilarJobs(asSource(opts.currentJob), open.map(asSource), 4);
  if (!picked.length) return [];

  const pickedRows = picked
    .map((src) => open.find((row) => String(row.id) === src.id))
    .filter((row): row is Record<string, unknown> => Boolean(row));

  const employerIds = [
    ...new Set(pickedRows.map((row) => String(row.employer_profile_id ?? "")).filter(Boolean)),
  ];
  const employerById = new Map<string, string>();
  if (employerIds.length) {
    const employerRows = await loadEmployerPublicRowsByIds(opts.supabase, employerIds);
    for (const [id, e] of employerRows) {
      employerById.set(id, (e.company_name ?? "—").toString().trim() || "—");
    }
  }

  const canScore = Boolean(opts.userId && opts.context?.seeker);
  const hasCompactMatchFields = pickedRows.every(
    (row) => "job_requirements" in row || "requirement_lines" in row,
  );
  const matchById =
    canScore && opts.userId
      ? (
          await getJobMatchesForSeeker({
            supabase: opts.supabase,
            userId: opts.userId,
            jobIds: pickedRows.map((row) => String(row.id)),
            context: opts.context,
            jobInputs: hasCompactMatchFields
              ? new Map(pickedRows.map((row) => [String(row.id), row]))
              : undefined,
          })
        ).byId
      : new Map();

  return pickedRows.map((row) => {
    const empName = employerById.get(String(row.employer_profile_id ?? ""));
    const tax = isJobSalaryTax(row.salary_tax as string | null) ? (row.salary_tax as "bruto" | "neto") : null;
    const period = isJobSalaryPeriod(row.salary_period as string | null)
      ? (row.salary_period as "month" | "hour")
      : null;
    const workRaw = (row.work_type ?? "").toString().trim();
    const workType = workRaw ? opts.workTypeLabel(workRaw).trim() : "";
    const salary = formatJobSalaryDisplay({
      min: toNum(row.salary_min),
      max: toNum(row.salary_max),
      currency: (row.salary_currency as string | null) ?? "EUR",
      tax,
      period,
      locale: opts.locale,
      taxLabel: tax ? opts.tJobs(`jobSalaryTaxShort.${tax}`) : "",
      periodLabel: period ? opts.tJobs(`jobSalaryPeriodOption.${period}`) : "",
    });
    const matchScore = matchById.get(String(row.id))?.matchScore;
    return {
      id: String(row.id),
      title: (row.title ?? "").toString().trim() || "—",
      company: empName ?? "—",
      location: (row.location ?? "").toString().trim() || "—",
      ...(workType ? { workType } : {}),
      ...(salary ? { salary } : {}),
      ...(typeof matchScore === "number" ? { matchScore } : {}),
    };
  });
}
