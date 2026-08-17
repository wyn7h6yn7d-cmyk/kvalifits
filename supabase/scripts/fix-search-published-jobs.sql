-- Server-side published job search: filter, sort, paginate. SECURITY INVOKER (RLS).
-- Public callers only see published rows via existing job_posts SELECT policy.

alter table public.job_posts
  add column if not exists languages text[] not null default '{}'::text[];

comment on column public.job_posts.languages is
  'Optional structured job languages for search filters. Matching scores stay in application code.';

create index if not exists job_posts_search_published_at_idx
  on public.job_posts (published_at desc nulls last, created_at desc)
  where status::text = 'published';

create index if not exists job_posts_search_salary_idx
  on public.job_posts ((coalesce(salary_max, salary_min)) desc nulls last)
  where status::text = 'published';

create index if not exists job_posts_search_deadline_idx
  on public.job_posts (application_deadline asc nulls last)
  where status::text = 'published';

create index if not exists job_posts_required_skills_gin_idx
  on public.job_posts using gin (required_skills);

create index if not exists job_posts_keywords_gin_idx
  on public.job_posts using gin (keywords);

create or replace function public.job_search_norm(raw text)
returns text
language sql
immutable
as $$
  select regexp_replace(lower(trim(coalesce(raw, ''))), '\s+', ' ', 'g');
$$;

create or replace function public.job_search_compact(raw text)
returns text
language sql
immutable
as $$
  select regexp_replace(public.job_search_norm(raw), '\s+', '', 'g');
$$;

create or replace function public.job_search_is_accepting(jp public.job_posts)
returns boolean
language sql
stable
as $$
  select
    jp.status::text = 'published'
    and (jp.expires_at is null or jp.expires_at >= now())
    and (
      jp.application_deadline is null
      or jp.application_deadline >= ((timezone('Europe/Tallinn', now()))::date)
    );
$$;

create or replace function public.job_salary_overlaps_bucket(
  p_min numeric,
  p_max numeric,
  p_bucket text
) returns boolean
language sql
immutable
as $$
  with b as (
    select
      case p_bucket
        when '0-1499' then 0
        when '1500-1999' then 1500
        when '2000-2499' then 2000
        when '2500-2999' then 2500
        when '3000-3999' then 3000
        when '4000+' then 4000
        else null
      end as lo,
      case p_bucket
        when '0-1499' then 1499
        when '1500-1999' then 1999
        when '2000-2499' then 2499
        when '2500-2999' then 2999
        when '3000-3999' then 3999
        when '4000+' then null
        else null
      end as hi
  )
  select
    p_min is not null or p_max is not null
    and b.lo is not null
    and coalesce(p_min, p_max) <= coalesce(b.hi, 1e12)
    and coalesce(p_max, p_min) >= b.lo
  from b;
$$;

