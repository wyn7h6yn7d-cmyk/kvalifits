-- Server-side employer candidate discovery: filter, sort, paginate.
-- SECURITY INVOKER so existing seeker_profiles / seeker_certificates RLS still applies.
-- Employers receive only the current page of intentionally discoverable fields.
--
-- Query plan reviewed 2026-08-19 against live seeker_profiles / seeker_certificates
-- (before these indexes):
--   Limit -> Sort (updated_at DESC, user_id)
--     -> Seq Scan on seeker_profiles
--       Filter: profile_visible / skills / about / (B-license OR hashed complete-cert set)
--       SubPlan: Seq Scan on seeker_certificates
-- Existing indexes were only PKs + seeker_certificates(user_id), so the sort+filter
-- could not use an index. The two partial indexes below match this plan:
--   1) visible+complete profiles ordered by updated_at
--   2) complete certificate rows by user_id (smaller than a full cert seq scan)
-- Boolean / substring filters stay as extra Filter nodes on that subset.
-- Do not add GIN on free-text skills/languages: matching is substring + alias, not overlap.

alter table public.seeker_profiles
  add column if not exists languages text[] not null default '{}'::text[],
  add column if not exists discovery_accessible_workplace boolean not null default false,
  add column if not exists discovery_adapted_arrangement boolean not null default false,
  add column if not exists discovery_extra_breaks boolean not null default false,
  add column if not exists exp_seeking_first_job boolean not null default false,
  add column if not exists experience_duration_years numeric,
  add column if not exists pref_full_time boolean not null default false,
  add column if not exists pref_part_time boolean not null default false,
  add column if not exists pref_desired_weekly_hours numeric,
  add column if not exists pref_min_weekly_hours numeric,
  add column if not exists pref_max_weekly_hours numeric,
  add column if not exists pref_day_work boolean not null default false,
  add column if not exists pref_evening_work boolean not null default false,
  add column if not exists pref_shift_work boolean not null default false,
  add column if not exists pref_weekend_work boolean not null default false,
  add column if not exists pref_flexible_hours boolean not null default false,
  add column if not exists pref_remote_work boolean not null default false,
  add column if not exists pref_hybrid_work boolean not null default false,
  add column if not exists pref_on_site_work boolean not null default false;

create index if not exists seeker_profiles_discoverable_updated_idx
  on public.seeker_profiles (updated_at desc nulls last, user_id)
  where profile_visible = true
    and full_name is not null
    and location is not null
    and experience_level is not null
    and cardinality(coalesce(skills, '{}'::text[])) >= 1
    and btrim(coalesce(about, '')) <> '';

create index if not exists seeker_certificates_discoverable_user_idx
  on public.seeker_certificates (user_id)
  where btrim(coalesce(certificate_name, '')) <> ''
    and btrim(coalesce(certificate_issuer, '')) <> ''
    and certificate_valid_from is not null
    and certificate_valid_until is not null;

create or replace function public.discoverable_candidate_is_eligible(sp public.seeker_profiles)
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    sp.profile_visible is true
    and btrim(coalesce(sp.full_name, '')) <> ''
    and btrim(coalesce(sp.location, '')) <> ''
    and sp.experience_level is not null
    and btrim(coalesce(sp.about, '')) <> ''
    and cardinality(coalesce(sp.skills, '{}'::text[])) >= 1
    and (
      coalesce(sp.has_b_category_drivers_license, false)
      or exists (
        select 1
        from public.seeker_certificates sc
        where sc.user_id = sp.user_id
          and btrim(coalesce(sc.certificate_name, '')) <> ''
          and btrim(coalesce(sc.certificate_issuer, '')) <> ''
          and sc.certificate_valid_from is not null
          and sc.certificate_valid_until is not null
      )
    );
$$;

create or replace function public.discoverable_hours_overlap(
  p_desired numeric,
  p_min numeric,
  p_max numeric,
  p_filter_min numeric,
  p_filter_max numeric
) returns boolean
language sql
immutable
security invoker
set search_path = public
as $$
  select case
    when p_filter_min is null and p_filter_max is null then true
    when p_desired is not null then
      (p_filter_min is null or p_desired >= p_filter_min)
      and (p_filter_max is null or p_desired <= p_filter_max)
    when p_min is null and p_max is null then false
    else
      (p_filter_min is null or coalesce(p_max, p_min) >= p_filter_min)
      and (p_filter_max is null or coalesce(p_min, p_max) <= p_filter_max)
  end;
