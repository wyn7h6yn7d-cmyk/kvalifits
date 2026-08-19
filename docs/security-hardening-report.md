# Security Hardening Report

**Branch:** `security/hardening-master`
**Date:** 2026-08-19

---

## Summary

Six security findings from the pre-beta audit were addressed. All changes are committed as Supabase migrations and application-layer code. No existing RLS policies were weakened. No destructive production DB operations were performed.

**Build status:** lint ✓ · typecheck ✓ · 189 unit tests pass ✓ · production build ✓

---

## Task 1 — Blocked User Enforcement

### Finding
Blocked users could still authenticate and call authenticated APIs with leftover JWTs.

### Changes

**Application layer:**
- `lib/auth/accountBlocked.ts` — Single source of truth for blocked-user authorization. Exports `evaluateAuthGate()`, `loginSessionAllowed()`, `blockedSessionMayMutate()`, and safe error codes.
- `lib/auth/profileSecurity.ts` — Cached per-request loader for `profiles.role` + `is_blocked`.
- `lib/auth/requireAuthenticatedUser.ts` — Shared API gate: resolves auth user → loads profile security → rejects blocked accounts with 403.
- `lib/auth/revokeUserSessions.ts` — Admin helper to revoke all sessions via `auth.admin.signOut()` after blocking.
- `app/api/auth/login/route.ts` — After successful password auth, checks `is_blocked`. If blocked: signs out the session, revokes all tokens, returns 403.
- All protected API routes (`/api/job-applications`, `/api/resumes/signed-url`, `/api/certificates/signed-url`, `/api/account/delete`, `/api/account/export`, `/api/jobs/match-explanation`, `/api/admin/moderation`) use `requireAuthenticatedUser()`.

**Database layer:**
- Migration `20260818120000_blocked_user_write_guard.sql`:
  - `current_user_is_blocked()` — SECURITY DEFINER function checking `profiles.is_blocked`.
  - `reject_blocked_user_dml()` — BEFORE trigger on 14 user-writable tables raising `42501` for blocked JWTs.
  - Storage write policies on `avatars` and `certificates` buckets include `NOT current_user_is_blocked()`.

**i18n:** `errorAccountBlocked` in ET, EN, RU. `mapAuthError.ts` maps the error code to localized messages.

### Tests (lib/auth/accountBlocked.test.ts)
- Active seeker works ✓
- Active employer works ✓
- Blocked seeker login rejected ✓
- Blocked employer login rejected ✓
- Blocked existing session cannot mutate ✓
- Unblocked user works again ✓
- Profile lookup failure denied ✓
- Response body contains only safe error code ✓

---

## Task 2 — Private CV Storage

### Finding
Candidate CV PDFs were stored in the PUBLIC `avatars` bucket, accessible to anyone with the URL.

### Changes

**Application layer:**
- `lib/seeker/cvStorage.ts` — Constants and helpers for the private `resumes` bucket. Builds object paths, parses legacy public URLs into private refs, never persists permanent public URLs.
- `lib/seeker/cvUpload.ts` — Upload handler targeting the `resumes` bucket with size validation.
- `app/api/resumes/signed-url/route.ts` — Short-lived signed URL endpoint. Gated by `requireAuthenticatedUser()` + `authorizeApplicantDocumentAccess()`. TTL capped at 1 hour. Falls back to legacy `avatars` bucket during migration.

**Database layer:**
- Migration `20260818140000_private_cv_resumes_storage.sql`:
  - Creates private `resumes` bucket (10 MiB, PDF only).
  - RLS: owner INSERT/UPDATE/DELETE/SELECT on own `{uid}/cv/` prefix. Blocked users denied.
  - RLS: admin SELECT for moderation.
  - RLS: employer SELECT only when candidate applied with `consent_to_share = true` and application not withdrawn.
  - Strips PDF from `avatars` bucket allowed MIME types (images only).

**Migration script:** `scripts/migrate-public-cvs-to-resumes.mjs` — Detects legacy public CVs → copies to private bucket → verifies → updates DB → removes public copy. Safe one-time execution.

### Tests (lib/seeker/cvStorage.test.ts)
- Owner path is private object, not public URL ✓
- Legacy public avatars URL converted to object path ✓
- Rejects avatar photos and other seekers as CV refs ✓
- buildCvObjectPath stays under owner prefix ✓
- firstCvStorageRef prefers valid private path ✓

---

## Task 3 — Job Applications INSERT Security

### Finding
`job_applications` INSERT was not sufficiently field-locked. Authenticated users could potentially forge `match_score`, `status`, `seeker_user_id`, and other server-controlled fields via direct PostgREST access.

### Changes

**Application layer:**
- `lib/jobs/jobApplicationFieldLock.ts` — Column classification: A (candidate input), B (server controlled), C (employer pipeline), D (audit/system). `authenticatedMaySetOnInsert()` returns `false` for ALL columns.

**Database layer:**
- Migration `20260818150000_job_applications_insert_field_lock.sql`:
  - Trigger `job_applications_guard_insert_fields_trg`: any JWT-bearing client gets `42501`. Only `service_role` (null `auth.uid()`) may INSERT.
  - Dropped `seeker_insert_own_applications` RLS policy (default deny).
  - Revoked INSERT grant from `authenticated`, `anon`, `public`. Granted only to `service_role`.
  - Official apply flow via `POST /api/job-applications` (service role) remains the source of truth.

### Tests (lib/jobs/jobApplicationFieldLock.test.ts)
- Candidate input columns classified as A ✓
- Server-controlled columns classified as B ✓
- Employer pipeline columns classified as C ✓
- Audit columns classified as D ✓
- No authenticated PostgREST INSERT of any column ✓
- Forge attack: match_score=100 blocked ✓
- Forge attack: status=hired blocked ✓
- Forge attack: different seeker_user_id blocked ✓
- Forge attack: employer/admin fields blocked ✓
- Forge attack: consent/snapshot fields blocked ✓

