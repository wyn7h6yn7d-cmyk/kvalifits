-- Repair job_applications columns used by employer applicants UI + apply API.
-- Idempotent (IF NOT EXISTS). Fixes 500 when opening …/jobs/[id]/applicants.

alter table public.job_applications
  add column if not exists match_score smallint,
  add column if not exists match_breakdown jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'submitted',
  add column if not exists updated_at timestamptz not null default now();

comment on column public.job_applications.match_score is
  '0–100 suitability score at application time (or last recompute).';
comment on column public.job_applications.match_breakdown is
  'Structured sub-scores and counts for transparent UI.';

create index if not exists job_applications_job_score_idx
  on public.job_applications (job_post_id, match_score desc nulls last);

notify pgrst, 'reload schema';
