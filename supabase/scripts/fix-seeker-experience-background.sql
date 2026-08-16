-- Fixes: seeker experience background / duration columns.
-- Run in Supabase SQL Editor if kogemuse taust fails to save.

alter table public.seeker_profiles
  add column if not exists exp_seeking_first_job boolean not null default false,
  add column if not exists exp_is_student boolean not null default false,
  add column if not exists exp_has_internship boolean not null default false,
  add column if not exists exp_has_volunteer boolean not null default false,
  add column if not exists exp_has_project boolean not null default false,
  add column if not exists exp_has_prior_work boolean not null default false,
  add column if not exists experience_duration_years numeric;

notify pgrst, 'reload schema';
