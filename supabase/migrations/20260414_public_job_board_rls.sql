-- Public job board (/tood): visitors without a session use the Supabase anon key.
-- Without SELECT policies for anon, RLS hides all rows.

-- Published job posts readable by anyone (anon + logged-in users).
drop policy if exists "job_posts_select_published_public" on public.job_posts;
create policy "job_posts_select_published_public"
on public.job_posts
for select
to anon, authenticated
using ((status)::text = 'published');

-- Employer name on listings: superseded by 20260415 (security definer helper avoids RLS recursion
-- when job_posts policies reference employer_profiles). Kept as drop-only for idempotency.
drop policy if exists "employer_profiles_select_for_published_jobs" on public.employer_profiles;

-- Employers must still read/update their own company row (e.g. drafts, onboarding).
drop policy if exists "employer_profiles_select_own" on public.employer_profiles;
create policy "employer_profiles_select_own"
on public.employer_profiles
for select
to authenticated
using (owner_user_id = auth.uid());
