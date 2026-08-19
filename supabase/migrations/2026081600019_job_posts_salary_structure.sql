-- Structured salary fields for job posts (required on publish).

alter table public.job_posts
  add column if not exists salary_mode text,
  add column if not exists salary_tax text,
  add column if not exists salary_period text;

alter table public.job_posts
  alter column salary_tax set default 'bruto',
  alter column salary_period set default 'month';

comment on column public.job_posts.salary_mode is
  'fixed | range — how salary_min/salary_max should be read.';
comment on column public.job_posts.salary_tax is
  'bruto | neto — tax basis for posted salary (default bruto).';
comment on column public.job_posts.salary_period is
  'month | hour — pay period for posted salary (default month).';

notify pgrst, 'reload schema';
