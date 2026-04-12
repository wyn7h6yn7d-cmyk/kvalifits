-- Run in Supabase Dashboard → SQL Editor (same project as the app).
-- Fixes: "Could not find the 'company_size' column of 'employer_profiles' in the schema cache"

alter table public.employer_profiles
  add column if not exists company_size text;

comment on column public.employer_profiles.company_size is 'Optional company size band (free text, e.g. headcount range).';

notify pgrst, 'reload schema';
