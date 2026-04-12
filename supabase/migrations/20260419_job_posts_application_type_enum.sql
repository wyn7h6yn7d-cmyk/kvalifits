-- App uses job_posts.application_type = 'in_app' | 'external_url'.
-- Skip if enum type is absent (some DBs use text or a differently named type).

do $body$
begin
  if exists (
    select 1
    from pg_catalog.pg_type t
    join pg_catalog.pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'application_type'
  ) then
    execute $e$alter type public.application_type add value if not exists 'in_app'$e$;
    execute $e$alter type public.application_type add value if not exists 'external_url'$e$;
  end if;
end;
$body$;

notify pgrst, 'reload schema';
