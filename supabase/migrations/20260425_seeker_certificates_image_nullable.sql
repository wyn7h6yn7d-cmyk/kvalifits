-- Allow certificates without an uploaded image/document.
-- Some environments created `public.seeker_certificates.certificate_image_url` as NOT NULL.
-- Our UI treats certificate uploads as optional, so this must be nullable.

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
        and column_name = 'certificate_image_url'
        and is_nullable = 'NO'
    ) then
      alter table public.seeker_certificates
        alter column certificate_image_url drop not null;
    end if;
  end if;
end;
$body$;

notify pgrst, 'reload schema';

