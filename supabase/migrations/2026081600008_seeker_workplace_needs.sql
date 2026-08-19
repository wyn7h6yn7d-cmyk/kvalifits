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
