-- Schema/RLS reconciliation part 1 of 3.
-- Catch-up for remotes that never applied 20260816_* product tables/columns.
-- Idempotent: CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS / DROP POLICY IF EXISTS.
-- Safe with existing rows. Does not drop tables or delete data.
-- Canonical sources remain the original 20260816_* files; this re-applies them for lagging remotes.


-- ===== 20260816_profiles_legal_acceptance.sql =====
-- Legal acceptance fields captured at registration (terms + privacy only).

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists privacy_version text;

comment on column public.profiles.terms_accepted_at is
  'When the user accepted terms + privacy at registration (no marketing consent).';
comment on column public.profiles.terms_version is
  'Accepted terms document version (ISO date from legal lastUpdated).';
comment on column public.profiles.privacy_version is
  'Accepted privacy policy version (ISO date from legal lastUpdated).';

notify pgrst, 'reload schema';

-- ===== 20260816_seeker_work_preferences.sql =====
-- Seeker work preferences (Töösoovid) for structured schedule/arrangement choices.

alter table public.seeker_profiles
  add column if not exists pref_full_time boolean not null default false,
  add column if not exists pref_part_time boolean not null default false,
  add column if not exists pref_desired_weekly_hours numeric,
  add column if not exists pref_min_weekly_hours numeric,
  add column if not exists pref_max_weekly_hours numeric,
  add column if not exists pref_day_work boolean not null default false,
  add column if not exists pref_evening_work boolean not null default false,
  add column if not exists pref_night_work boolean not null default false,
  add column if not exists pref_shift_work boolean not null default false,
  add column if not exists pref_weekend_work boolean not null default false,
  add column if not exists pref_flexible_hours boolean not null default false,
  add column if not exists pref_remote_work boolean not null default false,
  add column if not exists pref_hybrid_work boolean not null default false,
  add column if not exists pref_on_site_work boolean not null default false;

comment on column public.seeker_profiles.pref_full_time is 'Work preference: full-time load.';
comment on column public.seeker_profiles.pref_part_time is 'Work preference: part-time load.';
comment on column public.seeker_profiles.pref_desired_weekly_hours is 'Preferred weekly hours.';
comment on column public.seeker_profiles.pref_min_weekly_hours is 'Minimum acceptable weekly hours.';
comment on column public.seeker_profiles.pref_max_weekly_hours is 'Maximum acceptable weekly hours.';

notify pgrst, 'reload schema';

-- ===== 20260816_seeker_experience_background.sql =====
-- Seeker experience background flags + duration (for entry / “experience not required” matching).

alter table public.seeker_profiles
  add column if not exists exp_seeking_first_job boolean not null default false,
  add column if not exists exp_is_student boolean not null default false,
  add column if not exists exp_has_internship boolean not null default false,
  add column if not exists exp_has_volunteer boolean not null default false,
  add column if not exists exp_has_project boolean not null default false,
  add column if not exists exp_has_prior_work boolean not null default false,
  add column if not exists experience_duration_years numeric;

comment on column public.seeker_profiles.exp_seeking_first_job is
  'Seeker marks they are looking for a first job. 0 years must not be treated as a weak candidate for entry / experience-not-required roles.';
comment on column public.seeker_profiles.experience_duration_years is
  'Self-reported experience duration in years (0 allowed). Separate from experience_level.';

notify pgrst, 'reload schema';

-- ===== 20260816_job_posts_salary_structure.sql =====
-- Structured salary fields for job posts (required on publish).

alter table public.job_posts
  add column if not exists salary_mode text,
  add column if not exists salary_tax text,
  add column if not exists salary_period text;

alter table public.job_posts
  alter column salary_tax set default 'bruto',
  alter column salary_period set default 'month';

comment on column public.job_posts.salary_mode is
  'fixed | range — how salary_min/salary_max should be read.';
comment on column public.job_posts.salary_tax is
  'bruto | neto — tax basis for posted salary (default bruto).';
comment on column public.job_posts.salary_period is
  'month | hour — pay period for posted salary (default month).';

notify pgrst, 'reload schema';

