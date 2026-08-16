-- RLS security audit dump (read-only).
-- Paste full Results into chat (or export CSV).
-- Covers: profiles, seeker_profiles, seeker_certificates, seeker_workplace_needs,
--         seeker_work_capacity, employer_profiles, job_posts, job_applications,
--         job_application_internal_notes, job_post_reports

with target(table_name) as (
  values
    ('profiles'),
    ('seeker_profiles'),
    ('seeker_certificates'),
    ('seeker_workplace_needs'),
    ('seeker_work_capacity'),
    ('employer_profiles'),
    ('job_posts'),
    ('job_applications'),
    ('job_application_internal_notes'),
    ('job_post_reports')
),
rls as (
  select c.relname as table_name, c.relrowsecurity as rls_enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join target t on t.table_name = c.relname
  where n.nspname = 'public'
    and c.relkind = 'r'
),
policies as (
  select
    p.tablename as table_name,
    coalesce(
      string_agg(
        p.policyname || ' [' || p.cmd || ' → ' || coalesce(array_to_string(p.roles, ','), 'public') || ']',
        ' | ' order by p.policyname
      ),
      '(none)'
    ) as policies_remote
  from pg_policies p
  join target t on t.table_name = p.tablename
  where p.schemaname = 'public'
  group by p.tablename
),
grants as (
  select
    t.table_name,
    coalesce(
      (
        select string_agg(priv || ':' || role, ', ' order by role, priv)
        from (
          select distinct grantee::text as role, privilege_type::text as priv
          from information_schema.role_table_grants g
          where g.table_schema = 'public'
            and g.table_name = t.table_name
            and g.grantee in ('anon', 'authenticated', 'public')
        ) x
      ),
      '(none for anon/authenticated/public)'
    ) as grants_remote
  from target t
)
select
  t.table_name as "TABLE",
  case
    when r.table_name is null then 'TABLE MISSING'
    when r.rls_enabled then 'ENABLED'
    else 'DISABLED'
  end as "RLS REMOTE",
  coalesce(p.policies_remote, '(none)') as "POLICIES REMOTE",
  g.grants_remote as "GRANTS REMOTE (anon/authenticated/public)"
from target t
left join rls r on r.table_name = t.table_name
left join policies p on p.table_name = t.table_name
left join grants g on g.table_name = t.table_name
order by t.table_name;
