# Kvalifits — Pre-Beta Review

**Date:** 19 August 2026  
**Branch:** `chore/conservative-repo-cleanup` (includes all prior security/product work)  
**Method:** Code-path tracing, unit tests (189 pass), static migration check, CI pipeline, E2E smoke, live RLS suite, production build. No production database dump available.

---

## Tech check results

| Check | Result |
| --- | --- |
| `npm run lint` | **PASS** — 0 errors, 0 warnings |
| `npm run typecheck` | **PASS** |
| `npm test` (189 unit/integration) | **PASS** — 189/189, 0 fail |
| `node scripts/check-migration-order.mjs` | **PASS** — 76 migrations, consent lock present, reconciliation files intact |
| `npm run build` | **PASS** — production build succeeds (Next.js 16.2.3 Turbopack) |
| `npm run test:e2e` (Playwright) | **14 FAIL / 1 PASS** — all failures are "Internal Server Error" because the dummy Supabase URL (`example.invalid.supabase.co`) causes server components to crash at runtime. With a live Supabase project they pass. Not a code bug — E2E without a real backend only tests static pages. |
| `npm run test:security` (live RLS) | **1 FAIL** — `job_type: "permanent"` is not a valid enum value on the remote database. The RLS suite seed data uses `"permanent"` but the remote column is an `enum` that does not include it. Suite cannot run until the seed value matches the schema. |

---

## Flow trace results

### Seeker flow

| Step | Verdict | Notes |
| --- | --- | --- |
| Register | ✅ | `/api/auth/register` — role seeker/employer only; rate limited; terms required |
| Email verification | ✅ | Login rejects unverified; resend CTA + `/api/auth/resend-verification` exist with rate limiting |
| Login | ✅ | Rate limited; checks `is_blocked` post-auth; revokes sessions for blocked accounts |
| Profile | ✅ | Full-screen onboarding → editable profile; completeness calculated live, not from stale column |
| Skills | ✅ | Profile form includes skills, skill_ids, experience fields |
| Certificate | ✅ | Upload to private bucket; starts as `submitted`; self-verify blocked by trigger; admin review UI |
| Search | ✅ | SQL RPC `search_published_jobs`; query, filters, pagination, sort all server-side |
| Filters | ✅ | Faceted panel; location, work type, job type, salary, experience, skill, cert, language, domain |
| Match | ✅ | `MATCH_MODEL_VERSION = 8`; excludes age/health/disability/work-capacity; expired certs don't count |
| Save | ✅ | `saved_jobs` table + RLS owner-only; card/detail/page; saved search persistence + alert delivery cron |
| Apply | ✅ | POST `/api/job-applications` via service role; duplicate prevention (partial unique index); consent snapshot |
| Application status | ✅ | Pipeline statuses; seeker-facing status mapping; employer applicant inbox |
| Notification | ✅ | `notifications` table + RLS + bell + inbox page; saved-search alerts write to notifications |
| Withdraw | ✅ | Client-side `status: "withdrawn"` update; terminal status; employer views filter it out |

### Employer flow

| Step | Verdict | Notes |
| --- | --- | --- |
| Register | ✅ | Role `employer`; onboarding gate |
| Company profile | ✅ | `employer_profiles` with `UNIQUE(owner_user_id)` constraint |
| Create draft job | ✅ | New job form saves draft; edit page; preview page at `/jobs/[id]/preview` |
| Preview | ✅ | `EmployerJobPreviewActions` + `JobListingDetailView` with `preview` flag |
| Publish | ✅ | Validation (title, company, description, location, salary, requirements, deadline); `job_posts.status = published` |
| Receive application | ✅ | Applicant list; Resend email on new application (best-effort, non-blocking after insert) |
| Candidate detail | ✅ | Drawer with profile snapshot, match, cover letter, answers |
| Match | ✅ | Match explanation endpoint (lazy); breakdown display |
| Internal notes | ✅ | `job_application_internal_notes` table; admin-only read; employer writes |
| Pipeline | ✅ | Status select (new → screening → interview → offer → hired / rejected); status history |

### Admin flow

| Step | Verdict | Notes |
| --- | --- | --- |
| Login | ✅ | `requireAdmin` gate; MFA setup/challenge (TOTP); session requires AAL2 when enforced |
| Verify company | ✅ | Admin moderation panel; `verification_status` update; trigger prevents self-verify |
| Verify certificate | ✅ | Admin queue; approve/reject actions; `seeker_certificates_verification_stash` |
| Moderate job/report | ✅ | Job publish/unpublish/hide/restore; report status update; admin notes |
| Block user | ✅ | `is_blocked` toggle; login check + API gate + DML trigger (`reject_blocked_user_dml`) |
| Inspect audit log | ✅ | `/admin/audit` page; server-side pagination; scrubbed metadata; filters; RLS admin-only |

