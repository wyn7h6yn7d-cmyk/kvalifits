# Kvalifits — Remote Beta Readiness Report

Date: 2026-08-19  
Linked project: `svqdycsticovpudcgqvq` (`kvalifits Project`, eu-west-1)

## Final verdict

**REMOTE READY FOR CLOSED BETA**

---

## RLS security fix summary

| FAILURE | ROOT CAUSE | FIX | MIGRATION | TEST RESULT |
|---------|------------|-----|-----------|-------------|
| Anon cannot SELECT employer `contact_email` | `20260818202000_reconciliation_security_final.sql` re-granted full-table `SELECT` on `employer_profiles` to `anon`/`authenticated`, undoing column grants; `employer_profiles_select_for_published_jobs` applied to `authenticated` | Re-applied public column grants; restricted published-job table policy to `anon` only; non-owners use `employer_public_profiles` view | `20260820120000_rls_security_final_fixes.sql` | PASS |
| Seeker cannot SELECT published employer `contact_email` | Same as above — authenticated non-owners retained table row access with private column grants | Same migration | `20260820120000_rls_security_final_fixes.sql` | PASS |
| Seeker cannot SELECT published employer `registry_code` | Same | Same | `20260820120000_rls_security_final_fixes.sql` | PASS |
| Seeker cannot SELECT published employer `owner_user_id` | Same | Same | `20260820120000_rls_security_final_fixes.sql` | PASS |
| Other employer cannot SELECT Employer A `contact_email` | Same | Same | `20260820120000_rls_security_final_fixes.sql` | PASS |
| Seeker cannot SELECT employer `search_tsv` | Same — system column not in public grant list but full-table grant exposed it | Same | `20260820120000_rls_security_final_fixes.sql` | PASS |
| Seeker A can SELECT own `seeker_profiles` | Test seed omitted required NOT NULL `experience_level`; upsert failed silently → 0 rows → `.single()` coercion error | Added `experience_level` + `skills` to seed; fail fast on upsert error | (test fixture) `scripts/rls-security-suite.mjs` | PASS |
| Seeker A can UPDATE own `seeker_profiles.about` | Same missing row as above | Same test fixture fix | (test fixture) | PASS |
| Employer A can SELECT consented applicant education | Application withdrawn before education test; RLS policy excludes `status = withdrawn` | Moved withdraw test after education consented read | (test fixture) | PASS |
| Anon cannot discover candidates via RPC | Missing `NEXT_PUBLIC_SUPABASE_ANON_KEY` caused service-role apikey fallback; shared `anon` client retained JWT from `signIn()` | Resolve real anon key via env or Supabase CLI; isolate sign-in client from anon test client | (test fixture) | PASS |
| Discovery RPC page 2 overlaps page 1 | `search_discoverable_candidates` clamped `p_page` to last page when `p_page > total_pages` | Return empty candidates when page exceeds total pages | `20260820120000_rls_security_final_fixes.sql` | PASS |
| Anon cannot SELECT private seeker_profiles (regression during fix) | Real anon key exposed session leak: `signIn()` used shared anon client | Dedicated ephemeral client for password sign-in | (test fixture) | PASS |

---

## 1. Linked project correct

**YES** — `supabase/.temp/project-ref` and `supabase projects list` both confirm `svqdycsticovpudcgqvq` (linked, ACTIVE_HEALTHY).

---

## 2. Migrations

| Metric | Value |
|--------|-------|
| Repository migration files | **78** |
| Remote applied | **78 / 78** |
| Pending | **0** |
| Remote-only history entries | **0** |

Latest: `20260820120000_rls_security_final_fixes.sql`

---

## 3. RLS security suite

| Metric | Before | After |
|--------|--------|-------|
| PASS | 75 | **86** |
| FAIL | 11 | **0** |
| Total tests | 86 | **86** |

Command: `npm run test:security` against `https://svqdycsticovpudcgqvq.supabase.co`

**Status: PASS**

---

## 4. Storage security

| Check | Status |
|-------|--------|
| `resumes` bucket private | PASS |
| Private CV upload/download (RLS suite) | PASS |
| Consented employer CV download | PASS |

**Status: PASS**

---

## 5. Cron

| Check | Status |
|-------|--------|
| `pg_cron` extension | PASS (`1.6.4`) |
| `archive-expired-job-posts` | PASS |
| `notify-saved-jobs-near-deadline` | PASS |

Saved search alerts use app cron (`/api/cron/saved-search-alerts`), not pg_cron.

**Status: PARTIAL** (by design)

---

## 6. Unit tests / build

| Gate | Result |
|------|--------|
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm test` | **221 / 221 PASS** |
| `npm run build` | PASS |

---

## 7. E2E tests

**29 passed | 0 failed | 8 skipped** (`npm run test:e2e`)

Regression (3/26 fail) fixed — see [docs/e2e-regression-report.md](./e2e-regression-report.md). Root cause: Playwright webServer inherited real Supabase URL from migration shell while using dummy anon key; SSR auth crashed pages.

**Status: PASS**

---

## 8. Remaining blockers

| Priority | Blocker |
|----------|---------|
| P2 OPS | Add `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local` for local RLS runs without Supabase CLI |

**No remaining blockers for closed beta.**

---

## 9. What was NOT done

- No remote database reset
- No production table drops
- No user data deletion
- No `--include-all`
- No manual “mark applied” to skip migrations
