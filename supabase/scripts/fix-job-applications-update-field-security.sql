-- Harden job_applications UPDATE fields (mirror of
-- migration 20260816_job_applications_update_field_security.sql).
-- Run in Supabase SQL Editor if needed. Does not change apply UI.
-- For status timestamps + event trail, also run
-- supabase/scripts/fix-job-application-status-audit.sql (or apply that migration).

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

create or replace function public.current_user_owns_job_application_employer(app public.job_applications)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.job_posts jp
    join public.employer_profiles ep on ep.id = jp.employer_profile_id
    where jp.id = app.job_post_id
      and ep.owner_user_id = auth.uid()
  );
$$;

revoke all on function public.current_user_owns_job_application_employer(public.job_applications) from public;
grant execute on function public.current_user_owns_job_application_employer(public.job_applications) to authenticated;

create or replace function public.canonical_job_application_status(raw text)
returns text
language sql
immutable
as $$
  select case lower(btrim(coalesce(raw, '')))
    when '' then 'new'
    when 'submitted' then 'new'
    when 'new' then 'new'
    when 'reviewing' then 'reviewing'
    when 'interview' then 'interview'
    when 'interview_2' then 'interview_2'
    when 'offer' then 'offer'
    when 'hired' then 'hired'
    when 'rejected' then 'rejected'
    when 'withdrawn' then 'withdrawn'
    else null
  end;
$$;

revoke all on function public.canonical_job_application_status(text) from public;
grant execute on function public.canonical_job_application_status(text) to authenticated;

alter table public.job_applications
  add column if not exists status_updated_at timestamptz;

update public.job_applications
set status_updated_at = coalesce(status_updated_at, updated_at, created_at, now())
where status_updated_at is null;

create or replace function public.job_applications_guard_update_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_is_admin boolean;
  actor_is_employer boolean;
  attempted public.job_applications;
  overlay jsonb := '{}'::jsonb;
  old_j jsonb;
  k text;
  next_status text;
  protected_keys text[] := array[
    'id',
    'created_at',
    'job_post_id',
    'seeker_user_id',
    'match_score',
    'match_breakdown',
    'match_details',
    'consent_to_share',
    'shared_profile',
    'employer_status',
    'employer_notes',
    'reviewed_at',
    'reviewed_by',
    'status_updated_at'
  ];
  seeker_allowed text[] := array[
    'cover_letter',
    'application_answers',
    'updated_at'
  ];
  akey text;
begin
  if auth.uid() is null then
    if new.status is distinct from old.status then
      new.status := coalesce(public.canonical_job_application_status(new.status), old.status);
      new.status_updated_at := now();
    else
      new.status_updated_at := old.status_updated_at;
    end if;
    return new;
  end if;

  select public.current_user_is_admin() into actor_is_admin;
  if coalesce(actor_is_admin, false) then
    if new.status is distinct from old.status then
      new.status := coalesce(public.canonical_job_application_status(new.status), old.status);
      new.status_updated_at := now();
    else
      new.status_updated_at := old.status_updated_at;
    end if;
    return new;
  end if;

  attempted := new;
  old_j := to_jsonb(old);

  select public.current_user_owns_job_application_employer(old) into actor_is_employer;
  if coalesce(actor_is_employer, false)
     and old.seeker_user_id is distinct from auth.uid() then
    new := old;
    next_status := public.canonical_job_application_status(attempted.status);
    if next_status is null then
      new.status := old.status;
    else
      new.status := next_status;
    end if;
    new.updated_at := attempted.updated_at;
    if new.status is distinct from old.status then
      new.status_updated_at := now();
    end if;
    return new;
  end if;

  if old.seeker_user_id = auth.uid() then
    new := old;

    foreach akey in array seeker_allowed loop
      if to_jsonb(attempted) ? akey then
        overlay := jsonb_build_object(akey, to_jsonb(attempted) -> akey);
        new := jsonb_populate_record(new, overlay);
      end if;
    end loop;

    if lower(coalesce(old.status, '')) = 'withdrawn' then
      new.status := old.status;
    elsif public.canonical_job_application_status(attempted.status) = 'withdrawn' then
      new.status := 'withdrawn';
    else
      new.status := old.status;
    end if;

    foreach k in array protected_keys loop
      if old_j ? k then
        new := jsonb_populate_record(
          new,
          jsonb_build_object(k, old_j -> k)
        );
      end if;
    end loop;

    if new.status is distinct from old.status then
      new.status_updated_at := now();
    else
      new.status_updated_at := old.status_updated_at;
    end if;

    return new;
  end if;

  return old;
end;
$$;

drop trigger if exists job_applications_guard_update_fields_trg on public.job_applications;
create trigger job_applications_guard_update_fields_trg
  before update on public.job_applications
  for each row
  execute function public.job_applications_guard_update_fields();

drop policy if exists "seeker_update_own_applications" on public.job_applications;
create policy "seeker_update_own_applications"
  on public.job_applications
  for update
  to authenticated
  using (seeker_user_id = auth.uid())
  with check (seeker_user_id = auth.uid());

drop policy if exists "employer_update_applications_for_own_jobs" on public.job_applications;
create policy "employer_update_applications_for_own_jobs"
  on public.job_applications
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.job_posts jp
      join public.employer_profiles ep on ep.id = jp.employer_profile_id
      where jp.id = job_applications.job_post_id
        and ep.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.job_posts jp
      join public.employer_profiles ep on ep.id = jp.employer_profile_id
      where jp.id = job_applications.job_post_id
        and ep.owner_user_id = auth.uid()
    )
  );

-- Ensure columns exist before column-level GRANT (fixes 42703 on lagging remotes).
alter table public.job_applications
  add column if not exists status text not null default 'submitted',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists cover_letter text null,
  add column if not exists application_answers jsonb not null default '{}'::jsonb,
  add column if not exists status_updated_at timestamptz;

revoke update on table public.job_applications from authenticated;
revoke update on table public.job_applications from anon;
revoke update on table public.job_applications from public;

grant update (
  status,
  updated_at,
  cover_letter,
  application_answers
) on table public.job_applications to authenticated;

notify pgrst, 'reload schema';