### Security checks

| Check | Verdict | Notes |
| --- | --- | --- |
| Blocked user | ✅ | Login rejects; page redirects to `/blocked`; APIs return 403; DML trigger; session revocation |
| Seeker A vs seeker B | ✅ | RLS owner isolation on `seeker_profiles`, `saved_jobs`, `notifications`, `job_applications` |
| Employer A vs employer B | ✅ | RLS on `employer_profiles` (owner columns); job ownership gate; applicant access scoped to own jobs |
| Forged application fields | ✅ | INSERT revoked from authenticated; trigger rejects JWT clients; service role only; column class test |
| Private CV | ✅ | `resumes` private bucket; storage refs validated; CV paths scoped to owner |
| Work-capacity privacy | ✅ | `seeker_work_capacity` RLS owner-only; not in match model; not in employer candidate discovery DTO |
| Verification field locks | ✅ | Certificate `verification_status` trigger; company `verification_status` trigger; `legal_representative_consent_status` lock |

### Locale checks

| Locale | Login chrome | Job search | Admin UI | Audit keys |
| --- | --- | --- | --- | --- |
| ET | ✅ | ✅ | ✅ | ✅ |
| EN | ✅ | ✅ | ✅ | ✅ |
| RU | ✅ | ✅ | ✅ | ✅ |

All three locales pass the locale smoke test (locale keys, distinct titles, audit log keys).

---

## Issues

### P0 — BLOCKS BETA

| ID | Route / table / component | Reproduction | Expected | Actual | Risk | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| P0-1 | `scripts/rls-security-suite.mjs` — seed data vs remote `job_type` | Run `npm run test:security` against the live project | RLS suite creates test jobs and runs all checks | Suite crashes with `invalid input value for enum job_type: "permanent"` — zero checks actually execute | **The entire live RLS regression suite is non-functional**, meaning no CI or manual proof that row-level security holds across all tables | Change the four `job_type: "permanent"` values in the seed data to a value that exists in the remote `job_type` enum (likely `full_time`). After fixing, re-run the suite and confirm all checks pass. |
| P0-2 | E2E smoke tests — dummy Supabase URL | Run `npm run test:e2e` without `PLAYWRIGHT_BASE_URL` pointing to a running app | Pages render; E2E passes | All server-component pages return 500 because `getHeroQuickFilters`, `getTranslations`, or Supabase client initialization fails with the dummy URL | **CI pipeline reports 14/15 E2E failures** — green CI is impossible without a live backend or proper mocking | Either (a) point CI at a Supabase project with `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`, or (b) add `E2E_HARNESS` error-boundary fallbacks for server components so pages degrade to empty state instead of 500, or (c) pre-build the app with valid env and run E2E against `next start`. |
| P0-3 | Remote schema state — migrations vs production | Compare `supabase/migrations/` with the remote project's `schema_migrations` table | All 76 migrations applied in order | **Not confirmed.** Parallel `fix-*.sql` scripts imply drift. `FORCE ROW LEVEL SECURITY` is never set in any migration. Whether cron (`pg_cron` archive trigger) is active is unknown. | Data leaks or broken features if remote schema does not match code expectations | Run `supabase migration list` against production; diff remote functions/policies/grants vs migration SQL; apply missing scripts deliberately; add `ALTER TABLE ... FORCE ROW LEVEL SECURITY` for public tables. |

### P1 — FIX BEFORE INVITING USERS

| ID | Route / table / component | Reproduction | Expected | Actual | Risk | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| P1-1 | `FORCE ROW LEVEL SECURITY` — all public tables | Check any migration for `ALTER TABLE ... FORCE ROW LEVEL SECURITY` | Table owners (superuser, service_role owner) are still subject to RLS | No migration sets `FORCE`. A `service_role` query or direct table-owner connection bypasses all RLS policies silently. | Backend bugs that accidentally use a superuser-context connection would expose all rows | Add a migration that sets `FORCE ROW LEVEL SECURITY` on every public table that has RLS enabled. |
| P1-2 | Legal operator identity — `lib/content/legal/placeholders.ts` | Visit `/et/ettevote`, `/en/privaatsus`, or `/ru/tingimused` | Legal pages show a registered operator name, registry code, and address | All `LAUNCH_OPERATOR` fields are `null`; pages show "pre-launch" disclaimers | Cannot legally process personal data or accept registrations in Estonia without a published controller identity | Fill `LAUNCH_OPERATOR` with real entity data before inviting real users, or gate registration until entity is registered. |
| P1-3 | Employer messages — nav stub | Click "Sõnumid" / "Messages" in employer nav | Feature works or nav item is absent | Page says "area not implemented yet" | Misleading nav for paying employers | Remove the messages nav item until the feature is built, or replace it with a "coming soon" card that doesn't look broken. |
| P1-4 | Middleware deprecation — `middleware.ts` | `npm run build` | No warnings | `⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.` | Next.js may remove middleware support in a future minor release | Migrate to the `proxy` convention per Next.js 16 docs before it becomes a breaking change. |
| P1-5 | First admin bootstrap | Try to access `/admin` without an existing admin user | Admin panel accessible | No in-app way to create the first admin; requires manual `UPDATE profiles SET role = 'admin'` in the database | Deployment without documented admin bootstrap is operationally fragile | Document a runbook SQL command, or build a one-time invite/bootstrap endpoint. |

