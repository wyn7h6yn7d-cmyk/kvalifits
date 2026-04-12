-- Fixes: Could not find the 'salary_expectation' column of 'seeker_profiles' in the schema cache
-- (and related fields). Run once in Supabase SQL Editor if palgaootus / CV / tööloa märkused ei salvestu.

alter table public.seeker_profiles
  add column if not exists salary_expectation text,
  add column if not exists work_authorization_notes text,
  add column if not exists cv_url text;

notify pgrst, 'reload schema';
