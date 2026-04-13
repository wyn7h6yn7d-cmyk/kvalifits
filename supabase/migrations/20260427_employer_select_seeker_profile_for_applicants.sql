-- Allow employers to read seeker_profiles rows for users who have applied to their jobs.
-- Used to show current cv_url when the application snapshot omits it.

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
