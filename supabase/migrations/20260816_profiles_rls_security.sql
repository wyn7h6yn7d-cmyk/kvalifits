-- Harden public.profiles: enable RLS, own-row access, protect privilege columns.
-- Admins retain list/update via security-definer helper (avoids RLS recursion).
-- anon has no SELECT/UPDATE/INSERT policies on private profile data.

-- ---------------------------------------------------------------------------
-- Helper: admin check without RLS recursion on profiles
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Guard: non-admins cannot set/change privilege fields
-- (role, is_blocked — verification lives on employer/certificate tables)
-- ---------------------------------------------------------------------------
create or replace function public.profiles_guard_security_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_is_admin boolean;
begin
  -- Service role / system (auth.uid() null) may write freely.
  if auth.uid() is null then
    return new;
  end if;

  select public.current_user_is_admin() into actor_is_admin;

  if coalesce(actor_is_admin, false) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Registration may set seeker|employer only — never self-assign admin.
    if new.role is null or new.role not in ('seeker', 'employer') then
      raise exception 'profiles: invalid role for non-admin insert'
        using errcode = '42501';
    end if;
    new.is_blocked := false;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Lock privilege / moderation columns for ordinary users.
    new.role := old.role;
    new.is_blocked := old.is_blocked;
    return new;
  end if;

  return new;
end;
$$;

comment on function public.profiles_guard_security_fields() is
  'Prevents non-admins from changing role / is_blocked; blocks admin self-assignment on insert.';

drop trigger if exists profiles_guard_security_fields_trg on public.profiles;
create trigger profiles_guard_security_fields_trg
  before insert or update on public.profiles
  for each row
  execute function public.profiles_guard_security_fields();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Drop known policy names if re-running (idempotent).
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "admin_select_profiles" on public.profiles;
drop policy if exists "admin_update_profiles" on public.profiles;

-- Own row only (authenticated). No anon policies → no anon private profile reads.
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

-- Admins: list and moderate any profile (e.g. is_blocked).
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

-- ---------------------------------------------------------------------------
-- Table grants: no anon access; authenticated CRUD limited by RLS + trigger
-- (DELETE reserved for service role / account deletion workflows)
-- ---------------------------------------------------------------------------
revoke all on table public.profiles from anon;
revoke all on table public.profiles from public;

grant select, insert, update on table public.profiles to authenticated;

notify pgrst, 'reload schema';
