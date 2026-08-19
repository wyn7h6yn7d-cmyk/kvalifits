-- Production apply helper (idempotent). Same as
-- supabase/migrations/20260818140000_private_cv_resumes_storage.sql

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  10485760,
  array['application/pdf']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "resumes_insert_own" on storage.objects;
create policy "resumes_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'cv'
    and not public.current_user_is_blocked()
  );

drop policy if exists "resumes_update_own" on storage.objects;
create policy "resumes_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'cv'
    and not public.current_user_is_blocked()
  )
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'cv'
    and not public.current_user_is_blocked()
  );

drop policy if exists "resumes_delete_own" on storage.objects;
create policy "resumes_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'cv'
    and not public.current_user_is_blocked()
  );

drop policy if exists "resumes_select_own" on storage.objects;
create policy "resumes_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "resumes_select_admin" on storage.objects;
create policy "resumes_select_admin"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'resumes'
    and public.current_user_is_admin()
  );

drop policy if exists "resumes_select_employer_for_applicants" on storage.objects;
create policy "resumes_select_employer_for_applicants"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'resumes'
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

update storage.buckets
set
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]::text[],
  file_size_limit = 10485760
where id = 'avatars';

comment on column public.seeker_profiles.cv_url is
  'Private Storage object path in bucket `resumes` (e.g. user_id/cv/file.pdf). Never a permanent public URL; use short-lived signed URLs for access.';

notify pgrst, 'reload schema';
