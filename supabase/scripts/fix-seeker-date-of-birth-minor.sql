-- Fixes: missing seeker age / minor columns on seeker_profiles.
-- Run once in Supabase SQL Editor if sünnikuupäev / alaealine fields fail to save.

alter table public.seeker_profiles
  add column if not exists date_of_birth date,
  add column if not exists is_minor boolean not null default false,
  add column if not exists learning_obligation_status text,
  add column if not exists minor_age_band text,
  add column if not exists parental_consent_required boolean not null default false,
  add column if not exists night_work_restricted boolean not null default false,
  add column if not exists hazardous_work_restricted boolean not null default false;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'seeker_profiles_learning_obligation_status_check'
  ) then
    alter table public.seeker_profiles
      add constraint seeker_profiles_learning_obligation_status_check
      check (
        learning_obligation_status is null
        or learning_obligation_status in ('subject_to', 'not_subject_to')
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'seeker_profiles_minor_age_band_check'
  ) then
    alter table public.seeker_profiles
      add constraint seeker_profiles_minor_age_band_check
      check (
        minor_age_band is null
        or minor_age_band in ('under_15', 'age_15', 'age_16_17')
      );
  end if;
end $$;

create or replace function public.seeker_profiles_apply_age_fields()
returns trigger
language plpgsql
as $$
declare
  age_years integer;
begin
  if new.date_of_birth is null then
    new.is_minor := false;
    new.minor_age_band := null;
    new.learning_obligation_status := null;
    new.parental_consent_required := false;
    new.night_work_restricted := false;
    new.hazardous_work_restricted := false;
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

  return new;
end;
$$;

drop trigger if exists seeker_profiles_apply_age_fields_trg on public.seeker_profiles;
create trigger seeker_profiles_apply_age_fields_trg
before insert or update
on public.seeker_profiles
for each row
execute function public.seeker_profiles_apply_age_fields();

notify pgrst, 'reload schema';
