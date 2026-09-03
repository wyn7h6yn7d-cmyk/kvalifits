-- Homepage showcase view: include logo_url for approved plate rendering.
-- Still requires admin homepage_logo_approved + show_on_homepage.

drop view if exists public.employer_show_on_homepage_profiles;

create view public.employer_show_on_homepage_profiles
with (security_invoker = false, security_barrier = true)
as
select
  ep.id,
  ep.public_slug,
  ep.company_name,
  ep.logo_url,
  ep.carousel_logo_path,
  ep.use_logo_plate,
  ep.website
from public.employer_profiles ep
where coalesce(ep.show_on_homepage, false) = true
  and coalesce(ep.homepage_logo_approved, false) = true
  and ep.public_slug is not null
  and btrim(coalesce(ep.company_name, '')) <> ''
  and btrim(coalesce(ep.logo_url, '')) <> ''
  and btrim(coalesce(ep.carousel_logo_path, '')) <> ''
  and public.employer_profile_has_published_job(ep.id);

comment on view public.employer_show_on_homepage_profiles is
  'Homepage logo carousel: admin-approved employers only (show_on_homepage + homepage_logo_approved), with transparent carousel asset or plate-ready original logo.';

revoke all on table public.employer_show_on_homepage_profiles from public;
revoke all on table public.employer_show_on_homepage_profiles from anon;
revoke all on table public.employer_show_on_homepage_profiles from authenticated;
grant select on table public.employer_show_on_homepage_profiles to anon, authenticated;
