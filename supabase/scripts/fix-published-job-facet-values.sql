-- Contextual facet value search over the full matching published set (not the current page).
-- Counts omit the facet being listed so other active filters stay applied.

create or replace function public.published_job_facet_values(
  p_facet text,
  p_facet_query text default null,
  p_query text default null,
  p_locations text[] default null,
  p_titles text[] default null,
  p_domains text[] default null,
  p_job_types text[] default null,
  p_work_types text[] default null,
  p_salary_buckets text[] default null,
  p_experience text[] default null,
  p_skills text[] default null,
  p_certs text[] default null,
  p_languages text[] default null,
  p_has_salary boolean default false,
  p_limit integer default 20
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_facet text := nullif(trim(p_facet), '');
  v_q text := nullif(trim(p_facet_query), '');
  v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 40);
  v_out jsonb := '[]'::jsonb;
begin
  if v_facet is null then
    return v_out;
  end if;

  if v_facet = 'title' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select trim(jp.title) as val, count(*)::int as cnt
      from public.job_posts jp
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'title'
        ) m
      )
      and char_length(trim(jp.title)) between 2 and 48
      and (v_q is null or public.job_search_norm(jp.title) like '%' || public.job_search_norm(v_q) || '%')
      group by 1
      having count(*) > 0
      order by 2 desc, 1
      limit v_limit
    ) x;
  elsif v_facet = 'location' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select trim(part) as val, count(*)::int as cnt
      from public.job_posts jp
      cross join lateral regexp_split_to_table(coalesce(jp.location, ''), '[,/|]+') part
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'location'
        ) m
      )
      and char_length(trim(part)) between 2 and 48
      and (v_q is null or public.job_search_norm(part) like '%' || public.job_search_norm(v_q) || '%')
      group by 1
      having count(*) > 0
      order by 2 desc, 1
      limit v_limit
    ) x;
  elsif v_facet = 'domain' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select trim(ep.industry) as val, count(*)::int as cnt
      from public.job_posts jp
      join public.employer_profiles ep on ep.id = jp.employer_profile_id
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'domain'
        ) m
      )
      and char_length(trim(ep.industry)) between 2 and 48
      and (v_q is null or public.job_search_norm(ep.industry) like '%' || public.job_search_norm(v_q) || '%')
      group by 1
      having count(*) > 0
      order by 2 desc, 1
      limit v_limit
    ) x;
  elsif v_facet = 'jobType' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select replace(lower(coalesce(jp.job_type, '')), '-', '_') as val, count(*)::int as cnt
      from public.job_posts jp
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'jobType'
        ) m
      )
      and coalesce(jp.job_type, '') <> ''
      and (
        v_q is null
        or public.job_search_norm(replace(lower(coalesce(jp.job_type, '')), '-', '_'))
          like '%' || public.job_search_norm(v_q) || '%'
      )
      group by 1
      having count(*) > 0
    ) x;
  elsif v_facet = 'workType' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select replace(replace(lower(coalesce(jp.work_type, '')), '-', '_'), 'onsite', 'on_site') as val,
             count(*)::int as cnt
      from public.job_posts jp
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'workType'
        ) m
      )
      and coalesce(jp.work_type, '') <> ''
      and (
        v_q is null
        or public.job_search_norm(replace(replace(lower(coalesce(jp.work_type, '')), '-', '_'), 'onsite', 'on_site'))
          like '%' || public.job_search_norm(v_q) || '%'
      )
      group by 1
      having count(*) > 0
    ) x;
  elsif v_facet = 'salary' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.val), '[]'::jsonb)
    into v_out
    from (
      select b.val, count(*)::int as cnt
      from public.job_posts jp
      cross join (values ('0-1499'), ('1500-1999'), ('2000-2499'), ('2500-2999'), ('3000-3999'), ('4000+')) as b(val)
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'salary'
        ) m
      )
      and public.job_salary_overlaps_bucket(jp.salary_min, jp.salary_max, b.val)
      and (v_q is null or b.val like '%' || v_q || '%')
      group by 1
      having count(*) > 0
    ) x;
  elsif v_facet = 'experience' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select jp.experience_level_required as val, count(*)::int as cnt
      from public.job_posts jp
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'experience'
        ) m
      )
      and coalesce(jp.experience_level_required, '') <> ''
      and (
        v_q is null
        or public.job_search_norm(jp.experience_level_required) like '%' || public.job_search_norm(v_q) || '%'
      )
      group by 1
      having count(*) > 0
    ) x;
  elsif v_facet = 'skill' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select trim(s) as val, count(*)::int as cnt
      from public.job_posts jp
      cross join lateral unnest(coalesce(jp.required_skills, '{}'::text[])) s
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'skill'
        ) m
      )
      and char_length(trim(s)) between 2 and 48
      and (v_q is null or public.job_search_norm(s) like '%' || public.job_search_norm(v_q) || '%')
      group by 1
      having count(*) > 0
      order by 2 desc, 1
      limit v_limit
    ) x;
  elsif v_facet = 'cert' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select trim(part) as val, count(*)::int as cnt
      from public.job_posts jp
      cross join lateral regexp_split_to_table(coalesce(jp.certificate_requirements, ''), '[,;\n]+') part
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'cert'
        ) m
      )
      and char_length(trim(part)) between 2 and 48
      and (v_q is null or public.job_search_norm(part) like '%' || public.job_search_norm(v_q) || '%')
      group by 1
      having count(*) > 0
      order by 2 desc, 1
      limit v_limit
    ) x;
  elsif v_facet = 'language' then
    select coalesce(jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val), '[]'::jsonb)
    into v_out
    from (
      select trim(l) as val, count(*)::int as cnt
      from public.job_posts jp
      cross join lateral unnest(coalesce(jp.languages, '{}'::text[])) l
      where jp.id in (
        select m.id from public.published_job_ids_matching(
          p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
          p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, 'language'
        ) m
      )
      and char_length(trim(l)) between 2 and 48
      and (v_q is null or public.job_search_norm(l) like '%' || public.job_search_norm(v_q) || '%')
      group by 1
      having count(*) > 0
      order by 2 desc, 1
      limit v_limit
    ) x;
  end if;

  return coalesce(v_out, '[]'::jsonb);
end;
$$;

revoke all on function public.published_job_facet_values(
  text, text, text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean, integer
) from public;

grant execute on function public.published_job_facet_values(
  text, text, text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean, integer
) to anon, authenticated;

notify pgrst, 'reload schema';
