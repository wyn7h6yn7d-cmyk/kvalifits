-- Harden Storage bucket `avatars` only (not certificates).
-- Product uses getPublicUrl → keep bucket public for display read.
-- Paths in app: `{auth.uid()}/avatar-…`, `{auth.uid()}/employer-logo/…`, `{auth.uid()}/cv/…`
-- Write: owner-only; first path segment must equal auth.uid() (blocks cross-user overwrite).

-- ---------------------------------------------------------------------------
-- Bucket: public read, constrained uploads
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  10485760, -- 10 MiB (covers compressed avatars/logos + PDF CVs in this bucket)
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
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Drop known avatars-named policies only (never drop certificates_* or
-- generic all-bucket policies — certificates audit stays intact).
-- ---------------------------------------------------------------------------
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Anyone can upload an avatar" on storage.objects;
drop policy if exists "Anyone can update their own avatar" on storage.objects;
drop policy if exists "Anyone can delete their own avatar" on storage.objects;

drop policy if exists "avatars_select_public" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_upload_own" on storage.objects;

-- ---------------------------------------------------------------------------
-- SELECT: public read for display (bucket is public; policy covers API list/download)
-- ---------------------------------------------------------------------------
create policy "avatars_select_public"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'avatars');

-- ---------------------------------------------------------------------------
-- INSERT / UPDATE / DELETE: owner folder only (auth.uid() first path segment)
-- WITH CHECK on UPDATE prevents renaming/moving into another user's prefix.
-- ---------------------------------------------------------------------------
create policy "avatars_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

notify pgrst, 'reload schema';
