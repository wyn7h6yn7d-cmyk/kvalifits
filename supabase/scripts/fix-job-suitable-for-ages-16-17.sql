-- Fixes: job_posts.suitable_for_ages_16_17 (derived cache for young-seeker badge).
-- Run in Supabase SQL Editor if save fails mentioning this column.
-- Public badge is computed from work conditions via employment rules — not a manual toggle.

alter table public.job_posts
  add column if not exists suitable_for_ages_16_17 boolean not null default false;

comment on column public.job_posts.suitable_for_ages_16_17 is
  'Derived cache from employment-rules pre-check (hours/shifts/nature). Never a manual employer toggle; public badge recomputes from work conditions.';

notify pgrst, 'reload schema';
