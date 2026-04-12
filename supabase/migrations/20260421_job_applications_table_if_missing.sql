-- Create job_applications when 20260408 never ran on this database (repair / partial deploy).

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid not null references public.job_posts(id) on delete cascade,
  seeker_user_id uuid not null references auth.users(id) on delete cascade,
  cover_letter text null,
  consent_to_share boolean not null default false,
  shared_profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.job_applications
  add column if not exists match_score smallint,
  add column if not exists match_breakdown jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'submitted',
  add column if not exists updated_at timestamptz not null default now();

comment on column public.job_applications.match_score is
  '0–100 suitability score at application time (or last recompute).';
comment on column public.job_applications.match_breakdown is
  'Structured sub-scores and counts for transparent UI.';

create unique index if not exists job_applications_one_per_job_per_seeker
  on public.job_applications (job_post_id, seeker_user_id);

create index if not exists job_applications_job_score_idx
  on public.job_applications (job_post_id, match_score desc nulls last);

alter table public.job_applications enable row level security;

drop policy if exists "seeker_insert_own_applications" on public.job_applications;
create policy "seeker_insert_own_applications"
on public.job_applications
for insert
to authenticated
with check (
  seeker_user_id = auth.uid()
);

drop policy if exists "seeker_select_own_applications" on public.job_applications;
create policy "seeker_select_own_applications"
on public.job_applications
for select
to authenticated
using (
  seeker_user_id = auth.uid()
);

drop policy if exists "employer_select_applications_for_own_jobs" on public.job_applications;
create policy "employer_select_applications_for_own_jobs"
on public.job_applications
for select
to authenticated
using (
  exists (
    select 1
    from public.job_posts jp
    join public.employer_profiles ep on ep.id = jp.employer_profile_id
    where jp.id = job_applications.job_post_id
      and ep.owner_user_id = auth.uid()
  )
);

drop policy if exists "admin_select_all_applications" on public.job_applications;
create policy "admin_select_all_applications"
on public.job_applications
for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

notify pgrst, 'reload schema';
