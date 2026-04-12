-- Run in Supabase if employers cannot delete job posts (RLS).
-- See supabase/migrations/20260416_job_posts_delete_own.sql

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