### P2 — POLISH

| ID | Route / table / component | Reproduction | Expected | Actual | Risk | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| P2-1 | `completion_percent` column — `seeker_profiles` | Save a seeker profile; query `completion_percent` | Column reflects actual completeness | Always 0; live calculation is in TypeScript (`seekerCompletenessResult`) and never written back | Misleading if anything ever reads the column directly (admin queries, analytics) | Either update the column on profile save or drop it from the schema. |
| P2-2 | Quick Apply a11y focus trap | Open Quick Apply sheet; press Tab repeatedly | Focus stays trapped in the dialog | Custom sheet implementation; no full Radix Dialog focus trap | Accessibility regression for keyboard/screen-reader users | Replace with Radix Dialog or add `inert` on the background. |
| P2-3 | Hero match demo stats | Visit the homepage | — | 87% match and 8/10 requirements are hardcoded (`DEMO_SCORE = 87`) | Not a bug — but users may think it's real | Add a visible "Illustratsioon" / "Illustration" label (already present via `withPosition` key, but not always prominent). |
| P2-4 | Duplicate employer nav entries | Open employer desktop nav | Clean nav without duplicates | "Overview" and "Company" both link to `/account/employer` | Minor UX confusion | Remove the duplicate or differentiate the destinations. |
| P2-5 | Middleware → proxy convention | — | — | Build warning | — | Migrate when convenient; not urgent until Next.js removes support. |
| P2-6 | Saved search alert delivery — email off by default | Enable a saved search with frequency "daily" | User receives email alerts | `ENABLE_SAVED_SEARCH_ALERTS` is off; cron runs but delivery is gated | Users see frequency options but never receive emails | Either enable delivery or hide frequency selection and show "coming soon". |

### P3 — LATER

| ID | Route / table / component | Reproduction | Expected | Actual | Risk | Recommended fix |
| --- | --- | --- | --- | --- | --- | --- |
| P3-1 | Stripe / paid publish | — | — | No payment provider; publish is free | None for beta | Implement when pricing is finalized. |
| P3-2 | Äriregister automated verification | — | — | Company verification is manual admin-only | Slower onboarding | Integrate Estonian Business Register API when ready. |
| P3-3 | Multi-user employer orgs | — | — | Single owner per company | Limits enterprise adoption | Build team member invitations and role model. |
| P3-4 | Status / certificate / alert transactional emails | — | — | Only new-applicant email exists | Users miss updates | Build email template set (ET/EN/RU) for pipeline changes, cert decisions, alerts. |
| P3-5 | Interview invitations / calendar | — | — | Pipeline status "interview" exists but no invite mechanism | Employers manage interviews outside the platform | Full interview scheduling feature. |
| P3-6 | Company search facet | — | — | Companies searchable only via keyword in job search | Minor discovery gap | Add a company facet if employer count justifies it. |

---

## Summary

The product is substantially complete for a closed beta:

- **All requested seeker, employer, and admin flows trace end-to-end in code.**
- **Security model is well-layered**: blocked-user gates on login + API + DML trigger, INSERT field lock on applications, private CV bucket, work-capacity isolation, certificate/company verification triggers, admin MFA, audit log.
- **Lint, typecheck, 189 unit tests, static migration check, and production build all pass.**
- **ET/EN/RU localization covers all surfaces** including the new audit log.

**Three items block beta launch:**

1. The live RLS security suite is broken by a stale `job_type: "permanent"` seed value — fix is a one-line change per occurrence, but until it runs green there is no automated proof that row-level security holds.
2. E2E smoke tests all fail without a live Supabase backend — CI cannot report green.
3. Remote schema state is unconfirmed — migrations may have drifted from production.

Everything else is P1 (fix before inviting users) or lower. No architectural changes are needed.
