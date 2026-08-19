-- SQL Editor copy of 20260818150000_job_applications_insert_field_lock.sql
-- Official apply is POST /api/job-applications (service_role).
-- Authenticated PostgREST INSERT is denied.

create or replace function public.job_applications_guard_insert_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  raise exception 'job_applications_insert_via_api_only'
    using errcode = '42501';
end;
$$;

comment on function public.job_applications_guard_insert_fields() is
  'BEFORE INSERT: JWT clients cannot insert. Service role (apply API) may set match/snapshot/consent/status.';

drop trigger if exists job_applications_guard_insert_fields_trg on public.job_applications;
create trigger job_applications_guard_insert_fields_trg
  before insert on public.job_applications
  for each row
  execute function public.job_applications_guard_insert_fields();

drop policy if exists "seeker_insert_own_applications" on public.job_applications;

revoke insert on table public.job_applications from authenticated;
revoke insert on table public.job_applications from anon;
revoke insert on table public.job_applications from public;

grant insert on table public.job_applications to service_role;

notify pgrst, 'reload schema';
