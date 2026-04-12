-- Fixes: infinite recursion detected in policy for relation "employer_profiles"
-- Cause: employer_profiles SELECT policy used EXISTS on job_posts; job_posts RLS
-- can re-check employer_profiles → cycle. This helper reads job_posts with RLS off.

create or replace function public.employer_profile_has_published_job(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.job_posts jp
    where jp.employer_profile_id = profile_id
      and (jp.status)::text = 'published'
  );
$$;

revoke all on function public.employer_profile_has_published_job(uuid) from public;
grant execute on function public.employer_profile_has_published_job(uuid) to anon, authenticated;

drop policy if exists "employer_profiles_select_for_published_jobs" on public.employer_profiles;
create policy "employer_profiles_select_for_published_jobs"
on public.employer_profiles
for select
to anon, authenticated
using (public.employer_profile_has_published_job(id));
