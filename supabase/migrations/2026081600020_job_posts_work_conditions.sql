-- Structured work-condition fields for minor employment eligibility checks.

alter table public.job_posts
  add column if not exists weekly_hours numeric,
  add column if not exists daily_hours numeric,
  add column if not exists shift_start time,
  add column if not exists shift_end time,
  add column if not exists includes_night_work boolean not null default false,
  add column if not exists is_hazardous_work boolean not null default false;

comment on column public.job_posts.weekly_hours is
  'Typical weekly hours for the role (used by minor work eligibility).';
comment on column public.job_posts.daily_hours is
  'Typical workday length in hours (used by minor work eligibility).';
comment on column public.job_posts.shift_start is
  'Typical shift start time.';
comment on column public.job_posts.shift_end is
  'Typical shift end time.';
comment on column public.job_posts.includes_night_work is
  'Employer-declared night work (or evening/night shifts).';
comment on column public.job_posts.is_hazardous_work is
  'Employer-declared hazardous / restricted-nature work for minor eligibility.';

notify pgrst, 'reload schema';
