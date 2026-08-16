/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobSeoEmployerRow, JobSeoJobRow } from "@/lib/jobs/jobSeo";

const SELECT_FULL =
  "id,title,location,job_type,work_type,short_summary,description,employer_profile_id,status,created_at,published_at,application_deadline,expires_at,salary_min,salary_max,salary_currency,salary_tax,salary_period";
const SELECT_MID =
  "id,title,location,job_type,work_type,short_summary,description,employer_profile_id,status,created_at,salary_min,salary_max,salary_currency,salary_tax,salary_period";
const SELECT_LEGACY =
  "id,title,location,job_type,work_type,short_summary,description,employer_profile_id,status,created_at,salary_min,salary_max,salary_currency";
const SELECT_MIN =
  "id,title,location,job_type,work_type,short_summary,description,employer_profile_id,status,created_at";

/**
 * Load a published job + employer fields needed for SEO / JobPosting.
 * Returns null when missing or not published.
 */
export async function loadPublishedJobForSeo(jobId: string): Promise<{
  job: JobSeoJobRow & { employer_profile_id?: string | null; expires_at?: string | null };
  employer: JobSeoEmployerRow | null;
} | null> {
  const supabase = await createSupabaseServerClient();

  let { data: jobRaw, error } = await supabase
    .from("job_posts")
    .select(SELECT_FULL)
    .eq("id", jobId)
    .maybeSingle();

  if (error && /published_at|application_deadline|expires_at|column/i.test(error.message ?? "")) {
    const mid = await supabase.from("job_posts").select(SELECT_MID).eq("id", jobId).maybeSingle();
    jobRaw = mid.data as typeof jobRaw;
    error = mid.error;
  }
  if (error && /salary_|column/i.test(error.message ?? "")) {
    const legacy = await supabase.from("job_posts").select(SELECT_LEGACY).eq("id", jobId).maybeSingle();
    jobRaw = legacy.data as typeof jobRaw;
    error = legacy.error;
  }
  if (error) {
    const min = await supabase.from("job_posts").select(SELECT_MIN).eq("id", jobId).maybeSingle();
    jobRaw = min.data as typeof jobRaw;
  }

  const job = jobRaw as (JobSeoJobRow & { employer_profile_id?: string | null; status?: string }) | null;
  if (!job || (job.status as string) !== "published") return null;

  let employer: JobSeoEmployerRow | null = null;
  if (job.employer_profile_id) {
    const { data } = await supabase
      .from("employer_profiles")
      .select("company_name,website,logo_url,location")
      .eq("id", job.employer_profile_id)
      .maybeSingle();
    employer = (data as JobSeoEmployerRow | null) ?? null;
  }

  return { job, employer };
}
