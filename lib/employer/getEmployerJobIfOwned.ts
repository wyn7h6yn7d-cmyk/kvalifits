import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JOB_POST_CERTIFICATE_REQUIREMENTS_DB_ENABLED } from "@/lib/jobs/jobPostCertificateRequirementsSync";

export type EmployerJobRow = {
  id: string;
  title: string;
  employer_profile_id: string;
  location: string | null;
  work_type: string | null;
  job_type: string | null;
  short_summary: string | null;
  description: string | null;
  requirements: string | null;
  requirement_lines: string[] | null;
  required_skills: string[] | null;
  keywords: string[] | null;
  experience_level_required: string | null;
  certificate_requirements?: string | null;
};

export type EmployerSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Returns the job row only if `userId` owns the linked employer profile (matches job_applications RLS). */
export async function getEmployerJobIfOwned(
  supabase: EmployerSupabase,
  userId: string,
  jobId: string
): Promise<EmployerJobRow | null> {
  const { data: jobRaw, error } = await supabase
    .from("job_posts")
    .select(
      (JOB_POST_CERTIFICATE_REQUIREMENTS_DB_ENABLED
        ? "id,title,employer_profile_id,location,work_type,job_type,short_summary,description,requirements,requirement_lines,required_skills,keywords,experience_level_required,certificate_requirements"
        : "id,title,employer_profile_id,location,work_type,job_type,short_summary,description,requirements,requirement_lines,required_skills,keywords,experience_level_required") as any
    )
    .eq("id", jobId)
    .maybeSingle();

  if (error || !jobRaw) return null;
  const job = jobRaw as unknown as EmployerJobRow;

  const { data: ep, error: epErr } = await supabase
    .from("employer_profiles")
    .select("id")
    .eq("id", job.employer_profile_id)
    .eq("owner_user_id", userId)
    .maybeSingle();

  if (epErr || !ep) return null;
  return job as EmployerJobRow;
}
