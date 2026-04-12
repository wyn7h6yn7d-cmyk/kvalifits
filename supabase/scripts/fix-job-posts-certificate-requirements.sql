-- Fixes: "Could not find the 'certificate_requirements' column of 'job_posts' in the schema cache"
-- Run in Supabase SQL Editor after deploy if job publish/update fails on that column.

alter table public.job_posts
  add column if not exists certificate_requirements text;

comment on column public.job_posts.certificate_requirements is
  'Certificate / qualification expectations (comma or newline separated); used by matching when set.';

notify pgrst, 'reload schema';
