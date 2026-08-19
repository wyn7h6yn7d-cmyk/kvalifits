-- Final RLS security fixes (forward migration).
-- 1) Restore employer_profiles column-level grants undone by reconciliation_security_final.
-- 2) Restrict authenticated non-owners to employer_public_profiles view for company reads.
-- 3) Fix discovery RPC pagination overlap when requested page exceeds total pages.

-- ---------------------------------------------------------------------------
-- employer_profiles: public view + column grants + RLS
-- ---------------------------------------------------------------------------
drop view if exists public.employer_saved_public_profiles;
drop view if exists public.employer_public_profiles;

create view public.employer_public_profiles
with (security_invoker = false, security_barrier = true)
as
select
  ep.id,
  ep.public_slug,
  ep.company_name,
  ep.logo_url,
  ep.location,
  ep.industry,
  ep.website,
  ep.company_description,
  ep.company_verified,
  ep.verification_status
from public.employer_profiles ep
where public.employer_profile_has_published_job(ep.id);

comment on view public.employer_public_profiles is
  'Public company directory and job-card fields. No owner, contacts, registry, or search indexes.';

revoke all on table public.employer_public_profiles from public;
revoke all on table public.employer_public_profiles from anon;
revoke all on table public.employer_public_profiles from authenticated;
grant select on table public.employer_public_profiles to anon, authenticated;

do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'current_user_saved_job_for_employer'
      and pg_get_function_identity_arguments(p.oid) = 'uuid'
  ) then
    execute $v$
      create view public.employer_saved_public_profiles
      with (security_invoker = false, security_barrier = true)
      as
      select
        ep.id,
        ep.public_slug,
        ep.company_name,
        ep.logo_url,
        ep.location,
        ep.industry,
        ep.website,
        ep.company_description,
        ep.company_verified,
        ep.verification_status
      from public.employer_profiles ep
      where public.current_user_saved_job_for_employer(ep.id)
    $v$;
    execute $c$
      comment on view public.employer_saved_public_profiles is
        'Public company fields for employers the current user saved a job from. No private contacts.'
    $c$;
    execute 'revoke all on table public.employer_saved_public_profiles from public';
    execute 'revoke all on table public.employer_saved_public_profiles from anon';
    execute 'revoke all on table public.employer_saved_public_profiles from authenticated';
    execute 'grant select on table public.employer_saved_public_profiles to authenticated';
  end if;
end $$;

drop policy if exists "employer_profiles_select_for_published_jobs" on public.employer_profiles;
create policy "employer_profiles_select_for_published_jobs"
  on public.employer_profiles
  for select
  to anon
  using (public.employer_profile_has_published_job(id));

drop policy if exists "employer_profiles_select_for_saved_jobs" on public.employer_profiles;

revoke all on table public.employer_profiles from public;
revoke all on table public.employer_profiles from anon;
revoke all on table public.employer_profiles from authenticated;

grant select (
  id,
  public_slug,
  company_name,
  logo_url,
  location,
  industry,
  website,
  company_description,
  company_verified,
  verification_status
) on table public.employer_profiles to anon, authenticated;

grant select (
  owner_user_id,
  registry_code,
  contact_email,
  contact_phone,
  company_size,
  created_at,
  updated_at,
  verification_source,
  verified_at
) on table public.employer_profiles to authenticated;

grant insert, update on table public.employer_profiles to authenticated;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'employer_profiles'
      and column_name = 'industry_id'
  ) then
    execute 'grant select (industry_id) on table public.employer_profiles to anon, authenticated';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- search_discoverable_candidates: empty page when p_page > total_pages
-- ---------------------------------------------------------------------------
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

  v_pages := case
    when v_total = 0 then 1
    else greatest(ceil(v_total::numeric / v_size::numeric), 1)::integer
  end;

  if v_page > v_pages then
    return jsonb_build_object(
      'candidates', '[]'::jsonb,
      'total_count', v_total,
      'current_page', v_page,
      'total_pages', v_pages,
      'page_size', v_size
    );
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

revoke all on function public.search_discoverable_candidates(text, boolean, boolean, numeric, numeric, boolean, boolean, numeric, numeric, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text[], text[], text[], text[], text[], integer, integer) from public;
revoke all on function public.search_discoverable_candidates(text, boolean, boolean, numeric, numeric, boolean, boolean, numeric, numeric, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text[], text[], text[], text[], text[], integer, integer) from anon;
grant execute on function public.search_discoverable_candidates(text, boolean, boolean, numeric, numeric, boolean, boolean, numeric, numeric, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, text[], text[], text[], text[], text[], integer, integer) to authenticated;

notify pgrst, 'reload schema';