$$;

create or replace function public.discoverable_language_aliases(chip text)
returns text[]
language sql
immutable
security invoker
set search_path = public
as $$
  select case public.job_search_norm(chip)
    when 'eesti' then array['eesti', 'estonian', 'et']
    when 'inglise' then array['inglise', 'english', 'en']
    when 'vene' then array['vene', 'russian', 'ru', 'русский']
    else array[public.job_search_norm(chip)]
  end;
$$;

create or replace function public.discoverable_candidate_knows_language(
  p_languages text[],
  p_skills text[],
  p_chip text
) returns boolean
language sql
immutable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from unnest(public.discoverable_language_aliases(p_chip)) a(alias)
    where exists (
      select 1
      from unnest(coalesce(p_languages, '{}'::text[])) lang
      where public.job_search_norm(lang) = a.alias
         or public.job_search_norm(lang) like '%' || a.alias || '%'
         or a.alias like '%' || public.job_search_norm(lang) || '%'
    )
    or public.job_search_norm(array_to_string(coalesce(p_skills, '{}'::text[]), ' ')) like '%' || a.alias || '%'
  );
$$;

create or replace function public.discoverable_text_matches_any(p_haystack text[], p_needle text)
returns boolean
language sql
immutable
security invoker
set search_path = public
as $$
  select exists (
    select 1
    from unnest(coalesce(p_haystack, '{}'::text[])) h
    where public.job_search_norm(h) like '%' || public.job_search_norm(p_needle) || '%'
       or public.job_search_norm(p_needle) like '%' || public.job_search_norm(h) || '%'
  );
$$;

