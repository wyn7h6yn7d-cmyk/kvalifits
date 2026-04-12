-- Run in Supabase SQL Editor for public /tood listings + employer profile access.
-- Includes fix for: infinite recursion detected in policy for relation "employer_profiles"
-- (SELECT on employer_profiles must not use a plain EXISTS on job_posts when job_posts
-- policies reference employer_profiles — use the security definer helper below.)

-- Published job posts readable by anyone (anon + logged-in users).
drop policy if exists "job_posts_select_published_public" on public.job_posts;
create policy "job_posts_select_published_public"
on public.job_posts
for select
to anon, authenticated
using ((status)::text = 'published');

-- Helper: see migration 20260415_fix_employer_profiles_rls_recursion.sql
create or replace function public.employer_profile_has_published_job(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.job_posts jp
    where jp.employer_profile_id = profile_id
      and (jp.status)::text = 'published'
  );
$$;

revoke all on function public.employer_profile_has_published_job(uuid) from public;
grant execute on function public.employer_profile_has_published_job(uuid) to anon, authenticated;

-- Employer row readable for public listings only when at least one published job exists.
drop policy if exists "employer_profiles_select_for_published_jobs" on public.employer_profiles;
create policy "employer_profiles_select_for_published_jobs"
on public.employer_profiles
for select
to anon, authenticated
using (public.employer_profile_has_published_job(id));

-- Employers read their own company row (drafts, onboarding, account).
drop policy if exists "employer_profiles_select_own" on public.employer_profiles;
create policy "employer_profiles_select_own"
on public.employer_profiles
for select
to authenticated
using (owner_user_id = auth.uid());
