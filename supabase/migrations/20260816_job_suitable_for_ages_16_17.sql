-- Flag: employer asserts job may suit ages 16–17; must pass employment-rules checks on save.

alter table public.job_posts
  add column if not exists suitable_for_ages_16_17 boolean not null default false;

comment on column public.job_posts.suitable_for_ages_16_17 is
  'Derived cache from employment-rules pre-check (hours/shifts/nature). Never a manual employer toggle; public badge recomputes from work conditions.';

notify pgrst, 'reload schema';
