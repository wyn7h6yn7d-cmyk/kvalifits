-- Fixes: missing seeker work-preference (Töösoovid) columns.
-- Run in Supabase SQL Editor if pref_* fields fail to save.

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

notify pgrst, 'reload schema';
