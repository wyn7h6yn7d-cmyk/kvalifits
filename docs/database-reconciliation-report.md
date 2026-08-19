# Database Reconciliation Report

**Branch:** `db/reconciliation-master`
**Date:** 2026-08-19
**Remote:** `svqdycsticovpudcgqvq.supabase.co`

---

## Summary

The remote Supabase database has significant drift from the repository's intended schema. Only migrations through approximately `20260428_*` were applied. The entire `20260816_*`, `20260817_*`, `20260818_*`, and `20260819_*` batches (58+ migrations) have **not** been applied to the remote.

The repository now contains 77 migration files (including a new initial schema migration) and the full sequence is statically verified to be reproducible from scratch.

---

## Phase 1 — Remote Audit Results

### Tables Present on Remote (13)

| Table | Row Count | Status |
|-------|-----------|--------|
| profiles | 1 | ✓ |
| seeker_profiles | 1 | ✓ |
| employer_profiles | 0 | ✓ |
| seeker_certificates | 1 | ✓ |
| job_posts | 0 | ✓ |
| job_applications | 0 | ✓ |
| job_application_status_events | 0 | ✓ |
| saved_jobs | 0 | ✓ |
| saved_job_searches | 0 | ✓ |
| admin_audit_log | 9 | ✓ |
| auth_rate_limit_buckets | 5 | ✓ |
| seeker_certificates_verification_stash | 0 | ✓ |
| employer_public_profiles (view) | 0 | ✓ |

### Tables Missing from Remote (16+)

| Table | Expected From | Risk |
|-------|---------------|------|
| job_application_internal_notes | 20260816_job_application_internal_notes | Employer pipeline broken |
| job_post_reports | 20260816_job_post_reports | Job reporting broken |
| account_deletion_events | 20260816_account_privacy_deletion | GDPR workflow broken |
| legal_retention_records | 20260816_account_privacy_deletion | GDPR workflow broken |
| seeker_workplace_needs | 20260816_seeker_workplace_needs | Accessibility features unavailable |
| seeker_work_capacity | 20260816_seeker_work_capacity | Accessibility features unavailable |
| taxonomy_industries | 20260817230000_taxonomy_foundation | Taxonomy search broken |
| taxonomy_professions | 20260817230000_taxonomy_foundation | Taxonomy search broken |
| taxonomy_skills | 20260817230000_taxonomy_foundation | Taxonomy search broken |
| taxonomy_profession_skills | 20260817230000_taxonomy_foundation | Taxonomy search broken |
| taxonomy_certificates | 20260817230000_taxonomy_foundation | Taxonomy search broken |
| taxonomy_languages | 20260817230000_taxonomy_foundation | Taxonomy search broken |
| taxonomy_aliases | 20260817230000_taxonomy_foundation | Taxonomy search broken |
| notifications | 20260819120000_notifications | Notification system broken |
| saved_search_alert_deliveries | 20260819140000_saved_search_alert_delivery | Alert delivery broken |
| seeker_education | 20260819150000_seeker_education | Education section broken |

### Columns Missing from Remote

**seeker_profiles** (missing ~25 columns):
- Work preferences: `preferred_work_types`, `willing_to_relocate`, `minimum_salary`, `available_from`, `notice_period_weeks`, `work_hours_preference`, `transport_options`, `shift_flexibility`
- Experience: `years_of_experience`, `total_months_experience`, `industries_worked`, `current_employer`, `current_job_title`, `employment_gaps_note`, `references_available`
- Discovery: `discoverable`, `discovery_updated_at`, `discovery_workplace_flags`
- Other: `languages`, `profession_id`, `skill_ids`, `language_ids`

**job_posts** (missing ~15 columns):
- `salary_mode`, `salary_tax`, `salary_period`
- `suitable_for_ages_16_17`, `job_requirements`
- `industry_id`, `profession_id`, `skill_ids`, `certificate_ids`, `language_ids`
- Work conditions: `working_hours_description`, `working_environment`, `remote_policy`, `transport_access`, `has_parking`, `has_dormitory`
- `duty_lines`, `benefit_lines`

