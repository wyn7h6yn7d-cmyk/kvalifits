-- Server-only stamp: employer application email was accepted by the provider.
-- Authenticated clients must not write this column (no INSERT policy; not in UPDATE grants).

alter table public.job_applications
  add column if not exists employer_notified_at timestamptz;

comment on column public.job_applications.employer_notified_at is
  'Set only after a successful employer application notification send. Null means not delivered yet.';

notify pgrst, 'reload schema';
