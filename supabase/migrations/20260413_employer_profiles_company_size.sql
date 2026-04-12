-- Ensure employer_profiles.company_size exists (employer onboarding + account forms).
-- Idempotent: safe if 20260411 was already applied or partially skipped on an environment.

alter table public.employer_profiles
  add column if not exists company_size text;

comment on column public.employer_profiles.company_size is 'Optional company size band (free text, e.g. headcount range).';
