-- Fixes: job_applications.application_answers
-- Run in Supabase SQL Editor if apply fails mentioning application_answers.

alter table public.job_applications
  add column if not exists application_answers jsonb not null default '{}'::jsonb;

notify pgrst, 'reload schema';
