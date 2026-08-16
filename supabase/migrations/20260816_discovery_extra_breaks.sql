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
