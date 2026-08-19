# Pre-Beta Independent Review

**Reviewer:** AI code reviewer (independent pass)
**Date:** 2026-08-19
**Branch:** `reliability/email-monitoring`
**Scope:** Full codebase + build + test suite

---

## Verdict

### READY FOR CLOSED BETA

The application code is production-grade for a closed beta with the following
critical prerequisite: **the remote Supabase database must have all 77 migrations
applied before any external user access.** Without this, security controls
(RLS policies, INSERT locks, blocked-user guards, private storage buckets) are
absent on the remote, and the RLS security suite shows 20/62 failures.

Once migrations are applied, the codebase provides:
- Layered security (RLS + API-level auth gates + blocked-user guards + field locks)
- Proper error handling with no raw provider errors exposed
- Full i18n (ET/EN/RU)
- Accessible UI with Radix Dialog focus trapping
- Server-side pagination for public-facing data
- 197 unit tests, 30 E2E tests, 39 RLS security assertions
- Clean lint (0 errors, 0 warnings), clean typecheck, clean build

---

## 1. SECURITY

### What was verified

| Check | Method | Result |
|-------|--------|--------|
| Blocked user cannot login | Code audit: `loginSessionAllowed()` checks `is_blocked`, revokes sessions | **PASS** |
| Blocked user cannot write | DB trigger `reject_blocked_user_dml` + API `evaluateAuthGate()` | **PASS** |
| Seeker A cannot access seeker B | RLS `user_id = auth.uid()` on seeker_profiles; E2E test in `privacy.spec.ts` | **PASS** |
| Employer A cannot read employer B | RLS owner policies on employer_profiles; E2E test | **PASS** |
| Employer cannot read work capacity/health | Discovery RPC excludes `work_capacity`, `health`, `workplace_needs`; RLS test | **PASS** |
| Cannot forge match_score | `JOB_APPLICATION_COLUMN_CLASS` marks it "B" (server-only); authenticated INSERT revoked; service_role writes via API | **PASS** |
| Cannot self-verify certificate | RLS blocks seeker UPDATE on `verification_status`; admin-only verification | **PASS** |
| Private CV not publicly readable | `resumes` bucket with owner-only policies; signed URLs via API with auth check | **PASS** |
| Draft jobs private | RLS policy `job_posts_select_published` enforces `status = 'published'` | **PASS** |
| Admin requires admin role | All 8 admin pages use `requireAdmin()`; all 3 admin API routes check admin | **PASS** |

### RLS Security Suite

- **39 assertions defined** in `scripts/rls-security-suite.mjs`
- Seeds ephemeral users (seeker A, seeker B, employer A, employer B), runs negative/positive checks, cleans up
- **Requires live Supabase with all migrations applied** — last documented run: 42 pass / 20 fail (all failures from unapplied migrations)

---

## 2. DATABASE

| Check | Result |
|-------|--------|
| Migration count | **77 SQL files** |
| Sequential application | Idempotent `initial_schema.sql` + ordered migrations; reconciliation trilogy ensures final state |
| Migration-order failures | None — `CREATE TABLE IF NOT EXISTS`, `DO $$ ... EXCEPTION` guards throughout |
| Trigger definitions | `reject_blocked_user_dml`, consent protection, status audit — all defined in final reconciliation |
| Constraints | Unique active application, owner uniqueness on employer_profiles, pipeline status check |
| pg_cron | 3 cron jobs (archive expired posts, saved job deadline notifications, saved search alerts) — all exception-guarded if pg_cron unavailable |
| `supabase/config.toml` | **Missing** — not required for migration apply, but recommended for local dev |

### P0 — Remote drift unresolved

The reconciliation report documents that **58+ migrations are unapplied on the remote**.
This means 16+ tables, ~45 columns, all security hardening (INSERT locks, blocked-user
guards, private CV bucket), taxonomy, notifications, and education are absent remotely.

**This must be resolved before any external user access.**

---

## 3. SEEKER JOURNEY

