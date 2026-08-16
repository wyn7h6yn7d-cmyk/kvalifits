-- Fixes: languages + discovery workplace flags for employer candidate filters.
-- Practical work-condition flags only — never health / disability / work-capacity.
-- Run in Supabase SQL Editor if filters cannot read these columns.

alter table public.seeker_profiles
  add column if not exists languages text[] not null default '{}'::text[],
  add column if not exists discovery_accessible_workplace boolean not null default false,
  add column if not exists discovery_adapted_arrangement boolean not null default false,
  add column if not exists discovery_extra_breaks boolean not null default false;

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

-- Backfill opted-in practical flags
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
      ),
      discovery_extra_breaks = (
        coalesce(wn.share_practical_needs_with_employer, false)
        and coalesce(wn.extra_breaks, false)
        and ('extra_breaks' = any (coalesce(wn.shared_with_employer, '{}'::text[])))
      )
    from public.seeker_workplace_needs wn
    where wn.user_id = sp.user_id;
  end if;
end $$;

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
