-- Legal retention + account deletion audit (separate from live personal data).
-- Retained payloads must be anonymised — no emails, names, or raw user ids.

create table if not exists public.legal_retention_records (
  id uuid primary key default gen_random_uuid(),
  -- Opaque key derived from former account (sha256 hex). Not reversible to PII alone.
  retention_subject_key text not null,
  category text not null
    check (category in (
      'dispute_resolution',
      'security_audit',
      'legal_obligation'
    )),
  -- Anonymised facts only. Manage retention windows per category via retain_until.
  payload jsonb not null default '{}'::jsonb,
  retain_until timestamptz null,
  created_at timestamptz not null default now(),
  source_account_deleted_at timestamptz not null default now()
);

create index if not exists legal_retention_records_category_until_idx
  on public.legal_retention_records (category, retain_until);

create index if not exists legal_retention_records_subject_idx
  on public.legal_retention_records (retention_subject_key);

comment on table public.legal_retention_records is
  'Anonymised records kept after account deletion where law or dispute resolution requires. Managed separately from live profiles.';
comment on column public.legal_retention_records.category is
  'dispute_resolution | security_audit | legal_obligation — separate lifecycle per category.';
comment on column public.legal_retention_records.payload is
  'Anonymised JSON only — never store email, name, phone, or raw auth user id.';

create table if not exists public.account_deletion_events (
  id uuid primary key default gen_random_uuid(),
  retention_subject_key text not null,
  role text null,
  status text not null default 'completed'
    check (status in ('completed', 'failed')),
  erased_categories text[] not null default '{}',
  retained_categories text[] not null default '{}',
  error_message text null,
  created_at timestamptz not null default now()
);

create index if not exists account_deletion_events_created_idx
  on public.account_deletion_events (created_at desc);

comment on table public.account_deletion_events is
  'Audit log of account deletion / anonymisation workflows. No PII.';

alter table public.legal_retention_records enable row level security;
alter table public.account_deletion_events enable row level security;

-- No policies for anon/authenticated: only service role / admin bypasses RLS.
-- Explicit admin read for moderation tools later.
drop policy if exists "admin_select_legal_retention_records" on public.legal_retention_records;
create policy "admin_select_legal_retention_records"
on public.legal_retention_records
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

drop policy if exists "admin_select_account_deletion_events" on public.account_deletion_events;
create policy "admin_select_account_deletion_events"
on public.account_deletion_events
for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

notify pgrst, 'reload schema';
