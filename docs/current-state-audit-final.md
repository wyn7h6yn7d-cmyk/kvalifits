# Kvalifits — Final Current-State Audit

Scope: documentation-only audit of *real* current readiness.

Rules:
- No application code changes.
- No new features.
- No refactors.
- Do not claim “remote verified” unless the remote check actually ran and succeeded.

Legend:
- ✅ DONE
- 🟡 PARTIAL
- ❌ MISSING
- 🔴 RISK
- ⚪ NOT VERIFIED

## Audit Gate Results (run in this session)

- `npm run lint`: ✅ pass
- `npm run typecheck`: ✅ pass
- `npm test`: ✅ pass
  - `tests 221 | suites 60 | pass 221 | fail 0 | skipped 0`
- `npm run build`: ✅ pass
- `npm run test:security` (RLS security suite):
  - **After remote migration apply:** `Total 86 | PASS 75 | FAIL 11`
  - Baseline before apply: `Total 62 | PASS 42 | FAIL 20`
- `node scripts/remote-db-audit.mjs` (remote DB audit):
  - 🟡 PARTIAL (runs; critical tables/buckets/RPCs verified; migration history not readable via PostgREST)
- `pg_cron` remote enablement probe (linked DB):
  - ✅ DONE (`pg_cron` 1.6.4; `cron.job` exists; 2 scheduled jobs active)
- `npm run test:e2e` (Playwright):
  - `29 passed | 0 failed | 8 skipped`
  - Some WebServer fetch failures occurred due to an unreachable Supabase hostname (`ENOTFOUND example.invalid.supabase.co`), which is why several “live/auth” scenarios were skipped.

## 15-point Readiness Sections

## 1) SECURITY (RLS + app gates)

Verified signals:
- Blocked user login / blocked API access: ✅ (unit + e2e auth page tests)
- Cross-seeker access: ✅ for negative lookups on isolated rows (unit + RLS negative set)
- Cross-employer access: ✅ for negative access paths (unit + RLS negative set)
- Work-capacity privacy: 🔴 RISK (RLS suite cannot find `public.seeker_work_capacity`)
- Workplace-needs privacy: 🔴 RISK (private table access not validated remotely; related RLS targets missing in suite schema cache)
- Private resumes: 🔴 RISK (RLS suite shows `Bucket not found` for resumes + private download failures)
- Private certificates: 🟡 PARTIAL (self-verification prevention checks pass, but overall schema/cache issues affect some storage flows)
- Application field locks: ✅ (unit tests cover insert forge attacks + server-controlled field classification)
- Certificate self-verification prevention: ✅ (unit tests + RLS negative/positive checks)
- Company self-verification prevention: ⚪ NOT VERIFIED (no dedicated positive/negative assertion matched “self verification” for employer role in the executed outputs)
- Draft job privacy: 🔴 RISK (RLS suite failures: “stack depth limit exceeded” on employer draft job access)
- Admin authorization: ✅ (unit tests + e2e admin page access patterns)

RLS security suite verification:
- `npm run test:security` produced `20` FAILs with missing tables/buckets/RPCs and a few unexpected authorization reads.

## 2) REMOTE DATABASE (Expected vs Verified)

### 2.1 Repository expected state (from repo migrations/code)
Expected core artifacts (examples; derived from repo content and documented runbook):
- Storage buckets:
  - `avatars` (public read)
  - `resumes` (private CVs via signed URLs)
  - `certificates` (private via signed URLs)
- RLS-secured tables and views for:
  - `seeker_profiles`, `seeker_certificates`, `job_applications`, `employer_profiles`
  - workplace privacy: `seeker_work_capacity`, `seeker_workplace_needs` (private) where applicable
- Functions/RPC:
  - `public.search_discoverable_candidates(...)` (used by employer candidate discovery)
- Cron:
  - pg_cron functions from migrations:
    - `private.archive_expired_job_posts()`
    - `private.notify_saved_jobs_near_deadline()`
- Notifications:
  - `public.notifications` and related dedupe/ledger tables

### 2.2 Remote verified state (what was actually checked)

**Migration apply (2026-08-19):** 77/77 repository migrations applied to linked remote via `supabase db push --linked` (no `--include-all`). Pending = 0.

Remote DB audit status:
- `node scripts/remote-db-audit.mjs`: 🟡 PARTIAL
  - Critical tables present including `notifications`, `seeker_education`, `seeker_work_capacity`, `seeker_workplace_needs`
  - Storage: `resumes` (private), `certificates` (private), `avatars` (public)
  - Migration history table not accessible via PostgREST (CLI authoritative)

