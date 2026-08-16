-- Admin moderation: blocked users + certificate verification (incl. rejected) + admin RLS.

alter table public.profiles
  add column if not exists is_blocked boolean not null default false;

comment on column public.profiles.is_blocked is
  'When true, the user is blocked from using the platform (admin moderation).';

alter table public.seeker_certificates
  add column if not exists verification_status text,
  add column if not exists verified_at date,
  add column if not exists verification_source text,
  add column if not exists verified_by text;

update public.seeker_certificates
set verification_status = 'submitted'
where verification_status is null
   or verification_status not in ('submitted', 'under_review', 'verified', 'rejected');

alter table public.seeker_certificates
  alter column verification_status set default 'submitted';

alter table public.seeker_certificates
  alter column verification_status set not null;

comment on column public.seeker_certificates.verification_status is
  'submitted | under_review | verified | rejected — uploads start as submitted, never auto-verified.';

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'seeker_certificates_verification_status_check'
      and conrelid = 'public.seeker_certificates'::regclass
  ) then
    alter table public.seeker_certificates
      drop constraint seeker_certificates_verification_status_check;
  end if;

  alter table public.seeker_certificates
    add constraint seeker_certificates_verification_status_check
    check (verification_status in ('submitted', 'under_review', 'verified', 'rejected'));
exception
  when duplicate_object then null;
end $$;

drop policy if exists "admin_update_seeker_certificates" on public.seeker_certificates;
create policy "admin_update_seeker_certificates"
  on public.seeker_certificates
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

drop policy if exists "admin_select_seeker_certificates" on public.seeker_certificates;
create policy "admin_select_seeker_certificates"
  on public.seeker_certificates
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Audit log: see migration 20260816_admin_audit_log.sql
