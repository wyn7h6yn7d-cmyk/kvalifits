-- Structured job requirements with mandatory / recommended priority.
-- Matching still uses requirement_lines; priority is reserved for a future weight pass.

alter table public.job_posts
  add column if not exists job_requirements jsonb not null default '[]'::jsonb;

comment on column public.job_posts.job_requirements is
  'Array of { text, priority: mandatory|recommended }. Synced to requirement_lines. Matching weights mandatory > recommended.';

-- Backfill from existing requirement_lines (legacy rows → mandatory).
update public.job_posts
set job_requirements = coalesce(
  (
    select jsonb_agg(
      jsonb_build_object('text', trim(line), 'priority', 'mandatory')
      order by ord
    )
    from unnest(coalesce(requirement_lines, array[]::text[])) with ordinality as t(line, ord)
    where length(trim(line)) > 0
  ),
  '[]'::jsonb
)
where coalesce(jsonb_array_length(job_requirements), 0) = 0
  and coalesce(array_length(requirement_lines, 1), 0) > 0;

notify pgrst, 'reload schema';
