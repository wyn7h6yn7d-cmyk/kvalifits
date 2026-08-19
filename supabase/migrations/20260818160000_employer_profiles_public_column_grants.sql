-- Harden employer_profiles READ exposure.
-- Anon and authenticated non-owners share the same public columns.
-- Owners keep owner fields on their own row; admins keep administrative fields.
-- System search columns are not granted to Data API roles.

-- ---------------------------------------------------------------------------
-- Public listing view (security definer so seekers still see public fields
-- after authenticated is removed from the table published-job SELECT policy).
-- ---------------------------------------------------------------------------
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
  'Public company directory and job-card fields. No owner, contacts, registry, or search indexes.';

revoke all on table public.employer_public_profiles from public;
revoke all on table public.employer_public_profiles from anon;
revoke all on table public.employer_public_profiles from authenticated;
grant select on table public.employer_public_profiles to anon, authenticated;

-- Saved (possibly archived) listings: public columns only, current user only.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'current_user_saved_job_for_employer'
      and pg_get_function_identity_arguments(p.oid) = 'uuid'
  ) then
    execute $v$
      create view public.employer_saved_public_profiles
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
      where public.current_user_saved_job_for_employer(ep.id)
    $v$;
    execute $c$
      comment on view public.employer_saved_public_profiles is
        'Public company fields for employers the current user saved a job from. No private contacts.'
    $c$;
    execute 'revoke all on table public.employer_saved_public_profiles from public';
    execute 'revoke all on table public.employer_saved_public_profiles from anon';
    execute 'revoke all on table public.employer_saved_public_profiles from authenticated';
    execute 'grant select on table public.employer_saved_public_profiles to authenticated';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- RLS: authenticated non-owners must not read table rows of other companies.
-- Anon keeps published-job SELECT (column-limited below).
-- ---------------------------------------------------------------------------
drop policy if exists "employer_profiles_select_for_published_jobs" on public.employer_profiles;
create policy "employer_profiles_select_for_published_jobs"
  on public.employer_profiles
  for select
  to anon
  using (public.employer_profile_has_published_job(id));

drop policy if exists "employer_profiles_select_for_saved_jobs" on public.employer_profiles;

-- ---------------------------------------------------------------------------
-- Grants: revoke table-level SELECT (it exposes every column), then grant
-- public columns to anon+authenticated and owner/admin columns to authenticated.
-- ---------------------------------------------------------------------------
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

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employer_profiles'
      and column_name = 'industry_id'
  ) then
    execute 'grant select (industry_id) on table public.employer_profiles to anon, authenticated';
  end if;
end $$;

comment on column public.employer_profiles.contact_email is
  'OWNER PRIVATE. Operational applications inbox; not on the public company surface.';
comment on column public.employer_profiles.contact_phone is
  'OWNER PRIVATE. Operational contact; not on the public company surface.';
comment on column public.employer_profiles.registry_code is
  'OWNER PRIVATE. Company registry identifier; not on the public company surface.';
comment on column public.employer_profiles.owner_user_id is
  'OWNER PRIVATE. Account owner; readable by owner and admin only.';
comment on column public.employer_profiles.company_size is
  'OWNER PRIVATE. Internal profile field; not on the public company surface.';
comment on column public.employer_profiles.verification_source is
  'ADMIN ONLY. How verification was recorded; not for seekers or other employers.';
comment on column public.employer_profiles.verified_at is
  'ADMIN ONLY. Verification timestamp; public state is company_verified / verification_status.';
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'employer_profiles' and column_name = 'search_text'
  ) then
    execute $c$comment on column public.employer_profiles.search_text is
      'SYSTEM. Search document; not granted to anon or authenticated.'$c$;
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'employer_profiles' and column_name = 'search_tsv'
  ) then
    execute $c$comment on column public.employer_profiles.search_tsv is
      'SYSTEM. Search vector; not granted to anon or authenticated.'$c$;
  end if;
end $$;

notify pgrst, 'reload schema';
