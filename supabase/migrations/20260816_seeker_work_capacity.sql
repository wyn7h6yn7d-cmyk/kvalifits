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