create or replace function public.discoverable_candidate_ids_matching(
  p_query text default null,
  p_seeking_first_job boolean default false,
  p_experience_not_required boolean default false,
  p_experience_years_min numeric default null,
  p_experience_years_max numeric default null,
  p_part_time boolean default false,
  p_full_time boolean default false,
  p_hours_min numeric default null,
  p_hours_max numeric default null,
  p_day_work boolean default false,
  p_evening_work boolean default false,
  p_shift_work boolean default false,
  p_weekend_work boolean default false,
  p_flexible_hours boolean default false,
  p_remote boolean default false,
  p_hybrid boolean default false,
  p_on_site boolean default false,
  p_accessible_workplace boolean default false,
  p_adapted_arrangement boolean default false,
  p_extra_breaks boolean default false,
  p_locations text[] default null,
  p_languages text[] default null,
  p_certificates text[] default null,
  p_skills text[] default null,
  p_availability text[] default null
)
returns table (user_id uuid, updated_at timestamptz)
language sql
stable
security invoker
set search_path = public
as $$
  with q as (
    select nullif(
      regexp_replace(left(public.job_search_norm(p_query), 200), '[%_]', ' ', 'g'),
      ''
    ) as needle
  )
  select sp.user_id, sp.updated_at
  from public.seeker_profiles sp
  cross join q
  where exists (
      select 1
      from public.employer_profiles ep
      where ep.owner_user_id = auth.uid()
    )
    and public.discoverable_candidate_is_eligible(sp)
    and (
      q.needle is null
      or public.job_search_norm(sp.full_name) like '%' || q.needle || '%'
      or public.job_search_norm(sp.profile_title) like '%' || q.needle || '%'
      or public.job_search_norm(sp.location) like '%' || q.needle || '%'
      or public.job_search_norm(sp.experience_level) like '%' || q.needle || '%'
      or public.discoverable_text_matches_any(sp.skills, q.needle)
      or public.discoverable_text_matches_any(sp.languages, q.needle)
      or public.discoverable_text_matches_any(sp.preferred_locations, q.needle)
      or public.discoverable_text_matches_any(sp.preferred_job_types, q.needle)
      or exists (
        select 1
        from public.seeker_certificates sc
        where sc.user_id = sp.user_id
          and btrim(coalesce(sc.certificate_name, '')) <> ''
          and public.job_search_norm(sc.certificate_name) like '%' || q.needle || '%'
      )
    )
    and (p_seeking_first_job is not true or coalesce(sp.exp_seeking_first_job, false))
    and (
      p_experience_not_required is not true
      or coalesce(sp.exp_seeking_first_job, false)
      or sp.experience_duration_years = 0
      or public.job_search_norm(sp.experience_level) in ('entry', 'not_required')
    )
    and (
      (p_experience_years_min is null and p_experience_years_max is null)
      or (
        sp.experience_duration_years is null
        and coalesce(sp.exp_seeking_first_job, false)
        and (p_experience_years_min is null or p_experience_years_min <= 0)
      )
      or (
        sp.experience_duration_years is not null
        and (p_experience_years_min is null or sp.experience_duration_years >= p_experience_years_min)
        and (p_experience_years_max is null or sp.experience_duration_years <= p_experience_years_max)
      )
    )
    and (p_part_time is not true or coalesce(sp.pref_part_time, false))
    and (p_full_time is not true or coalesce(sp.pref_full_time, false))
    and public.discoverable_hours_overlap(
      sp.pref_desired_weekly_hours,
      sp.pref_min_weekly_hours,
      sp.pref_max_weekly_hours,
      p_hours_min,
      p_hours_max
    )
    and (p_day_work is not true or coalesce(sp.pref_day_work, false))
    and (p_evening_work is not true or coalesce(sp.pref_evening_work, false))
    and (p_shift_work is not true or coalesce(sp.pref_shift_work, false))
    and (p_weekend_work is not true or coalesce(sp.pref_weekend_work, false))
    and (p_flexible_hours is not true or coalesce(sp.pref_flexible_hours, false))
    and (p_remote is not true or coalesce(sp.pref_remote_work, false))
    and (p_hybrid is not true or coalesce(sp.pref_hybrid_work, false))
    and (p_on_site is not true or coalesce(sp.pref_on_site_work, false))
    and (p_accessible_workplace is not true or coalesce(sp.discovery_accessible_workplace, false))
    and (p_adapted_arrangement is not true or coalesce(sp.discovery_adapted_arrangement, false))
    and (p_extra_breaks is not true or coalesce(sp.discovery_extra_breaks, false))
    and coalesce((
      select bool_and(
        public.job_search_norm(sp.location) like '%' || public.job_search_norm(loc) || '%'
        or public.job_search_norm(loc) like '%' || public.job_search_norm(sp.location) || '%'
        or public.discoverable_text_matches_any(sp.preferred_locations, loc)
      )
      from unnest(coalesce(p_locations, '{}'::text[])) loc
      where btrim(coalesce(loc, '')) <> ''
    ), true)
    and coalesce((
      select bool_and(public.discoverable_candidate_knows_language(sp.languages, sp.skills, lang))
      from unnest(coalesce(p_languages, '{}'::text[])) lang
      where btrim(coalesce(lang, '')) <> ''
    ), true)
    and coalesce((
      select bool_and(
        exists (
          select 1
          from public.seeker_certificates sc
          where sc.user_id = sp.user_id
            and btrim(coalesce(sc.certificate_name, '')) <> ''
            and (
              public.job_search_norm(sc.certificate_name) like '%' || public.job_search_norm(cert) || '%'
              or public.job_search_norm(cert) like '%' || public.job_search_norm(sc.certificate_name) || '%'
            )
        )
        or (
          (
            public.job_search_norm(cert) like '%b-kategooria%'
            or public.job_search_norm(cert) = 'b'
            or public.job_search_norm(cert) like '%b-category%'
          )
          and coalesce(sp.has_b_category_drivers_license, false)
        )
      )
      from unnest(coalesce(p_certificates, '{}'::text[])) cert
      where btrim(coalesce(cert, '')) <> ''
    ), true)
    and coalesce((
      select bool_and(public.discoverable_text_matches_any(sp.skills, skill))
      from unnest(coalesce(p_skills, '{}'::text[])) skill
      where btrim(coalesce(skill, '')) <> ''
    ), true)
    and coalesce((
      select bool_and(public.discoverable_text_matches_any(sp.preferred_job_types, avail))
      from unnest(coalesce(p_availability, '{}'::text[])) avail
      where btrim(coalesce(avail, '')) <> ''
    ), true);
$$;

