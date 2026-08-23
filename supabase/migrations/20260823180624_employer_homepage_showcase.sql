-- Homepage company logo showcase (opt-in, admin-controlled).
-- Only employers with public profile + logo + homepage_showcase appear on the homepage carousel.

alter table public.employer_profiles
  add column if not exists homepage_showcase boolean not null default false;

comment on column public.employer_profiles.homepage_showcase is
  'Admin-controlled opt-in for homepage logo carousel. Employers cannot set via client API.';

create index if not exists employer_profiles_homepage_showcase_idx
  on public.employer_profiles (homepage_showcase)
  where homepage_showcase = true;

-- Strip homepage_showcase mutations from non-admin JWTs.
create or replace function public.protect_employer_profiles_homepage_showcase()
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
    new.homepage_showcase := false;
    return new;
  end if;

  new.homepage_showcase := old.homepage_showcase;
  return new;
end;
$$;

comment on function public.protect_employer_profiles_homepage_showcase() is
  'BEFORE INSERT/UPDATE on employer_profiles: only admin JWT or service role may change homepage_showcase.';

drop trigger if exists protect_employer_profiles_homepage_showcase_trg on public.employer_profiles;
create trigger protect_employer_profiles_homepage_showcase_trg
  before insert or update on public.employer_profiles
  for each row
  execute function public.protect_employer_profiles_homepage_showcase();

drop view if exists public.employer_homepage_showcase_profiles;

create view public.employer_homepage_showcase_profiles
with (security_invoker = false, security_barrier = true)
as
select
  ep.id,
  ep.public_slug,
  ep.company_name,
  ep.logo_url,
  ep.website
from public.employer_profiles ep
where coalesce(ep.homepage_showcase, false) = true
  and ep.public_slug is not null
  and btrim(coalesce(ep.company_name, '')) <> ''
  and btrim(coalesce(ep.logo_url, '')) <> ''
  and public.employer_profile_has_published_job(ep.id);

comment on view public.employer_homepage_showcase_profiles is
  'Homepage logo carousel rows: opt-in employers with public profile, logo, and a published job.';

revoke all on table public.employer_homepage_showcase_profiles from public;
revoke all on table public.employer_homepage_showcase_profiles from anon;
revoke all on table public.employer_homepage_showcase_profiles from authenticated;
grant select on table public.employer_homepage_showcase_profiles to anon, authenticated;

create or replace function private.set_employer_homepage_showcase(
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
  set homepage_showcase = coalesce(p_enabled, false)
  where id = p_employer_profile_id;

  if not found then
    raise exception 'employer_profile_not_found'
      using errcode = 'P0002';
  end if;
end;
$$;

comment on function private.set_employer_homepage_showcase(uuid, boolean) is
  'Admin/server: opt employer in or out of homepage logo showcase. Not granted to anon/authenticated.';

revoke all on function private.set_employer_homepage_showcase(uuid, boolean) from public;
revoke all on function private.set_employer_homepage_showcase(uuid, boolean) from anon, authenticated;
grant execute on function private.set_employer_homepage_showcase(uuid, boolean) to postgres;

notify pgrst, 'reload schema';
