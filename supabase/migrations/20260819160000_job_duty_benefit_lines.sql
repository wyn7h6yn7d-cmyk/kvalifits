-- Structured job duties and optional benefits.
-- Display-only: not used in matching. Benefits may be empty.
-- short_summary and description already exist and are not duplicated.

alter table public.job_posts
  add column if not exists duty_lines text[] not null default '{}'::text[],
  add column if not exists benefit_lines text[] not null default '{}'::text[];

comment on column public.job_posts.duty_lines is
  'Structured job duties / responsibilities (one item per line). Display-only; not used in matching.';
comment on column public.job_posts.benefit_lines is
  'Optional employer-offered benefits (one item per line). Empty is allowed. Display-only; not used in matching.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'job_posts_duty_lines_len'
      and conrelid = 'public.job_posts'::regclass
  ) then
    alter table public.job_posts
      add constraint job_posts_duty_lines_len
      check (cardinality(coalesce(duty_lines, '{}'::text[])) <= 30);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'job_posts_benefit_lines_len'
      and conrelid = 'public.job_posts'::regclass
  ) then
    alter table public.job_posts
      add constraint job_posts_benefit_lines_len
      check (cardinality(coalesce(benefit_lines, '{}'::text[])) <= 30);
  end if;
end $$;

notify pgrst, 'reload schema';