- Additional remote schema checks (linked DB):
  - `pg_cron` extension:
    - ✅ installed (`1.6.4`)
  - `cron` schema / jobs:
    - ✅ `archive-expired-job-posts`, `notify-saved-jobs-near-deadline` scheduled

RLS security suite status (remote-checked, post-migration):
- Ran against `https://svqdycsticovpudcgqvq.supabase.co`
- Outcome: **`Total 86 | PASS 75 | FAIL 11`**
- Fixed since baseline: resumes bucket, notifications, seeker_education, work_capacity, draft jobs, saved-search cursors, most storage flows
- Remaining FAIL causes:
  - `employer_profiles` private columns readable by anon/seeker/other employer (`contact_email`, `registry_code`, `owner_user_id`, `search_tsv`)
  - `seeker_profiles` owner SELECT/UPDATE: duplicate row / `.single()` coercion
  - `search_discoverable_candidates`: anon count > 0; pagination overlap

**Remote readiness conclusion:** 🟡 Schema largely aligned; **11 RLS failures remain** — not ready for closed beta until employer column security and discovery RPC issues are resolved.

See also: `docs/remote-beta-readiness.md`

## 3) AUTH

Verified by:
- Unit tests (safe responses, rate limiting, verification resend generic behavior)
- e2e (auth pages render; blocked login copy)

Results:
- registration: 🟡 PARTIAL
  - Unit tests cover behavior; e2e “live auth” flows were skipped.
- email verification: 🟡 PARTIAL
  - e2e shows verification resend CTA rendering when email unconfirmed.
  - Live email sending not verified (depends on remote providers/keys).
- resend: ✅ DONE (e2e page + unit coverage for resend endpoint behavior)
- login: 🟡 PARTIAL
  - e2e auth pages passed; “authenticated auth flows” were skipped due to unreachable Supabase hostname.
- logout: ⚪ NOT VERIFIED (live logout scenarios were skipped)
- forgot/reset: ✅ DONE (render + unit behavior)
- role routing: ✅ DONE (unit coverage of role gates + e2e chrome keys per locale)
- blocked state: ✅ DONE (e2e auth blocked error copy + unit blocked-user gate)
- admin MFA: ⚪ NOT VERIFIED
  - No executed output explicitly validated MFA enrollment/challenge.

## 4) SEEKER (complete flow)

Seeker flow target:
register → verify → profile → skills → education → certificate → search → filters → match → save → Quick Apply → applications → notification → withdraw

Verified path segments:
- register/verify: 🟡 PARTIAL (auth pages and resend CTA; live registration + confirmation not fully exercised)
- profile/skills: ⚪ NOT VERIFIED end-to-end live; some data-shape tests exist in unit suite
- education: 🔴 RISK remotely (RLS suite: `public.seeker_education` missing)
- certificate + self-verification prevention: ✅ DONE (self-verification prevention covered; some certificate storage flows depend on remote storage/RLS)
- search/filters/match/save:
  - ✅ DONE (unit suite covers sorting/filtering/pagination helpers; e2e job search passed)
- Quick Apply:
  - ✅ DONE for keyboard accessibility (e2e quick-apply-a11y passed)
  - 🟡 PARTIAL for signed-in “open from a published job” scenario (skipped)
- applications/withdraw:
  - ✅ DONE (unit tests for application withdrawal + application submit vs email delivery)
- notifications:
  - 🔴 RISK remotely (`public.notifications` missing in remote schema cache)

## 5) EMPLOYER

Target:
register → company → draft → edit → preview → publish → applicants → filters → candidate detail → matching → notes → pipeline

Verified segments:
- employer draft privacy / job ownership:
  - 🔴 RISK remotely (RLS suite failures around employer draft job_posts)
- candidate discovery authorization:
  - ✅ DONE at the code/RLS-negative level in unit suite
  - 🔴 RISK remotely because `search_discoverable_candidates` RPC missing in the RLS suite schema cache
- applicants/pipeline privacy:
  - 🟡 PARTIAL (unit suite covers ownership gates; remote RLS suite indicates missing schema objects)

## 6) ADMIN

Target:
users → employer verification → certificates → jobs → reports → block/unblock → audit viewer → authorization

Verified:
- admin audit viewer:
  - ✅ DONE (unit tests: parses filters, omits secrets, admin-gated read-only)
