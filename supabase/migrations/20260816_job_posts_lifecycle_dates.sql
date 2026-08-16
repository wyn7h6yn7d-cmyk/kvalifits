-- Job listing lifecycle dates (migration mirror of fix-job-posts-lifecycle-dates.sql).

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

update public.job_posts
set published_at = coalesce(published_at, created_at)
where status::text = 'published'
  and published_at is null
  and created_at is not null;

update public.job_posts
set status = 'archived'
where status::text = 'published'
  and expires_at is not null
  and expires_at < now();