-- ===== 20260816_job_posts_work_conditions.sql =====
-- Structured work-condition fields for minor employment eligibility checks.

alter table public.job_posts
  add column if not exists weekly_hours numeric,
  add column if not exists daily_hours numeric,
  add column if not exists shift_start time,
  add column if not exists shift_end time,
  add column if not exists includes_night_work boolean not null default false,
  add column if not exists is_hazardous_work boolean not null default false;

comment on column public.job_posts.weekly_hours is
  'Typical weekly hours for the role (used by minor work eligibility).';
comment on column public.job_posts.daily_hours is
  'Typical workday length in hours (used by minor work eligibility).';
comment on column public.job_posts.shift_start is
  'Typical shift start time.';
comment on column public.job_posts.shift_end is
  'Typical shift end time.';
comment on column public.job_posts.includes_night_work is
  'Employer-declared night work (or evening/night shifts).';
comment on column public.job_posts.is_hazardous_work is
  'Employer-declared hazardous / restricted-nature work for minor eligibility.';

notify pgrst, 'reload schema';

-- ===== 20260816_job_requirements_priority.sql =====
-- Structured job requirements with mandatory / recommended priority.
-- Matching still uses requirement_lines; priority is reserved for a future weight pass.

alter table public.job_posts
  add column if not exists job_requirements jsonb not null default '[]'::jsonb;

comment on column public.job_posts.job_requirements is
  'Array of { text, priority: mandatory|recommended }. Synced to requirement_lines. Matching weights mandatory > recommended.';

-- Backfill from existing requirement_lines (legacy rows → mandatory).
update public.job_posts
set job_requirements = coalesce(
  (
    select jsonb_agg(
      jsonb_build_object('text', trim(line), 'priority', 'mandatory')
      order by ord
    )
    from unnest(coalesce(requirement_lines, array[]::text[])) with ordinality as t(line, ord)
    where length(trim(line)) > 0
  ),
  '[]'::jsonb
)
where coalesce(jsonb_array_length(job_requirements), 0) = 0
  and coalesce(array_length(requirement_lines, 1), 0) > 0;

notify pgrst, 'reload schema';

-- ===== 20260816_job_suitable_for_ages_16_17.sql =====
-- Flag: employer asserts job may suit ages 16–17; must pass employment-rules checks on save.

alter table public.job_posts
  add column if not exists suitable_for_ages_16_17 boolean not null default false;

comment on column public.job_posts.suitable_for_ages_16_17 is
  'Derived cache from employment-rules pre-check (hours/shifts/nature). Never a manual employer toggle; public badge recomputes from work conditions.';

notify pgrst, 'reload schema';

-- ===== 20260816_seeker_workplace_needs.sql =====
-- Private workplace arrangement / accommodation needs (not on public seeker profile).
-- Employers never get a direct SELECT policy; only opted-in items may be copied into application shared_profile.

create table if not exists public.seeker_workplace_needs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  accessible_workplace boolean not null default false,
  flexible_hours boolean not null default false,
  extra_breaks boolean not null default false,
  adapted_tools boolean not null default false,
  adapted_arrangement boolean not null default false,
  remote_option boolean not null default false,
  other_need boolean not null default false,
  other_note text,
  -- Keys the seeker opts to show employers on apply (subset of selected needs only).
  shared_with_employer text[] not null default '{}'::text[],
  updated_at timestamptz not null default now(),
  constraint seeker_workplace_needs_other_note_len check (
    other_note is null or char_length(other_note) <= 500
  ),
  constraint seeker_workplace_needs_shared_keys_check check (
    shared_with_employer <@ array[
      'accessible_workplace',
      'flexible_hours',
      'extra_breaks',
      'adapted_tools',
      'adapted_arrangement',
      'remote_option',
      'other_need'
    ]::text[]
  )
);

comment on table public.seeker_workplace_needs is
  'Private practical workplace needs. No diagnosis/medical history. Not part of public discovery profile.';
comment on column public.seeker_workplace_needs.shared_with_employer is
  'Which selected need keys the seeker allows employers to see (via application snapshot only).';