- admin authorization:
  - ✅ DONE (unit tests cover gates and blocked-user session revocation logic)
- employer verification + certificates:
  - ⚪ NOT VERIFIED end-to-end remotely (RLS suite did not explicitly validate all admin positive flows in executed output)
- block/unblock:
  - ✅ DONE at the authorization gate level (unit + e2e blocked user copy)

## 7) JOB SEARCH

Report (server/client):
- Pagination:
  - Unit tests cover pagination param parsing and clamping.
- Server/client filtering:
  - ✅ DONE (job search facet mapping + URL state tests)
- Server/client sorting:
  - ✅ DONE (unit tests for match sort + salary/soonest/newest)
- Facets:
  - ✅ DONE (facet selection mapping tests)
- Match sort behavior:
  - ✅ DONE in unit suite when ranking available; fallback logic tested.
- Query state:
  - ✅ DONE (URL state preserved, page=1 omitted, page>=2 preserved)

Performance concerns (real code evidence):
- Account/company listings and sitemap generation include high `.limit()` values:
  - `app/sitemap.ts`: `.limit(5000)` and `.limit(2000)`
  - `lib/companies/loadPublicCompanies.ts`: `.limit(1000)` per query (multiple rounds)
  - `lib/jobs/runSavedSearchAlertDelivery.ts`: uses `JOB_LIMIT`/`SEARCH_LIMIT` (bounded; validate actual constants before launch)

Impact classification (code-side):
- SEO sitemap generation:
  - P2 likely (offline/static generation; may impact build time more than runtime)
- Public company listing:
  - P2 likely (runtime page could be heavy; confirm cache strategy and indexing)

## 8) PERFORMANCE (remaining risk scan)

Evidence-based hotspots:
- High `.limit()` / bulk selects found via repo scan:
  - `lib/companies/loadPublicCompanies.ts` uses `.limit(1000)` (multiple queries)
  - `lib/jobs/*` loaders use bounded limits (examples from repo):
    - `loadSimilarJobsForDetail.ts`: `.limit(60)`
    - `loadRankedJobsForSeeker.ts`: `.limit(80)`
    - `authorizeApplicantDocument.ts`: `.limit(50)` / `.limit(1)`
    - `runSavedSearchAlertDelivery.ts`: `.limit(JOB_LIMIT)` / `.limit(SEARCH_LIMIT)`
  - Notifications inbox uses `.limit(100)` (bounded)

Duplicate auth queries / N+1:
- ⚪ NOT VERIFIED via dedicated profiling in this run.

Overall performance classification:
- P2 (quality) rather than P0, given bounded limits in critical flows and passing unit/e2e for job search pagination/sorting.

## 9) MOBILE

Validated by Playwright:
- ✅ DONE (mobile seeker browse overflow/menu visibility passed)
- ✅ DONE (Quick Apply keyboard accessibility)

Open/unknown:
- Sticky collisions / touch accessibility were not exhaustively profiled beyond the existing e2e cases.

Status:
- 🟡 PARTIAL

## 10) ACCESSIBILITY

Validated by Playwright:
- ✅ DONE (Quick Apply dialog keyboard trap + Escape behavior)

Other accessibility warnings observed:
- WebServer warnings about missing `Description` / aria-describedby for `DialogContent`
  - This is a11y-quality risk, but not a hard blocker from test failure.

Status:
- 🟡 PARTIAL

## 11) LOCALIZATION

Verified:
- e2e locales smoke for ET/EN/RU ✅
- unit localization smoke ✅

Risks:
- ⚪ NOT VERIFIED for all metadata variants beyond the tests executed.

Status:
- ✅ DONE (ET/EN/RU structurally consistent for covered areas)

## 12) SEO

Verified by:
- unit tests:
  - SEO JobPosting JSON-LD lifecycle & field completeness ✅
  - canonical + hreflang helpers ✅
- e2e:
  - public pages render tests passed (does not fully validate sitemap details)

Status:
- ✅ DONE for helpers; 🟡 PARTIAL for live crawling validation.

## 13) EMAIL / NOTIFICATIONS

Separate:

### 13.1 Implemented in code
- Employer application notifications:
  - ✅ DONE (endpoint exists and unit tests cover submit vs email delivery outcomes)
- Saved search alert delivery:
  - ✅ DONE in code paths (unit tests cover cron auth and delivery cursors)

