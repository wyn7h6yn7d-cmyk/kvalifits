# Kvalifits — Remote Migration Apply Plan

Remote Supabase project (linked): `svqdycsticovpudcgqvq`  
RLS suite run against: `https://svqdycsticovpudcgqvq.supabase.co`

## What we verified remotely (blocking gaps)

### Cron is not enabled (root cause for cron-dependent RLS checks)
- `select extname from pg_extension where extname='pg_cron'` returned **0 rows** (no `pg_cron` extension present).
- `select schema_name from information_schema.schemata where schema_name='cron'` returned **no `cron` schema**.
- Therefore, `cron.job` / `cron.job_run_details` relations cannot exist yet (matches the failures in the screenshot: `relation "cron.job" does not exist`).

### Security suite missing objects (must be created by migrations)
From `npm run test:security` (RLS security suite):
- Storage buckets / policies missing:
  - `resumes` (private CV uploads/downloads): “Bucket not found”
  - `certificates` (private certificate storage / downloads): bucket not found (affected flows)
- Missing schema objects:
  - `public.seeker_work_capacity` (work-capacity privacy checks)
  - `public.seeker_education` (seeker education table check)
  - `public.notifications` (in-app notifications table check)
- Missing RPC:
  - `public.search_discoverable_candidates(...)` (employer candidate discovery authorization check)

## Migration status / convergence strategy

We cannot assume remote “migration history” matches the repo’s migration filenames 1:1.
In the linked remote, `supabase migration list --linked` shows applied migration version strings that **do not appear as migration filenames** in the current `supabase/migrations/` directory.  
Practical consequence: the safest convergence approach is to apply the repo’s pending migrations to bring the remote schema/policies to the expected state, then re-run the security suite.

## Phase-based apply order (minimize time-to-signal)

Apply migrations in the same dependency order they are versioned in `supabase/migrations/`, but focus on these “must-fix first” migrations (they correspond directly to the missing objects above):

### Phase 0 — Cron enablement + cron job wiring
These migrations contain `pg_cron` / cron references and are expected to create/ensure the scheduled jobs:
- `20260817210000_archive_expired_job_posts_cron.sql`
- `20260818201000_reconciliation_search_taxonomy_cron.sql`
- `20260819120000_notifications.sql` (notifications + cron-dependent scheduling parts)

If these migrations are written to “degrade gracefully” when `pg_cron` is absent, then the post-apply verification must include confirming `pg_cron` is actually installed (not just that functions were created).

### Phase 1 — Storage buckets + storage policies
- Private CV bucket:
  - `20260818140000_private_cv_resumes_storage.sql`
- Private certificates bucket:
  - `20260816_certificates_private_storage.sql`
- Public avatar/logo storage security (needed for PASS expectations in suite):
  - `20260816_avatars_storage_security.sql`

### Phase 2 — RLS for missing core tables + notifications
- In-app notifications:
  - `20260819120000_notifications.sql`
- Seeker education:
  - `20260819150000_seeker_education.sql`

### Phase 3 — RPC + RLS for employer discovery
- `20260819170000_search_discoverable_candidates.sql`

### Phase 4 — Saved search delivery + delivery ledger / `last_notified_at` behavior
Suite failures include:
- unexpected insert behavior / inability to set/forge `last_notified_at`
- delivery ledger cursor restrictions

Relevant migrations:
- `20260817104533_saved_job_searches.sql`
- `20260819140000_saved_search_alert_delivery.sql`

## Commands (apply + verify)

### Preflight
1. Confirm CLI is linked:
   - `supabase link --project-ref svqdycsticovpudcgqvq`
2. Snapshot current migration diff:
   - `supabase migration list --linked`

### Apply pending migrations to remote
Run the CLI migration apply for the linked project:
- `supabase migration up --linked --yes`

If the CLI indicates it is skipping migrations that should be applied, rerun with:
- `supabase migration up --linked --include-all --yes`

### Post-apply verification (must re-run)
Cron checks:
- `select extname from pg_extension where extname='pg_cron';`
- `select to_regclass('cron.job') as cron_job;`
- `select to_regclass('cron.job_run_details') as cron_job_run_details;`

Storage checks:
- `select name from storage.buckets order by name;`
  - ensure `resumes` and `certificates` exist

Schema checks:
- `select to_regclass('public.notifications') as notifications;`
- `select to_regclass('public.seeker_education') as seeker_education;`
- `select to_regproc('public.search_discoverable_candidates') as search_discoverable_candidates;` (or verify by calling RPC signature via `supabase db rpc` if needed)

Final authoritative check:
- `npm run test:security`

## Potential conflicts & what to do if a migration fails

Because remote migration history may not match the repo’s current migration filenames:
- A migration can fail due to already-existing objects (tables/policies/buckets/functions) that are named slightly differently.
- An RLS migration can fail due to policy recursion/stack depth issues if earlier policies partially exist.

Recommended response if migration application fails:
1. Stop and capture the failing migration filename + error.
2. Run the failing migration in a staging replica if possible (or manually fix the schema in a controlled SQL session).
3. Re-run only after the failing migration can apply cleanly.

## Exit criteria

Remote is considered “migration-aligned” only when:
- `pg_cron` + `cron.*` relations exist and cron-dependent functions/jobs can be observed
- `resumes` + `certificates` storage buckets exist
- `public.notifications` and `public.seeker_education` exist
- `public.search_discoverable_candidates(...)` is present
- `npm run test:security` goes to `Total 62 | PASS 62 | FAIL 0`

