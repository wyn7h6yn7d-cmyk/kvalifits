# Kvalifits — Closed Beta Release Gate

Date: 2026-08-19 (re-run after blocker closure work)  
Git HEAD: `9c8b76f`  
Linked Supabase project: `svqdycsticovpudcgqvq` (`kvalifits Project`, eu-west-1)

## Final verdict

**NOT READY FOR CLOSED BETA**

All **security, migration history, and automated quality** gates pass. Remaining gaps are **operator verification** on the deployed environment: production auth email deliverability, live seeker/employer/admin walkthrough, Vercel cron/secrets confirmation, and optional Sentry setup.

No open **security or data-integrity** code blockers were found in this re-run.

---

## Gate summary

| Gate | Status |
|------|--------|
| A. Database | **PASS** (clean local apply: **EXTERNAL ACTION REQUIRED**) |
| B. Security | **PASS** |
| C. Automated quality | **PASS** |
| D. Live flows | **EXTERNAL ACTION REQUIRED** |
| E. Storage | **PASS** |
| F. Cron | **PARTIAL** — DB **PASS**; Vercel **EXTERNAL ACTION REQUIRED** |
| G. Email | **EXTERNAL ACTION REQUIRED** |
| H. Monitoring | **EXTERNAL ACTION REQUIRED** (non-blocking for beta safety) |

---

## A. Database

| Check | Status | Evidence |
|-------|--------|----------|
| Correct remote project | **PASS** | `svqdycsticovpudcgqvq` linked |
| Repository migrations (Git HEAD) | **PASS** | **78** files committed (`Fix final Supabase migration history`) |
| Working tree migrations | **PASS** | **78** files |
| Remote applied | **PASS** | **78** / **78** paired |
| Pending remote | **PASS** | **0** — `supabase db push --linked --dry-run` → up to date |
| Git reproducibility | **PASS** | HEAD = working tree = remote manifest |
| Clean local apply from zero | **EXTERNAL ACTION REQUIRED** | Docker/Podman unavailable; `supabase db reset --local` not run on this machine |

---

## B. Security

Command: `npm run test:security`  
Result: **93 PASS / 0 FAIL**

| Area | Status |
|------|--------|
| Employer private columns | **PASS** |
| Seeker isolation | **PASS** |
| Education privacy | **PASS** |
| Candidate discovery auth | **PASS** |
| Candidate pagination isolation | **PASS** |
| CV privacy | **PASS** |
| Certificate privacy | **PASS** |
| Blocked users (DB write guard) | **PASS** — trigger deployed; fixture E2E available |
| Application forge protection | **PASS** |
| Company verification protection | **PASS** — 7 new adversarial tests (self-verify denied; admin allowed) |
| Certificate verification protection | **PASS** |
| Draft job privacy | **PASS** |

See also: `docs/remote-beta-readiness.md`

---

## C. Automated quality

| Command | Result |
|---------|--------|
| `npm run lint` | **PASS** |
| `npm run typecheck` | **PASS** |
| `npm test` | **PASS** — 221/221 |
| `npm run build` | **PASS** |
| `npm run test:e2e` | **PASS** — 29 passed, 0 failed, 9 skipped |
| `npm run test:security` | **PASS** — 93/0 |

E2E skipped (9): live-auth specs + blocked-user fixture (requires `E2E_TEST_FIXTURES=1` + project ref).

Offline E2E no longer floods logs with `ENOTFOUND example.invalid.supabase.co` for public job/company loaders.

---

## D. Live flows

| Flow | Status |
|------|--------|
| Seeker (register → withdraw) | **EXTERNAL ACTION REQUIRED** |
| Employer (register → pipeline) | **EXTERNAL ACTION REQUIRED** |
| Admin (verify → block/unblock) | **EXTERNAL ACTION REQUIRED** |

Details: `docs/live-beta-walkthrough.md`

Automated UI partial coverage: public routes, job search UI, Quick Apply a11y harness page.

---

## E. Storage

Remote buckets: `resumes`, `cvs`, `certificates` private; `avatars`, `company-logos`, `certificate-images` public.  
RLS storage tests: **PASS**

---

## F. Cron

| Layer | Status |
|-------|--------|
| `pg_cron` archive expired jobs | **PASS** — `0 * * * *` |
| `pg_cron` saved job deadline | **PASS** — `15 7 * * *` |
| Vercel `/api/cron/saved-search-alerts` | **EXTERNAL ACTION REQUIRED** |

Details: `docs/vercel-cron-verification.md` — **CODE READY — VERCEL ACTION REQUIRED**

Unconfigured saved-search cron does **not** block beta if product copy does not promise email alerts.

---

## G. Email

| Check | Status |
|-------|--------|
| Code + failure-safe application email | **PASS** |
| Local `RESEND_API_KEY` / `EMAIL_FROM` names | **PASS** |
| Production Vercel env + deliverability | **EXTERNAL ACTION REQUIRED** |
| Supabase Auth verification email (production) | **EXTERNAL ACTION REQUIRED** |

Details: `docs/email-production-verification.md`

**Must confirm auth verification email before inviting users.**

---

## H. Monitoring

| Check | Status |
|-------|--------|
| Sentry integration + scrubbing | **PASS** (code) |
| Production DSN on Vercel | **EXTERNAL ACTION REQUIRED** |

Details: `docs/sentry-production-verification.md`

Missing Sentry is **operational risk only**, not a security blocker.

---

## Commits in this closure pass

1. `Fix final Supabase migration history`
2. `Add employer company verification RLS adversarial tests`
3. `Add ephemeral blocked-user E2E with project safety guard`
4. `Avoid Supabase network calls in offline Playwright harness`
5. `Fix offline job search empty facet typing for typecheck`

---

## Related reports

- `docs/migration-integrity-report.md`
- `docs/live-beta-walkthrough.md`
- `docs/vercel-cron-verification.md`
- `docs/email-production-verification.md`
- `docs/sentry-production-verification.md`
- `docs/e2e-regression-report.md`
- `docs/production-runbook.md`

---

## Exact human actions still required

1. Run `supabase db reset --local` on a Docker machine; confirm 78 migrations apply.
2. Deploy latest `main` to production/preview on Vercel.
3. Confirm Supabase Auth verification email works (register one test seeker; click link).
4. Confirm Vercel Production has `RESEND_API_KEY`, `EMAIL_FROM`; send one operator test email.
5. Confirm Vercel Production has `CRON_SECRET`; verify cron job appears in dashboard; probe route with Bearer auth.
6. Optionally set `NEXT_PUBLIC_SENTRY_DSN` on production.
7. Execute `docs/live-beta-walkthrough.md` on beta URLs with dedicated test accounts.
8. Enable blocked-user fixture E2E in CI/staging: `E2E_TEST_FIXTURES=1`, `E2E_SUPABASE_PROJECT_REF=svqdycsticovpudcgqvq`.

After steps 1–7 pass, re-run this gate and promote verdict to **READY FOR CLOSED BETA**.
