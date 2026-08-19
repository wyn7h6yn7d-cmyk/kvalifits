-- Schema/RLS reconciliation part 3 of 3.
-- Final intended policy / grant / trigger / storage state.
-- Repeat-safe. Does not drop tables or delete rows.
-- Drops known overlapping legacy policies (OR-of-allow) then recreates canonical ones.

-- =====================================================================
-- Drop overlapping legacy policies (remote dashboard / older SQL editor)
-- =====================================================================

drop policy if exists "job_posts_select_owner" on public.job_posts;
drop policy if exists "job_posts_insert_owner" on public.job_posts;
drop policy if exists "job_posts_update_owner" on public.job_posts;
drop policy if exists "job_posts_delete_owner" on public.job_posts;
drop policy if exists "job_posts_select_public_published" on public.job_posts;
drop policy if exists "admin_select_all_jobs" on public.job_posts;
drop policy if exists "admin_update_all_jobs" on public.job_posts;
drop policy if exists "admin_delete_all_jobs" on public.job_posts;

drop policy if exists "employer_profiles_delete_own" on public.employer_profiles;
drop policy if exists "admin_select_all_employers" on public.employer_profiles;

drop policy if exists "seeker_profiles_delete_own" on public.seeker_profiles;
drop policy if exists "seeker_profiles_insert_own" on public.seeker_profiles;
drop policy if exists "seeker_profiles_select_own" on public.seeker_profiles;
drop policy if exists "seeker_profiles_update_own" on public.seeker_profiles;
drop policy if exists "admin_select_all_seekers" on public.seeker_profiles;

drop policy if exists "seeker_certificates_delete_own" on public.seeker_certificates;
drop policy if exists "seeker_certificates_insert_own" on public.seeker_certificates;
drop policy if exists "seeker_certificates_select_own" on public.seeker_certificates;
drop policy if exists "seeker_certificates_update_own" on public.seeker_certificates;

drop policy if exists "admin_select_all_profiles" on public.profiles;
drop policy if exists "admin_select_all_applications" on public.job_applications;

drop policy if exists "avatars: public read" on storage.objects;
drop policy if exists "avatars: user can delete own files" on storage.objects;
drop policy if exists "avatars: user can update own files" on storage.objects;
drop policy if exists "avatars: user can upload to own folder" on storage.objects;

drop policy if exists "cert_images_owner_delete bvepgu_0" on storage.objects;
drop policy if exists "cert_images_owner_insert bvepgu_0" on storage.objects;
drop policy if exists "cert_images_owner_read bvepgu_0" on storage.objects;
drop policy if exists "cert_images_owner_update bvepgu_0" on storage.objects;

drop policy if exists "cvs_owner_delete 24bk_0" on storage.objects;
drop policy if exists "cvs_owner_insert 24bk_0" on storage.objects;
drop policy if exists "cvs_owner_read 24bk_0" on storage.objects;
drop policy if exists "cvs_owner_update 24bk_0" on storage.objects;

drop policy if exists "company_logos_owner_delete 1y3lpeg_0" on storage.objects;
drop policy if exists "company_logos_owner_insert 1y3lpeg_0" on storage.objects;
drop policy if exists "company_logos_owner_update 1y3lpeg_0" on storage.objects;
drop policy if exists "company_logos_public_read 1y3lpeg_0" on storage.objects;

-- =====================================================================
-- Canonical age + legal-representative consent lock (final function body)
-- =====================================================================

create or replace function public.seeker_profiles_apply_age_fields()
returns trigger
language plpgsql
as $$
declare
  age_years integer;
  prev_status text;
begin
  prev_status := case when tg_op = 'UPDATE' then old.legal_representative_consent_status else null end;

  if new.date_of_birth is null then
    new.is_minor := false;
    new.minor_age_band := null;
    new.learning_obligation_status := null;
    new.parental_consent_required := false;
    new.night_work_restricted := false;
    new.hazardous_work_restricted := false;
    new.legal_representative_consent_status := null;
    return new;
  end if;

  if new.date_of_birth > current_date then
    raise exception 'date_of_birth cannot be in the future';
  end if;

  age_years := date_part('year', age(current_date, new.date_of_birth))::integer;

  new.is_minor := age_years < 18;

  if age_years < 15 then
    new.minor_age_band := 'under_15';
  elsif age_years = 15 then
    new.minor_age_band := 'age_15';
  elsif age_years in (16, 17) then
    new.minor_age_band := 'age_16_17';
  else
    new.minor_age_band := null;
  end if;

  if new.minor_age_band is distinct from 'age_16_17' then
    new.learning_obligation_status := null;
  end if;

  new.parental_consent_required := new.is_minor;
  new.night_work_restricted := new.is_minor;
  new.hazardous_work_restricted := new.is_minor;

  if not new.is_minor then
    new.legal_representative_consent_status := null;
  else
    if new.legal_representative_consent_status = 'confirmed'
       and prev_status is distinct from 'confirmed' then
      new.legal_representative_consent_status := coalesce(prev_status, 'required');
    end if;

    if new.legal_representative_consent_status is null
       or new.legal_representative_consent_status not in ('required', 'pending', 'confirmed') then
      new.legal_representative_consent_status := 'required';
    end if;
  end if;

  if tg_op = 'INSERT'
     or new.legal_representative_consent_status is distinct from prev_status then
    new.legal_representative_consent_updated_at := now();
  end if;

  return new;
end;
$$;

drop trigger if exists seeker_profiles_apply_age_fields_trg on public.seeker_profiles;
create trigger seeker_profiles_apply_age_fields_trg
before insert or update
on public.seeker_profiles
for each row
execute function public.seeker_profiles_apply_age_fields();

-- =====================================================================
-- Intended table grants (RLS still applies). TRUNCATE is never granted.
-- =====================================================================

