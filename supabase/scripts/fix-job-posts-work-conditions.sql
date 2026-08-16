-- Fixes: missing job work-condition columns for minor eligibility.
-- Run in Supabase SQL Editor if weekly_hours / shift_* fail to save.

alter table public.job_posts
  add column if not exists weekly_hours numeric,
  add column if not exists daily_hours numeric,
  add column if not exists shift_start time,
  add column if not exists shift_end time,
  add column if not exists includes_night_work boolean not null default false,
  add column if not exists is_hazardous_work boolean not null default false;

notify pgrst, 'reload schema';
