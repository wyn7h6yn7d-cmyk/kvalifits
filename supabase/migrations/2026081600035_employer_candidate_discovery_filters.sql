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