revoke all on table public.profiles from anon, public;
grant select, insert, update on table public.profiles to authenticated;

revoke all on table public.seeker_profiles from anon, public;
grant select, insert, update, delete on table public.seeker_profiles to authenticated;

revoke all on table public.employer_profiles from anon, public;
grant select on table public.employer_profiles to anon;
grant select, insert, update on table public.employer_profiles to authenticated;

revoke all on table public.job_posts from anon, public;
grant select on table public.job_posts to anon;
grant select, insert, update, delete on table public.job_posts to authenticated;

revoke all on table public.job_applications from anon, public;
grant select, insert on table public.job_applications to authenticated;
revoke update on table public.job_applications from authenticated, anon, public;
grant update (
  status,
  updated_at,
  cover_letter,
  application_answers
) on table public.job_applications to authenticated;

revoke all on table public.seeker_certificates from anon, public;
grant select, insert, update, delete on table public.seeker_certificates to authenticated;

revoke all on table public.saved_jobs from anon, public;
grant select, insert, delete on table public.saved_jobs to authenticated;

revoke all on table public.saved_job_searches from anon, public;
grant select, insert, update, delete on table public.saved_job_searches to authenticated;

do $$
begin
  if to_regclass('public.job_post_reports') is not null then
    execute 'revoke all on table public.job_post_reports from anon, public';
    execute 'grant insert on table public.job_post_reports to anon, authenticated';
    execute 'grant select, update on table public.job_post_reports to authenticated';
  end if;
  if to_regclass('public.job_application_internal_notes') is not null then
    execute 'revoke all on table public.job_application_internal_notes from anon, public';
    execute 'grant select, insert, update, delete on table public.job_application_internal_notes to authenticated';
  end if;
  if to_regclass('public.seeker_workplace_needs') is not null then
    execute 'revoke all on table public.seeker_workplace_needs from anon, public';
    execute 'grant select, insert, update, delete on table public.seeker_workplace_needs to authenticated';
  end if;
  if to_regclass('public.seeker_work_capacity') is not null then
    execute 'revoke all on table public.seeker_work_capacity from anon, public';
    execute 'grant select, insert, update, delete on table public.seeker_work_capacity to authenticated';
  end if;
  if to_regclass('public.legal_retention_records') is not null then
    execute 'revoke all on table public.legal_retention_records from anon, public';
    execute 'grant select on table public.legal_retention_records to authenticated';
  end if;
  if to_regclass('public.account_deletion_events') is not null then
    execute 'revoke all on table public.account_deletion_events from anon, public';
    execute 'grant select on table public.account_deletion_events to authenticated';
  end if;
  if to_regclass('public.job_application_status_events') is not null then
    execute 'revoke all on table public.job_application_status_events from anon, public';
    execute 'grant select on table public.job_application_status_events to authenticated';
  end if;
end;
$$;

-- =====================================================================
-- Recreate canonical RLS / storage / blocked-user / private CV
-- (original files are already idempotent DROP IF EXISTS + CREATE)
-- =====================================================================

-- ===== 20260816_profiles_rls_security.sql =====
-- Harden public.profiles: enable RLS, own-row access, protect privilege columns.
-- Admins retain list/update via security-definer helper (avoids RLS recursion).
-- anon has no SELECT/UPDATE/INSERT policies on private profile data.

-- ---------------------------------------------------------------------------
-- Helper: admin check without RLS recursion on profiles
-- ---------------------------------------------------------------------------
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

comment on function public.current_user_is_admin() is
  'True when auth.uid() has profiles.role = admin. SECURITY DEFINER to avoid RLS recursion.';

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Guard: non-admins cannot set/change privilege fields
-- (role, is_blocked — verification lives on employer/certificate tables)
-- ---------------------------------------------------------------------------
create or replace function public.profiles_guard_security_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_is_admin boolean;
begin
  -- Service role / system (auth.uid() null) may write freely.
  if auth.uid() is null then
    return new;
  end if;

  select public.current_user_is_admin() into actor_is_admin;

  if coalesce(actor_is_admin, false) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- Registration may set seeker|employer only — never self-assign admin.
    if new.role is null or new.role not in ('seeker', 'employer') then
      raise exception 'profiles: invalid role for non-admin insert'
        using errcode = '42501';
    end if;
    new.is_blocked := false;
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Lock privilege / moderation columns for ordinary users.
    new.role := old.role;
    new.is_blocked := old.is_blocked;
    return new;
  end if;

  return new;
end;
$$;

comment on function public.profiles_guard_security_fields() is
  'Prevents non-admins from changing role / is_blocked; blocks admin self-assignment on insert.';

drop trigger if exists profiles_guard_security_fields_trg on public.profiles;
create trigger profiles_guard_security_fields_trg
  before insert or update on public.profiles
  for each row
  execute function public.profiles_guard_security_fields();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Drop known policy names if re-running (idempotent).
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "admin_select_profiles" on public.profiles;
drop policy if exists "admin_update_profiles" on public.profiles;

-- Own row only (authenticated). No anon policies → no anon private profile reads.
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Admins: list and moderate any profile (e.g. is_blocked).
create policy "admin_select_profiles"
  on public.profiles
  for select
  to authenticated
  using (public.current_user_is_admin());

create policy "admin_update_profiles"
  on public.profiles
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- ---------------------------------------------------------------------------
-- Table grants: no anon access; authenticated CRUD limited by RLS + trigger
-- (DELETE reserved for service role / account deletion workflows)
-- ---------------------------------------------------------------------------
revoke all on table public.profiles from anon;
revoke all on table public.profiles from public;

grant select, insert, update on table public.profiles to authenticated;

notify pgrst, 'reload schema';

