-- Harden job_posts RLS (mirror of migration 20260816_job_posts_rls_security.sql).
-- Run in Supabase SQL Editor if needed. Does not change UI.

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

create or replace function public.current_user_owns_employer_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.employer_profiles ep
    where ep.id = profile_id
      and ep.owner_user_id = auth.uid()
  );
$$;

revoke all on function public.current_user_owns_employer_profile(uuid) from public;
grant execute on function public.current_user_owns_employer_profile(uuid) to authenticated;

alter table public.job_posts enable row level security;

drop policy if exists "job_posts_select_published_public" on public.job_posts;
drop policy if exists "job_posts_select_own" on public.job_posts;
drop policy if exists "job_posts_insert_own" on public.job_posts;
drop policy if exists "job_posts_update_own" on public.job_posts;
drop policy if exists "job_posts_delete_own" on public.job_posts;
drop policy if exists "admin_select_job_posts" on public.job_posts;
drop policy if exists "admin_update_job_posts" on public.job_posts;
drop policy if exists "admin_delete_job_posts" on public.job_posts;

create policy "job_posts_select_published_public"
  on public.job_posts
  for select
  to anon, authenticated
  using ((status)::text = 'published');

create policy "job_posts_select_own"
  on public.job_posts
  for select
  to authenticated
  using (public.current_user_owns_employer_profile(employer_profile_id));

create policy "job_posts_insert_own"
  on public.job_posts
  for insert
  to authenticated
  with check (public.current_user_owns_employer_profile(employer_profile_id));

create policy "job_posts_update_own"
  on public.job_posts
  for update
  to authenticated
  using (public.current_user_owns_employer_profile(employer_profile_id))
  with check (public.current_user_owns_employer_profile(employer_profile_id));

create policy "job_posts_delete_own"
  on public.job_posts
  for delete
  to authenticated
  using (public.current_user_owns_employer_profile(employer_profile_id));

create policy "admin_select_job_posts"
  on public.job_posts
  for select
  to authenticated
  using (public.current_user_is_admin());

create policy "admin_update_job_posts"
  on public.job_posts
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "admin_delete_job_posts"
  on public.job_posts
  for delete
  to authenticated
  using (public.current_user_is_admin());

revoke all on table public.job_posts from public;
grant select on table public.job_posts to anon;
grant select, insert, update, delete on table public.job_posts to authenticated;

notify pgrst, 'reload schema';
