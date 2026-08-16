-- Harden public.profiles RLS (mirror of migration 20260816_profiles_rls_security.sql).
-- Run in Supabase SQL Editor if needed.

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

comment on function public.current_user_is_admin() is
  'True when auth.uid() has profiles.role = admin. SECURITY DEFINER to avoid RLS recursion.';

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

create or replace function public.profiles_guard_security_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_is_admin boolean;
begin
  if auth.uid() is null then
    return new;
  end if;

  select public.current_user_is_admin() into actor_is_admin;

  if coalesce(actor_is_admin, false) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role is null or new.role not in ('seeker', 'employer') then
      raise exception 'profiles: invalid role for non-admin insert'
        using errcode = '42501';
    end if;
    new.is_blocked := false;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.role := old.role;
    new.is_blocked := old.is_blocked;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_security_fields_trg on public.profiles;
create trigger profiles_guard_security_fields_trg
  before insert or update on public.profiles
  for each row
  execute function public.profiles_guard_security_fields();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "admin_select_profiles" on public.profiles;
drop policy if exists "admin_update_profiles" on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "admin_select_profiles"
  on public.profiles
  for select
  to authenticated
  using (public.current_user_is_admin());

create policy "admin_update_profiles"
  on public.profiles
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

revoke all on table public.profiles from anon;
revoke all on table public.profiles from public;

grant select, insert, update on table public.profiles to authenticated;

notify pgrst, 'reload schema';