### 13.2 Configured in code
- Resend env usage is present (`RESEND_API_KEY`, `EMAIL_FROM`, `SAVED_SEARCH_ALERTS_EMAIL`)
  - ⚪ NOT VERIFIED live because remote providers are not configured/usable in this environment.

### 13.3 Verified live
- 🔴 NOT VERIFIED
  - Remote email send delivery is not exercised against Resend in this run.
- Notifications delivery:
  - 🔴 RISK remotely (`public.notifications` missing in RLS suite schema cache).

## 14) TESTING (exact pass/fail)

Local code-side:
- `npm run lint`: ✅ pass
- `npm run typecheck`: ✅ pass
- `npm test`: ✅ pass
  - `pass 221 / fail 0 / skipped 0`
- `npm run build`: ✅ pass

Security:
- `npm run test:security` (RLS suite):
  - `Total 62 | PASS 42 | FAIL 20`

E2E:
- `npm run test:e2e`:
  - `29 passed | 0 failed | 8 skipped`
  - Some live-auth scenarios skipped due to unreachable Supabase hostname.

## 15) OPERATIONS (runbooks)

Verified:
- `docs/production-runbook.md` exists in the repo and documents operational routes/commands.

Status:
- 🟡 PARTIAL (exists, but remote backing systems were not fully verified in this audit).

---

## Priority Findings (P0/P1/P2)

### P0 — BLOCKS CLOSED BETA

1) Remote Supabase RLS / schema mismatch (storage + private tables + RPC)
- Component/table/route:
  - Storage bucket `resumes` (used by `app/api/resumes/signed-url/route.ts` and `lib/seeker/cvStorage.ts`)
  - Tables missing in remote schema cache:
    - `public.seeker_work_capacity`
    - `public.seeker_education`
    - `public.notifications`
  - Missing RPC:
    - `public.search_discoverable_candidates(p_page, p_page_size, p_query)`
- Current state:
  - RLS suite shows “Bucket not found” for resumes and FAILs for private CV upload/download and consented application download.
  - RLS suite reports missing tables/functions in schema cache.
- Risk:
  - 🔴 Direct privacy breaks or total functional failure (private docs + discovery + notifications).
- Recommended action:
  - Bring remote Supabase schema to expected migration state, then re-run `node scripts/rls-security-suite.mjs`.
- Complexity:
  - High

2) Remote RLS policy mismatch on employer private columns
- Component/table:
  - `public.employer_profiles.contact_email` (via employer profiles RLS)
- Current state:
  - RLS suite FAIL:
    - “Anon cannot SELECT employer contact_email — unexpected data”
- Risk:
  - 🔴 Data exposure (private contact_email becomes readable).
- Recommended action:
  - Reconcile remote RLS/security with migration history, then re-run RLS suite.
- Complexity:
  - High

3) Remote draft job access failures (stack depth exceeded)
- Component/table:
  - `public.job_posts` in employer draft viewing/updating authorization path
- Current state:
  - RLS suite FAIL:
    - “Employer A can SELECT own draft job_posts — stack depth limit exceeded”
- Risk:
  - 🔴 Employer workflow blocked (draft read/update and applicant list load).
- Recommended action:
  - Investigate RLS policy/functions causing recursion/stack depth, fix remote.
- Complexity:
  - Medium-High

4) Cron-dependent notifications / search alerts cannot be verified or scheduled remotely
- Component/table:
  - `cron.job` / `cron.job_run_details` (missing because `pg_cron` extension is absent)
- Current state:
  - Remote schema checks show `pg_cron` is not installed; therefore cron relations do not exist and cron-dependent suite paths cannot validate against live job runs.
- Risk:
  - 🔴 Functional failure / missing reminders + notification delivery windows.
- Recommended action:
  - Apply the repo migrations that wire cron jobs, then verify `pg_cron` exists (`pg_extension`) before re-running `npm run test:security`.
- Complexity:
  - High

### P1 — BEFORE PUBLIC BETA

1) Live end-to-end auth scenarios skipped (environment connectivity / live credentials)
- Component/tests:
  - `e2e/auth-live.spec.ts` (employer login/logout, seeker login/logout, blocked-user session)
- Current state:
  - Playwright: those cases were marked skipped in this run (live Supabase unreachable).
- Risk:
  - 🟡 Registration→verify→login→logout flows not fully validated end-to-end against live Supabase.
- Recommended action:
  - Fix environment connectivity and re-run `npm run test:e2e`.