comment on column public.seeker_workplace_needs.other_note is
  'Short practical note for “other need” — must not contain diagnosis or medical history.';

alter table public.seeker_workplace_needs enable row level security;

drop policy if exists "seeker_workplace_needs_select_own" on public.seeker_workplace_needs;
create policy "seeker_workplace_needs_select_own"
on public.seeker_workplace_needs for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "seeker_workplace_needs_insert_own" on public.seeker_workplace_needs;
create policy "seeker_workplace_needs_insert_own"
on public.seeker_workplace_needs for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "seeker_workplace_needs_update_own" on public.seeker_workplace_needs;
create policy "seeker_workplace_needs_update_own"
on public.seeker_workplace_needs for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "seeker_workplace_needs_delete_own" on public.seeker_workplace_needs;
create policy "seeker_workplace_needs_delete_own"
on public.seeker_workplace_needs for delete to authenticated
using (auth.uid() = user_id);

notify pgrst, 'reload schema';

-- ===== 20260816_seeker_work_capacity.sql =====
-- Private voluntary work-capacity status. Never readable by employers via RLS.
-- Must not be used for matching scores or employer discovery filters.

create table if not exists public.seeker_work_capacity (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'prefer_not_to_say'
    check (status in ('prefer_not_to_say', 'partial', 'absent')),
  updated_at timestamptz not null default now()
);

comment on table public.seeker_work_capacity is
  'Private voluntary work-capacity status. Owner-only RLS. Not for employers, matching, or discovery filters. No diagnosis/medical history.';
comment on column public.seeker_work_capacity.status is
  'prefer_not_to_say | partial | absent. Never expose to employers by default.';

alter table public.seeker_work_capacity enable row level security;

drop policy if exists "seeker_work_capacity_select_own" on public.seeker_work_capacity;
create policy "seeker_work_capacity_select_own"
on public.seeker_work_capacity for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "seeker_work_capacity_insert_own" on public.seeker_work_capacity;
create policy "seeker_work_capacity_insert_own"
on public.seeker_work_capacity for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "seeker_work_capacity_update_own" on public.seeker_work_capacity;
create policy "seeker_work_capacity_update_own"
on public.seeker_work_capacity for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "seeker_work_capacity_delete_own" on public.seeker_work_capacity;
create policy "seeker_work_capacity_delete_own"
on public.seeker_work_capacity for delete to authenticated
using (auth.uid() = user_id);

-- Master opt-in: share practical workplace needs with employers (never work-capacity status).
alter table public.seeker_workplace_needs
  add column if not exists share_practical_needs_with_employer boolean not null default false;

comment on column public.seeker_workplace_needs.share_practical_needs_with_employer is
  'When true, only opted-in practical workplace need keys may be copied into application shared_profile. Work-capacity status is never included.';

notify pgrst, 'reload schema';

-- ===== 20260816_employer_candidate_discovery_filters.sql =====
-- Discovery-safe practical flags + languages for employer candidate filters.
-- Never expose disability / diagnosis / health / work-capacity.

alter table public.seeker_profiles
  add column if not exists languages text[] not null default '{}'::text[],
  add column if not exists discovery_accessible_workplace boolean not null default false,
  add column if not exists discovery_adapted_arrangement boolean not null default false;

comment on column public.seeker_profiles.languages is
  'Spoken/work languages for matching and employer discovery filters.';
comment on column public.seeker_profiles.discovery_accessible_workplace is
  'True when seeker opted to share accessible_workplace practical need for discovery. Not medical data.';
comment on column public.seeker_profiles.discovery_adapted_arrangement is
  'True when seeker opted to share adapted_arrangement practical need for discovery. Not medical data.';

-- Sync discovery flags from private workplace needs (opt-in share only).
create or replace function public.sync_seeker_discovery_workplace_flags()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  share_on boolean;
  shared text[];
  accessible boolean;
  adapted boolean;