create or replace function public.published_job_ids_matching(
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
  p_omit_facet text default null
)
returns table (id uuid)
language sql
stable
security invoker
set search_path = public
as $$
  with q as (
    select nullif(trim(p_query), '') as needle
  )
  select jp.id
  from public.job_posts jp
  left join public.employer_profiles ep on ep.id = jp.employer_profile_id
  cross join q
  where public.job_search_is_accepting(jp)
    and (
      q.needle is null
      or jp.title ilike '%' || q.needle || '%'
      or jp.location ilike '%' || q.needle || '%'
      or coalesce(jp.short_summary, '') ilike '%' || q.needle || '%'
      or coalesce(ep.company_name, '') ilike '%' || q.needle || '%'
      or coalesce(ep.industry, '') ilike '%' || q.needle || '%'
      or coalesce(jp.certificate_requirements, '') ilike '%' || q.needle || '%'
      or exists (
        select 1 from unnest(coalesce(jp.required_skills, '{}'::text[])) s
        where s ilike '%' || q.needle || '%'
      )
      or exists (
        select 1 from unnest(coalesce(jp.keywords, '{}'::text[])) k
        where k ilike '%' || q.needle || '%'
      )
    )
    and (
      not coalesce(p_has_salary, false)
      or jp.salary_min is not null
      or jp.salary_max is not null
    )
    and (
      p_omit_facet = 'location'
      or coalesce(array_length(p_locations, 1), 0) = 0
      or exists (
        select 1
        from unnest(p_locations) loc
        where exists (
          select 1
          from regexp_split_to_table(coalesce(jp.location, ''), '[,/|]+') part
          where public.job_search_compact(part) = public.job_search_compact(loc)
        )
        or public.job_search_norm(jp.location) ilike '%' || public.job_search_norm(loc) || '%'
      )
    )
    and (
      p_omit_facet = 'title'
      or coalesce(array_length(p_titles, 1), 0) = 0
      or exists (
        select 1 from unnest(p_titles) t
        where public.job_search_norm(jp.title) = public.job_search_norm(t)
      )
    )
    and (
      p_omit_facet = 'domain'
      or coalesce(array_length(p_domains, 1), 0) = 0
      or exists (
        select 1 from unnest(p_domains) d
        where public.job_search_norm(ep.industry) = public.job_search_norm(d)
      )
    )
    and (
      p_omit_facet = 'jobType'
      or coalesce(array_length(p_job_types, 1), 0) = 0
      or exists (
        select 1 from unnest(p_job_types) t
        where replace(lower(coalesce(jp.job_type, '')), '-', '_')
          = replace(lower(t), '-', '_')
      )
    )
    and (
      p_omit_facet = 'workType'
      or coalesce(array_length(p_work_types, 1), 0) = 0
      or exists (
        select 1 from unnest(p_work_types) t
        where replace(replace(lower(coalesce(jp.work_type, '')), '-', '_'), 'onsite', 'on_site')
          = replace(replace(lower(t), '-', '_'), 'onsite', 'on_site')
      )
    )
    and (
      p_omit_facet = 'salary'
      or coalesce(array_length(p_salary_buckets, 1), 0) = 0
      or exists (
        select 1 from unnest(p_salary_buckets) b
        where public.job_salary_overlaps_bucket(jp.salary_min, jp.salary_max, b)
      )
    )
    and (
      p_omit_facet = 'experience'
      or coalesce(array_length(p_experience, 1), 0) = 0
      or jp.experience_level_required = any (p_experience)
    )
    and (
      p_omit_facet = 'skill'
      or coalesce(array_length(p_skills, 1), 0) = 0
      or exists (
        select 1 from unnest(p_skills) s
        where exists (
          select 1 from unnest(coalesce(jp.required_skills, '{}'::text[])) rs
          where public.job_search_norm(rs) = public.job_search_norm(s)
        )
      )
    )
    and (
      p_omit_facet = 'cert'
      or coalesce(array_length(p_certs, 1), 0) = 0
      or exists (
        select 1 from unnest(p_certs) c
        where exists (
          select 1
          from regexp_split_to_table(coalesce(jp.certificate_requirements, ''), '[,;\n]+') part
          where public.job_search_norm(part) = public.job_search_norm(c)
        )
      )
    )
    and (
      p_omit_facet = 'language'
      or coalesce(array_length(p_languages, 1), 0) = 0
      or exists (
        select 1 from unnest(p_languages) lang
        where exists (
          select 1 from unnest(coalesce(jp.languages, '{}'::text[])) l
          where public.job_search_norm(l) = public.job_search_norm(lang)
        )
        or exists (
          select 1 from unnest(coalesce(jp.keywords, '{}'::text[])) k
          where public.job_search_norm(k) = public.job_search_norm(lang)
             or public.job_search_norm(k) like '%' || public.job_search_norm(lang) || '%'
        )
        or public.job_search_norm(jp.title) like '%' || public.job_search_norm(lang) || '%'
        or public.job_search_norm(jp.short_summary) like '%' || public.job_search_norm(lang) || '%'
      )
    );
$$;

create or replace function public.search_published_jobs(
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
  p_sort text default 'newest',
  p_page integer default 1,
  p_page_size integer default 20
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_size integer := least(greatest(coalesce(p_page_size, 20), 1), 200);
  v_sort text := case
    when p_sort in ('newest', 'salary', 'deadline') then p_sort
    else 'newest'
  end;
  v_total integer := 0;
  v_pages integer := 1;
  v_jobs jsonb := '[]'::jsonb;
begin
  select count(*)::integer into v_total
  from public.published_job_ids_matching(
    p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
    p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, null
  );

  v_pages := greatest(ceil(v_total::numeric / v_size::numeric), 1)::integer;
  if v_page > v_pages then
    v_page := v_pages;
  end if;

  with ranked as (
    select
      jp.id,
      jp.title,
      jp.location,
      jp.job_type,
      jp.work_type,
      jp.short_summary,
      jp.required_skills,
      jp.keywords,
      jp.certificate_requirements,
      jp.salary_min,
      jp.salary_max,
      jp.salary_currency,
      jp.salary_tax,
      jp.salary_period,
      jp.employer_profile_id,
      jp.status,
      jp.created_at,
      jp.published_at,
      jp.application_deadline,
      jp.expires_at,
      jp.experience_level_required,
      jp.weekly_hours,
      jp.daily_hours,
      jp.shift_start,
      jp.shift_end,
      jp.includes_night_work,
      jp.is_hazardous_work,
      jp.languages,
      ep.company_name,
      ep.logo_url,
      ep.company_verified,
      ep.verification_status,
      ep.industry,
      ep.public_slug,
      case v_sort
        when 'salary' then coalesce(jp.salary_max, jp.salary_min)
        else null
      end as sort_salary,
      case v_sort
        when 'deadline' then jp.application_deadline
        else null
      end as sort_deadline,
      coalesce(jp.published_at, jp.created_at) as sort_published
    from public.job_posts jp
    left join public.employer_profiles ep on ep.id = jp.employer_profile_id
    where jp.id in (
      select m.id
      from public.published_job_ids_matching(
        p_query, p_locations, p_titles, p_domains, p_job_types, p_work_types,
        p_salary_buckets, p_experience, p_skills, p_certs, p_languages, p_has_salary, null
      ) m
    )
  ),
  ordered as (
    select *
    from ranked
    order by
      case when v_sort = 'salary' then sort_salary end desc nulls last,
      case when v_sort = 'deadline' then sort_deadline end asc nulls last,
      sort_published desc nulls last,
      created_at desc
    offset (v_page - 1) * v_size
    limit v_size
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', o.id,
        'title', o.title,
        'location', o.location,
        'job_type', o.job_type,
        'work_type', o.work_type,
        'short_summary', o.short_summary,
        'required_skills', o.required_skills,
        'keywords', o.keywords,
        'certificate_requirements', o.certificate_requirements,
        'salary_min', o.salary_min,
        'salary_max', o.salary_max,
        'salary_currency', o.salary_currency,
        'salary_tax', o.salary_tax,
        'salary_period', o.salary_period,
        'employer_profile_id', o.employer_profile_id,
        'status', o.status,
        'created_at', o.created_at,
        'published_at', o.published_at,
        'application_deadline', o.application_deadline,
        'expires_at', o.expires_at,
        'experience_level_required', o.experience_level_required,
        'weekly_hours', o.weekly_hours,
        'daily_hours', o.daily_hours,
        'shift_start', o.shift_start,
        'shift_end', o.shift_end,
        'includes_night_work', o.includes_night_work,
        'is_hazardous_work', o.is_hazardous_work,
        'languages', o.languages,
        'company_name', o.company_name,
        'logo_url', o.logo_url,
        'company_verified', o.company_verified,
        'verification_status', o.verification_status,
        'industry', o.industry,
        'public_slug', o.public_slug
      )
      order by o.sort_published desc nulls last, o.created_at desc
    ),
    '[]'::jsonb
  )
  into v_jobs
  from ordered o;

  return jsonb_build_object(
    'jobs', coalesce(v_jobs, '[]'::jsonb),
    'total_count', v_total,
    'current_page', v_page,
    'total_pages', v_pages,
    'page_size', v_size
  );
