-- Idempotent: private `certificates` Storage bucket + RLS policies.
-- Run in Supabase SQL Editor if migration not applied.
-- Certificates must NOT live in the public `avatars` bucket.

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
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
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

-- Optional: rewrite legacy public avatars URLs to object paths after files are
-- copied into the private `certificates` bucket (service role / Dashboard).
-- Example path extraction (run only after copy):
--
-- update public.seeker_certificates
-- set certificate_image_url = regexp_replace(
--   certificate_image_url,
--   '^https?://[^/]+/storage/v1/object/public/avatars/',
--   ''
-- )
-- where certificate_image_url ~ '/storage/v1/object/public/avatars/.+/certificates/';

comment on column public.seeker_certificates.certificate_image_url is
  'Private Storage object path in bucket `certificates` (e.g. user_id/file.ext). Never a permanent public URL; use short-lived signed URLs for access.';
