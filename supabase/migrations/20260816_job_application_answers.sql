-- Short structured answers collected on in-app apply (not a profile duplicate).

alter table public.job_applications
  add column if not exists application_answers jsonb not null default '{}'::jsonb;

comment on column public.job_applications.application_answers is
  'Job-specific apply answers: salary wish, start/notice, hours, schedule fit, interview preference, optional note.';

notify pgrst, 'reload schema';