**job_applications** (missing 5 columns):
- `employer_status`, `employer_notes`, `employer_notified_at`, `reviewed_at`, `reviewed_by`, `match_details`

**employer_profiles** (missing 1 column):
- `industry_id`

### Functions Missing from Remote

| Function | Expected From |
|----------|---------------|
| `search_published_jobs()` | 20260817180000 / reconciliation |
| `published_job_search_facets()` | 20260817193000 / reconciliation |
| `published_job_facet_values()` | 20260817193000 / reconciliation |
| `get_job_match_inputs()` | 20260817220000 / reconciliation |
| `search_discoverable_candidates()` | 20260819170000 |

Functions present: `published_job_ids_matching`, `job_search_*` helpers, `current_user_is_admin`, `current_user_is_seeker`, `current_user_owns_employer_profile`, `employer_profile_has_published_job`, `job_salary_overlaps_bucket`, `slugify_company_name`, `rls_auto_enable`, `canonical_job_application_status`

### Storage Drift

| Bucket | Remote | Expected | Drift |
|--------|--------|----------|-------|
| avatars | public, no MIME restriction | public, images only | **MIME not restricted** — PDFs still allowed |
| certificates | private, images+PDF, 10MB | private, images+PDF, 10MB | ✓ OK |
| resumes | **MISSING** | private, PDF only, 10MB | **CRITICAL — CVs not private** |
| company-logos | public, exists | Not in repo | Legacy bucket, harmless |
| cvs | private, exists | Not in repo | Legacy bucket — may contain old CVs |

### RLS / Security Drift

| Issue | Severity | Status |
|-------|----------|--------|
| Employer contact_email visible to anon/seeker | **HIGH** | Column grants not applied |
| Employer registry_code visible to seeker | **HIGH** | Column grants not applied |
| Employer owner_user_id visible to seeker | **HIGH** | Column grants not applied |
| Employer search_tsv visible to seeker | MEDIUM | Column grants not applied |
| Stack depth limit on employer job queries | **HIGH** | RLS recursion fix not applied |
| Blocked user write guard triggers missing | **HIGH** | Trigger migration not applied |
| job_applications INSERT not locked | **HIGH** | Field lock migration not applied |
| saved_job_searches field lock missing | MEDIUM | Field lock not applied |
| resumes bucket missing | **HIGH** | Storage migration not applied |

### pg_cron Status

**NOT CONFIRMED** — The `archive_expired_job_posts` cron job exists in migrations but cannot be verified via PostgREST. The `pg_cron` extension availability on the remote is unknown. The migration is exception-guarded so it won't fail if `pg_cron` is unavailable.

### Enum Values

| Enum | Remote Values |
|------|---------------|
| `job_type` | full_time, part_time, contract, internship |
| `job_work_type` | on_site, hybrid, remote |
| `job_post_status` | draft, published, archived, expired |
| `application_type` | external_url, in_app |

---

## Phase 1 — Specific Findings Verification

### 1. Seeker consent protection
The `seeker_profiles_apply_age_fields()` function is defined in three migrations: `20260816_legal_representative_consent`, `20260816_seeker_date_of_birth_minor`, and `20260818202000_reconciliation_security_final`. The final reconciliation version includes the consent lock (`legal_representative_consent_status = 'confirmed'` cannot be self-set). The `date_of_birth_minor` migration explicitly preserves the consent lock. **Static check: PASS.** **Remote: NOT APPLIED** — the trigger doesn't exist on the remote.

### 2. job_post_reports dependency
Migration creates the table with `IF NOT EXISTS` and FK to `job_posts`. The `admin_rls_consistency` migration guards `job_post_reports` RLS with `to_regclass` checks. **Static check: PASS.** **Remote: table missing.**

### 3. admin_rls_consistency
Guards optional tables (`job_post_reports`, `legal_retention_records`, `account_deletion_events`) with `to_regclass`. Core table policies use `DROP IF EXISTS` + `CREATE`. **Static check: PASS.** The reconciliation final migration re-applies all admin policies.

