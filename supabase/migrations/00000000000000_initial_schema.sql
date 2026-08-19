-- Initial schema for Kvalifits.
-- Core tables were originally created via the Supabase Dashboard.
-- This migration records their existence so the full migration sequence
-- is reproducible from scratch on a fresh Supabase project.
-- All statements are idempotent (IF NOT EXISTS) to be safe on existing remotes.

-- ============================================================
-- profiles (one row per auth.users entry)
-- ============================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'seeker'
             check (role in ('seeker', 'employer', 'admin')),
  email      text,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ============================================================
-- seeker_profiles
-- ============================================================
create table if not exists public.seeker_profiles (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  full_name        text,
  phone            text,
  location         text,
  profile_title    text,
  about            text,
  skills           text[] default '{}',
  experience_level text,
  preferred_job_types text[] default '{}',
  preferred_locations text[] default '{}',
  cv_url           text,
  profile_visible  boolean not null default false,
  completion_percent integer not null default 0,
  is_complete      boolean not null default false,
  salary_expectation text,
  work_authorization_notes text,
  has_b_category_drivers_license boolean default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.seeker_profiles enable row level security;

-- ============================================================
-- employer_profiles
-- ============================================================
create table if not exists public.employer_profiles (
  id                  uuid primary key default gen_random_uuid(),
  owner_user_id       uuid not null references auth.users (id) on delete cascade,
  company_name        text not null default '',
  registry_code       text,
  contact_email       text,
  contact_phone       text,
  website             text,
  company_description text,
  logo_url            text,
  location            text,
  industry            text,
  company_size        text,
  company_verified    boolean not null default false,
  verification_status text not null default 'unverified',
  verification_source text,
  verified_at         timestamptz,
  public_slug         text unique,
  search_text         text,
  search_tsv          tsvector,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.employer_profiles enable row level security;

-- ============================================================
-- seeker_certificates
-- ============================================================
create table if not exists public.seeker_certificates (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  certificate_name       text not null,
  certificate_number     text,
  certificate_issuer     text,
  certificate_valid_from date,
  certificate_valid_until date,
  certificate_image_url  text,
  verification_status    text not null default 'unverified',
  verified_at            timestamptz,
  verification_source    text,
  verified_by            uuid references auth.users (id),
  created_at             timestamptz not null default now()
);

alter table public.seeker_certificates enable row level security;

-- ============================================================
-- job_posts
-- ============================================================
create table if not exists public.job_posts (
  id                      uuid primary key default gen_random_uuid(),
  employer_profile_id     uuid not null references public.employer_profiles (id) on delete cascade,
  created_by              uuid references auth.users (id),
  title                   text not null,
  slug                    text,
  location                text,
  work_type               text,
  job_type                text,
  description             text,
  requirements            text,
  salary_min              integer,
  salary_max              integer,
  salary_currency         text default 'EUR',
  application_type        text not null default 'in_app',
  application_url         text,
  status                  text not null default 'draft',
  published_at            timestamptz,
  expires_at              timestamptz,
  application_deadline    timestamptz,
  certificate_requirements text,
  short_summary           text,
  requirement_lines       text[],
  required_skills         text[] default '{}',
  keywords                text[] default '{}',
  experience_level_required text,
  languages               text[] default '{}',
  search_text             text,
  search_tsv              tsvector,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.job_posts enable row level security;

-- ============================================================
-- job_applications
-- ============================================================
create table if not exists public.job_applications (
  id               uuid primary key default gen_random_uuid(),
  job_post_id      uuid not null references public.job_posts (id) on delete cascade,
  seeker_user_id   uuid not null references auth.users (id) on delete cascade,
  cover_letter     text,
  consent_to_share boolean not null default false,
  shared_profile   jsonb,
  match_score      integer,
  match_breakdown  jsonb,
  status           text not null default 'pending',
  status_updated_at timestamptz,
  application_answers jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.job_applications enable row level security;

-- ============================================================
-- Minimal RLS so tables are usable before security migrations
-- ============================================================
do $$
begin
  -- profiles: own-row read/update
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_select_own') then
    execute 'create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid())';
  end if;
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'profiles_update_own') then
    execute 'create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid())';
  end if;

  -- seeker_profiles: own-row
  if not exists (select 1 from pg_policies where tablename = 'seeker_profiles' and policyname = 'seeker_profiles_select_own') then
    execute 'create policy "seeker_profiles_select_own" on public.seeker_profiles for select to authenticated using (user_id = auth.uid())';
  end if;

  -- employer_profiles: own-row
  if not exists (select 1 from pg_policies where tablename = 'employer_profiles' and policyname = 'employer_profiles_select_own') then
    execute 'create policy "employer_profiles_select_own" on public.employer_profiles for select to authenticated using (owner_user_id = auth.uid())';
  end if;

  -- job_posts: public read
  if not exists (select 1 from pg_policies where tablename = 'job_posts' and policyname = 'job_posts_select_published') then
    execute $p$create policy "job_posts_select_published" on public.job_posts for select using (status = 'published')$p$;
  end if;
end $$;

-- Grants
grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant select, update on public.seeker_profiles to authenticated;
grant select on public.employer_profiles to anon, authenticated;
grant insert, update on public.employer_profiles to authenticated;
grant select on public.job_posts to anon, authenticated;
grant insert, update, delete on public.job_posts to authenticated;
grant select, insert, update on public.job_applications to authenticated;
grant select on public.seeker_certificates to authenticated;
grant insert, update, delete on public.seeker_certificates to authenticated;

-- Storage: create avatars and certificates buckets if missing
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