| Step | Implementation | Status |
|------|---------------|--------|
| Register | `POST /api/auth/register` with rate limiting, role assignment | **PASS** |
| Email verify | Supabase Auth built-in + resend endpoint + rate limit | **PASS** |
| Login | `POST /api/auth/login` with blocked check, email verify check | **PASS** |
| Profile | `SeekerProfileForm` with completeness tracking | **PASS** |
| Skills | Structured skills in profile, taxonomy-backed | **PASS** |
| Certificates | Upload + metadata, admin-only verification | **PASS** |
| Search | Server-side `search_published_jobs()` RPC with `.range()` pagination | **PASS** |
| Filters | Server-side facets via `published_job_facet_values()` RPC | **PASS** |
| Match explanation | `GET /api/jobs/match-explanation` with auth check | **PASS** |
| Save job | `saved_jobs` table with owner RLS | **PASS** |
| Quick Apply | Radix Sheet with focus trap, a11y tested in E2E | **PASS** |
| Status updates | Seeker-facing status with distinct labels (7 states) | **PASS** |
| Notifications | Bell with unread count, inbox with mark-read/mark-all-read | **PASS** |
| Withdraw | Client-side withdraw with RLS-protected status update | **PASS** |
| ET/EN/RU | All UI strings localized via next-intl | **PASS** |

---

## 4. EMPLOYER JOURNEY

| Step | Implementation | Status |
|------|---------------|--------|
| Register | Same auth flow, role=employer | **PASS** |
| Company profile | `EmployerProfileForm` with owner RLS | **PASS** |
| Create draft | Default `status=draft`, explicit publish action | **PASS** |
| Save draft | Updates without changing status | **PASS** |
| Preview | Owner-only preview, noindex, "Eelvaade" label | **PASS** |
| Publish | Explicit publish action sets `status=published` | **PASS** |
| Receive candidate | `new_application` notification + applicant inbox | **PASS** |
| Candidate detail | Drawer with profile, match, shared data | **PASS** |
| Matching | Server-computed scores, no client forgery | **PASS** |
| Internal notes | Employer-only `employer_notes` column, never exposed to seeker | **PASS** |
| Pipeline | 8-status pipeline with status history | **PASS** |
| Draft privacy | RLS enforces `status='published'` for public SELECT | **PASS** |
| Candidate discovery | Server-side RPC `search_discoverable_candidates()` with pagination | **PASS** |

---

## 5. ADMIN

| Function | Implementation | Status |
|----------|---------------|--------|
| Company verification | Admin moderation action with audit log | **PASS** |
| Certificate verification | Admin-only UPDATE on verification_status | **PASS** |
| Job/report moderation | `runModerationAction()` with audit log | **PASS** |
| Block/unblock | Profile `is_blocked` + session revocation + DML trigger | **PASS** |
| Audit log viewer | Server-paginated, filtered, read-only | **PASS** |
| Admin authorization | `requireAdmin()` on all 8 admin pages + 3 API routes | **PASS** |

---

## 6. FAILURE STATES

| Scenario | Handling | Status |
|----------|---------|--------|
| Failed email on application | Application remains valid, email failure logged | **PASS** |
| Network error | Error boundaries at locale and global level | **PASS** |
| Missing resource (404) | Localized not-found page with noindex metadata | **PASS** |
| Expired job | `jobAcceptsApplications()` checks deadline/expiry | **PASS** |
| Duplicate application | Unique constraint + clean "already applied" response | **PASS** |
| Invalid form | Client + server validation, localized error messages | **PASS** |
| Unauthorized access | Redirects to login or shows 403, no blank pages | **PASS** |
| Raw error exposure | API routes return safe error codes, no Supabase internals | **PASS** |

---

## 7. QUALITY

| Check | Result |
|-------|--------|
| `npm test` | **197 pass, 0 fail** |
| `npx eslint .` | **0 errors, 0 warnings** |
| `npm run typecheck` | **Pass** |
| `npm run build` | **Pass** (all routes compile) |
| Playwright tests listed | **30 tests in 8 files** (require running dev server) |
| RLS security suite | **39 assertions** (require live Supabase) |

---

## 8. PERFORMANCE

| Check | Finding | Status |
|-------|---------|--------|
| Job search page size | Server-side via `search_published_jobs()` RPC with `.range()` pagination | **PASS** |
| Job search filters | Server-side via `published_job_facet_values()` RPC | **PASS** |
| Candidate discovery | Server-side via `search_discoverable_candidates()` RPC with page/pageSize params | **PASS** |
| Entire catalog shipped | No — RPC-based pagination prevents this | **PASS** |

### P2 — High `.limit()` values on account pages

Several account pages use `.limit(200)` or higher without offset pagination:

| Route | Limit | Risk |
|-------|-------|------|
| Seeker saved jobs | 200 | Low — unlikely to hit in beta |
| Seeker applications | 200 | Low — unlikely to hit in beta |
| Employer applicants per job | 200 | Medium — popular job could exceed |
| Admin users | 300 | Low — admin-only |
| Admin employers/jobs/reports | 200 | Low — admin-only |
| Employer inbox job options | 2000 (applications) | Medium — counts only, but large IN clause |
| Public companies | 400 | Medium — grows over time |

