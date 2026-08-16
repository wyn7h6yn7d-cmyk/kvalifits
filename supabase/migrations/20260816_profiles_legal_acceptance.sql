-- Legal acceptance fields captured at registration (terms + privacy only).

alter table public.profiles
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists privacy_version text;

comment on column public.profiles.terms_accepted_at is
  'When the user accepted terms + privacy at registration (no marketing consent).';
comment on column public.profiles.terms_version is
  'Accepted terms document version (ISO date from legal lastUpdated).';
comment on column public.profiles.privacy_version is
  'Accepted privacy policy version (ISO date from legal lastUpdated).';

notify pgrst, 'reload schema';
