-- Seeker work preferences (Töösoovid) for structured schedule/arrangement choices.

alter table public.seeker_profiles
  add column if not exists pref_full_time boolean not null default false,
  add column if not exists pref_part_time boolean not null default false,
  add column if not exists pref_desired_weekly_hours numeric,
  add column if not exists pref_min_weekly_hours numeric,
  add column if not exists pref_max_weekly_hours numeric,
  add column if not exists pref_day_work boolean not null default false,
  add column if not exists pref_evening_work boolean not null default false,
  add column if not exists pref_night_work boolean not null default false,
  add column if not exists pref_shift_work boolean not null default false,
  add column if not exists pref_weekend_work boolean not null default false,
  add column if not exists pref_flexible_hours boolean not null default false,
  add column if not exists pref_remote_work boolean not null default false,
  add column if not exists pref_hybrid_work boolean not null default false,
  add column if not exists pref_on_site_work boolean not null default false;

comment on column public.seeker_profiles.pref_full_time is 'Work preference: full-time load.';
comment on column public.seeker_profiles.pref_part_time is 'Work preference: part-time load.';
comment on column public.seeker_profiles.pref_desired_weekly_hours is 'Preferred weekly hours.';
comment on column public.seeker_profiles.pref_min_weekly_hours is 'Minimum acceptable weekly hours.';
comment on column public.seeker_profiles.pref_max_weekly_hours is 'Maximum acceptable weekly hours.';

notify pgrst, 'reload schema';
