-- Job listing lifecycle dates.
-- published_at          — when the listing went public
-- application_deadline  — last calendar day to apply (DATE)
-- expires_at            — when the listing becomes inactive (timestamptz)
--
-- Expired listings are archived (status = archived), never deleted by this script.

alter table public.job_posts
  add column if not exists published_at timestamptz,
  add column if not exists application_deadline date,
  add column if not exists expires_at timestamptz;

comment on column public.job_posts.published_at is
  'When the listing was published (public).';

comment on column public.job_posts.application_deadline is
  'Last calendar day candidates may apply (inclusive, Europe/Tallinn).';

comment on column public.job_posts.expires_at is
  'When the listing expires and should become inactive (archived). Not deleted.';

-- Backfill published_at from created_at for already-public listings.
update public.job_posts
set published_at = coalesce(published_at, created_at)
where status::text = 'published'
  and published_at is null
  and created_at is not null;

-- Archive published listings whose expires_at is already in the past.
update public.job_posts
set status = 'archived'
where status::text = 'published'
  and expires_at is not null
  and expires_at < now();

notify pgrst, 'reload schema';
