-- Structured fields for future suitability / matching (additive, IF NOT EXISTS)

-- Seeker extras (may already exist in some projects)
alter table public.seeker_profiles
  add column if not exists salary_expectation text,
  add column if not exists work_authorization_notes text,
  add column if not exists cv_url text;

-- Employer extras
alter table public.employer_profiles
  add column if not exists company_size text;

-- Job post structured matching inputs
alter table public.job_posts
  add column if not exists short_summary text,
  add column if not exists requirement_lines text[] not null default '{}'::text[],
  add column if not exists required_skills text[] not null default '{}'::text[],
  add column if not exists keywords text[] not null default '{}'::text[],
  add column if not exists experience_level_required text,
  add column if not exists certificate_requirements text;

comment on column public.job_posts.requirement_lines is 'Structured job requirements (one line per item) for transparent matching.';
comment on column public.job_posts.required_skills is 'Structured skill tags for matching against seeker skills.';
comment on column public.job_posts.keywords is 'Search / matching keywords separate from long description text.';
