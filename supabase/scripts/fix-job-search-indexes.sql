-- Job search indexes + structured keyword strategy (FTS + pg_trgm).
-- Inspected schema: job_posts uses location text, employer_profile_id, job_type, work_type,
-- required_skills/keywords/languages arrays, certificate_requirements text.
-- There is no location_id, valid_through, employer_id, or skill/cert/language join tables.

create schema if not exists extensions;

do $$
begin
  begin
    create extension if not exists pg_trgm with schema extensions;
  exception
    when duplicate_object then
      null;
    when others then
      create extension if not exists pg_trgm;
  end;
end;
$$;

create or replace function public.job_search_job_type_key(raw text)
returns text
language sql
immutable
as $$
  select replace(lower(coalesce(raw, '')), '-', '_');
$$;

create or replace function public.job_search_work_type_key(raw text)
returns text
language sql
immutable
as $$
  select replace(replace(lower(coalesce(raw, '')), '-', '_'), 'onsite', 'on_site');
$$;

create or replace function public.job_search_norm_arr(raw text[])
returns text[]
language sql
immutable
as $$
  select coalesce(
    array_agg(n.val),
    '{}'::text[]
  )
  from (
    select public.job_search_norm(x) as val
    from unnest(coalesce(raw, '{}'::text[])) x
  ) n
  where n.val <> '';
$$;

create or replace function public.job_search_structured_text(
  p_title text,
  p_location text,
  p_summary text,
  p_skills text[],
  p_keywords text[],
  p_certs text
)
returns text
language sql
immutable
as $$
  select public.job_search_norm(
    coalesce(p_title, '') || ' ' ||
    coalesce(p_location, '') || ' ' ||
    coalesce(p_summary, '') || ' ' ||
    coalesce(array_to_string(p_skills, ' '), '') || ' ' ||
    coalesce(array_to_string(p_keywords, ' '), '') || ' ' ||
    coalesce(p_certs, '')
  );
$$;

create or replace function public.job_search_employer_text(
  p_company_name text,
  p_industry text
)
returns text
language sql
immutable
as $$
  select public.job_search_norm(coalesce(p_company_name, '') || ' ' || coalesce(p_industry, ''));
$$;

create or replace function public.job_search_tsquery(raw text)
returns tsquery
language plpgsql
immutable
as $$
declare
  parts text[];
  cleaned text;
begin
  select array_agg(t.tok)
    into parts
  from (
    select regexp_replace(lower(tok), '[^[:alnum:]]', '', 'g') as tok
    from unnest(regexp_split_to_array(trim(coalesce(raw, '')), '\s+')) as tok
  ) t
  where length(t.tok) >= 2;

  if parts is null then
    return ''::tsquery;
  end if;

  cleaned := array_to_string(parts, ':* & ') || ':*';
  begin
    return to_tsquery('simple', cleaned);
  exception
    when others then
      return ''::tsquery;
  end;
end;
$$;

alter table public.job_posts
  add column if not exists search_text text
  generated always as (
    public.job_search_structured_text(
      title,
      location,
      short_summary,
      required_skills,
      keywords,
      certificate_requirements
    )
  ) stored;

alter table public.job_posts
  add column if not exists search_tsv tsvector
  generated always as (
    to_tsvector(
      'simple'::regconfig,
      coalesce(
        public.job_search_structured_text(
          title,
          location,
          short_summary,
          required_skills,
          keywords,
          certificate_requirements
        ),
        ''
      )
    )
  ) stored;

alter table public.employer_profiles
  add column if not exists search_text text
  generated always as (
    public.job_search_employer_text(company_name, industry)
  ) stored;

alter table public.employer_profiles
  add column if not exists search_tsv tsvector
  generated always as (
    to_tsvector(
      'simple'::regconfig,
      coalesce(public.job_search_employer_text(company_name, industry), '')
    )
  ) stored;

comment on column public.job_posts.search_text is
  'Normalized structured search document: title, location, short_summary, skills, keywords, certificates. Not description.';
comment on column public.job_posts.search_tsv is
  'simple tsvector of search_text for prefix full-text search.';
comment on column public.employer_profiles.search_text is
  'Normalized company_name + industry for job keyword search.';
comment on column public.employer_profiles.search_tsv is
  'simple tsvector of employer search_text.';

-- Join used on every search (FK is not auto-indexed in Postgres).
create index if not exists job_posts_employer_profile_id_idx
  on public.job_posts (employer_profile_id);

create index if not exists job_posts_search_job_type_idx
  on public.job_posts (public.job_search_job_type_key(job_type))
  where status::text = 'published';

create index if not exists job_posts_search_work_type_idx
  on public.job_posts (public.job_search_work_type_key(work_type))
  where status::text = 'published';

create index if not exists job_posts_search_experience_idx
  on public.job_posts (experience_level_required)
  where status::text = 'published'
    and coalesce(experience_level_required, '') <> '';

create index if not exists job_posts_search_title_norm_idx
  on public.job_posts (public.job_search_norm(title))
  where status::text = 'published';

create index if not exists job_posts_search_skills_norm_gin_idx
  on public.job_posts using gin (public.job_search_norm_arr(required_skills))
  where status::text = 'published';

