-- Harden public.seeker_profiles RLS (mirror of migration 20260816_seeker_profiles_rls_security.sql).
-- Run in Supabase SQL Editor if needed.

alter table public.seeker_profiles enable row level security;

drop policy if exists "seeker_select_own_profile" on public.seeker_profiles;
create policy "seeker_select_own_profile"
  on public.seeker_profiles
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "seeker_insert_own_profile" on public.seeker_profiles;
create policy "seeker_insert_own_profile"
  on public.seeker_profiles
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "seeker_update_own_profile" on public.seeker_profiles;
create policy "seeker_update_own_profile"
  on public.seeker_profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "seeker_delete_own_profile" on public.seeker_profiles;
create policy "seeker_delete_own_profile"
  on public.seeker_profiles
  for delete
  to authenticated
  using (user_id = auth.uid());

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

drop policy if exists "employer_select_discoverable_seeker_profiles" on public.seeker_profiles;
create policy "employer_select_discoverable_seeker_profiles"
  on public.seeker_profiles
  for select
  to authenticated
  using (
    profile_visible = true
    and exists (
      select 1
      from public.employer_profiles ep
      where ep.owner_user_id = auth.uid()
    )
  );

revoke all on table public.seeker_profiles from anon;
revoke all on table public.seeker_profiles from public;

grant select, insert, update, delete on table public.seeker_profiles to authenticated;

notify pgrst, 'reload schema';