-- ===== 20260816_seeker_profiles_rls_security.sql =====
-- Harden public.seeker_profiles RLS.
-- Seekers: full own-row CRUD via user_id = auth.uid().
-- Employers: keep existing SELECT-only discovery / applicant policies (no write).
-- Account deletion uses service role (bypasses RLS); own DELETE remains for consistency.

alter table public.seeker_profiles enable row level security;

-- ---------------------------------------------------------------------------
-- Seeker ownership
-- ---------------------------------------------------------------------------
drop policy if exists "seeker_select_own_profile" on public.seeker_profiles;
create policy "seeker_select_own_profile"
  on public.seeker_profiles
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "seeker_insert_own_profile" on public.seeker_profiles;
create policy "seeker_insert_own_profile"
  on public.seeker_profiles
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "seeker_update_own_profile" on public.seeker_profiles;
create policy "seeker_update_own_profile"
  on public.seeker_profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "seeker_delete_own_profile" on public.seeker_profiles;
create policy "seeker_delete_own_profile"
  on public.seeker_profiles
  for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Employer SELECT (preserved — no INSERT/UPDATE/DELETE for employers)
-- ---------------------------------------------------------------------------
drop policy if exists "employer_select_seeker_profiles_for_own_job_applicants" on public.seeker_profiles;
create policy "employer_select_seeker_profiles_for_own_job_applicants"
  on public.seeker_profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications ja
      join public.job_posts jp on jp.id = ja.job_post_id
      join public.employer_profiles ep on ep.id = jp.employer_profile_id
      where ja.seeker_user_id = seeker_profiles.user_id
        and ep.owner_user_id = auth.uid()
    )
  );

