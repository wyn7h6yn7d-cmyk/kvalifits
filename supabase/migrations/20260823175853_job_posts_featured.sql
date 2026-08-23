-- Featured job postings (Esiletõstetud tööpakkumine).
-- Employers cannot set featured fields via API; admin/service role only.
-- Active featured state requires published + accepting + featured_from..featured_until window.

alter table public.job_posts
  add column if not exists is_featured boolean not null default false,
  add column if not exists featured_from timestamptz,
  add column if not exists featured_until timestamptz;

comment on column public.job_posts.is_featured is
  'Admin-controlled featured flag. Employers cannot set via RLS client; use server/admin flows.';
comment on column public.job_posts.featured_from is
  'Inclusive start of featured window (timestamptz). Required when is_featured is true.';
comment on column public.job_posts.featured_until is
  'Exclusive end of featured window (timestamptz). Required when is_featured is true.';

alter table public.job_posts
  drop constraint if exists job_posts_featured_window_check;

alter table public.job_posts
  add constraint job_posts_featured_window_check
  check (
    (not is_featured and featured_from is null and featured_until is null)
    or (
      is_featured
      and featured_from is not null
      and featured_until is not null
      and featured_until > featured_from
    )
  );

create index if not exists job_posts_featured_window_idx
  on public.job_posts (featured_from, featured_until)
  where is_featured = true and status = 'published'::public.job_post_status;

-- Runtime: is this job featured right now (published, accepting, in window)?
create or replace function public.job_post_featured_is_active(jp public.job_posts)
returns boolean
language sql
stable
as $$
  select
    coalesce(jp.is_featured, false)
    and jp.status::text = 'published'
    and jp.featured_from is not null
    and jp.featured_until is not null
    and now() >= jp.featured_from
    and now() < jp.featured_until
    and public.job_search_is_accepting(jp);
$$;

comment on function public.job_post_featured_is_active(public.job_posts) is
  'True when a job is featured, published, accepting applications, and inside featured_from..featured_until.';

revoke all on function public.job_post_featured_is_active(public.job_posts) from public;
grant execute on function public.job_post_featured_is_active(public.job_posts) to anon, authenticated;

-- Strip featured mutations from non-admin JWTs (employer API).
create or replace function public.protect_job_posts_featured_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.current_user_is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_featured := false;
    new.featured_from := null;
    new.featured_until := null;
    return new;
  end if;

  new.is_featured := old.is_featured;
  new.featured_from := old.featured_from;
  new.featured_until := old.featured_until;
  return new;
end;
$$;

comment on function public.protect_job_posts_featured_fields() is
  'BEFORE INSERT/UPDATE on job_posts: only admin JWT or service role may change featured fields.';

-- Validate featured invariants for all writers (including admin/service role).
create or replace function public.validate_job_posts_featured_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status::text is distinct from 'published' then
    new.is_featured := false;
    new.featured_from := null;
    new.featured_until := null;
    return new;
  end if;

  if not coalesce(new.is_featured, false) then
    new.featured_from := null;
    new.featured_until := null;
    return new;
  end if;

  if new.featured_from is null or new.featured_until is null then
    raise exception 'featured_window_required'
      using errcode = '23514';
  end if;

  if new.featured_until <= new.featured_from then
    raise exception 'featured_window_invalid'
      using errcode = '23514';
  end if;

  if not public.job_search_is_accepting(new) then
    raise exception 'featured_job_not_accepting'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function public.validate_job_posts_featured_fields() is
  'BEFORE INSERT/UPDATE: featured jobs must be published, accepting, and have a valid window.';

drop trigger if exists protect_job_posts_featured_fields_trg on public.job_posts;
create trigger protect_job_posts_featured_fields_trg
  before insert or update on public.job_posts
  for each row
  execute function public.protect_job_posts_featured_fields();

drop trigger if exists validate_job_posts_featured_fields_trg on public.job_posts;
create trigger validate_job_posts_featured_fields_trg
  before insert or update on public.job_posts
  for each row
  execute function public.validate_job_posts_featured_fields();

-- Admin/server-only activation helper (service role / postgres).
create or replace function private.set_job_post_featured(
  p_job_post_id uuid,
  p_featured_from timestamptz,
  p_featured_until timestamptz
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.job_posts
  set
    is_featured = true,
    featured_from = p_featured_from,
    featured_until = p_featured_until
  where id = p_job_post_id;

  if not found then
    raise exception 'job_not_found'
      using errcode = 'P0002';
  end if;
end;
$$;

comment on function private.set_job_post_featured(uuid, timestamptz, timestamptz) is
  'Admin/server: mark a published accepting job as featured for a time window. Not granted to anon/authenticated.';

create or replace function private.clear_job_post_featured(p_job_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.job_posts
  set
    is_featured = false,
    featured_from = null,
    featured_until = null
  where id = p_job_post_id;

  if not found then
    raise exception 'job_not_found'
      using errcode = 'P0002';
  end if;
end;
$$;

comment on function private.clear_job_post_featured(uuid) is
  'Admin/server: remove featured flag from a job post.';

revoke all on function private.set_job_post_featured(uuid, timestamptz, timestamptz) from public;
revoke all on function private.set_job_post_featured(uuid, timestamptz, timestamptz) from anon, authenticated;
revoke all on function private.clear_job_post_featured(uuid) from public;
revoke all on function private.clear_job_post_featured(uuid) from anon, authenticated;
grant execute on function private.set_job_post_featured(uuid, timestamptz, timestamptz) to postgres;
grant execute on function private.clear_job_post_featured(uuid) to postgres;

-- Expired listings: archive and drop featured flags.
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
  set
    status = 'archived',
    is_featured = false,
    featured_from = null,
    featured_until = null
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

notify pgrst, 'reload schema';
