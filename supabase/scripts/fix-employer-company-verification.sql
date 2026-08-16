-- Idempotent: employer company verification columns + non-admin guard.
-- Run in Supabase SQL Editor if profile/admin verification fails on missing columns.
-- Does NOT integrate Äriregister. Company name alone never marks verified.

alter table public.employer_profiles
  add column if not exists company_verified boolean not null default false,
  add column if not exists verification_status text,
  add column if not exists verification_source text,
  add column if not exists verified_at timestamptz;

update public.employer_profiles
set
  verification_status = 'unverified',
  company_verified = false,
  verification_source = null,
  verified_at = null
where verification_status is null
   or verification_status not in ('unverified', 'under_review', 'verified');

update public.employer_profiles
set company_verified = (verification_status = 'verified')
where company_verified is distinct from (verification_status = 'verified');

alter table public.employer_profiles
  alter column verification_status set default 'unverified';

alter table public.employer_profiles
  alter column verification_status set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'employer_profiles_verification_status_check'
      and conrelid = 'public.employer_profiles'::regclass
  ) then
    alter table public.employer_profiles
      add constraint employer_profiles_verification_status_check
      check (verification_status in ('unverified', 'under_review', 'verified'));
  end if;
end $$;

comment on column public.employer_profiles.company_verified is
  'True only when verification_status = verified. Never set by company name alone.';
comment on column public.employer_profiles.verification_status is
  'unverified | under_review | verified — defaults to unverified; not auto-verified on profile save.';
comment on column public.employer_profiles.verification_source is
  'How verification was established (e.g. manual). Null until verified. No Äriregister yet.';
comment on column public.employer_profiles.verified_at is
  'When the company was marked verified (null unless verified).';

create or replace function public.employer_profiles_guard_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
begin
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  ) into is_admin;

  -- Service role / system jobs (auth.uid() null) may update verification, e.g. account deletion.
  if auth.uid() is null then
    is_admin := true;
  end if;

  if not coalesce(is_admin, false) then
    if tg_op = 'INSERT' then
      new.company_verified := false;
      new.verification_status := 'unverified';
      new.verification_source := null;
      new.verified_at := null;
    elsif tg_op = 'UPDATE' then
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

drop policy if exists "admin_select_employer_profiles" on public.employer_profiles;
create policy "admin_select_employer_profiles"
on public.employer_profiles
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "admin_update_employer_profiles" on public.employer_profiles;
create policy "admin_update_employer_profiles"
on public.employer_profiles
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

notify pgrst, 'reload schema';