drop policy if exists "employer_select_discoverable_seeker_profiles" on public.seeker_profiles;
create policy "employer_select_discoverable_seeker_profiles"
  on public.seeker_profiles
  for select
  to authenticated
  using (
    profile_visible = true
    and exists (
      select 1
      from public.employer_profiles ep
      where ep.owner_user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Grants: no anon; authenticated limited by RLS above
-- ---------------------------------------------------------------------------
revoke all on table public.seeker_profiles from anon;
revoke all on table public.seeker_profiles from public;

grant select, insert, update, delete on table public.seeker_profiles to authenticated;

notify pgrst, 'reload schema';

-- ===== 20260816_employer_profiles_rls_security.sql =====
-- Harden public.employer_profiles RLS only.
-- Owner CRUD for own row; verification / company_verified locked for non-admins.
-- Public SELECT stays minimal: only when employer has a published job
-- (security-definer helper — does not touch job_posts policies).
-- Admin SELECT/UPDATE remain separate policies.

-- ---------------------------------------------------------------------------
-- Admin helper (idempotent)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Public listing helper (avoids RLS recursion with job_posts; no policy changes there)
-- ---------------------------------------------------------------------------
create or replace function public.employer_profile_has_published_job(profile_id uuid)
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
    where jp.employer_profile_id = profile_id
      and (jp.status)::text = 'published'
  );
$$;

revoke all on function public.employer_profile_has_published_job(uuid) from public;
grant execute on function public.employer_profile_has_published_job(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Guard: non-admins cannot set verification / ownership fields
-- ---------------------------------------------------------------------------
create or replace function public.employer_profiles_guard_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
begin
  -- Service role / system jobs (auth.uid() null) may update verification.
  if auth.uid() is null then
    is_admin := true;
  else
    select public.current_user_is_admin() into is_admin;
  end if;

  if not coalesce(is_admin, false) then
    if tg_op = 'INSERT' then
      new.company_verified := false;
      new.verification_status := 'unverified';
      new.verification_source := null;
      new.verified_at := null;
    elsif tg_op = 'UPDATE' then
      -- Employers cannot self-verify or reassign ownership.
      new.owner_user_id := old.owner_user_id;
      new.company_verified := old.company_verified;
      new.verification_status := old.verification_status;
      new.verification_source := old.verification_source;
      new.verified_at := old.verified_at;
    end if;
    return new;
  end if;

  -- Admin path: keep boolean + timestamp consistent with status.
  if new.verification_status is null
     or new.verification_status not in ('unverified', 'under_review', 'verified') then
    new.verification_status := 'unverified';
  end if;

  new.company_verified := (new.verification_status = 'verified');

  if new.verification_status = 'verified' then
    if new.verified_at is null then
      new.verified_at := now();
    end if;
    if new.verification_source is null or btrim(new.verification_source) = '' then
      new.verification_source := 'manual';
    end if;
  else
    new.verified_at := null;
    new.verification_source := null;
  end if;

  return new;
end;
$$;

drop trigger if exists employer_profiles_guard_verification on public.employer_profiles;
create trigger employer_profiles_guard_verification
  before insert or update on public.employer_profiles
  for each row
  execute function public.employer_profiles_guard_verification();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.employer_profiles enable row level security;

-- Owner
drop policy if exists "employer_profiles_select_own" on public.employer_profiles;
create policy "employer_profiles_select_own"
  on public.employer_profiles
  for select
  to authenticated
  using (owner_user_id = auth.uid());

drop policy if exists "employer_profiles_insert_own" on public.employer_profiles;
create policy "employer_profiles_insert_own"
  on public.employer_profiles
  for insert
  to authenticated
  with check (owner_user_id = auth.uid());

drop policy if exists "employer_profiles_update_own" on public.employer_profiles;
create policy "employer_profiles_update_own"
  on public.employer_profiles
  for update
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

-- Public / board: company row only when at least one published job exists.
drop policy if exists "employer_profiles_select_for_published_jobs" on public.employer_profiles;
create policy "employer_profiles_select_for_published_jobs"
  on public.employer_profiles
  for select
  to anon, authenticated
  using (public.employer_profile_has_published_job(id));

-- Admin (separate)
drop policy if exists "admin_select_employer_profiles" on public.employer_profiles;
create policy "admin_select_employer_profiles"
  on public.employer_profiles
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "admin_update_employer_profiles" on public.employer_profiles;
create policy "admin_update_employer_profiles"
  on public.employer_profiles
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Grants: anon SELECT only (RLS-limited to published-job employers);
-- authenticated SELECT/INSERT/UPDATE; no client DELETE.
revoke all on table public.employer_profiles from public;
grant select on table public.employer_profiles to anon;
grant select, insert, update on table public.employer_profiles to authenticated;

notify pgrst, 'reload schema';

-- ===== 20260816_job_posts_rls_security.sql =====
-- Harden public.job_posts RLS only (no UI changes).
-- PUBLIC: SELECT published only.
-- EMPLOYER: SELECT/INSERT/UPDATE/DELETE own via employer_profiles ownership;
--           UPDATE WITH CHECK blocks reassigning employer_profile_id to another company.
-- ADMIN: SELECT / UPDATE / DELETE for moderation (existing admin client flows).

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
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

-- Ownership check with RLS off — avoids recursion with employer_profiles policies
-- that themselves may reference job_posts.
create or replace function public.current_user_owns_employer_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.employer_profiles ep
    where ep.id = profile_id
      and ep.owner_user_id = auth.uid()
  );
$$;

revoke all on function public.current_user_owns_employer_profile(uuid) from public;
grant execute on function public.current_user_owns_employer_profile(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.job_posts enable row level security;

-- Drop known / prior policy names (idempotent).
drop policy if exists "job_posts_select_published_public" on public.job_posts;
drop policy if exists "job_posts_select_own" on public.job_posts;
drop policy if exists "job_posts_insert_own" on public.job_posts;
drop policy if exists "job_posts_update_own" on public.job_posts;
drop policy if exists "job_posts_delete_own" on public.job_posts;
drop policy if exists "admin_select_job_posts" on public.job_posts;
drop policy if exists "admin_update_job_posts" on public.job_posts;
drop policy if exists "admin_delete_job_posts" on public.job_posts;

-- PUBLIC: only published listings
create policy "job_posts_select_published_public"
  on public.job_posts
  for select
  to anon, authenticated
  using ((status)::text = 'published');

-- EMPLOYER: own rows (drafts + published + archived)
create policy "job_posts_select_own"
  on public.job_posts
  for select
  to authenticated
  using (public.current_user_owns_employer_profile(employer_profile_id));

create policy "job_posts_insert_own"
  on public.job_posts
  for insert
  to authenticated
  with check (public.current_user_owns_employer_profile(employer_profile_id));

-- USING: may update only rows currently owned.
-- WITH CHECK: new employer_profile_id must still be owned (blocks body reassignment).
create policy "job_posts_update_own"
  on public.job_posts
  for update
  to authenticated
  using (public.current_user_owns_employer_profile(employer_profile_id))
  with check (public.current_user_owns_employer_profile(employer_profile_id));

create policy "job_posts_delete_own"
  on public.job_posts
  for delete
  to authenticated
  using (public.current_user_owns_employer_profile(employer_profile_id));

-- ADMIN: moderation (list, status changes, delete)
create policy "admin_select_job_posts"
  on public.job_posts
  for select
  to authenticated
  using (public.current_user_is_admin());

create policy "admin_update_job_posts"
  on public.job_posts
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

create policy "admin_delete_job_posts"
  on public.job_posts
  for delete
  to authenticated
  using (public.current_user_is_admin());

-- Grants: anon SELECT (RLS → published only); authenticated CRUD limited by policies.
revoke all on table public.job_posts from public;
grant select on table public.job_posts to anon;
grant select, insert, update, delete on table public.job_posts to authenticated;

notify pgrst, 'reload schema';

-- ===== 20260816_seeker_certificates_rls_security.sql =====
-- Harden public.seeker_certificates + storage.objects (certificates bucket).
-- Seekers own their rows; cannot self-set verification fields.
-- Delete→reinsert sync preserves verification via a durable stash table
-- (profile save uses separate delete + insert requests / transactions).
-- Employers: SELECT metadata only for discoverable seekers / consented applicants.
-- Admins: SELECT/UPDATE via current_user_is_admin().

-- ---------------------------------------------------------------------------
-- Admin helper (idempotent; also used by profiles RLS)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Verification stash (durable across delete + insert HTTP requests)
-- ---------------------------------------------------------------------------
create table if not exists public.seeker_certificates_verification_stash (
  user_id uuid not null,
  name_key text not null,
  verification_status text not null,
  verified_at date,
  verification_source text,
  verified_by text,
  stashed_at timestamptz not null default now(),
  primary key (user_id, name_key)
);

alter table public.seeker_certificates_verification_stash enable row level security;

revoke all on table public.seeker_certificates_verification_stash from anon;
revoke all on table public.seeker_certificates_verification_stash from authenticated;
revoke all on table public.seeker_certificates_verification_stash from public;

create or replace function public.seeker_certificates_stash_verification_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only stash when an authenticated session deletes (owner flow).
  if auth.uid() is null then
    return old;
  end if;

  insert into public.seeker_certificates_verification_stash (
    user_id,
    name_key,
    verification_status,
    verified_at,
    verification_source,
    verified_by,
    stashed_at
  )
  values (
    old.user_id,
    lower(btrim(coalesce(old.certificate_name, ''))) || '::' ||
      lower(btrim(coalesce(old.certificate_issuer, ''))),
    coalesce(old.verification_status, 'submitted'),
    old.verified_at,
    old.verification_source,
    old.verified_by,
    now()
  )
  on conflict (user_id, name_key) do update
  set
    verification_status = excluded.verification_status,
    verified_at = excluded.verified_at,
    verification_source = excluded.verification_source,
    verified_by = excluded.verified_by,
    stashed_at = excluded.stashed_at;

  return old;
end;
$$;

create or replace function public.seeker_certificates_guard_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_is_admin boolean;
  stash_key text;
  stashed public.seeker_certificates_verification_stash%rowtype;
begin
  -- Service role / backend without JWT: leave values as provided.
  if auth.uid() is null then
    return new;
  end if;

  select public.current_user_is_admin() into actor_is_admin;
  if coalesce(actor_is_admin, false) then
    return new;
  end if;

  if tg_op = 'UPDATE' then
    -- Seekers cannot change verification columns.
    new.verification_status := old.verification_status;
    new.verified_at := old.verified_at;
    new.verification_source := old.verification_source;
    new.verified_by := old.verified_by;
    return new;
  end if;

  if tg_op = 'INSERT' then
    stash_key :=
      lower(btrim(coalesce(new.certificate_name, ''))) || '::' ||
      lower(btrim(coalesce(new.certificate_issuer, '')));

    delete from public.seeker_certificates_verification_stash s
    where s.user_id = new.user_id
      and s.name_key = stash_key
    returning * into stashed;

    if found then
      -- Re-insert after owner delete: restore prior admin verification.
      new.verification_status := stashed.verification_status;
      new.verified_at := stashed.verified_at;
      new.verification_source := stashed.verification_source;
      new.verified_by := stashed.verified_by;
      return new;
    end if;

    -- Fresh insert: never allow self-verification.
    new.verification_status := 'submitted';
    new.verified_at := null;
    new.verification_source := null;
    new.verified_by := null;
    return new;
  end if;

  return new;
end;
$$;

drop trigger if exists seeker_certificates_stash_verification_trg on public.seeker_certificates;
create trigger seeker_certificates_stash_verification_trg
  before delete on public.seeker_certificates
  for each row
  execute function public.seeker_certificates_stash_verification_on_delete();

drop trigger if exists seeker_certificates_guard_verification_trg on public.seeker_certificates;
create trigger seeker_certificates_guard_verification_trg
  before insert or update on public.seeker_certificates
  for each row
  execute function public.seeker_certificates_guard_verification();

-- ---------------------------------------------------------------------------
-- Table RLS
-- ---------------------------------------------------------------------------
alter table public.seeker_certificates enable row level security;

drop policy if exists "seeker_select_own_certificates" on public.seeker_certificates;
create policy "seeker_select_own_certificates"
  on public.seeker_certificates
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "seeker_insert_own_certificates" on public.seeker_certificates;
create policy "seeker_insert_own_certificates"
  on public.seeker_certificates
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "seeker_update_own_certificates" on public.seeker_certificates;
create policy "seeker_update_own_certificates"
  on public.seeker_certificates
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "seeker_delete_own_certificates" on public.seeker_certificates;
create policy "seeker_delete_own_certificates"
  on public.seeker_certificates
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Employer: metadata for discoverable candidates (product: candidates search).
drop policy if exists "employer_select_discoverable_seeker_certificates" on public.seeker_certificates;
create policy "employer_select_discoverable_seeker_certificates"
  on public.seeker_certificates
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.seeker_profiles sp
      join public.employer_profiles ep on ep.owner_user_id = auth.uid()
      where sp.user_id = seeker_certificates.user_id
        and sp.profile_visible = true
    )
  );

