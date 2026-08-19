-- Auth rate-limit buckets (server-side; used by /api/auth/*).
-- Key is opaque hash — never store raw IP or email in plaintext.

create table if not exists public.auth_rate_limit_buckets (
  bucket_key text primary key,
  window_started_at timestamptz not null,
  hit_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint auth_rate_limit_buckets_hit_count_nonneg check (hit_count >= 0)
);

comment on table public.auth_rate_limit_buckets is
  'Sliding/fixed window counters for login, register, password-reset abuse protection.';

alter table public.auth_rate_limit_buckets enable row level security;

-- No policies for anon/authenticated: only service role writes/reads.

create or replace function public.auth_rate_limit_hit(
  p_bucket_key text,
  p_window_seconds integer,
  p_max_hits integer
)
returns table (allowed boolean, retry_after_seconds integer, hit_count integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_started timestamptz;
  v_count integer;
  v_elapsed integer;
begin
  if p_window_seconds < 1 or p_max_hits < 1 then
    return query select false, 60, 0;
    return;
  end if;

  insert into public.auth_rate_limit_buckets (bucket_key, window_started_at, hit_count, updated_at)
  values (p_bucket_key, v_now, 1, v_now)
  on conflict (bucket_key) do update
  set
    window_started_at = case
      when public.auth_rate_limit_buckets.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then v_now
      else public.auth_rate_limit_buckets.window_started_at
    end,
    hit_count = case
      when public.auth_rate_limit_buckets.window_started_at <= v_now - make_interval(secs => p_window_seconds)
        then 1
      else public.auth_rate_limit_buckets.hit_count + 1
    end,
    updated_at = v_now
  returning
    public.auth_rate_limit_buckets.window_started_at,
    public.auth_rate_limit_buckets.hit_count
  into v_started, v_count;

  v_elapsed := greatest(0, floor(extract(epoch from (v_now - v_started)))::integer);

  if v_count > p_max_hits then
    return query select
      false,
      greatest(1, p_window_seconds - v_elapsed),
      v_count;
  else
    return query select true, 0, v_count;
  end if;
end;
$$;

revoke all on function public.auth_rate_limit_hit(text, integer, integer) from public;
grant execute on function public.auth_rate_limit_hit(text, integer, integer) to service_role;

notify pgrst, 'reload schema';