begin
  share_on := coalesce(new.share_practical_needs_with_employer, false);
  shared := coalesce(new.shared_with_employer, '{}'::text[]);

  accessible :=
    share_on
    and coalesce(new.accessible_workplace, false)
    and ('accessible_workplace' = any (shared));

  adapted :=
    share_on
    and coalesce(new.adapted_arrangement, false)
    and ('adapted_arrangement' = any (shared));

  update public.seeker_profiles
  set
    discovery_accessible_workplace = accessible,
    discovery_adapted_arrangement = adapted
  where user_id = new.user_id;

  return new;
end;
$$;

drop trigger if exists seeker_workplace_needs_sync_discovery_trg on public.seeker_workplace_needs;
create trigger seeker_workplace_needs_sync_discovery_trg
after insert or update of
  accessible_workplace,
  adapted_arrangement,
  shared_with_employer,
  share_practical_needs_with_employer
on public.seeker_workplace_needs
for each row
execute function public.sync_seeker_discovery_workplace_flags();

-- Backfill from existing opted-in needs (if table/column exist).
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'seeker_workplace_needs'
      and column_name = 'share_practical_needs_with_employer'
  ) then
    update public.seeker_profiles sp
    set
      discovery_accessible_workplace = (
        coalesce(wn.share_practical_needs_with_employer, false)
        and coalesce(wn.accessible_workplace, false)
        and ('accessible_workplace' = any (coalesce(wn.shared_with_employer, '{}'::text[])))
      ),
      discovery_adapted_arrangement = (
        coalesce(wn.share_practical_needs_with_employer, false)
        and coalesce(wn.adapted_arrangement, false)
        and ('adapted_arrangement' = any (coalesce(wn.shared_with_employer, '{}'::text[])))
      )
    from public.seeker_workplace_needs wn
    where wn.user_id = sp.user_id;
  end if;
end $$;

-- Employers may read discoverable (visible) seeker summary rows for candidate search.
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

notify pgrst, 'reload schema';

-- ===== 20260816_discovery_extra_breaks.sql =====
-- Practical discovery flag: extra breaks (opt-in share only).
-- Employer filters work conditions — never health / disability / work-capacity.

alter table public.seeker_profiles
  add column if not exists discovery_extra_breaks boolean not null default false;

comment on column public.seeker_profiles.discovery_extra_breaks is
  'True when seeker opted to share extra_breaks practical workplace need for discovery. Not medical data.';

create or replace function public.sync_seeker_discovery_workplace_flags()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  share_on boolean;
  shared text[];
  accessible boolean;
  adapted boolean;
  extra_breaks boolean;
begin
  share_on := coalesce(new.share_practical_needs_with_employer, false);
  shared := coalesce(new.shared_with_employer, '{}'::text[]);

  accessible :=
    share_on
    and coalesce(new.accessible_workplace, false)
    and ('accessible_workplace' = any (shared));

  adapted :=
    share_on
    and coalesce(new.adapted_arrangement, false)
    and ('adapted_arrangement' = any (shared));

  extra_breaks :=
    share_on
    and coalesce(new.extra_breaks, false)
    and ('extra_breaks' = any (shared));

  update public.seeker_profiles
  set
    discovery_accessible_workplace = accessible,
    discovery_adapted_arrangement = adapted,
    discovery_extra_breaks = extra_breaks
  where user_id = new.user_id;

  return new;
end;
$$;

drop trigger if exists seeker_workplace_needs_sync_discovery_trg on public.seeker_workplace_needs;
create trigger seeker_workplace_needs_sync_discovery_trg
after insert or update of
  accessible_workplace,
  adapted_arrangement,
  extra_breaks,
  shared_with_employer,
  share_practical_needs_with_employer
on public.seeker_workplace_needs
for each row
execute function public.sync_seeker_discovery_workplace_flags();

-- Backfill
update public.seeker_profiles sp
set discovery_extra_breaks = (
  coalesce(wn.share_practical_needs_with_employer, false)
  and coalesce(wn.extra_breaks, false)
  and ('extra_breaks' = any (coalesce(wn.shared_with_employer, '{}'::text[])))
)
from public.seeker_workplace_needs wn
where wn.user_id = sp.user_id;

notify pgrst, 'reload schema';

