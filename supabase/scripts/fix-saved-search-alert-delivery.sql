-- Saved-search alert delivery.
-- Locks worker cursors so seekers cannot forge last_notified_at / notify_after.
-- Adds an idempotency ledger and a unique in-app notification key for retries.
-- Repeat-safe. Does not delete existing saved searches or notifications.

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;
grant usage on schema private to postgres;

-- ---------------------------------------------------------------------------
-- Delivery ledger (service_role / worker only)
-- ---------------------------------------------------------------------------

create table if not exists public.saved_search_alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  saved_search_id uuid not null references public.saved_job_searches (id) on delete cascade,
  job_post_id uuid not null references public.job_posts (id) on delete cascade,
  seeker_user_id uuid not null references auth.users (id) on delete cascade,
  notified_at timestamptz not null default now(),
  constraint saved_search_alert_deliveries_unique unique (saved_search_id, job_post_id)
);

create index if not exists saved_search_alert_deliveries_seeker_idx
  on public.saved_search_alert_deliveries (seeker_user_id, notified_at desc);

comment on table public.saved_search_alert_deliveries is
  'Idempotency ledger for saved-search job alerts. One row per saved search + job. JWT roles have no access.';
comment on column public.saved_search_alert_deliveries.saved_search_id is
  'Saved search that produced the alert.';
comment on column public.saved_search_alert_deliveries.job_post_id is
  'Published job that was included in an alert. Prevents duplicate notifications on cron retry.';
comment on column public.saved_search_alert_deliveries.seeker_user_id is
  'Recipient. Denormalized so account delete can erase without a join.';

alter table public.saved_search_alert_deliveries enable row level security;

revoke all on table public.saved_search_alert_deliveries from public;
revoke all on table public.saved_search_alert_deliveries from anon;
revoke all on table public.saved_search_alert_deliveries from authenticated;
grant select, insert, update, delete on table public.saved_search_alert_deliveries to service_role;

-- ---------------------------------------------------------------------------
-- Seeker must not write delivery cursors
-- ---------------------------------------------------------------------------

revoke all on table public.saved_job_searches from public;
revoke all on table public.saved_job_searches from anon;
revoke all on table public.saved_job_searches from authenticated;

grant select, delete on table public.saved_job_searches to authenticated;
grant insert (
  id,
  seeker_user_id,
  name,
  query,
  filters,
  require_public_salary,
  min_match_percent,
  frequency,
  enabled,
  locale,
  search_fingerprint,
  created_at,
  updated_at
) on table public.saved_job_searches to authenticated;
grant update (
  name,
  query,
  filters,
  require_public_salary,
  min_match_percent,
  frequency,
  enabled,
  locale,
  search_fingerprint,
  updated_at
) on table public.saved_job_searches to authenticated;
grant all on table public.saved_job_searches to service_role;

create or replace function private.saved_job_searches_lock_delivery_cursors()
returns trigger
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
begin
  if tg_op = 'INSERT' then
    if auth.role() is distinct from 'service_role' then
      new.last_notified_at := null;
      new.notify_after := now();
    end if;
    if new.notify_after is null then
      new.notify_after := now();
    end if;
    return new;
  end if;

  if auth.role() is distinct from 'service_role' then
    new.last_notified_at := old.last_notified_at;
    new.notify_after := old.notify_after;
  end if;
  return new;
end;
$$;

comment on function private.saved_job_searches_lock_delivery_cursors() is
  'Forces last_notified_at and notify_after to stay worker-controlled for JWT clients.';

revoke all on function private.saved_job_searches_lock_delivery_cursors() from public;
revoke all on function private.saved_job_searches_lock_delivery_cursors() from anon, authenticated;

drop trigger if exists saved_job_searches_lock_delivery_cursors_trg on public.saved_job_searches;
create trigger saved_job_searches_lock_delivery_cursors_trg
  before insert or update on public.saved_job_searches
  for each row
  execute function private.saved_job_searches_lock_delivery_cursors();

comment on table public.saved_job_searches is
  'Seeker-owned saved searches / job-alert settings. last_notified_at and notify_after are worker-only delivery cursors.';
comment on column public.saved_job_searches.notify_after is
  'Worker cursor: consider only jobs published after this timestamp. Not seeker-writable.';
comment on column public.saved_job_searches.last_notified_at is
  'Set by the alert worker after a successful delivery. Not seeker-writable.';

-- ---------------------------------------------------------------------------
-- In-app notification idempotency (one row per search + job-set hash)
-- ---------------------------------------------------------------------------

create unique index if not exists notifications_saved_search_alert_delivery_key
  on public.notifications (user_id, entity_id, (payload->>'delivery_key'))
  where type = 'saved_search_alert'
    and entity_id is not null
    and payload->>'delivery_key' is not null;

notify pgrst, 'reload schema';
