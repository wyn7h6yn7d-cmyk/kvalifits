-- Allow seekers to withdraw (update) their own job applications.

drop policy if exists "seeker_update_own_applications" on public.job_applications;
create policy "seeker_update_own_applications"
on public.job_applications
for update
to authenticated
using (
  seeker_user_id = auth.uid()
)
with check (
  seeker_user_id = auth.uid()
);

