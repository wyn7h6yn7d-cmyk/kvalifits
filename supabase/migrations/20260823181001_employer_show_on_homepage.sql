-- Rename homepage_showcase -> show_on_homepage (admin-controlled homepage logo carousel opt-in).

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employer_profiles'
      and column_name = 'homepage_showcase'
  ) then
    alter table public.employer_profiles
      rename column homepage_showcase to show_on_homepage;
  elsif not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employer_profiles'
      and column_name = 'show_on_homepage'
  ) then
    alter table public.employer_profiles
      add column show_on_homepage boolean not null default false;
  end if;
end $$;

comment on column public.employer_profiles.show_on_homepage is
  'Admin-controlled opt-in for homepage logo carousel. Employers cannot set via client API.';

drop index if exists employer_profiles_homepage_showcase_idx;

create index if not exists employer_profiles_show_on_homepage_idx
  on public.employer_profiles (show_on_homepage)
  where show_on_homepage = true;

drop trigger if exists protect_employer_profiles_homepage_showcase_trg on public.employer_profiles;
drop function if exists public.protect_employer_profiles_homepage_showcase();

create or replace function public.protect_employer_profiles_show_on_homepage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.current_user_is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.show_on_homepage := false;
    return new;
  end if;

  new.show_on_homepage := old.show_on_homepage;
  return new;
end;
$$;

comment on function public.protect_employer_profiles_show_on_homepage() is
  'BEFORE INSERT/UPDATE on employer_profiles: only admin JWT or service role may change show_on_homepage.';

drop trigger if exists protect_employer_profiles_show_on_homepage_trg on public.employer_profiles;
create trigger protect_employer_profiles_show_on_homepage_trg
  before insert or update on public.employer_profiles
  for each row
  execute function public.protect_employer_profiles_show_on_homepage();

drop view if exists public.employer_homepage_showcase_profiles;
drop view if exists public.employer_show_on_homepage_profiles;

create view public.employer_show_on_homepage_profiles
with (security_invoker = false, security_barrier = true)
as
select
  ep.id,
  ep.public_slug,
  ep.company_name,
  ep.logo_url,
  ep.website
from public.employer_profiles ep
where coalesce(ep.show_on_homepage, false) = true
  and ep.public_slug is not null
  and btrim(coalesce(ep.company_name, '')) <> ''
  and btrim(coalesce(ep.logo_url, '')) <> ''
  and public.employer_profile_has_published_job(ep.id);

comment on view public.employer_show_on_homepage_profiles is
  'Homepage logo carousel: admin opt-in employers with public profile, logo, and a published job.';

revoke all on table public.employer_show_on_homepage_profiles from public;
revoke all on table public.employer_show_on_homepage_profiles from anon;
revoke all on table public.employer_show_on_homepage_profiles from authenticated;
grant select on table public.employer_show_on_homepage_profiles to anon, authenticated;

drop function if exists private.set_employer_homepage_showcase(uuid, boolean);

create or replace function private.set_employer_show_on_homepage(
  p_employer_profile_id uuid,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.employer_profiles
  set show_on_homepage = coalesce(p_enabled, false)
  where id = p_employer_profile_id;

  if not found then
    raise exception 'employer_profile_not_found'
      using errcode = 'P0002';
  end if;
end;
$$;

comment on function private.set_employer_show_on_homepage(uuid, boolean) is
  'Admin/server: opt employer in or out of homepage logo carousel. Not granted to anon/authenticated.';

revoke all on function private.set_employer_show_on_homepage(uuid, boolean) from public;
revoke all on function private.set_employer_show_on_homepage(uuid, boolean) from anon, authenticated;
grant execute on function private.set_employer_show_on_homepage(uuid, boolean) to postgres;

notify pgrst, 'reload schema';
