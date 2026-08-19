# Migration Integrity Report

Date: 2026-08-19  
Project: `svqdycsticovpudcgqvq` (kvalifits)

## Final verdict

**MIGRATION HISTORY NEEDS REPAIR**

Remote database and the **working-tree** migration directory are aligned (78/78, dry-run up to date, RLS 86/86). A **fresh clone of current Git HEAD** would **not** reproduce that state: committed history still contains duplicate migration timestamps, omits the latest security migration, and leaves renames uncommitted. Clean local apply from zero was **not executed** (Docker/Podman unavailable on this machine).

---

## Summary table

| Metric | Value |
|--------|-------|
| **REPOSITORY MIGRATION COUNT (working tree)** | **78** |
| **REPOSITORY MIGRATION COUNT (Git HEAD committed)** | **77** (duplicate timestamps — not safe) |
| **CLEAN APPLY RESULT** | **NOT RUN** — Docker/Podman not installed; `supabase db reset --local` fails |
| **REMOTE APPLIED COUNT** | **78** |
| **REMOTE PENDING** | **0** |
| **REMOTE-ONLY HISTORY** | **0** |
| **LOCAL/REMOTE DRIFT (working tree vs remote)** | **None** — `supabase db push --linked --dry-run` → up to date |
| **LOCAL/REMOTE DRIFT (Git HEAD vs remote)** | **Yes** — HEAD missing `20260820120000`; duplicate `20260413` / `20260816` prefixes |
| **RLS LOCAL** | **NOT RUN** — no local Supabase stack |
| **RLS REMOTE** | **86 PASS / 0 FAIL** |

---

## 1. Migration directory audit (working tree)

Path: `supabase/migrations/`

| Check | Result |
|-------|--------|
| File count | **78** `.sql` files |
| Unique version/timestamp prefixes | **PASS** — no duplicate prefixes |
| `* 2.sql` macOS duplicates | **PASS** — none present |
| Temporary/backup patterns (`.tmp`, `.bak`, `~`) | **PASS** — none |
| Deterministic filename ordering | **PASS** — lexicographic sort matches apply order |
| Static order guard (`scripts/check-migration-order.mjs`) | **PASS** |
| Static sequence guard (`scripts/verify-migration-sequence.mjs`) | **PASS** (29 expected auth-schema warnings only) |

### Intentional gap in numeric sequence

`2026081600009_*` is intentionally absent (no migration ever used that slot).

### Ordered migration manifest (78)