create or replace function public.search_discoverable_candidates(
  p_query text default null,
  p_seeking_first_job boolean default false,
  p_experience_not_required boolean default false,
  p_experience_years_min numeric default null,
  p_experience_years_max numeric default null,
  p_part_time boolean default false,
  p_full_time boolean default false,
  p_hours_min numeric default null,
  p_hours_max numeric default null,
  p_day_work boolean default false,
  p_evening_work boolean default false,
  p_shift_work boolean default false,
  p_weekend_work boolean default false,
  p_flexible_hours boolean default false,
  p_remote boolean default false,
  p_hybrid boolean default false,
  p_on_site boolean default false,
  p_accessible_workplace boolean default false,
  p_adapted_arrangement boolean default false,
  p_extra_breaks boolean default false,
  p_locations text[] default null,
  p_languages text[] default null,
  p_certificates text[] default null,
  p_skills text[] default null,
  p_availability text[] default null,
  p_page integer default 1,
  p_page_size integer default 24
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_page integer := greatest(coalesce(p_page, 1), 1);
  v_size integer := least(greatest(coalesce(p_page_size, 24), 1), 30);
  v_total integer := 0;
  v_pages integer := 1;
  v_items jsonb := '[]'::jsonb;
begin
  if auth.uid() is null
     or not exists (
       select 1 from public.employer_profiles ep where ep.owner_user_id = auth.uid()
     )
  then
    return jsonb_build_object(
      'candidates', '[]'::jsonb,
      'total_count', 0,
      'current_page', 1,
      'total_pages', 1,
      'page_size', v_size
    );
  end if;

  select count(*)::integer into v_total
  from public.discoverable_candidate_ids_matching(
    p_query, p_seeking_first_job, p_experience_not_required,
    p_experience_years_min, p_experience_years_max,
    p_part_time, p_full_time, p_hours_min, p_hours_max,
    p_day_work, p_evening_work, p_shift_work, p_weekend_work, p_flexible_hours,
    p_remote, p_hybrid, p_on_site,
    p_accessible_workplace, p_adapted_arrangement, p_extra_breaks,
    p_locations, p_languages, p_certificates, p_skills, p_availability
  );

  v_pages := greatest(ceil(v_total::numeric / v_size::numeric), 1)::integer;
  if v_page > v_pages then
    v_page := v_pages;
  end if;

  select coalesce(
    jsonb_agg(item order by sort_updated desc nulls last, sort_user_id),
    '[]'::jsonb
  )
  into v_items
  from (
    select
      jsonb_build_object(
        'id', sp.user_id,
        'user_id', sp.user_id,
        'full_name', sp.full_name,
        'location', sp.location,
        'preferred_locations', coalesce(sp.preferred_locations, '{}'::text[]),
        'experience_level', sp.experience_level,
        'profile_title', sp.profile_title,
        'skills', coalesce(sp.skills, '{}'::text[]),
        'languages', coalesce(sp.languages, '{}'::text[]),
        'preferred_job_types', coalesce(sp.preferred_job_types, '{}'::text[]),
        'exp_seeking_first_job', coalesce(sp.exp_seeking_first_job, false),
        'experience_duration_years', sp.experience_duration_years,
        'pref_full_time', coalesce(sp.pref_full_time, false),
        'pref_part_time', coalesce(sp.pref_part_time, false),
        'pref_desired_weekly_hours', sp.pref_desired_weekly_hours,
        'pref_min_weekly_hours', sp.pref_min_weekly_hours,
        'pref_max_weekly_hours', sp.pref_max_weekly_hours,
        'pref_day_work', coalesce(sp.pref_day_work, false),
        'pref_evening_work', coalesce(sp.pref_evening_work, false),
        'pref_shift_work', coalesce(sp.pref_shift_work, false),
        'pref_weekend_work', coalesce(sp.pref_weekend_work, false),
        'pref_flexible_hours', coalesce(sp.pref_flexible_hours, false),
        'pref_remote_work', coalesce(sp.pref_remote_work, false),
        'pref_hybrid_work', coalesce(sp.pref_hybrid_work, false),
        'pref_on_site_work', coalesce(sp.pref_on_site_work, false),
        'discovery_accessible_workplace', coalesce(sp.discovery_accessible_workplace, false),
        'discovery_adapted_arrangement', coalesce(sp.discovery_adapted_arrangement, false),
        'discovery_extra_breaks', coalesce(sp.discovery_extra_breaks, false),
        'has_b_category_drivers_license', coalesce(sp.has_b_category_drivers_license, false),
        'updated_at', sp.updated_at,
        'certificates', coalesce((
          select jsonb_agg(cert_row order by cert_row->>'validUntil' desc nulls last)
          from (
            select jsonb_build_object(
              'name', btrim(sc.certificate_name),
              'validUntil', sc.certificate_valid_until,
              'issuer', nullif(btrim(coalesce(sc.certificate_issuer, '')), ''),
              'verification_status', sc.verification_status,
              'verified_at', sc.verified_at,
              'verification_source', sc.verification_source
            ) as cert_row
            from public.seeker_certificates sc
            where sc.user_id = sp.user_id
              and btrim(coalesce(sc.certificate_name, '')) <> ''
              and btrim(coalesce(sc.certificate_issuer, '')) <> ''
              and sc.certificate_valid_from is not null
              and sc.certificate_valid_until is not null
            order by sc.created_at desc
            limit 12
          ) certs
        ), '[]'::jsonb)
      ) as item,
      sp.updated_at as sort_updated,
      sp.user_id as sort_user_id
    from public.seeker_profiles sp
    join (
      select m.user_id, m.updated_at
      from public.discoverable_candidate_ids_matching(
        p_query, p_seeking_first_job, p_experience_not_required,
        p_experience_years_min, p_experience_years_max,
        p_part_time, p_full_time, p_hours_min, p_hours_max,
        p_day_work, p_evening_work, p_shift_work, p_weekend_work, p_flexible_hours,
        p_remote, p_hybrid, p_on_site,
        p_accessible_workplace, p_adapted_arrangement, p_extra_breaks,
        p_locations, p_languages, p_certificates, p_skills, p_availability
      ) m
      order by m.updated_at desc nulls last, m.user_id
      offset (v_page - 1) * v_size
      limit v_size
    ) page on page.user_id = sp.user_id
  ) listed;

  return jsonb_build_object(
    'candidates', coalesce(v_items, '[]'::jsonb),
    'total_count', v_total,
    'current_page', v_page,
    'total_pages', v_pages,
    'page_size', v_size
  );
end;
$$;

create or replace function public.discoverable_candidate_facets()
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_out jsonb := '{}'::jsonb;
begin
  if auth.uid() is null
     or not exists (
       select 1 from public.employer_profiles ep where ep.owner_user_id = auth.uid()
     )
  then
    return jsonb_build_object(
      'locations', '[]'::jsonb,
      'skills', '[]'::jsonb,
      'certificates', '[]'::jsonb,
      'availability', '[]'::jsonb,
      'languages', '[]'::jsonb
    );
  end if;

  v_out := jsonb_build_object(
    'locations', coalesce((
      select jsonb_agg(x.val order by x.cnt desc, x.val)
      from (
        select trim(part) as val, count(*)::int as cnt
        from public.seeker_profiles sp
        cross join lateral unnest(
          coalesce(sp.preferred_locations, '{}'::text[]) || array[sp.location]
        ) part
        where public.discoverable_candidate_is_eligible(sp)
          and char_length(trim(part)) between 2 and 48
        group by 1
        order by 2 desc, 1
        limit 40
      ) x
    ), '[]'::jsonb),
    'skills', coalesce((
      select jsonb_agg(x.val order by x.cnt desc, x.val)
      from (
        select trim(s) as val, count(*)::int as cnt
        from public.seeker_profiles sp
        cross join lateral unnest(coalesce(sp.skills, '{}'::text[])) s
        where public.discoverable_candidate_is_eligible(sp)
          and char_length(trim(s)) between 2 and 48
        group by 1
        order by 2 desc, 1
        limit 40
      ) x
    ), '[]'::jsonb),
    'certificates', coalesce((
      select jsonb_agg(x.val order by x.cnt desc, x.val)
      from (
        select trim(c) as val, count(*)::int as cnt
        from (
          select sc.certificate_name as c
          from public.seeker_profiles sp
          join public.seeker_certificates sc on sc.user_id = sp.user_id
          where public.discoverable_candidate_is_eligible(sp)
            and btrim(coalesce(sc.certificate_name, '')) <> ''
            and btrim(coalesce(sc.certificate_issuer, '')) <> ''
            and sc.certificate_valid_from is not null
            and sc.certificate_valid_until is not null
          union all
          select 'B-kategooria'
          from public.seeker_profiles sp
          where public.discoverable_candidate_is_eligible(sp)
            and coalesce(sp.has_b_category_drivers_license, false)
        ) names
        where char_length(trim(c)) between 2 and 64
        group by 1
        order by 2 desc, 1
        limit 40
      ) x
    ), '[]'::jsonb),
    'availability', coalesce((
      select jsonb_agg(x.val order by x.cnt desc, x.val)
      from (
        select trim(a) as val, count(*)::int as cnt
        from public.seeker_profiles sp
        cross join lateral unnest(coalesce(sp.preferred_job_types, '{}'::text[])) a
        where public.discoverable_candidate_is_eligible(sp)
          and char_length(trim(a)) between 2 and 48
        group by 1
        order by 2 desc, 1
        limit 30
      ) x
    ), '[]'::jsonb),
    'languages', coalesce((
      select jsonb_agg(x.val order by x.cnt desc, x.val)
      from (
        select trim(l) as val, count(*)::int as cnt
        from (
          select unnest(array['Eesti', 'Inglise', 'Vene']) as l
          union all
          select lang
          from public.seeker_profiles sp
          cross join lateral unnest(coalesce(sp.languages, '{}'::text[])) lang
          where public.discoverable_candidate_is_eligible(sp)
        ) langs
        where char_length(trim(l)) between 2 and 32
        group by 1
        order by 2 desc, 1
        limit 20
      ) x
    ), '[]'::jsonb)
  );

  return v_out;
end;
$$;

revoke all on function public.discoverable_candidate_is_eligible(public.seeker_profiles) from public;
revoke all on function public.discoverable_hours_overlap(numeric, numeric, numeric, numeric, numeric) from public;
revoke all on function public.discoverable_language_aliases(text) from public;
revoke all on function public.discoverable_candidate_knows_language(text[], text[], text) from public;
revoke all on function public.discoverable_text_matches_any(text[], text) from public;
revoke all on function public.discoverable_candidate_ids_matching(text, boolean, boolean, numeric, numeric, boolean, boolean, numeric, numeric, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text[], text[], text[], text[], text[]) from public;
revoke all on function public.search_discoverable_candidates(text, boolean, boolean, numeric, numeric, boolean, boolean, numeric, numeric, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text[], text[], text[], text[], text[], integer, integer) from public;
revoke all on function public.discoverable_candidate_facets() from public;

revoke all on function public.discoverable_candidate_is_eligible(public.seeker_profiles) from anon;
revoke all on function public.discoverable_hours_overlap(numeric, numeric, numeric, numeric, numeric) from anon;
revoke all on function public.discoverable_language_aliases(text) from anon;
revoke all on function public.discoverable_candidate_knows_language(text[], text[], text) from anon;
revoke all on function public.discoverable_text_matches_any(text[], text) from anon;
revoke all on function public.discoverable_candidate_ids_matching(text, boolean, boolean, numeric, numeric, boolean, boolean, numeric, numeric, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text[], text[], text[], text[], text[]) from anon;
revoke all on function public.search_discoverable_candidates(text, boolean, boolean, numeric, numeric, boolean, boolean, numeric, numeric, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text[], text[], text[], text[], text[], integer, integer) from anon;
revoke all on function public.discoverable_candidate_facets() from anon;

grant execute on function public.discoverable_candidate_is_eligible(public.seeker_profiles) to authenticated;
grant execute on function public.discoverable_hours_overlap(numeric, numeric, numeric, numeric, numeric) to authenticated;
grant execute on function public.discoverable_language_aliases(text) to authenticated;
grant execute on function public.discoverable_candidate_knows_language(text[], text[], text) to authenticated;
grant execute on function public.discoverable_text_matches_any(text[], text) to authenticated;
grant execute on function public.discoverable_candidate_ids_matching(text, boolean, boolean, numeric, numeric, boolean, boolean, numeric, numeric, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text[], text[], text[], text[], text[]) to authenticated;
grant execute on function public.search_discoverable_candidates(text, boolean, boolean, numeric, numeric, boolean, boolean, numeric, numeric, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text[], text[], text[], text[], text[], integer, integer) to authenticated;
grant execute on function public.discoverable_candidate_facets() to authenticated;

notify pgrst, 'reload schema';