-- Employer: metadata for consented applicants (aligned with storage access).
drop policy if exists "employer_select_applicant_seeker_certificates" on public.seeker_certificates;
create policy "employer_select_applicant_seeker_certificates"
  on public.seeker_certificates
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications ja
      join public.job_posts jp on jp.id = ja.job_post_id
      join public.employer_profiles ep on ep.id = jp.employer_profile_id
      where ja.seeker_user_id = seeker_certificates.user_id
        and ep.owner_user_id = auth.uid()
        and ja.consent_to_share = true
        and coalesce(ja.status, '') is distinct from 'withdrawn'
    )
  );

-- Admin moderation queue
drop policy if exists "admin_select_seeker_certificates" on public.seeker_certificates;
create policy "admin_select_seeker_certificates"
  on public.seeker_certificates
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "admin_update_seeker_certificates" on public.seeker_certificates;
create policy "admin_update_seeker_certificates"
  on public.seeker_certificates
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

revoke all on table public.seeker_certificates from anon;
revoke all on table public.seeker_certificates from public;
grant select, insert, update, delete on table public.seeker_certificates to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private certificates bucket (refresh policies; admin via helper)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificates',
  'certificates',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
  ]::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "certificates_insert_own" on storage.objects;
create policy "certificates_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "certificates_update_own" on storage.objects;
create policy "certificates_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "certificates_delete_own" on storage.objects;
create policy "certificates_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "certificates_select_own" on storage.objects;
create policy "certificates_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "certificates_select_admin" on storage.objects;
create policy "certificates_select_admin"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'certificates'
    and public.current_user_is_admin()
  );

drop policy if exists "certificates_select_employer_for_applicants" on storage.objects;
create policy "certificates_select_employer_for_applicants"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'certificates'
    and exists (
      select 1
      from public.job_applications ja
      join public.job_posts jp on jp.id = ja.job_post_id
      join public.employer_profiles ep on ep.id = jp.employer_profile_id
      where ja.seeker_user_id::text = (storage.foldername(name))[1]
        and ep.owner_user_id = auth.uid()
        and ja.consent_to_share = true
        and coalesce(ja.status, '') is distinct from 'withdrawn'
    )
  );

notify pgrst, 'reload schema';

