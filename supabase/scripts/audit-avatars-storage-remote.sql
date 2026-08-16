-- Audit remote state for Storage bucket `avatars` (read-only).
-- Run in Supabase SQL Editor; paste results before/after applying
-- migration 20260816_avatars_storage_security.sql.

-- 1) Bucket public/private + limits
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  updated_at
from storage.buckets
where id = 'avatars';

-- 2) Policies that touch the avatars bucket (or all storage.objects policies for review)
select
  policyname,
  cmd,
  roles,
  qual as using_expr,
  with_check as with_check_expr
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (
    policyname ilike '%avatar%'
    or coalesce(qual, '') ilike '%avatars%'
    or coalesce(with_check, '') ilike '%avatars%'
  )
order by policyname;

-- 3) Full storage.objects policy list (optional; spot policies that apply to all buckets)
select
  policyname,
  cmd,
  roles,
  qual as using_expr,
  with_check as with_check_expr
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;