---

## Task 4 — Employer Profile Field Exposure

### Finding
Authenticated seekers could receive broader `employer_profiles` data than intended, including contact emails, registry codes, and verification metadata.

### Changes

**Application layer:**
- `lib/employer/employerProfileFields.ts` — Column classification: PUBLIC, OWNER_PRIVATE, ADMIN_ONLY, SYSTEM. `authenticatedNonOwnerMaySelectColumn()` returns the same result as `publicSurfaceMaySelectColumn()` — logging in does not expand the surface.

**Database layer:**
- Migration `20260818160000_employer_profiles_public_column_grants.sql`:
  - Public view `employer_public_profiles` with security barrier — only public columns, only companies with published jobs.
  - Column-level grants: anon + authenticated get only public columns. Owner/admin get private columns via RLS on the base table.
  - Revoked table-level SELECT (which exposed everything).
  - Comments on each private column documenting its classification.

### Tests (lib/employer/employerProfileFields.test.ts)
- Public listing fields classified correctly ✓
- Anon and authenticated non-owners share same surface ✓
- Login does not expose extra private columns ✓
- Owner reads own operational contacts ✓
- Admin reads verification metadata ✓
- Seeker blocked from contact_email, contact_phone ✓
- Seeker blocked from registry_code, owner_user_id ✓
- Seeker blocked from verification_source, verified_at ✓
- Search indexes blocked from all client roles ✓

---

## Task 5 — Employer Owner Uniqueness

### Finding
Product assumes one employer profile per owner, but `UNIQUE(owner_user_id)` was not confirmed in migrations.

### Changes

**Application layer:**
- `lib/employer/employerOwnerUniqueness.ts` — Handles SQLSTATE 23505 as "already_exists" rather than error. Concurrent onboarding INSERTs are safe.

**Database layer:**
- Migration `20260818170000_employer_profiles_owner_user_id_unique.sql`:
  - Pre-flight check: fails if any duplicate `owner_user_id` values exist (manual reconciliation required — no auto-delete).
  - Sets `owner_user_id NOT NULL`.
  - Adds `UNIQUE (owner_user_id)` constraint if not already present.

### Tests (lib/employer/employerOwnerUniqueness.test.ts)
- First profile create works ✓
- Concurrent second create returns "already_exists" ✓
- Other owners can create their own profiles ✓
- Non-unique failures stay failed ✓

---

## Task 6 — Security Regression Tests

All test files use Node.js built-in test runner (`node:test`). Total: 189 tests, 0 failures.

| Test file | Coverage |
|---|---|
| `lib/auth/accountBlocked.test.ts` | Blocked login, blocked session, unblocked recovery, safe error bodies |
| `lib/seeker/cvStorage.test.ts` | Private bucket refs, legacy URL migration, cross-user rejection |
| `lib/jobs/jobApplicationFieldLock.test.ts` | Column classification, forge attack vectors |
| `lib/employer/employerProfileFields.test.ts` | Field exposure per role, login surface parity |
| `lib/employer/employerOwnerUniqueness.test.ts` | Unique constraint, concurrent INSERT handling |
| `lib/auth/accountAuthReads.test.ts` | Migration SQL presence verification |
| `scripts/rls-security-suite.mjs` | Live RLS: seeker A vs B, employer A vs B, blocked writes, private columns |

---

## Migrations Summary

| Migration | Purpose |
|---|---|
| `20260818120000_blocked_user_write_guard.sql` | DML trigger + storage policies rejecting blocked JWTs |
| `20260818140000_private_cv_resumes_storage.sql` | Private `resumes` bucket, RLS, avatars PDF removal |
| `20260818150000_job_applications_insert_field_lock.sql` | INSERT trigger + grant revocation on job_applications |
| `20260818160000_employer_profiles_public_column_grants.sql` | Column-level grants + public view for employer_profiles |
| `20260818170000_employer_profiles_owner_user_id_unique.sql` | UNIQUE(owner_user_id) with duplicate pre-check |
| `20260818202000_reconciliation_security_final.sql` | FORCE ROW LEVEL SECURITY + final consistency |

---

## Unresolved / Needs Production Approval

1. **Run `scripts/migrate-public-cvs-to-resumes.mjs` in production** — Moves any existing public CVs to the private bucket. Must run with `SUPABASE_SERVICE_ROLE_KEY`. One-time, non-destructive (copies before deleting).

2. **Verify remote schema state** — The reconciliation migration applies `FORCE ROW LEVEL SECURITY` to all public tables. If the remote schema has drifted, review `supabase/scripts/fix-*.sql` scripts manually.

3. **RLS security suite seed data** — `scripts/rls-security-suite.mjs` uses `job_type` enum values for seed data. Confirm the production `job_type` enum includes the seed value (or update the seed to match production).

4. **Access token expiry window** — After admin blocks a user, leftover access tokens remain valid until Supabase JWT expiry (default 1 hour). The DML trigger and API gates reject blocked users immediately. Consider reducing JWT expiry to 15 minutes for tighter enforcement.

5. **Storage RLS for employer CV access** — The employer SELECT policy on `resumes` bucket joins through `job_applications → job_posts → employer_profiles`. In production with many applications, monitor query performance on this policy.

---

## What Was NOT Changed

- No UI redesign
- No matching weight changes
- No job search rebuild
- No `service_role` exposure to browser
- No RLS weakening
- No automatic merge to main
- No destructive production DB operations
- No migration history deleted
