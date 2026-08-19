-- job_applications INSERT field lock.
-- Official apply is POST /api/job-applications (service_role).
-- Authenticated PostgREST INSERT is denied (no policy + no INSERT grant + trigger).
--
-- Column class (INSERT):
--   A candidate: job_post_id, cover_letter, application_answers
--   B server:    seeker_user_id, consent_to_share, shared_profile, match_score,
--                match_breakdown, match_details, status, created_at, updated_at,
--                status_updated_at
--   C employer:  employer_status, employer_notes (UPDATE pipeline only; not INSERT)
--   D audit:     id, reviewed_at, reviewed_by
--
-- Does not drop tables or delete rows. Repeat-safe.

-- ---------------------------------------------------------------------------
-- Trigger: JWT (anon/authenticated/admin) cannot INSERT.
-- service_role / backend: auth.uid() is null — apply API may write server fields.
-- ---------------------------------------------------------------------------
create or replace function public.job_applications_guard_insert_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- service_role / apply API (no JWT): allow match snapshot, consent, status.
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

-- ---------------------------------------------------------------------------
-- RLS: no INSERT policy for anon/authenticated (default deny).
-- service_role bypasses RLS for the official apply endpoint.
-- ---------------------------------------------------------------------------
drop policy if exists "seeker_insert_own_applications" on public.job_applications;

-- ---------------------------------------------------------------------------
-- Grants: authenticated cannot INSERT any column (column UPDATE grants unchanged).
-- ---------------------------------------------------------------------------
revoke insert on table public.job_applications from authenticated;
revoke insert on table public.job_applications from anon;
revoke insert on table public.job_applications from public;

grant insert on table public.job_applications to service_role;

notify pgrst, 'reload schema';
