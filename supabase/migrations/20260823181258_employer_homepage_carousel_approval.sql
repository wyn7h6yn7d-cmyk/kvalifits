-- Homepage carousel approval: admin-only showcase flags + approved carousel asset path.

alter table public.employer_profiles
  add column if not exists homepage_logo_approved boolean not null default false,
  add column if not exists carousel_logo_path text,
  add column if not exists use_logo_plate boolean not null default false;

comment on column public.employer_profiles.homepage_logo_approved is
  'Admin-approved homepage carousel logo. Employers cannot set via client API.';
comment on column public.employer_profiles.carousel_logo_path is
  'Storage path in avatars bucket for admin-prepared carousel logo asset. Not employer-writable.';
comment on column public.employer_profiles.use_logo_plate is
  'When true, homepage carousel renders the approved logo on a subtle plate. Admin-only.';

create index if not exists employer_profiles_homepage_carousel_active_idx
  on public.employer_profiles (show_on_homepage, homepage_logo_approved)
  where show_on_homepage = true and homepage_logo_approved = true;

drop trigger if exists protect_employer_profiles_show_on_homepage_trg on public.employer_profiles;
drop function if exists public.protect_employer_profiles_show_on_homepage();

create or replace function public.protect_employer_profiles_homepage_carousel_fields()
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
    new.homepage_logo_approved := false;
    new.carousel_logo_path := null;
    new.use_logo_plate := false;
    return new;
  end if;

  new.show_on_homepage := old.show_on_homepage;
  new.homepage_logo_approved := old.homepage_logo_approved;
  new.carousel_logo_path := old.carousel_logo_path;
  new.use_logo_plate := old.use_logo_plate;

  if new.logo_url is distinct from old.logo_url then
    new.show_on_homepage := false;
    new.homepage_logo_approved := false;
    new.carousel_logo_path := null;
    new.use_logo_plate := false;
  end if;

  return new;
end;
$$;

comment on function public.protect_employer_profiles_homepage_carousel_fields() is
  'BEFORE INSERT/UPDATE: employers may change logo_url only; homepage carousel fields are admin-only.';

drop trigger if exists protect_employer_profiles_homepage_carousel_fields_trg on public.employer_profiles;
create trigger protect_employer_profiles_homepage_carousel_fields_trg
  before insert or update on public.employer_profiles
  for each row
  execute function public.protect_employer_profiles_homepage_carousel_fields();

create or replace function public.validate_employer_profiles_homepage_carousel_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.homepage_logo_approved, false) then
    if btrim(coalesce(new.logo_url, '')) = '' then
      raise exception 'homepage_carousel_original_logo_required'
        using errcode = '23514';
    end if;
    if btrim(coalesce(new.carousel_logo_path, '')) = '' then
      raise exception 'homepage_carousel_asset_required'
        using errcode = '23514';
    end if;
  end if;

  if coalesce(new.show_on_homepage, false) and not coalesce(new.homepage_logo_approved, false) then
    raise exception 'homepage_carousel_approval_required'
      using errcode = '23514';
  end if;

  if coalesce(new.show_on_homepage, false) or coalesce(new.homepage_logo_approved, false) then
    if btrim(coalesce(new.logo_url, '')) = '' then
      raise exception 'homepage_carousel_original_logo_required'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_employer_profiles_homepage_carousel_fields_trg on public.employer_profiles;
create trigger validate_employer_profiles_homepage_carousel_fields_trg
  before insert or update on public.employer_profiles
  for each row
  execute function public.validate_employer_profiles_homepage_carousel_fields();

drop view if exists public.employer_homepage_showcase_profiles;
drop view if exists public.employer_show_on_homepage_profiles;

create view public.employer_show_on_homepage_profiles
with (security_invoker = false, security_barrier = true)
as
select
  ep.id,
  ep.public_slug,
  ep.company_name,
  ep.carousel_logo_path,
  ep.use_logo_plate,
  ep.website
from public.employer_profiles ep
where coalesce(ep.show_on_homepage, false) = true
  and coalesce(ep.homepage_logo_approved, false) = true
  and ep.public_slug is not null
  and btrim(coalesce(ep.company_name, '')) <> ''
  and btrim(coalesce(ep.logo_url, '')) <> ''
  and btrim(coalesce(ep.carousel_logo_path, '')) <> ''
  and public.employer_profile_has_published_job(ep.id);

comment on view public.employer_show_on_homepage_profiles is
  'Homepage logo carousel: admin opt-in + approved carousel asset, public profile, original logo present.';

revoke all on table public.employer_show_on_homepage_profiles from public;
revoke all on table public.employer_show_on_homepage_profiles from anon;
revoke all on table public.employer_show_on_homepage_profiles from authenticated;
grant select on table public.employer_show_on_homepage_profiles to anon, authenticated;

-- Employers may upload only to their own non-carousel-logo folders in avatars.
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (
      public.current_user_is_admin()
      or (
        (storage.foldername(name))[1] = auth.uid()::text
        and coalesce((storage.foldername(name))[2], '') <> 'carousel-logo'
      )
    )
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (
      public.current_user_is_admin()
      or (
        (storage.foldername(name))[1] = auth.uid()::text
        and coalesce((storage.foldername(name))[2], '') <> 'carousel-logo'
      )
    )
  )
  with check (
    bucket_id = 'avatars'
    and (
      public.current_user_is_admin()
      or (
        (storage.foldername(name))[1] = auth.uid()::text
        and coalesce((storage.foldername(name))[2], '') <> 'carousel-logo'
      )
    )
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (
      public.current_user_is_admin()
      or (
        (storage.foldername(name))[1] = auth.uid()::text
        and coalesce((storage.foldername(name))[2], '') <> 'carousel-logo'
      )
    )
  );

drop function if exists private.set_employer_show_on_homepage(uuid, boolean);

create or replace function private.set_employer_homepage_carousel(
  p_employer_profile_id uuid,
  p_show_on_homepage boolean,
  p_homepage_logo_approved boolean,
  p_carousel_logo_path text,
  p_use_logo_plate boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.employer_profiles
  set
    show_on_homepage = coalesce(p_show_on_homepage, false),
    homepage_logo_approved = coalesce(p_homepage_logo_approved, false),
    carousel_logo_path = nullif(btrim(coalesce(p_carousel_logo_path, '')), ''),
    use_logo_plate = coalesce(p_use_logo_plate, false)
  where id = p_employer_profile_id;

  if not found then
    raise exception 'employer_profile_not_found'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function private.set_employer_homepage_carousel(uuid, boolean, boolean, text, boolean) from public;
revoke all on function private.set_employer_homepage_carousel(uuid, boolean, boolean, text, boolean) from anon, authenticated;
grant execute on function private.set_employer_homepage_carousel(uuid, boolean, boolean, text, boolean) to postgres;

notify pgrst, 'reload schema';