| # | Version | File |
|---|---------|------|
| 1 | `00000000000000` | `initial_schema.sql` |
| 2 | `20260408` | `job_applications.sql` |
| 3 | `20260411` | `matching_structured_fields.sql` |
| 4 | `20260412` | `job_application_match.sql` |
| 5 | `20260413` | `employer_profiles_company_size.sql` |
| 6 | `20260413120000` | `seeker_cert_number_nullable_b_license.sql` |
| 7 | `20260414` | `public_job_board_rls.sql` |
| 8 | `20260415` | `fix_employer_profiles_rls_recursion.sql` |
| 9 | `20260416` | `job_posts_delete_own.sql` |
| 10 | `20260417` | `job_posts_certificate_requirements.sql` |
| 11 | `20260418` | `job_posts_matching_columns_repair.sql` |
| 12 | `20260419` | `job_posts_application_type_enum.sql` |
| 13 | `20260420` | `job_applications_match_columns_repair.sql` |
| 14 | `20260421` | `job_applications_table_if_missing.sql` |
| 15 | `20260422` | `seeker_profiles_structured_columns_repair.sql` |
| 16 | `20260424` | `job_applications_withdraw_policy.sql` |
| 17 | `20260425` | `seeker_certificates_image_nullable.sql` |
| 18 | `20260426` | `job_applications_unique_active.sql` |
| 19 | `20260427` | `employer_select_seeker_profile_for_applicants.sql` |
| 20 | `20260428` | `employer_logo_in_app_only.sql` |
| 21–53 | `2026081600001`–`2026081600035` | Security/hardening batch (33 files, unique sub-timestamps) |
| 54 | `20260817103953` | `saved_jobs.sql` |
| 55 | `20260817104533` | `saved_job_searches.sql` |
| 56 | `20260817115759` | `job_application_status_audit.sql` |
| 57 | `20260817121339` | `employer_public_profiles.sql` |
| 58 | `20260817180000` | `search_published_jobs.sql` |
| 59 | `20260817193000` | `published_job_facet_values.sql` |
| 60 | `20260817200000` | `job_search_indexes.sql` |
| 61 | `20260817210000` | `archive_expired_job_posts_cron.sql` |
| 62 | `20260817220000` | `get_job_match_inputs.sql` |
| 63 | `20260817230000` | `taxonomy_foundation.sql` |
| 64 | `20260818120000` | `blocked_user_write_guard.sql` |
| 65 | `20260818140000` | `private_cv_resumes_storage.sql` |
| 66 | `20260818150000` | `job_applications_insert_field_lock.sql` |
| 67 | `20260818151000` | `job_applications_employer_notified_at.sql` |
| 68 | `20260818160000` | `employer_profiles_public_column_grants.sql` |
| 69 | `20260818170000` | `employer_profiles_owner_user_id_unique.sql` |
| 70 | `20260818200000` | `reconciliation_missing_relations.sql` |
| 71 | `20260818201000` | `reconciliation_search_taxonomy_cron.sql` |
| 72 | `20260818202000` | `reconciliation_security_final.sql` |
| 73 | `20260819120000` | `notifications.sql` |
| 74 | `20260819140000` | `saved_search_alert_delivery.sql` |
| 75 | `20260819150000` | `seeker_education.sql` |
| 76 | `20260819160000` | `job_duty_benefit_lines.sql` |
| 77 | `20260819170000` | `search_discoverable_candidates.sql` |
| 78 | `20260820120000` | `rls_security_final_fixes.sql` |

*(Full filenames: prefix + underscore + descriptive slug as in repo.)*

---

## 2. Clean database apply (local)

| Step | Result |
|------|--------|
| `supabase status` | **FAIL** — `docker: command not found` (Podman also absent) |
| `supabase db reset --local` | **FAIL** — cannot inspect/start local stack |
| Disposable local Postgres | **Not available** — `psql`/`postgres` not on PATH |

**Conclusion:** Clean apply from zero was **not executed** in this environment. Reproducibility is supported by static guards + remote dry-run parity, but a green `supabase db reset --local` on a Docker-equipped machine is still required for full proof.

---

## 3. Schema verification (remote — linked project)

Verified on remote after 78 migrations applied. Counts:

| Object class | Count |
|--------------|------:|
| Public base tables | 28 |
| Public views | 1 (`employer_public_profiles`) |
| Public functions | 57 |
| RLS policies (public) | 91 |
| Triggers (public) | 82 |
| Storage buckets | 6 |

### Required feature checklist (remote)

| Area | Status | Evidence |
|------|--------|----------|
| Core tables (`profiles`, `seeker_profiles`, `employer_profiles`, `job_posts`, `job_applications`) | PASS | Present in `information_schema.tables` |
| Taxonomy (`taxonomy_*` × 7 tables) | PASS | All 7 present |
| Notifications | PASS | `notifications` table |
| Education | PASS | `seeker_education` table |
| CV privacy | PASS | `resumes` bucket `public=false`; legacy `cvs` private |
| Certificates storage | PASS | `certificates` bucket private |
| Avatars / logos | PASS | `avatars`, `company-logos` public |
| Job search RPCs | PASS | `search_published_jobs`, `published_job_facet_values` |
| Candidate discovery | PASS | `search_discoverable_candidates`, `discoverable_candidate_facets` |
| Match inputs | PASS | `get_job_match_inputs` |
| pg_cron | PASS | Extension enabled; cron jobs from migration `20260817210000` |
| Saved jobs / alerts | PASS | `saved_jobs`, `saved_job_searches`, `saved_search_alert_deliveries` |
| RLS enabled | PASS | 91 policies on public objects |

All 28 public application tables are created by migrations (no orphan objects detected that exist only outside migration history).

---

## 4. RLS security suite

| Target | Result |
|--------|--------|
| Remote (`npm run test:security`) | **86 PASS / 0 FAIL** |
| Local Supabase | **Not run** — no local stack |