end;
$$;

create or replace function public.published_job_search_facets(
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
  p_has_salary boolean default false
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_out jsonb := '{}'::jsonb;
begin
  -- title
  v_out := v_out || jsonb_build_object('title', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
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
      group by 1
      order by 2 desc
      limit 40
    ) x
  ), '[]'::jsonb));

  -- location
  v_out := v_out || jsonb_build_object('location', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
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
      group by 1
      order by 2 desc
      limit 40
    ) x
  ), '[]'::jsonb));

  -- domain
  v_out := v_out || jsonb_build_object('domain', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
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
      group by 1
      order by 2 desc
      limit 40
    ) x
  ), '[]'::jsonb));

  -- jobType (raw DB keys)
  v_out := v_out || jsonb_build_object('jobType', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
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
      group by 1
    ) x
  ), '[]'::jsonb));

  -- workType
  v_out := v_out || jsonb_build_object('workType', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
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
      group by 1
    ) x
  ), '[]'::jsonb));

  -- salary buckets
  v_out := v_out || jsonb_build_object('salary', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.val)
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
      group by 1
    ) x
  ), '[]'::jsonb));

  -- experience
  v_out := v_out || jsonb_build_object('experience', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
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
      group by 1
    ) x
  ), '[]'::jsonb));

  -- skills
  v_out := v_out || jsonb_build_object('skill', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
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
      group by 1
      order by 2 desc
      limit 40
    ) x
  ), '[]'::jsonb));

  -- certs
  v_out := v_out || jsonb_build_object('cert', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
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
      group by 1
      order by 2 desc
      limit 40
    ) x
  ), '[]'::jsonb));

  -- languages
  v_out := v_out || jsonb_build_object('language', coalesce((
    select jsonb_agg(jsonb_build_object('value', x.val, 'count', x.cnt) order by x.cnt desc, x.val)
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
      group by 1
      order by 2 desc
      limit 40
    ) x
  ), '[]'::jsonb));

  return v_out;
end;
$$;

revoke all on function public.job_search_norm(text) from public;
revoke all on function public.job_search_compact(text) from public;
revoke all on function public.job_search_is_accepting(public.job_posts) from public;
revoke all on function public.job_salary_overlaps_bucket(numeric, numeric, text) from public;
revoke all on function public.published_job_ids_matching(text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean, text) from public;
revoke all on function public.search_published_jobs(text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean, text, integer, integer) from public;
revoke all on function public.published_job_search_facets(text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean) from public;

grant execute on function public.job_search_norm(text) to anon, authenticated;
grant execute on function public.job_search_compact(text) to anon, authenticated;
grant execute on function public.job_search_is_accepting(public.job_posts) to anon, authenticated;
grant execute on function public.job_salary_overlaps_bucket(numeric, numeric, text) to anon, authenticated;
grant execute on function public.published_job_ids_matching(text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean, text) to anon, authenticated;
grant execute on function public.search_published_jobs(text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean, text, integer, integer) to anon, authenticated;
grant execute on function public.published_job_search_facets(text, text[], text[], text[], text[], text[], text[], text[], text[], text[], text[], boolean) to anon, authenticated;

notify pgrst, 'reload schema';
