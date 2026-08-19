-- Mirror of migration 20260818170000_employer_profiles_owner_user_id_unique.sql.
-- Idempotent. Does not delete duplicate rows; fails if duplicates exist.

-- One employer_profiles row per owner user.
-- Production already has UNIQUE (owner_user_id) (employer_profiles_owner_user_id_key)
-- and 0 duplicate owners. This records the constraint in migrations for fresh
-- applies. Does not delete rows: if duplicates exist, the migration fails.

-- Fail closed if duplicate owners are already present (manual reconcile; do not auto-delete).
do $$
declare
  duplicate_owners int;
begin
  select count(*)::int into duplicate_owners
  from (
    select owner_user_id
    from public.employer_profiles
    where owner_user_id is not null
    group by owner_user_id
    having count(*) > 1
  ) d;

  if duplicate_owners > 0 then
    raise exception
      'employer_profiles has % owner_user_id value(s) with more than one row. Do not auto-delete. Reconcile, then re-run this migration.',
      duplicate_owners;
  end if;
end $$;

alter table public.employer_profiles
  alter column owner_user_id set not null;

do $$
begin
  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'employer_profiles'
      and c.contype = 'u'
      and pg_get_constraintdef(c.oid) = 'UNIQUE (owner_user_id)'
  ) then
    return;
  end if;

  if exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'employer_profiles'
      and indexdef ilike '%UNIQUE%'
      and indexdef ~ '\(owner_user_id\)'
  ) then
    return;
  end if;

  alter table public.employer_profiles
    add constraint employer_profiles_owner_user_id_key unique (owner_user_id);
end $$;

do $$
begin
  if exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'employer_profiles'
      and c.conname = 'employer_profiles_owner_user_id_key'
  ) then
    execute $c$
      comment on constraint employer_profiles_owner_user_id_key on public.employer_profiles is
        'One company profile per owner user. Concurrent onboarding INSERTs must not create a second row.'
    $c$;
  end if;
end $$;

notify pgrst, 'reload schema';
