-- Fixes: private seeker_work_capacity + practical-needs share master flag.
-- Run in Supabase SQL Editor if töövõime / jagamise lüliti fails to save.

create table if not exists public.seeker_work_capacity (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'prefer_not_to_say'
    check (status in ('prefer_not_to_say', 'partial', 'absent')),
  updated_at timestamptz not null default now()
);

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

alter table public.seeker_workplace_needs
  add column if not exists share_practical_needs_with_employer boolean not null default false;

notify pgrst, 'reload schema';
