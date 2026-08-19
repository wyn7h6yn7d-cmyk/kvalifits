-- Allow employers to update application status on jobs they own (simple pipeline).

drop policy if exists "employer_update_applications_for_own_jobs" on public.job_applications;
create policy "employer_update_applications_for_own_jobs"
on public.job_applications
for update
to authenticated
using (
  exists (
    select 1
    from public.job_posts jp
    join public.employer_profiles ep on ep.id = jp.employer_profile_id
    where jp.id = job_applications.job_post_id
      and ep.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.job_posts jp
    join public.employer_profiles ep on ep.id = jp.employer_profile_id
    where jp.id = job_applications.job_post_id
      and ep.owner_user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
