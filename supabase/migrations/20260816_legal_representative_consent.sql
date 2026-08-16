-- Legal representative consent status for minor seekers (prep for future digital workflow).
-- Do not expose guardian PII or detailed consent payloads to employers.

alter table public.seeker_profiles
  add column if not exists legal_representative_consent_status text,
  add column if not exists legal_representative_consent_updated_at timestamptz,
  add column if not exists legal_representative_consent_workflow_id text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'seeker_profiles_legal_representative_consent_status_check'
  ) then
    alter table public.seeker_profiles
      add constraint seeker_profiles_legal_representative_consent_status_check
      check (
        legal_representative_consent_status is null
        or legal_representative_consent_status in ('required', 'pending', 'confirmed')
      );
  end if;
end $$;

comment on column public.seeker_profiles.legal_representative_consent_status is
  'Minor-only: required | pending | confirmed. confirmed is reserved for a future digital consent workflow — not a self-serve checkbox.';
comment on column public.seeker_profiles.legal_representative_consent_updated_at is
  'When consent status last changed (system / future workflow).';
comment on column public.seeker_profiles.legal_representative_consent_workflow_id is
  'Optional id for a future digital consent workflow. Private — never show to employers.';

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
    -- Seekers must not self-mark confirmed; reserved for future digital workflow.
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

-- Backfill minors missing a consent status.
update public.seeker_profiles
set legal_representative_consent_status = 'required'
where is_minor = true
  and legal_representative_consent_status is null;

notify pgrst, 'reload schema';
