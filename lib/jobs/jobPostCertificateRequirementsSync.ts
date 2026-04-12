/**
 * `job_posts.certificate_requirements` may be missing or absent from PostgREST schema cache on older DBs.
 * After `supabase/scripts/fix-job-posts-certificate-requirements.sql` (or migration 20260417), set
 * `NEXT_PUBLIC_JOB_POST_CERTIFICATE_REQUIREMENTS_SYNC=1` in `.env.local` / Vercel so reads/writes include the column.
 * (Same pattern as `NEXT_PUBLIC_EMPLOYER_COMPANY_SIZE_SYNC`.)
 */
export const JOB_POST_CERTIFICATE_REQUIREMENTS_DB_ENABLED =
  process.env.NEXT_PUBLIC_JOB_POST_CERTIFICATE_REQUIREMENTS_SYNC === "1";

export function jobPostCertificateRequirementsField(trimmed: string): {
  certificate_requirements?: string | null;
} {
  if (!JOB_POST_CERTIFICATE_REQUIREMENTS_DB_ENABLED) return {};
  return { certificate_requirements: trimmed || null };
}
