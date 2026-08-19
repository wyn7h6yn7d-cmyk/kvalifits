-- Production apply helper (idempotent). Same as
-- supabase/migrations/20260818120000_blocked_user_write_guard.sql

create or replace function public.current_user_is_blocked()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_blocked is true
  );
$$;

comment on function public.current_user_is_blocked() is
  'True when auth.uid() has profiles.is_blocked. SECURITY DEFINER; row_security off to avoid RLS recursion.';

revoke all on function public.current_user_is_blocked() from public;
revoke all on function public.current_user_is_blocked() from anon;
grant execute on function public.current_user_is_blocked() to authenticated;

create or replace function public.reject_blocked_user_dml()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  if public.current_user_is_blocked() then
    raise exception 'account_blocked'
      using errcode = '42501';
  end if;

  return coalesce(new, old);
end;
$$;

comment on function public.reject_blocked_user_dml() is
  'BEFORE INSERT/UPDATE/DELETE: blocked JWTs cannot mutate user-writable rows.';

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles',
    'seeker_profiles',
    'seeker_certificates',
    'seeker_certificates_verification_stash',
    'seeker_workplace_needs',
    'seeker_work_capacity',
    'employer_profiles',
    'job_posts',
    'job_applications',
    'job_application_internal_notes',
    'job_application_status_events',
    'saved_jobs',
    'saved_job_searches',
    'job_post_reports'
  ]
  loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    execute format('drop trigger if exists reject_blocked_user_dml_trg on public.%I', t);
    execute format(
      'create trigger reject_blocked_user_dml_trg before insert or update or delete on public.%I for each row execute function public.reject_blocked_user_dml()',
      t
    );
  end loop;
end $$;

drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  );

drop policy if exists "certificates_insert_own" on storage.objects;
create policy "certificates_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  );

drop policy if exists "certificates_update_own" on storage.objects;
create policy "certificates_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  )
  with check (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  );

drop policy if exists "certificates_delete_own" on storage.objects;
create policy "certificates_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  );

notify pgrst, 'reload schema';
