-- Run in Supabase SQL Editor if migration not applied.
-- Adds employer_profiles.logo_url; makes job_posts.application_url nullable; sets all jobs to in_app.

do $body$
begin
  if exists (
    select 1 from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'employer_profiles'
  ) then
    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'employer_profiles' and column_name = 'logo_url'
    ) then
      alter table public.employer_profiles add column logo_url text null;
    end if;
  end if;

  if exists (
    select 1 from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'job_posts'
  ) then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'job_posts'
        and column_name = 'application_url' and is_nullable = 'NO'
    ) then
      alter table public.job_posts alter column application_url drop not null;
    end if;
  end if;
end;
$body$;

update public.job_posts
set application_type = 'in_app'::public.application_type,
    application_url = null
where application_type = 'external_url'::public.application_type;

notify pgrst, 'reload schema';