-- ===== 20260816_job_applications_update_field_security.sql =====
-- Harden job_applications UPDATE: seekers may not change server/employer fields.
-- Defense in depth:
--   1) BEFORE UPDATE trigger (role-aware field lock)
--   2) column-level UPDATE grants (authenticated can only touch allowed cols)
-- Row-level policies stay for who may update which rows; they alone are not enough.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Trigger: lock protected columns by actor
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
  -- Server / employer / audit fields seekers must never change after insert.
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
    'reviewed_by'
  ];
  seeker_allowed text[] := array[
    'cover_letter',
    'application_answers',
    'updated_at'
  ];
  akey text;
begin
  -- Service role / backend (no JWT): full write (e.g. account deletion wipe).
  if auth.uid() is null then
    return new;
  end if;

  select public.current_user_is_admin() into actor_is_admin;
  if coalesce(actor_is_admin, false) then
    return new;
  end if;

  attempted := new;
  old_j := to_jsonb(old);

  -- Employer on own job: only pipeline status + updated_at.
  select public.current_user_owns_job_application_employer(old) into actor_is_employer;
  if coalesce(actor_is_employer, false)
     and old.seeker_user_id is distinct from auth.uid() then
    new := old;
    new.status := attempted.status;
    new.updated_at := attempted.updated_at;
    return new;
  end if;

  -- Seeker (own row): restore all protected keys from OLD; allow candidate fields only.
  if old.seeker_user_id = auth.uid() then
    new := old;

    foreach akey in array seeker_allowed loop
      if to_jsonb(attempted) ? akey then
        overlay := jsonb_build_object(akey, to_jsonb(attempted) -> akey);
        new := jsonb_populate_record(new, overlay);
      end if;
    end loop;

    -- Status: withdraw only (cannot set employer pipeline values; cannot un-withdraw).
    if lower(coalesce(old.status, '')) = 'withdrawn' then
      new.status := old.status;
    elsif lower(coalesce(attempted.status, '')) = 'withdrawn' then
      new.status := 'withdrawn';
    else
      new.status := old.status;
    end if;

    -- Belt-and-suspenders: re-apply protected keys from OLD if present on the row type.
    foreach k in array protected_keys loop
      if old_j ? k then
        new := jsonb_populate_record(
          new,
          jsonb_build_object(k, old_j -> k)
        );
      end if;
    end loop;

    return new;
  end if;

  -- Unexpected actor with UPDATE privilege: reject field changes.
  return old;
end;
$$;

comment on function public.job_applications_guard_update_fields() is
  'Seeker UPDATE may only touch cover_letter / application_answers / updated_at and status→withdrawn. Employer UPDATE may only touch status / updated_at. Admin and service role unrestricted.';

drop trigger if exists job_applications_guard_update_fields_trg on public.job_applications;
create trigger job_applications_guard_update_fields_trg
  before update on public.job_applications
  for each row
  execute function public.job_applications_guard_update_fields();

-- ---------------------------------------------------------------------------
-- Keep row-level who-can-update (unchanged intent); not sufficient alone.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Ensure seeker-editable columns exist (remote may lag behind product migrations)
-- ---------------------------------------------------------------------------
alter table public.job_applications
  add column if not exists status text not null default 'submitted',
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists cover_letter text null,
  add column if not exists application_answers jsonb not null default '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- Column-level UPDATE privileges (authenticated cannot UPDATE locked columns)
-- ---------------------------------------------------------------------------
revoke update on table public.job_applications from authenticated;
revoke update on table public.job_applications from anon;
revoke update on table public.job_applications from public;

-- Only columns the product update paths need. Match/consent/identity stay ungGranted.
grant update (
  status,
  updated_at,
  cover_letter,
  application_answers
) on table public.job_applications to authenticated;

notify pgrst, 'reload schema';

-- ===== 20260817115759_job_application_status_audit.sql =====
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

-- ===== 20260816_admin_rls_consistency.sql =====
-- Admin RLS consistency: one SECURITY DEFINER check, dashboard-scoped privileges.
-- Uses profiles.role via current_user_is_admin() — never JWT/user_metadata.
-- Admin policies are TO authenticated only (never anon / public).
-- Privileges match admin dashboard needs only (no broad INSERT/DELETE).

-- ---------------------------------------------------------------------------
-- Canonical admin check (idempotent)
-- ---------------------------------------------------------------------------
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

comment on function public.current_user_is_admin() is
  'True when auth.uid() has profiles.role = admin. SECURITY DEFINER; do not use JWT metadata.';

revoke all on function public.current_user_is_admin() from public;
revoke all on function public.current_user_is_admin() from anon;
grant execute on function public.current_user_is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- profiles — SELECT list/block queue; UPDATE is_blocked (AdminUsers / moderation)
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "admin_select_profiles" on public.profiles;
create policy "admin_select_profiles"
  on public.profiles
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "admin_update_profiles" on public.profiles;
create policy "admin_update_profiles"
  on public.profiles
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- ---------------------------------------------------------------------------
-- seeker_profiles — SELECT for users admin enrichment (was missing)
-- ---------------------------------------------------------------------------
alter table public.seeker_profiles enable row level security;

drop policy if exists "admin_select_seeker_profiles" on public.seeker_profiles;
create policy "admin_select_seeker_profiles"
  on public.seeker_profiles
  for select
  to authenticated
  using (public.current_user_is_admin());

-- ---------------------------------------------------------------------------
-- seeker_certificates — SELECT/UPDATE moderation queue
-- ---------------------------------------------------------------------------
alter table public.seeker_certificates enable row level security;

drop policy if exists "admin_select_seeker_certificates" on public.seeker_certificates;
create policy "admin_select_seeker_certificates"
  on public.seeker_certificates
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "admin_update_seeker_certificates" on public.seeker_certificates;
create policy "admin_update_seeker_certificates"
  on public.seeker_certificates
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- ---------------------------------------------------------------------------
-- employer_profiles — SELECT/UPDATE company verification
-- ---------------------------------------------------------------------------
alter table public.employer_profiles enable row level security;

