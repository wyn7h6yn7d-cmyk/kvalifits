-- Harden seeker_certificates + certificates storage (mirror of
-- migration 20260816_seeker_certificates_rls_security.sql).
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

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

create table if not exists public.seeker_certificates_verification_stash (
  user_id uuid not null,
  name_key text not null,
  verification_status text not null,
  verified_at date,
  verification_source text,
  verified_by text,
  stashed_at timestamptz not null default now(),
  primary key (user_id, name_key)
);

alter table public.seeker_certificates_verification_stash enable row level security;

revoke all on table public.seeker_certificates_verification_stash from anon;
revoke all on table public.seeker_certificates_verification_stash from authenticated;
revoke all on table public.seeker_certificates_verification_stash from public;

create or replace function public.seeker_certificates_stash_verification_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return old;
  end if;

  insert into public.seeker_certificates_verification_stash (
    user_id,
    name_key,
    verification_status,
    verified_at,
    verification_source,
    verified_by,
    stashed_at
  )
  values (
    old.user_id,
    lower(btrim(coalesce(old.certificate_name, ''))) || '::' ||
      lower(btrim(coalesce(old.certificate_issuer, ''))),
    coalesce(old.verification_status, 'submitted'),
    old.verified_at,
    old.verification_source,
    old.verified_by,
    now()
  )
  on conflict (user_id, name_key) do update
  set
    verification_status = excluded.verification_status,
    verified_at = excluded.verified_at,
    verification_source = excluded.verification_source,
    verified_by = excluded.verified_by,
    stashed_at = excluded.stashed_at;

  return old;
end;
$$;

create or replace function public.seeker_certificates_guard_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_is_admin boolean;
  stash_key text;
  stashed public.seeker_certificates_verification_stash%rowtype;
begin
  if auth.uid() is null then
    return new;
  end if;

  select public.current_user_is_admin() into actor_is_admin;
  if coalesce(actor_is_admin, false) then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    new.verification_status := old.verification_status;
    new.verified_at := old.verified_at;
    new.verification_source := old.verification_source;
    new.verified_by := old.verified_by;
    return new;
  end if;

  if tg_op = 'INSERT' then
    stash_key :=
      lower(btrim(coalesce(new.certificate_name, ''))) || '::' ||
      lower(btrim(coalesce(new.certificate_issuer, '')));

    delete from public.seeker_certificates_verification_stash s
    where s.user_id = new.user_id
      and s.name_key = stash_key
    returning * into stashed;

    if found then
      new.verification_status := stashed.verification_status;
      new.verified_at := stashed.verified_at;
      new.verification_source := stashed.verification_source;
      new.verified_by := stashed.verified_by;
      return new;
    end if;

    new.verification_status := 'submitted';
    new.verified_at := null;
    new.verification_source := null;
    new.verified_by := null;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists seeker_certificates_stash_verification_trg on public.seeker_certificates;
create trigger seeker_certificates_stash_verification_trg
  before delete on public.seeker_certificates
  for each row
  execute function public.seeker_certificates_stash_verification_on_delete();

drop trigger if exists seeker_certificates_guard_verification_trg on public.seeker_certificates;
create trigger seeker_certificates_guard_verification_trg
  before insert or update on public.seeker_certificates
  for each row
  execute function public.seeker_certificates_guard_verification();

alter table public.seeker_certificates enable row level security;

drop policy if exists "seeker_select_own_certificates" on public.seeker_certificates;
create policy "seeker_select_own_certificates"
  on public.seeker_certificates
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "seeker_insert_own_certificates" on public.seeker_certificates;
create policy "seeker_insert_own_certificates"
  on public.seeker_certificates
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "seeker_update_own_certificates" on public.seeker_certificates;
create policy "seeker_update_own_certificates"
  on public.seeker_certificates
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "seeker_delete_own_certificates" on public.seeker_certificates;
create policy "seeker_delete_own_certificates"
  on public.seeker_certificates
  for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "employer_select_discoverable_seeker_certificates" on public.seeker_certificates;
create policy "employer_select_discoverable_seeker_certificates"
  on public.seeker_certificates
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.seeker_profiles sp
      join public.employer_profiles ep on ep.owner_user_id = auth.uid()
      where sp.user_id = seeker_certificates.user_id
        and sp.profile_visible = true
    )
  );

drop policy if exists "employer_select_applicant_seeker_certificates" on public.seeker_certificates;
create policy "employer_select_applicant_seeker_certificates"
  on public.seeker_certificates
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications ja
      join public.job_posts jp on jp.id = ja.job_post_id
      join public.employer_profiles ep on ep.id = jp.employer_profile_id
      where ja.seeker_user_id = seeker_certificates.user_id
        and ep.owner_user_id = auth.uid()
        and ja.consent_to_share = true
        and coalesce(ja.status, '') is distinct from 'withdrawn'
    )
  );

drop policy if exists "admin_select_seeker_certificates" on public.seeker_certificates;
create policy "admin_select_seeker_certificates"
  on public.seeker_certificates
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "admin_update_seeker_certificates" on public.seeker_certificates;
create policy "admin_update_seeker_certificates"
  on public.seeker_certificates
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

revoke all on table public.seeker_certificates from anon;
revoke all on table public.seeker_certificates from public;
grant select, insert, update, delete on table public.seeker_certificates to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificates',
  'certificates',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
  ]::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "certificates_insert_own" on storage.objects;
create policy "certificates_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "certificates_update_own" on storage.objects;
create policy "certificates_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "certificates_delete_own" on storage.objects;
create policy "certificates_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "certificates_select_own" on storage.objects;
create policy "certificates_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "certificates_select_admin" on storage.objects;
create policy "certificates_select_admin"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'certificates'
    and public.current_user_is_admin()
  );

drop policy if exists "certificates_select_employer_for_applicants" on storage.objects;
create policy "certificates_select_employer_for_applicants"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'certificates'
    and exists (
      select 1
      from public.job_applications ja
      join public.job_posts jp on jp.id = ja.job_post_id
      join public.employer_profiles ep on ep.id = jp.employer_profile_id
      where ja.seeker_user_id::text = (storage.foldername(name))[1]
        and ep.owner_user_id = auth.uid()
        and ja.consent_to_share = true
        and coalesce(ja.status, '') is distinct from 'withdrawn'
    )
  );

notify pgrst, 'reload schema';
