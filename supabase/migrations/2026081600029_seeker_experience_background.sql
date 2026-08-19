-- Seeker experience background flags + duration (for entry / “experience not required” matching).

alter table public.seeker_profiles
  add column if not exists exp_seeking_first_job boolean not null default false,
  add column if not exists exp_is_student boolean not null default false,
  add column if not exists exp_has_internship boolean not null default false,
  add column if not exists exp_has_volunteer boolean not null default false,
  add column if not exists exp_has_project boolean not null default false,
  add column if not exists exp_has_prior_work boolean not null default false,
  add column if not exists experience_duration_years numeric;

comment on column public.seeker_profiles.exp_seeking_first_job is
  'Seeker marks they are looking for a first job. 0 years must not be treated as a weak candidate for entry / experience-not-required roles.';
comment on column public.seeker_profiles.experience_duration_years is
  'Self-reported experience duration in years (0 allowed). Separate from experience_level.';

notify pgrst, 'reload schema';
