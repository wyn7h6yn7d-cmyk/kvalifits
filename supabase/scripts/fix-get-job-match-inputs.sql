-- Compact matching columns for a list of published job IDs.
-- Used by the server service getJobMatchesForSeeker. Does not compute scores
-- (TypeScript MATCH_MODEL_VERSION stays source of truth for equivalence).
-- Never returns description or other large blobs.

create or replace function public.get_job_match_inputs(p_job_ids uuid[])
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'job_id', jp.id,
        'title', jp.title,
        'location', jp.location,
        'work_type', jp.work_type,
        'job_type', jp.job_type,
        'short_summary', jp.short_summary,
        'required_skills', jp.required_skills,
        'keywords', jp.keywords,
        'certificate_requirements', jp.certificate_requirements,
        'experience_level_required', jp.experience_level_required,
        'weekly_hours', jp.weekly_hours,
        'daily_hours', jp.daily_hours,
        'shift_start', jp.shift_start,
        'shift_end', jp.shift_end,
        'includes_night_work', jp.includes_night_work,
        'is_hazardous_work', jp.is_hazardous_work,
        'requirement_lines', jp.requirement_lines,
        'job_requirements', jp.job_requirements,
        'requirements', case
          when coalesce(jsonb_array_length(jp.job_requirements), 0) > 0 then null
          when coalesce(array_length(jp.requirement_lines, 1), 0) > 0 then null
          else jp.requirements
        end
      )
      order by jp.id
    ),
    '[]'::jsonb
  )
  from public.job_posts jp
  where (jp.status)::text = 'published'
    and jp.id = any (coalesce(p_job_ids, '{}'::uuid[])[1:200]);
$$;

comment on function public.get_job_match_inputs(uuid[]) is
  'Compact job matching inputs (no descriptions). Scores are computed by getJobMatchesForSeeker.';

revoke all on function public.get_job_match_inputs(uuid[]) from public;
revoke all on function public.get_job_match_inputs(uuid[]) from anon;
grant execute on function public.get_job_match_inputs(uuid[]) to authenticated;

notify pgrst, 'reload schema';
