-- Admin audit log for important admin actions (admin-only RLS).

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users (id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id text not null,
  details jsonb not null default '{}'::jsonb,
  "timestamp" timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'admin_audit_log'
      and column_name = 'admin_user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'admin_audit_log'
      and column_name = 'actor_id'
  ) then
    alter table public.admin_audit_log rename column admin_user_id to actor_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'admin_audit_log'
      and column_name = 'created_at'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'admin_audit_log'
      and column_name = 'timestamp'
  ) then
    alter table public.admin_audit_log rename column created_at to "timestamp";
  end if;

  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'admin_audit_log'
      and column_name = 'details'
  ) then
    alter table public.admin_audit_log
      add column details jsonb not null default '{}'::jsonb;
  end if;
end $$;

create index if not exists admin_audit_log_timestamp_idx
  on public.admin_audit_log ("timestamp" desc);

create index if not exists admin_audit_log_target_idx
  on public.admin_audit_log (target_type, target_id);

create index if not exists admin_audit_log_actor_idx
  on public.admin_audit_log (actor_id, "timestamp" desc);

comment on table public.admin_audit_log is
  'Append-only audit of important admin actions. Not visible to regular users.';

alter table public.admin_audit_log enable row level security;

drop policy if exists "admin_select_admin_audit_log" on public.admin_audit_log;
drop policy if exists "admin_insert_admin_audit_log" on public.admin_audit_log;

create policy "admin_select_admin_audit_log"
  on public.admin_audit_log
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "admin_insert_admin_audit_log"
  on public.admin_audit_log
  for insert
  to authenticated
  with check (
    actor_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

revoke all on public.admin_audit_log from anon;
grant select, insert on public.admin_audit_log to authenticated;