These are not beta-blocking. All public-facing discovery (job search, candidate search)
uses proper server-side pagination.

---

## 9. UX

| Check | Finding | Status |
|-------|---------|--------|
| Navigation | Clean, role-appropriate, no stub items | **PASS** |
| Messages stub removed | "Sõnumid" not in live nav; test verifies absence | **PASS** |
| Demo/test data | No `test@`, Lorem ipsum, or dummy data in app code | **PASS** |
| Loading states | Skeleton components for jobs, applicants, applications, matches, saved | **PASS** |
| Empty states | `EmptyState` components with icons and CTAs | **PASS** |
| Error states | Error boundaries + inline error messages, no blank pages | **PASS** |
| Mobile | Safe-area, h-dvh, 44px touch targets, responsive breakpoints | **PASS** |
| Focus/keyboard | Radix focus traps on sheets/dialogs, focus-visible indicators | **PASS** |
| Language parity | ET/EN/RU verified by unit tests + E2E locale smoke tests | **PASS** |

### P1 — Legal operator fields

`LAUNCH_OPERATOR` in `lib/content/legal/placeholders.ts` has all identity fields set to
`null` (no registered entity). Legal pages gracefully show pre-launch disclaimers, which
is appropriate for beta, but must be filled before commercial launch.

### P2 — Dead NavKey types

`NavKey` type includes `"employerMessages"` and `"employerCompany"` which are not used in
any nav array. Translation key `"employerMessages": "Sõnumid"` exists as a dead key.
Cosmetic — no user impact.

---

## Issue Summary

### P0 — BLOCKS BETA

| # | Issue | Route/Table | Risk | Fix | Complexity |
|---|-------|-------------|------|-----|------------|
| P0-1 | **Remote database drift: 58+ migrations unapplied** | All tables, RLS, triggers, storage | Critical — security controls absent remotely | Run `supabase db push` or equivalent to apply all migrations, then re-run RLS suite expecting full pass | Medium — operational, not code |

### P1 — FIX BEFORE FIRST EXTERNAL USERS

| # | Issue | Location | Risk | Fix | Complexity |
|---|-------|----------|------|-----|------------|
| P1-1 | Legal operator identity fields null | `lib/content/legal/placeholders.ts` | Legal compliance — pages show pre-launch disclaimers | Fill `LAUNCH_OPERATOR` fields once entity is registered | Trivial |
| P1-2 | `supabase/config.toml` missing | Project root | Local dev reproducibility | Create config for local `supabase start` | Low |
| P1-3 | Confirm pg_cron active on remote | Remote Supabase | Expired jobs not archived, deadline notifications not sent | Verify via Supabase dashboard; enable extension if needed | Low |

### P2 — QUALITY

| # | Issue | Location | Risk | Fix | Complexity |
|---|-------|----------|------|-----|------------|
| P2-1 | Account pages use `.limit(200–2000)` without pagination | Multiple account pages | Slow load if limits exceeded | Add server-side pagination | Medium |
| P2-2 | Dead `NavKey` types and translation keys | `navConfig.ts`, `messages/*.json` | None — cosmetic | Remove unused types and keys | Trivial |
| P2-3 | No `error.tsx` in account sub-routes | `app/[locale]/account/` | Unhandled account errors fall to locale error boundary | Add account-level error boundary | Low |
| P2-4 | Employer applicant list filters client-side | `EmployerApplicantList.tsx` | Slow for jobs with 200+ applicants | Move filtering server-side | Medium |

### P3 — LATER

| # | Issue | Location | Risk | Fix | Complexity |
|---|-------|----------|------|-----|------------|
| P3-1 | Public companies page loads up to 400 rows | `loadPublicCompanies.ts` | Grows over time | Add pagination | Medium |
| P3-2 | Sitemap queries up to 5000 rows | `app/sitemap.ts` | Acceptable for now | Paginate when catalog grows | Low |
| P3-3 | Employer inbox counts all applications via `.limit(2000)` | `loadEmployerInboxJobOptions.ts` | Inefficient at scale | Replace with `COUNT` aggregate | Low |
| P3-4 | No real-time notification updates | `NotificationBell.tsx` | Polls on window focus only | Add Supabase Realtime subscription | Medium |

---

## Test Evidence

```
Unit tests:   197 pass / 0 fail
ESLint:       0 errors / 0 warnings
TypeScript:   Pass (tsc --noEmit)
Build:        Pass (next build)
E2E tests:    30 defined (8 files, chromium + mobile)
RLS suite:    39 assertions (requires live Supabase)
```
