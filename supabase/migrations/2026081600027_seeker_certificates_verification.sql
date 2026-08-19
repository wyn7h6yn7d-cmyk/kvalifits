-- Certificate verification lifecycle (submitted → under_review → verified).
-- Uploads must not appear as verified by default.

alter table public.seeker_certificates
  add column if not exists verification_status text,
  add column if not exists verified_at date,
  add column if not exists verification_source text,
  add column if not exists verified_by text;

update public.seeker_certificates
set verification_status = 'submitted'
where verification_status is null
   or verification_status not in ('submitted', 'under_review', 'verified');

alter table public.seeker_certificates
  alter column verification_status set default 'submitted';

alter table public.seeker_certificates
  alter column verification_status set not null;

comment on column public.seeker_certificates.verification_status is
  'submitted | under_review | verified — uploads start as submitted, never auto-verified.';
comment on column public.seeker_certificates.verified_at is
  'Date the certificate was marked verified (null unless verified).';
comment on column public.seeker_certificates.verification_source is
  'Verification source org, e.g. Kutsekoda (null unless verified).';
comment on column public.seeker_certificates.verified_by is
  'Person or role that verified the certificate (null unless verified).';

notify pgrst, 'reload schema';