-- ===== 20260816_job_application_internal_notes.sql =====
-- Private employer-only notes on a job application.
-- Kept in a separate table so seekers (who can SELECT their own job_applications)
-- never receive these notes via RLS or API selects.

create table if not exists public.job_application_internal_notes (
  application_id uuid primary key
    references public.job_applications (id) on delete cascade,
  note_text text not null default '',
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_application_internal_notes_note_len
    check (char_length(note_text) <= 8000)
);

comment on table public.job_application_internal_notes is
  'Employer-private hiring notes for a job application. Not visible to seekers or other employers.';

comment on column public.job_application_internal_notes.note_text is
  'Internal note body; company owner only.';

create index if not exists job_application_internal_notes_updated_at_idx
  on public.job_application_internal_notes (updated_at desc);

alter table public.job_application_internal_notes enable row level security;

-- Deny by default: no SELECT/INSERT/UPDATE/DELETE for anon or seekers.
-- Only the employer profile owner for the job that owns the application.

drop policy if exists "employer_select_internal_notes_for_own_jobs"
  on public.job_application_internal_notes;
create policy "employer_select_internal_notes_for_own_jobs"
on public.job_application_internal_notes
for select
to authenticated
using (
  exists (
    select 1
    from public.job_applications ja
    join public.job_posts jp on jp.id = ja.job_post_id
    join public.employer_profiles ep on ep.id = jp.employer_profile_id
    where ja.id = job_application_internal_notes.application_id
      and ep.owner_user_id = auth.uid()
  )
);

drop policy if exists "employer_insert_internal_notes_for_own_jobs"
  on public.job_application_internal_notes;
create policy "employer_insert_internal_notes_for_own_jobs"
on public.job_application_internal_notes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.job_applications ja
    join public.job_posts jp on jp.id = ja.job_post_id
    join public.employer_profiles ep on ep.id = jp.employer_profile_id
    where ja.id = job_application_internal_notes.application_id
      and ep.owner_user_id = auth.uid()
  )
);

drop policy if exists "employer_update_internal_notes_for_own_jobs"
  on public.job_application_internal_notes;
create policy "employer_update_internal_notes_for_own_jobs"
on public.job_application_internal_notes
for update
to authenticated
using (
  exists (
    select 1
    from public.job_applications ja
    join public.job_posts jp on jp.id = ja.job_post_id
    join public.employer_profiles ep on ep.id = jp.employer_profile_id
    where ja.id = job_application_internal_notes.application_id
      and ep.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.job_applications ja
    join public.job_posts jp on jp.id = ja.job_post_id
    join public.employer_profiles ep on ep.id = jp.employer_profile_id
    where ja.id = job_application_internal_notes.application_id
      and ep.owner_user_id = auth.uid()
  )
);

drop policy if exists "employer_delete_internal_notes_for_own_jobs"
  on public.job_application_internal_notes;
create policy "employer_delete_internal_notes_for_own_jobs"
on public.job_application_internal_notes
for delete
to authenticated
using (
  exists (
    select 1
    from public.job_applications ja
    join public.job_posts jp on jp.id = ja.job_post_id
    join public.employer_profiles ep on ep.id = jp.employer_profile_id
    where ja.id = job_application_internal_notes.application_id
      and ep.owner_user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';

-- ===== 20260816_job_post_reports.sql =====
-- Public job post reports for admin moderation.
-- Reporters may INSERT only; they never SELECT (so they never see admin_notes).

create table if not exists public.job_post_reports (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid not null references public.job_posts (id) on delete cascade,
  reporter_user_id uuid null references auth.users (id) on delete set null,
  reason text not null
    check (reason in (
      'fraud_suspicious',
      'wrong_company',
      'discriminatory',
      'illegal_work',
      'misleading_info',
      'other'
    )),
  details text null,
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  -- Admin-only field. Reporters have no SELECT on this table.
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users (id) on delete set null,
  constraint job_post_reports_details_len check (
    details is null or char_length(details) <= 2000
  ),
  constraint job_post_reports_admin_notes_len check (
    char_length(admin_notes) <= 8000
  )
);

comment on table public.job_post_reports is
  'Reports of public job posts for admin review. Reporters insert only; admin_notes never exposed to reporters.';
comment on column public.job_post_reports.admin_notes is
  'Internal admin notes. Not visible to the reporter (no reporter SELECT policy).';
comment on column public.job_post_reports.reason is
  'fraud_suspicious | wrong_company | discriminatory | illegal_work | misleading_info | other';

create index if not exists job_post_reports_job_post_id_idx
  on public.job_post_reports (job_post_id);
create index if not exists job_post_reports_status_created_idx
  on public.job_post_reports (status, created_at desc);

alter table public.job_post_reports enable row level security;

-- Anyone (incl. anon) may file a report against a published job.
drop policy if exists "anyone_insert_job_post_report" on public.job_post_reports;
create policy "anyone_insert_job_post_report"
on public.job_post_reports
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.job_posts jp
    where jp.id = job_post_id
      and (jp.status)::text = 'published'
  )
  and (admin_notes = '' or admin_notes is null)
  and status = 'open'
  and reviewed_at is null
  and reviewed_by is null
  and (
    reporter_user_id is null
    or reporter_user_id = auth.uid()
  )
);

