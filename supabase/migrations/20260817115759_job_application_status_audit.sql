-- Lightweight recruiting pipeline: last status timestamp + append-only
-- status events for important transitions. Not a full ATS.

-- ---------------------------------------------------------------------------
-- Canonical status values
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- status_updated_at (changes only when status changes)
-- ---------------------------------------------------------------------------
alter table public.job_applications
  add column if not exists status_updated_at timestamptz;

update public.job_applications
set status = coalesce(public.canonical_job_application_status(status), 'new')
where public.canonical_job_application_status(status) is distinct from status
   or status is null;

update public.job_applications
set status_updated_at = coalesce(status_updated_at, updated_at, created_at, now())
where status_updated_at is null;

alter table public.job_applications
  alter column status_updated_at set default now(),
  alter column status_updated_at set not null;

alter table public.job_applications
  alter column status set default 'new';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'job_applications_status_pipeline_check'
      and conrelid = 'public.job_applications'::regclass
  ) then
    alter table public.job_applications
      add constraint job_applications_status_pipeline_check
      check (
        status in (
          'new',
          'reviewing',
          'interview',
          'interview_2',
          'offer',
          'hired',
          'rejected',
          'withdrawn'
        )
      );
  end if;
end
$$;

comment on column public.job_applications.status_updated_at is
  'Set only when pipeline status changes. Distinct from updated_at (any row edit).';

create index if not exists job_applications_job_status_updated_idx
  on public.job_applications (job_post_id, status_updated_at desc);

-- ---------------------------------------------------------------------------
-- Append-only status events (employer-visible; never to seekers)
-- ---------------------------------------------------------------------------
create table if not exists public.job_application_status_events (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null
    references public.job_applications (id) on delete cascade,
  from_status text null,
  to_status text not null,
  actor_user_id uuid null references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint job_application_status_events_to_status_check
    check (
      to_status in (
        'new',
        'reviewing',
        'interview',
        'interview_2',
        'offer',
        'hired',
        'rejected',
        'withdrawn'
      )
    )
);

comment on table public.job_application_status_events is
  'Append-only pipeline status changes. Visible to the hiring employer only; never to the candidate.';

create index if not exists job_application_status_events_app_created_idx
  on public.job_application_status_events (application_id, created_at desc);

alter table public.job_application_status_events enable row level security;

drop policy if exists "employer_select_status_events_for_own_jobs"
  on public.job_application_status_events;
create policy "employer_select_status_events_for_own_jobs"
  on public.job_application_status_events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications ja
      join public.job_posts jp on jp.id = ja.job_post_id
      join public.employer_profiles ep on ep.id = jp.employer_profile_id
      where ja.id = job_application_status_events.application_id
        and ep.owner_user_id = auth.uid()
    )
  );

revoke all on table public.job_application_status_events from anon;
revoke all on table public.job_application_status_events from public;
revoke insert, update, delete on table public.job_application_status_events from authenticated;
grant select on table public.job_application_status_events to authenticated;

-- ---------------------------------------------------------------------------
-- Guard: employer may only change status on own jobs; stamp status_updated_at
-- ---------------------------------------------------------------------------
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

comment on function public.job_applications_guard_update_fields() is
  'Seeker UPDATE may only touch cover_letter / application_answers / updated_at and status→withdrawn. Employer UPDATE may only touch status / updated_at on own jobs. status_updated_at is server-stamped.';

drop trigger if exists job_applications_guard_update_fields_trg on public.job_applications;
create trigger job_applications_guard_update_fields_trg
  before update on public.job_applications
  for each row
  execute function public.job_applications_guard_update_fields();

-- ---------------------------------------------------------------------------
-- Audit trail trigger (important = every real status change)
-- ---------------------------------------------------------------------------
create or replace function public.job_applications_log_status_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.job_application_status_events (
      application_id, from_status, to_status, actor_user_id
    ) values (
      new.id,
      null,
      coalesce(public.canonical_job_application_status(new.status), 'new'),
      auth.uid()
    );
    return new;
  end if;

  if old.status is distinct from new.status then
    insert into public.job_application_status_events (
      application_id, from_status, to_status, actor_user_id
    ) values (
      new.id,
      old.status,
      new.status,
      auth.uid()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists job_applications_log_status_event_trg on public.job_applications;
create trigger job_applications_log_status_event_trg
  after insert or update of status on public.job_applications
  for each row
  execute function public.job_applications_log_status_event();

revoke all on function public.job_applications_log_status_event() from public;
revoke all on function public.job_applications_log_status_event() from anon;
revoke all on function public.job_applications_log_status_event() from authenticated;

-- Seed one trail row for existing applications (no actor).
insert into public.job_application_status_events (
  application_id, from_status, to_status, actor_user_id, created_at
)
select
  ja.id,
  null,
  ja.status,
  null,
  coalesce(ja.status_updated_at, ja.created_at, now())
from public.job_applications ja
where not exists (
  select 1
  from public.job_application_status_events e
  where e.application_id = ja.id
);

-- Column grants: clients still cannot write status_updated_at
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