Remote result matches post-migration baseline; no evidence that security objects exist only from pre-reconciliation remote drift.

---

## 5. Local vs remote structural comparison

| Comparison | Result |
|------------|--------|
| Working tree migration list vs `supabase_migrations.schema_migrations` | **78 = 78**, all versions match |
| `supabase db push --linked --dry-run` | **Up to date** (0 pending) |
| `supabase migration list --linked` | No local-only or remote-only rows |
| Full pg_dump diff (local vs remote) | **Not performed** — local DB unavailable |

**Expected application-schema drift:** none between working tree and remote.

---

## 6. Git state review

### Problem: committed HEAD ≠ working tree ≠ safe fresh clone

| Source | Count | Duplicate timestamps | Latest migration |
|--------|------:|:--------------------:|------------------|
| **Git HEAD** | 77 | **Yes** (`20260413` ×2, `20260816` ×33) | `20260819170000` |
| **Working tree** | 78 | **No** | `20260820120000` |
| **Remote** | 78 applied | **No** | `20260820120000` |

**74 paths** under `supabase/migrations/` differ between HEAD and working tree (renames + PG17 edits + new file).

### FILES REMOVED / RENAMED / MODIFIED

| Change | Files | REASON |
|--------|------:|--------|
| **Renamed** (duplicate `20260816_*` → unique sub-timestamps) | 33 | Supabase CLI accepts only one migration per version prefix; remote apply required unique timestamps |
| **Renamed** (duplicate `20260413_*`) | 1 | `20260413_seeker_cert…` → `20260413120000_seeker_cert…` |
| **Removed from tree** (macOS duplicates) | 15 × `* 2.sql` | Accidental Finder duplicates; would double-apply if tracked |
| **Modified in place** (PostgreSQL 17) | 5 | Enum index predicates, array slice syntax, SQL typo fixes during remote push |
| **Added** | 1 | `20260820120000_rls_security_final_fixes.sql` — employer column grants + discovery pagination |

Representative renames (content unchanged except where noted):

```
20260816_account_privacy_deletion.sql      → 2026081600001_account_privacy_deletion.sql
20260816_admin_audit_log.sql               → 2026081600002_admin_audit_log.sql
… (31 more 20260816_* → 2026081600003–2026081600035)
20260413_seeker_cert_number_nullable…      → 20260413120000_seeker_cert_number_nullable…
```

PostgreSQL 17 compatibility edits (content fixes, same migration version):

- `20260817180000_search_published_jobs.sql`
- `20260817200000_job_search_indexes.sql`
- `20260817220000_get_job_match_inputs.sql`
- `20260817230000_taxonomy_foundation.sql`
- `20260818201000_reconciliation_search_taxonomy_cron.sql`

### Untracked / stray files

| Pattern | Status |
|---------|--------|
| `supabase/migrations/* 2.sql` | **None** in working tree |
| Random untracked `.sql` outside migrations | **None** |

---

## 7. Remote-only history reconciliation (prior work — documented for context)

During remote apply, 6 orphan remote-only history entries (`20260817175123` … `20260817175240`) were marked **reverted** via `supabase migration repair --status reverted` without dropping schema objects. Current remote history contains **0** remote-only entries.

---

## 8. Actions required to reach HEALTHY

1. **Commit** working-tree migration renames, PG17 fixes, and `20260820120000_rls_security_final_fixes.sql` so Git HEAD matches remote (78 unique versions).
2. **Run** `supabase db reset --local` on a Docker-equipped machine; confirm 78/78 apply with zero errors.
3. **Run** `npm run test:security` against that local stack; expect 86/86 (same as remote).
4. Optional: add CI job step `supabase db reset --local` + security suite when Docker is available in CI.

---

## 9. Conclusion

| Layer | Health |
|-------|--------|
| Remote database migration history | **Healthy** |
| Working-tree migration directory | **Healthy** |
| Git committed migration history | **Needs repair** |
| Clean local apply proof | **Incomplete** (environment blocker) |

**MIGRATION HISTORY NEEDS REPAIR** until Git records the renames/fixes and a clean local apply is verified on Docker.
