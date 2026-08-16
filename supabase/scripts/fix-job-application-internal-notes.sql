-- Fixes: employer-private notes on job applications (RLS-isolated table).
-- Run in Supabase SQL Editor if notes fail to load/save.

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

alter table public.job_application_internal_notes enable row level security;

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
