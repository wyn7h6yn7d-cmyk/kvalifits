-- Fix: allow re-apply after withdrawing, while preventing multiple active applications.
-- Drops legacy unique index and creates a partial unique index on non-withdrawn applications.

do $body$
begin
  if exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'job_applications'
  ) then
    execute 'drop index if exists public.job_applications_one_per_job_per_seeker';

    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'job_applications'
        and column_name = 'status'
    ) then
      execute 'create unique index if not exists job_applications_one_active_per_job_per_seeker
               on public.job_applications (job_post_id, seeker_user_id)
               where (status is distinct from ''withdrawn'')';
    end if;
  end if;
end;
$body$;

notify pgrst, 'reload schema';