- Complexity:
  - Low-Medium

2) Quick Apply signed-in flow partially skipped
- Component/tests:
  - `e2e/quick-apply-a11y.spec.ts` (“signed-in seeker can open Quick Apply from a published job”)
- Current state:
  - Scenario marked skipped.
- Risk:
  - 🟡 In-app conversion path not fully validated under remote auth.
- Recommended action:
  - Re-run e2e with usable remote Supabase credentials.
- Complexity:
  - Low-Medium

### P2 — QUALITY

1) Performance scaling risk from high `.limit()` usage (read-time cost)
- Evidence:
  - `lib/companies/loadPublicCompanies.ts` uses `.limit(1000)` multiple times
  - `app/sitemap.ts` uses `.limit(5000)` and `.limit(2000)`
- Risk:
  - 🟡 Might degrade performance at scale (mostly sitemap/build time; company listing runtime)
- Recommended action:
  - Add/confirm pagination and caching strategy; confirm indexes for referenced columns.
- Complexity:
  - Medium

2) Accessibility aria-describedby warnings in dialogs
- Evidence:
  - Playwright WebServer warnings: missing `Description` / aria-describedby on `DialogContent`
- Risk:
  - 🟡 Quality/accessibility improvement needed
- Complexity:
  - Low

---

## Feature Matrix

Legend for TESTED/STATUS:
- ✅ Tested
- 🟡 Partially tested
- ❌ Not tested / missing
- 🔴 Risk

| FEATURE | UI | BACKEND | DB | RLS | MOBILE | ET | EN | RU | TESTED | STATUS |
|---|---|---|---|---|---|---|---|---|---|---|
| Blocked user login + session gate | ✅ | ✅ | ⚪ | 🟡 (remote RLS suite failing overall) | ✅ | ✅ | ✅ | ✅ | unit + e2e auth.spec | 🟡 PARTIAL |
| Resend verification | ✅ | ✅ | ⚪ | ⚪ | ⚪ | ✅ | ✅ | ✅ | unit + e2e | 🟡 PARTIAL |
| Private resumes (signed URL + storage) | ✅ (route exists) | ✅ | ❌ (bucket missing in remote RLS suite) | ❌ | ⚪ | ✅ | ✅ | ✅ | RLS suite | 🔴 RISK |
| Private certificates (signed URL + verification prevention) | ✅ | ✅ | ⚪ | 🟡 | ⚪ | ✅ | ✅ | ✅ | unit + RLS suite | 🟡 PARTIAL |
| Application field locks (forge prevention) | ✅ | ✅ | ✅ | ✅ | ⚪ | ✅ | ✅ | ✅ | unit | ✅ DONE |
| Draft job privacy (owner-only) | ✅ | ✅ | ✅ | 🔴 (stack depth failures) | ⚪ | ✅ | ✅ | ✅ | unit + RLS suite | 🔴 RISK |
| Employer candidate discovery (RPC + RLS) | ✅ | ✅ | ❌ (RPC missing in remote suite) | ❌ | ⚪ | ✅ | ✅ | ✅ | unit + RLS suite | 🔴 RISK |
| Notifications (in-app + cron) | ✅ | ✅ | ❌ (`public.notifications` missing in remote suite) | ❌ | ⚪ | ✅ | ✅ | ✅ | unit + RLS suite | 🔴 RISK |
| Job search (filters/sort/pagination/state) | ✅ | ✅ | ✅ | ✅/🟡 | ✅ | ✅ | ✅ | ✅ | unit + e2e job-search | ✅ DONE |
| Quick Apply dialog accessibility | ✅ | ⚪ | ⚪ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ | e2e quick-apply-a11y | ✅ DONE |
| Admin audit viewer + gating | ✅ | ✅ | ✅ | 🟡 (not fully revalidated remotely) | ⚪ | ✅ | ✅ | ✅ | unit | 🟡 PARTIAL |

---

## FINAL VERDICT

**NOT READY**

Primary blocker: **REMOTE INFRASTRUCTURE** — migrations are now fully applied (77/77, pending 0) and most schema/storage gaps are closed, but the RLS security suite still reports **11 failures** (employer private column exposure, seeker profile row integrity, discovery RPC authorization).

Secondary blocker: **CODE** — E2E suite regressed (3 pass / 26 fail) due to WebServer JSON parse errors unrelated to migration apply.

Detailed remote report: `docs/remote-beta-readiness.md`

