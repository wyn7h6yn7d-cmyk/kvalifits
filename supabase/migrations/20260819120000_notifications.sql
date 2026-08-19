-- In-app notifications foundation.
-- Owner SELECT + mark-as-read (read_at only). INSERT is trigger/service_role only.
-- Does not delete existing rows. Repeat-safe. Does not implement chat.

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;
grant usage on schema private to postgres;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_type_check'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications
      add constraint notifications_type_check
      check (type in (
        'application_status_changed',
        'certificate_reviewed',
        'saved_job_deadline',
        'new_application',
        'job_moderation',
        'interview_invite',
        'strong_match',
        'saved_search_alert'
      ));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'notifications_entity_type_check'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications
      add constraint notifications_entity_type_check
      check (
        entity_type is null
        or entity_type in (
          'job_application',
          'job_post',
          'seeker_certificate',
          'job_post_report',
          'saved_job_search'
        )
      );
  end if;
end $$;

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

create unique index if not exists notifications_saved_job_deadline_once
  on public.notifications (user_id, entity_id)
  where type = 'saved_job_deadline' and entity_id is not null;

comment on table public.notifications is
  'In-app notification inbox. Copy is derived in the UI from type + small payload keys.';
comment on column public.notifications.user_id is
  'Recipient auth user. RLS: only this user may SELECT / set read_at.';
comment on column public.notifications.payload is
  'Small context (status keys, ids, days_left). Do not store translated prose.';
comment on column public.notifications.read_at is
  'Set by the owner when marked read. Null = unread.';

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
drop policy if exists "notifications_update_own" on public.notifications;
drop policy if exists "notifications_insert_own" on public.notifications;
drop policy if exists "notifications_delete_own" on public.notifications;

create policy "notifications_select_own"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

revoke all on table public.notifications from public;
revoke all on table public.notifications from anon;
revoke all on table public.notifications from authenticated;

grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;
grant select, insert, update, delete on table public.notifications to service_role;

