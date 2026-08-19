-- SQL Editor copy of 20260818151000_job_applications_employer_notified_at.sql

alter table public.job_applications
  add column if not exists employer_notified_at timestamptz;

comment on column public.job_applications.employer_notified_at is
  'Set only after a successful employer application notification send. Null means not delivered yet.';

notify pgrst, 'reload schema';
