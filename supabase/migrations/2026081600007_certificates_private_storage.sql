-- Private Storage bucket for seeker certificate files.
-- Do NOT use the public `avatars` bucket for certificates.
-- DB column `seeker_certificates.certificate_image_url` stores an object path
-- (e.g. `{user_id}/{file}`) — never a permanent public URL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificates',
  'certificates',
  false,
  10485760, -- 10 MiB
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

-- Helper: first path segment is the owning user id.
-- Object names: `{user_id}/{filename}`

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

-- Owner can read own files (signed URLs / download).
drop policy if exists "certificates_select_own" on storage.objects;
create policy "certificates_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'certificates'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can review all certificate files.
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

-- Employers may read only when product logic allows:
-- non-withdrawn application with consent to their job.
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

comment on column public.seeker_certificates.certificate_image_url is
  'Private Storage object path in bucket `certificates` (e.g. user_id/file.ext). Never a permanent public URL; use short-lived signed URLs for access.';
