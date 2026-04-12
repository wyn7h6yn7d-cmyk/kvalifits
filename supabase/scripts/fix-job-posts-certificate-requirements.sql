-- Fixes: "Could not find the 'certificate_requirements' column of 'job_posts' in the schema cache"
-- Run in Supabase SQL Editor after deploy if job publish/update fails on that column.
--
-- After success: set NEXT_PUBLIC_JOB_POST_CERTIFICATE_REQUIREMENTS_SYNC=1 on Vercel so the app
-- includes this column in selects/inserts/updates (see lib/jobs/jobPostCertificateRequirementsSync.ts).

alter table public.job_posts
  add column if not exists certificate_requirements text;

comment on column public.job_posts.certificate_requirements is
  'Certificate / qualification expectations (comma or newline separated); used by matching when set.';

notify pgrst, 'reload schema';
