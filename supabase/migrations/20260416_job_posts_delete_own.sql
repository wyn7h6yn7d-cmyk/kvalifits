-- Employers: delete own job posts from the app (browser client + RLS).
-- job_applications rows cascade when job_posts row is deleted (FK on delete cascade).

drop policy if exists "job_posts_delete_own" on public.job_posts;
create policy "job_posts_delete_own"
on public.job_posts
for delete
to authenticated
using (
  exists (
    select 1
    from public.employer_profiles ep
    where ep.id = job_posts.employer_profile_id
      and ep.owner_user_id = auth.uid()
  )
);
