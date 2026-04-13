-- Run in Supabase SQL Editor if migration not applied.
-- Same as supabase/migrations/20260427_employer_select_seeker_profile_for_applicants.sql

drop policy if exists "employer_select_seeker_profiles_for_own_job_applicants" on public.seeker_profiles;

create policy "employer_select_seeker_profiles_for_own_job_applicants"
on public.seeker_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.job_applications ja
    join public.job_posts jp on jp.id = ja.job_post_id
    join public.employer_profiles ep on ep.id = jp.employer_profile_id
    where ja.seeker_user_id = seeker_profiles.user_id
      and ep.owner_user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
