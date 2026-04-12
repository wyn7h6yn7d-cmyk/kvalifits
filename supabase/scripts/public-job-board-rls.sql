-- Run in Supabase SQL Editor if /tood shows no jobs when logged out.
-- See supabase/migrations/20260414_public_job_board_rls.sql (same content).

drop policy if exists "job_posts_select_published_public" on public.job_posts;
create policy "job_posts_select_published_public"
on public.job_posts
for select
to anon, authenticated
using ((status)::text = 'published');

drop policy if exists "employer_profiles_select_for_published_jobs" on public.employer_profiles;
create policy "employer_profiles_select_for_published_jobs"
on public.employer_profiles
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.job_posts jp
    where jp.employer_profile_id = employer_profiles.id
      and (jp.status)::text = 'published'
  )
);

drop policy if exists "employer_profiles_select_own" on public.employer_profiles;
create policy "employer_profiles_select_own"
on public.employer_profiles
for select
to authenticated
using (owner_user_id = auth.uid());