drop policy if exists "admin_select_employer_profiles" on public.employer_profiles;
create policy "admin_select_employer_profiles"
  on public.employer_profiles
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "admin_update_employer_profiles" on public.employer_profiles;
create policy "admin_update_employer_profiles"
  on public.employer_profiles
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- ---------------------------------------------------------------------------
-- job_posts — SELECT/UPDATE/DELETE (AdminJobsTable + moderation hide/restore)
-- ---------------------------------------------------------------------------
alter table public.job_posts enable row level security;

drop policy if exists "admin_select_job_posts" on public.job_posts;
create policy "admin_select_job_posts"
  on public.job_posts
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "admin_update_job_posts" on public.job_posts;
create policy "admin_update_job_posts"
  on public.job_posts
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "admin_delete_job_posts" on public.job_posts;
create policy "admin_delete_job_posts"
  on public.job_posts
  for delete
  to authenticated
  using (public.current_user_is_admin());

-- ---------------------------------------------------------------------------
-- job_applications — SELECT only (no admin write in dashboard)
-- ---------------------------------------------------------------------------
alter table public.job_applications enable row level security;

drop policy if exists "admin_select_all_applications" on public.job_applications;
drop policy if exists "admin_select_job_applications" on public.job_applications;
create policy "admin_select_job_applications"
  on public.job_applications
  for select
  to authenticated
  using (public.current_user_is_admin());

-- ---------------------------------------------------------------------------
-- job_post_reports — SELECT/UPDATE moderation
-- Table is created in 20260816_job_post_reports (later in the 20260816_*
-- filename order). Skip if missing so a fresh apply does not abort here.
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.job_post_reports') is null then
    return;
  end if;

  execute 'alter table public.job_post_reports enable row level security';
  execute 'drop policy if exists "admin_select_job_post_reports" on public.job_post_reports';
  execute $p$
    create policy "admin_select_job_post_reports"
      on public.job_post_reports
      for select
      to authenticated
      using (public.current_user_is_admin())
  $p$;
  execute 'drop policy if exists "admin_update_job_post_reports" on public.job_post_reports';
  execute $p$
    create policy "admin_update_job_post_reports"
      on public.job_post_reports
      for update
      to authenticated
      using (public.current_user_is_admin())
      with check (public.current_user_is_admin())
  $p$;
end;
$$;

-- ---------------------------------------------------------------------------
-- admin_audit_log — SELECT + INSERT (append-only; actor_id must be self)
-- ---------------------------------------------------------------------------
alter table public.admin_audit_log enable row level security;

drop policy if exists "admin_select_admin_audit_log" on public.admin_audit_log;
create policy "admin_select_admin_audit_log"
  on public.admin_audit_log
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "admin_insert_admin_audit_log" on public.admin_audit_log;
create policy "admin_insert_admin_audit_log"
  on public.admin_audit_log
  for insert
  to authenticated
  with check (
    public.current_user_is_admin()
    and actor_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Privacy / deletion audit — SELECT only (skip if tables are absent)
-- ---------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.legal_retention_records') is not null then
    execute 'alter table public.legal_retention_records enable row level security';
    execute 'drop policy if exists "admin_select_legal_retention_records" on public.legal_retention_records';
    execute $p$
      create policy "admin_select_legal_retention_records"
        on public.legal_retention_records
        for select
        to authenticated
        using (public.current_user_is_admin())
    $p$;
  end if;

  if to_regclass('public.account_deletion_events') is not null then
    execute 'alter table public.account_deletion_events enable row level security';
    execute 'drop policy if exists "admin_select_account_deletion_events" on public.account_deletion_events';
    execute $p$
      create policy "admin_select_account_deletion_events"
        on public.account_deletion_events
        for select
        to authenticated
        using (public.current_user_is_admin())
    $p$;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Storage: certificates bucket — admin SELECT for review (no write)
-- ---------------------------------------------------------------------------
drop policy if exists "certificates_select_admin" on storage.objects;
create policy "certificates_select_admin"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'certificates'
    and public.current_user_is_admin()
  );

-- ---------------------------------------------------------------------------
-- Explicit: no admin policies on privacy-sensitive / employer-private tables
-- (seeker_work_capacity, seeker_workplace_needs, job_application_internal_notes,
--  seeker_certificates_verification_stash, auth_rate_limit_buckets).
-- Service role continues to bypass RLS for server workflows.
-- ---------------------------------------------------------------------------

notify pgrst, 'reload schema';

-- ===== 20260816_avatars_storage_security.sql =====
-- Harden Storage bucket `avatars` only (not certificates).
-- Product uses getPublicUrl → keep bucket public for display read.
-- Paths in app: `{auth.uid()}/avatar-…`, `{auth.uid()}/employer-logo/…`, `{auth.uid()}/cv/…`
-- Write: owner-only; first path segment must equal auth.uid() (blocks cross-user overwrite).

-- ---------------------------------------------------------------------------
-- Bucket: public read, constrained uploads
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  10485760, -- 10 MiB (covers compressed avatars/logos + PDF CVs in this bucket)
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf'
  ]::text[]
)
on conflict (id) do update
set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Drop known avatars-named policies only (never drop certificates_* or
-- generic all-bucket policies — certificates audit stays intact).
-- ---------------------------------------------------------------------------
drop policy if exists "Avatar images are publicly accessible" on storage.objects;
drop policy if exists "Anyone can upload an avatar" on storage.objects;
drop policy if exists "Anyone can update their own avatar" on storage.objects;
drop policy if exists "Anyone can delete their own avatar" on storage.objects;

