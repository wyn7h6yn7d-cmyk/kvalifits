-- Idempotent: job_post_reports for public listing reports + admin review.
-- Run in Supabase SQL Editor if report submit / admin list fails.

create table if not exists public.job_post_reports (
  id uuid primary key default gen_random_uuid(),
  job_post_id uuid not null references public.job_posts (id) on delete cascade,
  reporter_user_id uuid null references auth.users (id) on delete set null,
  reason text not null
    check (reason in (
      'fraud_suspicious',
      'wrong_company',
      'discriminatory',
      'illegal_work',
      'misleading_info',
      'other'
    )),
  details text null,
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  admin_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz null,
  reviewed_by uuid null references auth.users (id) on delete set null,
  constraint job_post_reports_details_len check (
    details is null or char_length(details) <= 2000
  ),
  constraint job_post_reports_admin_notes_len check (
    char_length(admin_notes) <= 8000
  )
);

create index if not exists job_post_reports_job_post_id_idx
  on public.job_post_reports (job_post_id);
create index if not exists job_post_reports_status_created_idx
  on public.job_post_reports (status, created_at desc);

alter table public.job_post_reports enable row level security;

drop policy if exists "anyone_insert_job_post_report" on public.job_post_reports;
create policy "anyone_insert_job_post_report"
on public.job_post_reports
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.job_posts jp
    where jp.id = job_post_id
      and (jp.status)::text = 'published'
  )
  and (admin_notes = '' or admin_notes is null)
  and status = 'open'
  and reviewed_at is null
  and reviewed_by is null
  and (
    reporter_user_id is null
    or reporter_user_id = auth.uid()
  )
);

drop policy if exists "admin_select_job_post_reports" on public.job_post_reports;
create policy "admin_select_job_post_reports"
on public.job_post_reports
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "admin_update_job_post_reports" on public.job_post_reports;
create policy "admin_update_job_post_reports"
on public.job_post_reports
for update
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

notify pgrst, 'reload schema';