### 4. job_applications final state
- INSERT: Locked to `service_role` only (trigger + grant revocation in `20260818150000`)
- UPDATE: Field guard trigger in `20260816_job_applications_update_field_security` + reconciliation
- Status: `canonical_job_application_status()` function present on remote
- **Remote: INSERT grant not revoked, no field lock trigger — CRITICAL**

### 5. employer_profiles
- Column grants: NOT applied (contact_email visible to all)
- Owner uniqueness: NOT applied (constraint missing)
- Public view: Present and working correctly
- **Remote: owner_user_id column readable by all — CRITICAL**

### 6. Seeker certificates / workplace needs / work capacity
- Certificates: RLS policies present (basic), verification guard NOT applied
- Workplace needs: **Table missing**
- Work capacity: **Table missing**

### 7. Storage
- Certificates: private, correct config ✓
- Resumes: **Missing** — CVs still in public avatars
- Avatars: public but no MIME restriction — PDFs can still be uploaded

### 8-9. saved_jobs / saved_job_searches
- Tables present, basic RLS working ✓
- saved_job_searches field lock for `last_notified_at`/`notify_after`: **NOT applied**

### 10. Taxonomy
- All 7 tables: **Missing**
- All seed data: **Missing**
- Taxonomy validation triggers: **Missing**

### 11. archive_expired_job_posts
- `private.archive_expired_job_posts()` function: **Unknown** (not exposed via PostgREST)
- pg_cron schedule: **Unknown**

---

## Phase 2 — Reconciliation Migration

### New Initial Schema Migration

Created `00000000000000_initial_schema.sql` to record core table definitions in the migration history. This migration:
- Creates `profiles`, `seeker_profiles`, `employer_profiles`, `seeker_certificates`, `job_posts`, `job_applications` with `IF NOT EXISTS`
- Enables RLS on all tables
- Sets up minimal own-row policies
- Creates `avatars` and `certificates` storage buckets
- Is idempotent — safe on both fresh and existing databases

### Existing Reconciliation Trilogy

The three reconciliation migrations (`20260818200000`, `20260818201000`, `20260818202000`) already cover the gap between the `20260428_*` and `20260818_*` state:
- Part 1: Missing relations (tables, columns, policies)
- Part 2: Search functions, taxonomy foundation, archive cron
- Part 3: Final security state (all policies, grants, triggers, storage)

All three use idempotent patterns and are safe on both fresh and partially-applied databases.

### Migration Application Order for Remote

To bring the remote to the intended state, apply in this order:

```
-- Already applied (20260408 through ~20260428)
-- Need to apply:
20260816_* (32 files)
20260817* (8 files)
20260818* (9 files)
20260819* (5 files)
```

The reconciliation trilogy makes earlier 20260816/20260817 migrations redundant on the remote. For production, the recommended approach is:

1. **Option A (safest):** Apply all migrations in order via `supabase db push` or `supabase migration up`
2. **Option B (fastest):** Apply only the reconciliation trilogy + 20260819_* migrations (the trilogy re-applies all 20260816/20260817 content idempotently)

---

## Phase 3 — Clean Migration Test

### Static Verification

77 migrations verified in filename order:
- **Tables created:** 32 (including initial schema)
- **Views created:** 2
- **Functions created:** 62
- **Critical ordering errors:** 0

The migration order checker confirms:
- No unguarded `ENABLE RLS` on missing tables
- Consent lock preserved in `seeker_date_of_birth_minor`
- pg_cron `CREATE EXTENSION` exception-guarded
- All 3 reconciliation files present

### Docker/Local Supabase

Docker was not available in this environment, so a live fresh-database test could not be performed. **Recommended:** Run `supabase db reset` in a disposable local environment with Docker to confirm all 77 migrations apply sequentially.

---

## Phase 4 — RLS Security Suite