drop policy if exists "avatars_select_public" on storage.objects;
drop policy if exists "avatars_insert_own" on storage.objects;
drop policy if exists "avatars_update_own" on storage.objects;
drop policy if exists "avatars_delete_own" on storage.objects;
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_upload_own" on storage.objects;

-- ---------------------------------------------------------------------------
-- SELECT: public read for display (bucket is public; policy covers API list/download)
-- ---------------------------------------------------------------------------
create policy "avatars_select_public"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'avatars');

-- ---------------------------------------------------------------------------
-- INSERT / UPDATE / DELETE: owner folder only (auth.uid() first path segment)
-- WITH CHECK on UPDATE prevents renaming/moving into another user's prefix.
-- ---------------------------------------------------------------------------
create policy "avatars_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

notify pgrst, 'reload schema';

-- ===== 20260818120000_blocked_user_write_guard.sql =====
-- Reject INSERT/UPDATE/DELETE from a blocked account's leftover JWT.
-- Does not add or relax RLS policies (OR-of-allow cannot express a global deny).
-- Service role (auth.uid() is null) and unblocked admins keep write access, including unblock.

create or replace function public.current_user_is_blocked()
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
      and p.is_blocked is true
  );
$$;

comment on function public.current_user_is_blocked() is
  'True when auth.uid() has profiles.is_blocked. SECURITY DEFINER; row_security off to avoid RLS recursion.';

revoke all on function public.current_user_is_blocked() from public;
revoke all on function public.current_user_is_blocked() from anon;
grant execute on function public.current_user_is_blocked() to authenticated;

create or replace function public.reject_blocked_user_dml()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- No JWT (service role / system) may write; admin unblock uses the admin's JWT, not the target's.
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  if public.current_user_is_blocked() then
    raise exception 'account_blocked'
      using errcode = '42501';
  end if;

  return coalesce(new, old);
end;
$$;

comment on function public.reject_blocked_user_dml() is
  'BEFORE INSERT/UPDATE/DELETE: blocked JWTs cannot mutate user-writable rows.';

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles',
    'seeker_profiles',
    'seeker_certificates',
    'seeker_certificates_verification_stash',
    'seeker_workplace_needs',
    'seeker_work_capacity',
    'employer_profiles',
    'job_posts',
    'job_applications',
    'job_application_internal_notes',
    'job_application_status_events',
    'saved_jobs',
    'saved_job_searches',
    'job_post_reports'
  ]
  loop
    if to_regclass('public.' || t) is null then
      continue;
    end if;
    execute format('drop trigger if exists reject_blocked_user_dml_trg on public.%I', t);
    execute format(
      'create trigger reject_blocked_user_dml_trg before insert or update or delete on public.%I for each row execute function public.reject_blocked_user_dml()',
      t
    );
  end loop;
end $$;

-- Strengthen Storage write policies (AND, never OR). SELECT stays unchanged.
drop policy if exists "avatars_insert_own" on storage.objects;
create policy "avatars_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  );

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  );

drop policy if exists "certificates_insert_own" on storage.objects;
create policy "certificates_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  );

drop policy if exists "certificates_update_own" on storage.objects;
create policy "certificates_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  )
  with check (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  );

drop policy if exists "certificates_delete_own" on storage.objects;
create policy "certificates_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not public.current_user_is_blocked()
  );

notify pgrst, 'reload schema';

-- ===== 20260818140000_private_cv_resumes_storage.sql =====
-- Private Storage bucket for candidate CV PDFs.
-- Do NOT use the public `avatars` bucket for CVs.
-- DB column public.seeker_profiles.cv_url stores an object path
-- (e.g. `{user_id}/cv/{file}.pdf`) — never a permanent public URL.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  10485760, -- 10 MiB
  array['application/pdf']::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Object names: `{user_id}/cv/{filename}.pdf`

drop policy if exists "resumes_insert_own" on storage.objects;
create policy "resumes_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'cv'
    and not public.current_user_is_blocked()
  );

drop policy if exists "resumes_update_own" on storage.objects;
create policy "resumes_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'cv'
    and not public.current_user_is_blocked()
  )
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'cv'
    and not public.current_user_is_blocked()
  );

drop policy if exists "resumes_delete_own" on storage.objects;
create policy "resumes_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'cv'
    and not public.current_user_is_blocked()
  );

drop policy if exists "resumes_select_own" on storage.objects;
create policy "resumes_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin review of candidate CVs (moderation / support).
drop policy if exists "resumes_select_admin" on storage.objects;
create policy "resumes_select_admin"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'resumes'
    and public.current_user_is_admin()
  );

-- Employer may read only when the candidate applied to their job with share consent
-- and the application is not withdrawn (same product rule as private certificates).
drop policy if exists "resumes_select_employer_for_applicants" on storage.objects;
create policy "resumes_select_employer_for_applicants"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'resumes'
    and exists (
      select 1
      from public.job_applications ja
      join public.job_posts jp on jp.id = ja.job_post_id
      join public.employer_profiles ep on ep.id = jp.employer_profile_id
      where ja.seeker_user_id::text = (storage.foldername(name))[1]
        and ep.owner_user_id = auth.uid()
        and ja.consent_to_share = true
        and coalesce(ja.status, '') is distinct from 'withdrawn'
    )
  );

-- Avatars stay public for profile photos and employer logos. No public PDFs.
update storage.buckets
set
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]::text[],
  file_size_limit = 10485760
where id = 'avatars';

comment on column public.seeker_profiles.cv_url is
  'Private Storage object path in bucket `resumes` (e.g. user_id/cv/file.pdf). Never a permanent public URL; use short-lived signed URLs for access.';

notify pgrst, 'reload schema';

-- Re-assert avatars MIME after 20260816_avatars_storage_security (no public PDFs).
update storage.buckets
set
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif']::text[],
  file_size_limit = 10485760
where id = 'avatars';

notify pgrst, 'reload schema';
