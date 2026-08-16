-- Admin RLS consistency (mirror of migration 20260816_admin_rls_consistency.sql).
-- Run in Supabase SQL Editor if needed.

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

comment on function public.current_user_is_admin() is
  'True when auth.uid() has profiles.role = admin. SECURITY DEFINER; do not use JWT metadata.';

revoke all on function public.current_user_is_admin() from public;
revoke all on function public.current_user_is_admin() from anon;
grant execute on function public.current_user_is_admin() to authenticated;

alter table public.profiles enable row level security;
drop policy if exists "admin_select_profiles" on public.profiles;
create policy "admin_select_profiles"
  on public.profiles for select to authenticated
  using (public.current_user_is_admin());
drop policy if exists "admin_update_profiles" on public.profiles;
create policy "admin_update_profiles"
  on public.profiles for update to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

alter table public.seeker_profiles enable row level security;
drop policy if exists "admin_select_seeker_profiles" on public.seeker_profiles;
create policy "admin_select_seeker_profiles"
  on public.seeker_profiles for select to authenticated
  using (public.current_user_is_admin());

alter table public.seeker_certificates enable row level security;
drop policy if exists "admin_select_seeker_certificates" on public.seeker_certificates;
create policy "admin_select_seeker_certificates"
  on public.seeker_certificates for select to authenticated
  using (public.current_user_is_admin());
drop policy if exists "admin_update_seeker_certificates" on public.seeker_certificates;
create policy "admin_update_seeker_certificates"
  on public.seeker_certificates for update to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

alter table public.employer_profiles enable row level security;
drop policy if exists "admin_select_employer_profiles" on public.employer_profiles;
create policy "admin_select_employer_profiles"
  on public.employer_profiles for select to authenticated
  using (public.current_user_is_admin());
drop policy if exists "admin_update_employer_profiles" on public.employer_profiles;
create policy "admin_update_employer_profiles"
  on public.employer_profiles for update to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

alter table public.job_posts enable row level security;
drop policy if exists "admin_select_job_posts" on public.job_posts;
create policy "admin_select_job_posts"
  on public.job_posts for select to authenticated
  using (public.current_user_is_admin());
drop policy if exists "admin_update_job_posts" on public.job_posts;
create policy "admin_update_job_posts"
  on public.job_posts for update to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());
drop policy if exists "admin_delete_job_posts" on public.job_posts;
create policy "admin_delete_job_posts"
  on public.job_posts for delete to authenticated
  using (public.current_user_is_admin());

alter table public.job_applications enable row level security;
drop policy if exists "admin_select_all_applications" on public.job_applications;
drop policy if exists "admin_select_job_applications" on public.job_applications;
create policy "admin_select_job_applications"
  on public.job_applications for select to authenticated
  using (public.current_user_is_admin());

alter table public.job_post_reports enable row level security;
drop policy if exists "admin_select_job_post_reports" on public.job_post_reports;
create policy "admin_select_job_post_reports"
  on public.job_post_reports for select to authenticated
  using (public.current_user_is_admin());
drop policy if exists "admin_update_job_post_reports" on public.job_post_reports;
create policy "admin_update_job_post_reports"
  on public.job_post_reports for update to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

alter table public.admin_audit_log enable row level security;
drop policy if exists "admin_select_admin_audit_log" on public.admin_audit_log;
create policy "admin_select_admin_audit_log"
  on public.admin_audit_log for select to authenticated
  using (public.current_user_is_admin());
drop policy if exists "admin_insert_admin_audit_log" on public.admin_audit_log;
create policy "admin_insert_admin_audit_log"
  on public.admin_audit_log for insert to authenticated
  with check (public.current_user_is_admin() and actor_id = auth.uid());

alter table public.legal_retention_records enable row level security;
drop policy if exists "admin_select_legal_retention_records" on public.legal_retention_records;
create policy "admin_select_legal_retention_records"
  on public.legal_retention_records for select to authenticated
  using (public.current_user_is_admin());

alter table public.account_deletion_events enable row level security;
drop policy if exists "admin_select_account_deletion_events" on public.account_deletion_events;
create policy "admin_select_account_deletion_events"
  on public.account_deletion_events for select to authenticated
  using (public.current_user_is_admin());

drop policy if exists "certificates_select_admin" on storage.objects;
create policy "certificates_select_admin"
  on storage.objects for select to authenticated
  using (bucket_id = 'certificates' and public.current_user_is_admin());

notify pgrst, 'reload schema';
