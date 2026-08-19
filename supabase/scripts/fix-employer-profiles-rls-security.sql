-- Harden employer_profiles RLS (mirror of
-- migration 20260816_employer_profiles_rls_security.sql).
-- Run in Supabase SQL Editor if needed. Does not change job_posts.

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

create or replace function public.employer_profiles_guard_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
begin
  if auth.uid() is null then
    is_admin := true;
  else
    select public.current_user_is_admin() into is_admin;
  end if;

  if not coalesce(is_admin, false) then
    if tg_op = 'INSERT' then
      new.company_verified := false;
      new.verification_status := 'unverified';
      new.verification_source := null;
      new.verified_at := null;
    elsif tg_op = 'UPDATE' then
      new.owner_user_id := old.owner_user_id;
      new.company_verified := old.company_verified;
      new.verification_status := old.verification_status;
      new.verification_source := old.verification_source;
      new.verified_at := old.verified_at;
    end if;
    return new;
  end if;

  if new.verification_status is null
     or new.verification_status not in ('unverified', 'under_review', 'verified') then
    new.verification_status := 'unverified';
  end if;

  new.company_verified := (new.verification_status = 'verified');

  if new.verification_status = 'verified' then
    if new.verified_at is null then
      new.verified_at := now();
    end if;
    if new.verification_source is null or btrim(new.verification_source) = '' then
      new.verification_source := 'manual';
    end if;
  else
    new.verified_at := null;
    new.verification_source := null;
  end if;

  return new;
end;
$$;

drop trigger if exists employer_profiles_guard_verification on public.employer_profiles;
create trigger employer_profiles_guard_verification
  before insert or update on public.employer_profiles
  for each row
  execute function public.employer_profiles_guard_verification();

alter table public.employer_profiles enable row level security;

drop policy if exists "employer_profiles_select_own" on public.employer_profiles;
create policy "employer_profiles_select_own"
  on public.employer_profiles
  for select
  to authenticated
  using (owner_user_id = auth.uid());

drop policy if exists "employer_profiles_insert_own" on public.employer_profiles;
create policy "employer_profiles_insert_own"
  on public.employer_profiles
  for insert
  to authenticated
  with check (owner_user_id = auth.uid());

drop policy if exists "employer_profiles_update_own" on public.employer_profiles;
create policy "employer_profiles_update_own"
  on public.employer_profiles
  for update
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- Authenticated non-owners read public fields via employer_public_profiles.
-- Table published-job SELECT stays anon-only so login cannot widen columns.
drop policy if exists "employer_profiles_select_for_published_jobs" on public.employer_profiles;
create policy "employer_profiles_select_for_published_jobs"
  on public.employer_profiles
  for select
  to anon
  using (public.employer_profile_has_published_job(id));

drop policy if exists "employer_profiles_select_for_saved_jobs" on public.employer_profiles;

drop policy if exists "admin_select_employer_profiles" on public.employer_profiles;
create policy "admin_select_employer_profiles"
  on public.employer_profiles
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "admin_update_employer_profiles" on public.employer_profiles;
create policy "admin_update_employer_profiles"
  on public.employer_profiles
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Do not GRANT table-level SELECT to authenticated (exposes private columns).
-- Column grants: supabase/scripts/fix-employer-profiles-public-column-grants.sql
revoke all on table public.employer_profiles from public;
grant insert, update on table public.employer_profiles to authenticated;

notify pgrst, 'reload schema';
