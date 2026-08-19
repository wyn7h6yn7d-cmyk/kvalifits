-- Saved jobs (mirror of migration 20260817103953_saved_jobs.sql).
-- Run in Supabase SQL Editor if the local migration has not been applied remotely.

create table if not exists public.saved_jobs (
  id uuid primary key default gen_random_uuid(),
  seeker_user_id uuid not null references auth.users(id) on delete cascade,
  job_post_id uuid not null references public.job_posts(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists saved_jobs_seeker_job_unique
  on public.saved_jobs (seeker_user_id, job_post_id);

create index if not exists saved_jobs_seeker_created_idx
  on public.saved_jobs (seeker_user_id, created_at desc);

create index if not exists saved_jobs_job_post_idx
  on public.saved_jobs (job_post_id);

comment on table public.saved_jobs is
  'Seeker bookmarks of job posts. Private to the seeker; employers cannot enumerate savers.';
comment on column public.saved_jobs.seeker_user_id is
  'Auth user id of the seeker who saved the listing.';
comment on column public.saved_jobs.job_post_id is
  'Job post that was saved.';

create or replace function public.current_user_is_seeker()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'seeker'
  );
$$;

revoke all on function public.current_user_is_seeker() from public;
grant execute on function public.current_user_is_seeker() to authenticated;

create or replace function public.current_user_has_saved_job(post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.saved_jobs sj
    where sj.job_post_id = post_id
      and sj.seeker_user_id = auth.uid()
  );
$$;

revoke all on function public.current_user_has_saved_job(uuid) from public;
grant execute on function public.current_user_has_saved_job(uuid) to authenticated;

create or replace function public.current_user_saved_job_for_employer(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.saved_jobs sj
    join public.job_posts jp on jp.id = sj.job_post_id
    where sj.seeker_user_id = auth.uid()
      and jp.employer_profile_id = profile_id
  );
$$;

revoke all on function public.current_user_saved_job_for_employer(uuid) from public;
grant execute on function public.current_user_saved_job_for_employer(uuid) to authenticated;

alter table public.saved_jobs enable row level security;

drop policy if exists "saved_jobs_select_own" on public.saved_jobs;
create policy "saved_jobs_select_own"
  on public.saved_jobs
  for select
  to authenticated
  using (
    seeker_user_id = auth.uid()
    and public.current_user_is_seeker()
  );

drop policy if exists "saved_jobs_insert_own" on public.saved_jobs;
create policy "saved_jobs_insert_own"
  on public.saved_jobs
  for insert
  to authenticated
  with check (
    seeker_user_id = auth.uid()
    and public.current_user_is_seeker()
    and exists (
      select 1
      from public.job_posts jp
      where jp.id = job_post_id
        and (jp.status)::text = 'published'
    )
  );

drop policy if exists "saved_jobs_delete_own" on public.saved_jobs;
create policy "saved_jobs_delete_own"
  on public.saved_jobs
  for delete
  to authenticated
  using (
    seeker_user_id = auth.uid()
    and public.current_user_is_seeker()
  );

revoke all on table public.saved_jobs from public;
revoke all on table public.saved_jobs from anon;
revoke all on table public.saved_jobs from authenticated;
grant select, insert, delete on table public.saved_jobs to authenticated;
grant all on table public.saved_jobs to service_role;

drop policy if exists "job_posts_select_saved_by_seeker" on public.job_posts;
create policy "job_posts_select_saved_by_seeker"
  on public.job_posts
  for select
  to authenticated
  using (public.current_user_has_saved_job(id));

-- Company names for saved listings come from employer_saved_public_profiles
-- (see fix-employer-profiles-public-column-grants.sql). Do not add a table
-- SELECT policy here: authenticated table SELECT of other companies leaks
-- private employer columns.
drop policy if exists "employer_profiles_select_for_saved_jobs" on public.employer_profiles;

notify pgrst, 'reload schema';
