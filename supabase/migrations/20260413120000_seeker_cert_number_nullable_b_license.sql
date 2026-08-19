-- 1) Certificate number is optional in the UI; allow NULL in DB.
-- 2) Explicit B-category driver's license flag for matching without a manual cert row.

do $body$
begin
  if exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'seeker_certificates'
  ) then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'seeker_certificates'
        and column_name = 'certificate_number'
        and is_nullable = 'NO'
    ) then
      alter table public.seeker_certificates
        alter column certificate_number drop not null;
    end if;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'seeker_profiles'
  ) then
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'seeker_profiles'
        and column_name = 'has_b_category_drivers_license'
    ) then
      alter table public.seeker_profiles
        add column has_b_category_drivers_license boolean not null default false;
    end if;
  end if;
end;
$body$;

notify pgrst, 'reload schema';
