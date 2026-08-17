-- Hourly archive of published jobs past expires_at or application_deadline.
-- Does not delete rows. Not callable by anon/authenticated (no request-path writes).

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;
grant usage on schema private to postgres;

create or replace function private.archive_expired_job_posts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  update public.job_posts
  set status = 'archived'
  where status::text = 'published'
    and (
      (expires_at is not null and expires_at < now())
      or (
        application_deadline is not null
        and application_deadline < ((timezone('Europe/Tallinn', now()))::date)
      )
    );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on function private.archive_expired_job_posts() is
  'Marks published jobs inactive when expires_at or application_deadline has passed. Never deletes. Invoked by pg_cron only.';

revoke all on function private.archive_expired_job_posts() from public;
revoke all on function private.archive_expired_job_posts() from anon, authenticated;
grant execute on function private.archive_expired_job_posts() to postgres;

create extension if not exists pg_cron with schema pg_catalog;

do $$
begin
  begin
    perform cron.unschedule('archive-expired-job-posts');
  exception
    when undefined_function then
      null;
    when others then
      null;
  end;
end;
$$;

select cron.schedule(
  'archive-expired-job-posts',
  '0 * * * *',
  $job$select private.archive_expired_job_posts()$job$
);
