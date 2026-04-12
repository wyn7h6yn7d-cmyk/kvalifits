-- Repair job_posts structured columns on DBs that missed 20260411 (idempotent).

alter table public.job_posts
  add column if not exists short_summary text,
  add column if not exists requirement_lines text[] not null default '{}'::text[],
  add column if not exists required_skills text[] not null default '{}'::text[],
  add column if not exists keywords text[] not null default '{}'::text[],
  add column if not exists experience_level_required text,
  add column if not exists certificate_requirements text;

comment on column public.job_posts.requirement_lines is
  'Structured job requirements (one line per item) for transparent matching.';
comment on column public.job_posts.required_skills is
  'Structured skill tags for matching against seeker skills.';
comment on column public.job_posts.keywords is
  'Search / matching keywords separate from long description text.';
comment on column public.job_posts.certificate_requirements is
  'Certificate / qualification expectations (comma or newline separated); used by matching when set.';

notify pgrst, 'reload schema';