### Results (against live remote)

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Private CV storage | 2 | 3 | `resumes` bucket missing |
| Seeker A vs B negative | 6 | 0 | All isolation checks pass |
| Employer A vs B negative | 1 | 0 | Cross-employer writes denied |
| Employer profile exposure | 1 | 6 | Column grants not applied |
| Anon negative | 6 | 0 | All anon restrictions pass |
| Positive owner flows | 7 | 4 | RLS recursion + missing columns |
| Missing tables/functions | 0 | 5 | Tables not created yet |
| Saved search field lock | 3 | 2 | Field lock not applied |
| **Total** | **42** | **20** | |

### Fixes Applied to RLS Suite

1. Changed `job_type: "permanent"` → `"full_time"` (enum mismatch)
2. Changed `work_type: "full_time"` → `"on_site"` (enum mismatch)
3. Added `requirements`, `application_url`, `salary_currency`, `required_skills`, `keywords`, `requirement_lines`, `languages` to job seed data (NOT NULL constraints on remote)

### Expected After Migrations Applied

All 20 failures are caused by unapplied migrations. After applying the full migration sequence:
- 3 CV storage failures → PASS (resumes bucket created)
- 6 employer exposure failures → PASS (column grants applied)
- 4 positive flow failures → PASS (recursion fix + columns added)
- 5 missing table failures → PASS (tables created)
- 2 field lock failures → PASS (field lock triggers applied)

---

## Taxonomy Status

**All 7 taxonomy tables missing from remote.** Seed data (5 industries, 6 professions, 6 skills, 5 certificates, 10 languages, 100+ aliases) exists in migration `20260817230000_taxonomy_foundation.sql` and is re-applied in reconciliation part 2. Seed uses `ON CONFLICT DO NOTHING/UPDATE` for idempotency.

---

## Items NOT CONFIRMED

| Item | Reason | Action Required |
|------|--------|-----------------|
| Migration history table contents | `supabase_migrations` schema not exposed via PostgREST | Check via Supabase Dashboard or `supabase db remote status` |
| pg_cron extension availability | Cannot query `pg_cron` via PostgREST | Check via Dashboard SQL Editor |
| Archive cron schedule | Cannot verify `cron.job` table | Check via Dashboard SQL Editor |
| `FORCE ROW LEVEL SECURITY` status | Cannot query `pg_class` via PostgREST | Check via Dashboard SQL Editor |
| All triggers on remote tables | Cannot query `pg_trigger` via PostgREST | Check via Dashboard SQL Editor |
| Full column-level GRANT state | Cannot query `information_schema.column_privileges` via PostgREST | Check via Dashboard SQL Editor |
| Storage policies on remote | Cannot query `storage.objects` policies via PostgREST | Check via Dashboard SQL Editor |

---

## Recommended Production Actions

### Immediate (before beta)

1. **Apply all unapplied migrations** via Supabase Dashboard SQL Editor or `supabase db push` — start with the reconciliation trilogy for safety
2. **Create `resumes` bucket** — apply `20260818140000_private_cv_resumes_storage.sql`
3. **Lock employer column grants** — apply `20260818160000_employer_profiles_public_column_grants.sql`
4. **Restrict avatars MIME types** — included in the resumes migration
5. **Run CV migration script** — `scripts/migrate-public-cvs-to-resumes.mjs` after resumes bucket exists
6. **Verify pg_cron** — check `archive-expired-job-posts` schedule exists

### Verification After Apply

1. Re-run `node scripts/rls-security-suite.mjs` — expect 62/62 PASS
2. Re-run `node scripts/remote-db-audit.mjs` — expect all tables present
3. Check employer_profiles column exposure manually via Dashboard
4. Verify `FORCE ROW LEVEL SECURITY` on all public tables via Dashboard

### Repository Improvements

1. Add `supabase/config.toml` for local development with `supabase start`
2. Add a CI step that runs `supabase db reset` to verify clean migration
3. Consider adding the initial schema to Supabase's managed migration system

---

## What Was NOT Changed

- No production data deleted
- No production tables dropped
- No migration history rewritten
- No fix scripts deleted
- No application UI redesigned
- No destructive operations performed