-- Server insert helper (triggers + cron + service role). Not granted to JWT roles.
create or replace function private.create_notification(
  p_user_id uuid,
  p_type text,
  p_entity_type text,
  p_entity_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_user_id is null or p_type is null or btrim(p_type) = '' then
    return null;
  end if;

  insert into public.notifications (user_id, type, entity_type, entity_id, payload)
  values (
    p_user_id,
    p_type,
    nullif(btrim(coalesce(p_entity_type, '')), ''),
    p_entity_id,
    coalesce(p_payload, '{}'::jsonb)
  )
  on conflict do nothing
  returning id into v_id;

  return v_id;
exception
  when unique_violation then
    return null;
  when others then
    raise notice 'create_notification failed: %', sqlerrm;
    return null;
end;
$$;

comment on function private.create_notification(uuid, text, text, uuid, jsonb) is
  'Inserts an in-app notification. Invoked by triggers/cron/service role only.';

revoke all on function private.create_notification(uuid, text, text, uuid, jsonb) from public;
revoke all on function private.create_notification(uuid, text, text, uuid, jsonb) from anon, authenticated;
grant execute on function private.create_notification(uuid, text, text, uuid, jsonb) to postgres;
grant execute on function private.create_notification(uuid, text, text, uuid, jsonb) to service_role;

-- New application → employer owner
create or replace function private.notify_new_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select ep.owner_user_id
    into v_owner
  from public.job_posts jp
  join public.employer_profiles ep on ep.id = jp.employer_profile_id
  where jp.id = new.job_post_id;

  if v_owner is not null then
    perform private.create_notification(
      v_owner,
      'new_application',
      'job_application',
      new.id,
      jsonb_build_object('job_post_id', new.job_post_id)
    );
  end if;
  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists notifications_new_application_trg on public.job_applications;
create trigger notifications_new_application_trg
  after insert on public.job_applications
  for each row
  execute function private.notify_new_application();

-- Application pipeline change → seeker (not self-withdrawn)
create or replace function private.notify_application_status_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is not distinct from old.status then
    return new;
  end if;
  if new.status::text in ('new', 'withdrawn') then
    return new;
  end if;
  if new.seeker_user_id is not null then
    perform private.create_notification(
      new.seeker_user_id,
      'application_status_changed',
      'job_application',
      new.id,
      jsonb_build_object('status', new.status::text, 'job_post_id', new.job_post_id)
    );
  end if;
  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists notifications_application_status_trg on public.job_applications;
create trigger notifications_application_status_trg
  after update of status on public.job_applications
  for each row
  execute function private.notify_application_status_changed();

-- Certificate reviewed → seeker
create or replace function private.notify_certificate_reviewed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verification_status is not distinct from old.verification_status then
    return new;
  end if;
  if new.verification_status::text not in ('verified', 'rejected') then
    return new;
  end if;
  if new.user_id is not null then
    perform private.create_notification(
      new.user_id,
      'certificate_reviewed',
      'seeker_certificate',
      new.id,
      jsonb_build_object('verification_status', new.verification_status::text)
    );
  end if;
  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists notifications_certificate_reviewed_trg on public.seeker_certificates;
create trigger notifications_certificate_reviewed_trg
  after update of verification_status on public.seeker_certificates
  for each row
  execute function private.notify_certificate_reviewed();

-- New job report → employer owner
create or replace function private.notify_job_report_received()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select ep.owner_user_id
    into v_owner
  from public.job_posts jp
  join public.employer_profiles ep on ep.id = jp.employer_profile_id
  where jp.id = new.job_post_id;

  if v_owner is not null then
    perform private.create_notification(
      v_owner,
      'job_moderation',
      'job_post',
      new.job_post_id,
      jsonb_build_object('action', 'report_received')
    );
  end if;
  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists notifications_job_report_trg on public.job_post_reports;
create trigger notifications_job_report_trg
  after insert on public.job_post_reports
  for each row
  execute function private.notify_job_report_received();

-- Admin hide/restore of a listing → employer owner
create or replace function private.notify_job_admin_moderation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_action text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;
  if not public.current_user_is_admin() then
    return new;
  end if;
  if new.status::text = 'archived' then
    v_action := 'hidden';
  elsif new.status::text = 'published' then
    v_action := 'restored';
  else
    return new;
  end if;

  select ep.owner_user_id
    into v_owner
  from public.employer_profiles ep
  where ep.id = new.employer_profile_id;

  if v_owner is not null then
    perform private.create_notification(
      v_owner,
      'job_moderation',
      'job_post',
      new.id,
      jsonb_build_object('action', v_action)
    );
  end if;
  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists notifications_job_admin_moderation_trg on public.job_posts;
create trigger notifications_job_admin_moderation_trg
  after update of status on public.job_posts
  for each row
  execute function private.notify_job_admin_moderation();

-- Saved jobs approaching apply deadline
create or replace function private.notify_saved_jobs_near_deadline()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  insert into public.notifications (user_id, type, entity_type, entity_id, payload)
  select
    sj.seeker_user_id,
    'saved_job_deadline',
    'job_post',
    jp.id,
    jsonb_build_object(
      'days_left',
      ((jp.application_deadline)::date - ((timezone('Europe/Tallinn', now()))::date))
    )
  from public.saved_jobs sj
  join public.job_posts jp on jp.id = sj.job_post_id
  where jp.status::text = 'published'
    and jp.application_deadline is not null
    and (jp.application_deadline)::date >= ((timezone('Europe/Tallinn', now()))::date)
    and (jp.application_deadline)::date <= ((timezone('Europe/Tallinn', now()))::date + 3)
  on conflict do nothing;

  get diagnostics v_count = row_count;
  return v_count;
exception
  when undefined_table then
    return 0;
  when others then
    raise notice 'notify_saved_jobs_near_deadline failed: %', sqlerrm;
    return 0;
end;
$$;

comment on function private.notify_saved_jobs_near_deadline() is
  'Creates at most one saved_job_deadline notification per seeker+job when the apply deadline is within 3 days.';

revoke all on function private.notify_saved_jobs_near_deadline() from public;
revoke all on function private.notify_saved_jobs_near_deadline() from anon, authenticated;
grant execute on function private.notify_saved_jobs_near_deadline() to postgres;

do $$
begin
  begin
    execute 'create extension if not exists pg_cron with schema pg_catalog';
  exception
    when others then
      raise notice 'pg_cron extension not available: %', sqlerrm;
  end;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise notice 'Skipping saved-job-deadline schedule; enable pg_cron then re-run.';
    return;
  end if;

  begin
    perform cron.unschedule('notify-saved-jobs-near-deadline');
  exception
    when undefined_function then
      null;
    when others then
      null;
  end;

  perform cron.schedule(
    'notify-saved-jobs-near-deadline',
    '15 7 * * *',
    $job$select private.notify_saved_jobs_near_deadline()$job$
  );
end;
$$;

notify pgrst, 'reload schema';
