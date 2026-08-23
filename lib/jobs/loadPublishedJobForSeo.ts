import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadEmployerPublicRowById } from "@/lib/companies/loadPublicEmployerFields";
import { isPublicJobListing } from "@/lib/jobs/jobVisibility";
import type { JobSeoEmployerRow, JobSeoJobRow } from "@/lib/jobs/jobSeo";

const SELECT_FULL =
  "id,title,location,job_type,work_type,short_summary,description,requirements,requirement_lines,job_requirements,employer_profile_id,status,created_at,published_at,application_deadline,expires_at,salary_min,salary_max,salary_currency,salary_tax,salary_period";
const SELECT_MID =
  "id,title,location,job_type,work_type,short_summary,description,requirements,requirement_lines,job_requirements,employer_profile_id,status,created_at,salary_min,salary_max,salary_currency,salary_tax,salary_period";
const SELECT_LEGACY =
  "id,title,location,job_type,work_type,short_summary,description,requirements,requirement_lines,employer_profile_id,status,created_at,salary_min,salary_max,salary_currency";
const SELECT_MIN =
  "id,title,location,job_type,work_type,short_summary,description,requirements,requirement_lines,employer_profile_id,status,created_at";

/**
 * Load a public job + employer fields for SEO (published, or archived public history).
 * Returns null when missing or not a public listing. Indexability is decided by the caller.
 */
export async function loadPublishedJobForSeo(jobId: string): Promise<{
  job: JobSeoJobRow & { employer_profile_id?: string | null };
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

  const job = jobRaw as (JobSeoJobRow & { employer_profile_id?: string | null }) | null;
  if (!job) return null;
  if (!isPublicJobListing(job)) return null;

  let employer: JobSeoEmployerRow | null = null;
  if (job.employer_profile_id) {
    const row = await loadEmployerPublicRowById(supabase, job.employer_profile_id);
    employer = row
      ? {
          company_name: (row.company_name as string | null | undefined) ?? null,
          website: (row.website as string | null | undefined) ?? null,
          logo_url: (row.logo_url as string | null | undefined) ?? null,
          location: (row.location as string | null | undefined) ?? null,
          public_slug: (row.public_slug as string | null | undefined) ?? null,
        }
      : null;
  }

  return { job, employer };
}