-- Admins may read all reports (including admin_notes).
drop policy if exists "admin_select_job_post_reports" on public.job_post_reports;
create policy "admin_select_job_post_reports"
on public.job_post_reports
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Admins may update status / notes.
drop policy if exists "admin_update_job_post_reports" on public.job_post_reports;
create policy "admin_update_job_post_reports"
on public.job_post_reports
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

notify pgrst, 'reload schema';

-- ===== 20260816_account_privacy_deletion.sql =====
-- Legal retention + account deletion audit (separate from live personal data).
-- Retained payloads must be anonymised — no emails, names, or raw user ids.

create table if not exists public.legal_retention_records (
  id uuid primary key default gen_random_uuid(),
  -- Opaque key derived from former account (sha256 hex). Not reversible to PII alone.
  retention_subject_key text not null,
  category text not null
    check (category in (
      'dispute_resolution',
      'security_audit',
      'legal_obligation'
    )),
  -- Anonymised facts only. Manage retention windows per category via retain_until.
  payload jsonb not null default '{}'::jsonb,
  retain_until timestamptz null,
  created_at timestamptz not null default now(),
  source_account_deleted_at timestamptz not null default now()
);

create index if not exists legal_retention_records_category_until_idx
  on public.legal_retention_records (category, retain_until);

create index if not exists legal_retention_records_subject_idx
  on public.legal_retention_records (retention_subject_key);

comment on table public.legal_retention_records is
  'Anonymised records kept after account deletion where law or dispute resolution requires. Managed separately from live profiles.';
comment on column public.legal_retention_records.category is
  'dispute_resolution | security_audit | legal_obligation — separate lifecycle per category.';
comment on column public.legal_retention_records.payload is
  'Anonymised JSON only — never store email, name, phone, or raw auth user id.';

create table if not exists public.account_deletion_events (
  id uuid primary key default gen_random_uuid(),
  retention_subject_key text not null,
  role text null,
  status text not null default 'completed'
    check (status in ('completed', 'failed')),
  erased_categories text[] not null default '{}',
  retained_categories text[] not null default '{}',
  error_message text null,
  created_at timestamptz not null default now()
);

create index if not exists account_deletion_events_created_idx
  on public.account_deletion_events (created_at desc);

comment on table public.account_deletion_events is
  'Audit log of account deletion / anonymisation workflows. No PII.';

alter table public.legal_retention_records enable row level security;
alter table public.account_deletion_events enable row level security;

-- No policies for anon/authenticated: only service role / admin bypasses RLS.
-- Explicit admin read for moderation tools later.
drop policy if exists "admin_select_legal_retention_records" on public.legal_retention_records;
create policy "admin_select_legal_retention_records"
on public.legal_retention_records
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "admin_select_account_deletion_events" on public.account_deletion_events;
create policy "admin_select_account_deletion_events"
on public.account_deletion_events
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

notify pgrst, 'reload schema';
