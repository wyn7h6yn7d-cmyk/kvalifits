-- Fixes: public company directory slug + public view.
-- Mirror of migration 20260817121339_employer_public_profiles.sql.
-- Run in Supabase SQL Editor if /ettevotted is empty or company pages 404.
-- Safe to re-run.

-- Public company directory: stable slug + column-limited public surface.
-- Visibility stays “has a published job” (existing RLS helper).
-- Does not expose owner, contacts, registry, billing, or verification admin fields.

-- ---------------------------------------------------------------------------
-- public_slug
-- ---------------------------------------------------------------------------
create or replace function public.slugify_company_name(raw text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(both '-' from regexp_replace(
      regexp_replace(
        lower(translate(btrim(coalesce(raw, '')), 'äöüõšžÄÖÜÕŠŽ', 'aouoszaouosz')),
        '[^a-z0-9]+',
        '-',
        'g'
      ),
      '-{2,}',
      '-',
      'g'
    )),
    ''
  );
$$;

revoke all on function public.slugify_company_name(text) from public;
grant execute on function public.slugify_company_name(text) to authenticated;

create or replace function public.employer_profiles_assign_public_slug()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  n integer := 1;
begin
  if tg_op = 'UPDATE' then
    -- Clients cannot pick or change slugs (stable public URLs).
    new.public_slug := old.public_slug;
  end if;

  if new.public_slug is not null and btrim(new.public_slug) <> '' then
    return new;
  end if;

  if btrim(coalesce(new.company_name, '')) = '' then
    new.public_slug := null;
    return new;
  end if;

  base := coalesce(public.slugify_company_name(new.company_name), 'ettevote');
  if char_length(base) > 72 then
    base := trim(both '-' from left(base, 72));
  end if;
  if base = '' then
    base := 'ettevote';
  end if;

  candidate := base;
  while exists (
    select 1
    from public.employer_profiles ep
    where ep.public_slug = candidate
      and ep.id is distinct from new.id
  ) loop
    n := n + 1;
    candidate := left(base, 70) || '-' || n::text;
  end loop;

  new.public_slug := candidate;
  return new;
end;
$$;

alter table public.employer_profiles
  add column if not exists public_slug text;

drop trigger if exists employer_profiles_assign_public_slug_trg on public.employer_profiles;
create trigger employer_profiles_assign_public_slug_trg
  before insert or update on public.employer_profiles
  for each row
  execute function public.employer_profiles_assign_public_slug();

-- Backfill existing named companies (trigger fills null slugs).
update public.employer_profiles
set public_slug = public_slug
where public_slug is null
  and btrim(coalesce(company_name, '')) <> '';

create unique index if not exists employer_profiles_public_slug_uidx
  on public.employer_profiles (public_slug)
  where public_slug is not null;

comment on column public.employer_profiles.public_slug is
  'Stable public URL key for /ettevotted/[slug]. Server-assigned from company name; not client-writable.';

-- ---------------------------------------------------------------------------
-- Public view (safe columns only)
-- ---------------------------------------------------------------------------
-- Public view + column grants: prefer
-- supabase/scripts/fix-employer-profiles-public-column-grants.sql
drop view if exists public.employer_saved_public_profiles;
drop view if exists public.employer_public_profiles;
create view public.employer_public_profiles
with (security_invoker = false, security_barrier = true)
as
select
  ep.id,
  ep.public_slug,
  ep.company_name,
  ep.logo_url,
  ep.location,
  ep.industry,
  ep.website,
  ep.company_description,
  ep.company_verified,
  ep.verification_status
from public.employer_profiles ep
where public.employer_profile_has_published_job(ep.id);

comment on view public.employer_public_profiles is
  'Public company directory rows. No owner, contacts, registry, billing, or verification admin metadata.';

revoke all on table public.employer_public_profiles from public;
revoke all on table public.employer_public_profiles from anon;
revoke all on table public.employer_public_profiles from authenticated;
grant select on table public.employer_public_profiles to anon, authenticated;

-- Authenticated non-owners must not hit the table for other companies.
drop policy if exists "employer_profiles_select_for_published_jobs" on public.employer_profiles;
create policy "employer_profiles_select_for_published_jobs"
  on public.employer_profiles
  for select
  to anon
  using (public.employer_profile_has_published_job(id));

drop policy if exists "employer_profiles_select_for_saved_jobs" on public.employer_profiles;

-- ---------------------------------------------------------------------------
-- Anon cannot SELECT private employer columns even when the row is public
-- ---------------------------------------------------------------------------
-- Anon + authenticated public columns; authenticated also gets owner/admin columns.
-- Full grant set: fix-employer-profiles-public-column-grants.sql
revoke all on table public.employer_profiles from public;
revoke all on table public.employer_profiles from anon;
revoke all on table public.employer_profiles from authenticated;
grant select (
  id,
  public_slug,
  company_name,
  logo_url,
  location,
  industry,
  website,
  company_description,
  company_verified,
  verification_status
) on table public.employer_profiles to anon, authenticated;
grant select (
  owner_user_id,
  registry_code,
  contact_email,
  contact_phone,
  company_size,
  created_at,
  updated_at,
  verification_source,
  verified_at
) on table public.employer_profiles to authenticated;
grant insert, update on table public.employer_profiles to authenticated;

notify pgrst, 'reload schema';
