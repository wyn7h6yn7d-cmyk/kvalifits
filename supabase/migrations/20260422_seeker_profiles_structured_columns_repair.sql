-- Repair seeker_profiles columns from 20260411 when that migration never ran on this DB.

alter table public.seeker_profiles
  add column if not exists salary_expectation text,
  add column if not exists work_authorization_notes text,
  add column if not exists cv_url text;

notify pgrst, 'reload schema';