create index if not exists job_posts_search_languages_norm_gin_idx
  on public.job_posts using gin (public.job_search_norm_arr(languages))
  where status::text = 'published'
    and coalesce(array_length(languages, 1), 0) > 0;

create index if not exists employer_profiles_industry_norm_idx
  on public.employer_profiles (public.job_search_norm(industry))
  where coalesce(industry, '') <> '';

create index if not exists job_posts_search_tsv_idx
  on public.job_posts using gin (search_tsv)
  where status::text = 'published';

create index if not exists employer_profiles_search_tsv_idx
  on public.employer_profiles using gin (search_tsv);

do $$
declare
  v_ops text;
begin
  if exists (
    select 1
    from pg_opclass opc
    join pg_namespace n on n.oid = opc.opcnamespace
    where opc.opcname = 'gin_trgm_ops'
      and n.nspname = 'extensions'
  ) then
    v_ops := 'extensions.gin_trgm_ops';
  else
    v_ops := 'gin_trgm_ops';
  end if;

  execute format(
    'create index if not exists job_posts_search_text_trgm_idx
       on public.job_posts using gin (search_text %s)
       where status::text = ''published''',
    v_ops
  );
  execute format(
    'create index if not exists employer_profiles_search_text_trgm_idx
       on public.employer_profiles using gin (search_text %s)',
    v_ops
  );
end;
$$;

-- Planner-friendly matching: inline accepting predicates (avoid row-typed function barrier),
-- array overlap for skills/languages, FTS + trigram LIKE on structured search_text only.
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
set search_path = public, extensions
as $$
  with q as (
    select
      nullif(trim(p_query), '') as needle,
      public.job_search_tsquery(p_query) as tsq,
      public.job_search_norm(p_query) as needle_norm
  )
  select jp.id
  from public.job_posts jp
  left join public.employer_profiles ep on ep.id = jp.employer_profile_id
  cross join q
  where jp.status::text = 'published'
    and (jp.expires_at is null or jp.expires_at >= now())
    and (
      jp.application_deadline is null
      or jp.application_deadline >= ((timezone('Europe/Tallinn', now()))::date)
    )
    and (
      q.needle is null
      or (q.tsq <> ''::tsquery and jp.search_tsv @@ q.tsq)
      or jp.search_text like '%' || q.needle_norm || '%'
      or jp.employer_profile_id in (
        select ep2.id
        from public.employer_profiles ep2
        where (q.tsq <> ''::tsquery and ep2.search_tsv @@ q.tsq)
           or ep2.search_text like '%' || q.needle_norm || '%'
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
        or public.job_search_norm(jp.location) like '%' || public.job_search_norm(loc) || '%'
      )
    )
    and (
      p_omit_facet = 'title'
      or coalesce(array_length(p_titles, 1), 0) = 0
      or public.job_search_norm(jp.title) = any (
        select public.job_search_norm(t) from unnest(p_titles) t
      )
    )
    and (
      p_omit_facet = 'domain'
      or coalesce(array_length(p_domains, 1), 0) = 0
      or public.job_search_norm(ep.industry) = any (
        select public.job_search_norm(d) from unnest(p_domains) d
      )
    )
    and (
      p_omit_facet = 'jobType'
      or coalesce(array_length(p_job_types, 1), 0) = 0
      or public.job_search_job_type_key(jp.job_type) = any (
        select public.job_search_job_type_key(t) from unnest(p_job_types) t
      )
    )
    and (
      p_omit_facet = 'workType'
      or coalesce(array_length(p_work_types, 1), 0) = 0
      or public.job_search_work_type_key(jp.work_type) = any (
        select public.job_search_work_type_key(t) from unnest(p_work_types) t
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
      or public.job_search_norm_arr(jp.required_skills) && public.job_search_norm_arr(p_skills)
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
      or public.job_search_norm_arr(jp.languages) && public.job_search_norm_arr(p_languages)
      or exists (
        select 1 from unnest(p_languages) lang
        where exists (
          select 1 from unnest(coalesce(jp.keywords, '{}'::text[])) k
          where public.job_search_norm(k) = public.job_search_norm(lang)
             or public.job_search_norm(k) like '%' || public.job_search_norm(lang) || '%'
        )
        or public.job_search_norm(jp.title) like '%' || public.job_search_norm(lang) || '%'
        or public.job_search_norm(jp.short_summary) like '%' || public.job_search_norm(lang) || '%'
      )
    );
$$;

revoke all on function public.job_search_job_type_key(text) from public;
revoke all on function public.job_search_work_type_key(text) from public;
revoke all on function public.job_search_norm_arr(text[]) from public;
revoke all on function public.job_search_structured_text(text, text, text, text[], text[], text) from public;
revoke all on function public.job_search_employer_text(text, text) from public;
revoke all on function public.job_search_tsquery(text) from public;

grant execute on function public.job_search_job_type_key(text) to anon, authenticated;
grant execute on function public.job_search_work_type_key(text) to anon, authenticated;
grant execute on function public.job_search_norm_arr(text[]) to anon, authenticated;
grant execute on function public.job_search_structured_text(text, text, text, text[], text[], text) to anon, authenticated;
grant execute on function public.job_search_employer_text(text, text) to anon, authenticated;
grant execute on function public.job_search_tsquery(text) to anon, authenticated;

analyze public.job_posts;
analyze public.employer_profiles;

notify pgrst, 'reload schema';
