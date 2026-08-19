-- Optional structured seeker education history.
-- Not required for profile completeness. No matching weights in this change.
-- Writes: owner seeker only. Reads: owner, discoverable-profile employers,
-- consented applicants' employers, admins. Repeat-safe.

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;
grant usage on schema private to postgres;

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

create table if not exists public.seeker_education (
  id uuid primary key default gen_random_uuid(),
  seeker_user_id uuid not null references auth.users (id) on delete cascade,
  institution text not null,
  field_of_study text,
  degree_or_level text not null,
  start_year integer not null,
  end_year integer,
  currently_studying boolean not null default false,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seeker_education_institution_len check (
    char_length(btrim(institution)) >= 2 and char_length(institution) <= 120
  ),
  constraint seeker_education_field_len check (
    field_of_study is null or char_length(field_of_study) <= 120
  ),
  constraint seeker_education_description_len check (
    description is null or char_length(description) <= 400
  ),
  constraint seeker_education_degree_check check (
    degree_or_level in (
      'basic',
      'vocational',
      'secondary',
      'vocational_secondary',
      'applied_higher',
      'bachelor',
      'master',
      'doctoral',
      'other'
    )
  ),
  constraint seeker_education_start_year_check check (start_year >= 1950 and start_year <= 2100),
  constraint seeker_education_end_year_check check (
    end_year is null or (end_year >= 1950 and end_year <= 2100)
  ),
  constraint seeker_education_year_order check (end_year is null or start_year <= end_year),
  constraint seeker_education_current_no_end check (not currently_studying or end_year is null)
);

create index if not exists seeker_education_seeker_year_idx
  on public.seeker_education (seeker_user_id, start_year desc);

comment on table public.seeker_education is
  'Optional seeker education history. Not required. Not used in match scoring yet.';
comment on column public.seeker_education.seeker_user_id is
  'Auth user id of the seeker who owns this row.';
comment on column public.seeker_education.degree_or_level is
  'Controlled vocabulary: Estonian-friendly levels plus other for international use.';
comment on column public.seeker_education.start_year is
  'First calendar year of the programme.';
comment on column public.seeker_education.end_year is
  'Last calendar year, or null while currently_studying.';

create or replace function private.seeker_education_touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.seeker_education_touch_updated_at() from public;
revoke all on function private.seeker_education_touch_updated_at() from anon, authenticated;

drop trigger if exists seeker_education_touch_updated_at_trg on public.seeker_education;
create trigger seeker_education_touch_updated_at_trg
  before update on public.seeker_education
  for each row
  execute function private.seeker_education_touch_updated_at();

alter table public.seeker_education enable row level security;

drop policy if exists "seeker_education_select_own" on public.seeker_education;
create policy "seeker_education_select_own"
  on public.seeker_education
  for select
  to authenticated
  using (seeker_user_id = auth.uid());

drop policy if exists "seeker_education_insert_own" on public.seeker_education;
create policy "seeker_education_insert_own"
  on public.seeker_education
  for insert
  to authenticated
  with check (
    seeker_user_id = auth.uid()
    and public.current_user_is_seeker()
  );

drop policy if exists "seeker_education_update_own" on public.seeker_education;
create policy "seeker_education_update_own"
  on public.seeker_education
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

drop policy if exists "seeker_education_delete_own" on public.seeker_education;
create policy "seeker_education_delete_own"
  on public.seeker_education
  for delete
  to authenticated
  using (
    seeker_user_id = auth.uid()
    and public.current_user_is_seeker()
  );

drop policy if exists "employer_select_discoverable_seeker_education" on public.seeker_education;
create policy "employer_select_discoverable_seeker_education"
  on public.seeker_education
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.seeker_profiles sp
      join public.employer_profiles ep on ep.owner_user_id = auth.uid()
      where sp.user_id = seeker_education.seeker_user_id
        and sp.profile_visible = true
    )
  );

drop policy if exists "employer_select_applicant_seeker_education" on public.seeker_education;
create policy "employer_select_applicant_seeker_education"
  on public.seeker_education
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.job_applications ja
      join public.job_posts jp on jp.id = ja.job_post_id
      join public.employer_profiles ep on ep.id = jp.employer_profile_id
      where ja.seeker_user_id = seeker_education.seeker_user_id
        and ep.owner_user_id = auth.uid()
        and ja.consent_to_share = true
        and coalesce(ja.status, '') is distinct from 'withdrawn'
    )
  );

drop policy if exists "admin_select_seeker_education" on public.seeker_education;
create policy "admin_select_seeker_education"
  on public.seeker_education
  for select
  to authenticated
  using (public.current_user_is_admin());

revoke all on table public.seeker_education from public;
revoke all on table public.seeker_education from anon;
revoke all on table public.seeker_education from authenticated;
grant select, insert, update, delete on table public.seeker_education to authenticated;
grant all on table public.seeker_education to service_role;

-- Blocked accounts cannot mutate education rows.
do $$
begin
  if to_regclass('public.seeker_education') is null then
    return;
  end if;
  if to_regprocedure('public.reject_blocked_user_dml()') is null then
    return;
  end if;
  drop trigger if exists reject_blocked_user_dml_trg on public.seeker_education;
  create trigger reject_blocked_user_dml_trg
    before insert or update or delete on public.seeker_education
    for each row
    execute function public.reject_blocked_user_dml();
end $$;

notify pgrst, 'reload schema';
