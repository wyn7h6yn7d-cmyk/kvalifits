-- Saved job searches (mirror of migration 20260817104533_saved_job_searches.sql).
-- Run in Supabase SQL Editor if the local migration has not been applied remotely.
-- Does not send email; persists seeker alert settings only.

create or replace function public.current_user_is_seeker()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'seeker'
  );
$$;

revoke all on function public.current_user_is_seeker() from public;
grant execute on function public.current_user_is_seeker() to authenticated;

create table if not exists public.saved_job_searches (
  id uuid primary key default gen_random_uuid(),
  seeker_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  query text not null default '',
  filters jsonb not null default '[]'::jsonb,
  require_public_salary boolean not null default false,
  min_match_percent integer null
    check (min_match_percent is null or (min_match_percent >= 0 and min_match_percent <= 100)),
  frequency text not null default 'daily'
    check (frequency in ('immediate', 'daily', 'weekly')),
  enabled boolean not null default true,
  locale text not null default 'et'
    check (locale in ('et', 'en', 'ru')),
  search_fingerprint text not null,
  notify_after timestamptz not null default now(),
  last_notified_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint saved_job_searches_name_len check (char_length(name) <= 120),
  constraint saved_job_searches_query_len check (char_length(query) <= 500),
  constraint saved_job_searches_filters_is_array check (jsonb_typeof(filters) = 'array')
);

create unique index if not exists saved_job_searches_seeker_fingerprint_unique
  on public.saved_job_searches (seeker_user_id, search_fingerprint);

create index if not exists saved_job_searches_seeker_created_idx
  on public.saved_job_searches (seeker_user_id, created_at desc);

create index if not exists saved_job_searches_enabled_freq_idx
  on public.saved_job_searches (enabled, frequency)
  where enabled = true;

alter table public.saved_job_searches enable row level security;

drop policy if exists "saved_job_searches_select_own" on public.saved_job_searches;
create policy "saved_job_searches_select_own"
  on public.saved_job_searches
  for select
  to authenticated
  using (
    seeker_user_id = auth.uid()
    and public.current_user_is_seeker()
  );

drop policy if exists "saved_job_searches_insert_own" on public.saved_job_searches;
create policy "saved_job_searches_insert_own"
  on public.saved_job_searches
  for insert
  to authenticated
  with check (
    seeker_user_id = auth.uid()
    and public.current_user_is_seeker()
  );

drop policy if exists "saved_job_searches_update_own" on public.saved_job_searches;
create policy "saved_job_searches_update_own"
  on public.saved_job_searches
  for update
  to authenticated
  using (
    seeker_user_id = auth.uid()
    and public.current_user_is_seeker()
  )
  with check (
    seeker_user_id = auth.uid()
    and public.current_user_is_seeker()
  );

drop policy if exists "saved_job_searches_delete_own" on public.saved_job_searches;
create policy "saved_job_searches_delete_own"
  on public.saved_job_searches
  for delete
  to authenticated
  using (
    seeker_user_id = auth.uid()
    and public.current_user_is_seeker()
  );

revoke all on table public.saved_job_searches from public;
revoke all on table public.saved_job_searches from anon;
revoke all on table public.saved_job_searches from authenticated;
grant select, insert, update, delete on table public.saved_job_searches to authenticated;
grant all on table public.saved_job_searches to service_role;

notify pgrst, 'reload schema';
