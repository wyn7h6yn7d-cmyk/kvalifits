# Public Launch Release Gate

Date: 2026-08-19 (re-evaluated)  
Target: **FULL PUBLIC PRODUCTION LAUNCH** (~1000 early users)

## Final verdict

**NOT READY FOR PUBLIC LAUNCH**

Automated security, quality, and code readiness are strong. Launch is blocked by **legal operator identity**, **production email delivery verification**, **missing `CRON_SECRET` on Vercel Production**, **undeployed health/upload-rate-limit code**, **no live seeker/employer/admin walkthrough**, **no backup restore drill**, and **no staging load test**.

Human checklist: `docs/HUMAN-ACTIONS-BEFORE-LAUNCH.md`

---

## Gate matrix

| Cat | Area | Status |
|-----|------|--------|
| A | Database & migrations | **PASS** (clean local Docker drill: **EXTERNAL ACTION REQUIRED**) |
| B | Security (RLS) | **PASS** — 93/0 |
| C | Auth | **PASS** (code); live email **EXTERNAL ACTION REQUIRED** |
| D | Live seeker flow | **EXTERNAL ACTION REQUIRED** |
| E | Live employer flow | **EXTERNAL ACTION REQUIRED** |
| F | Admin | **EXTERNAL ACTION REQUIRED** |
| G | Email | **EXTERNAL ACTION REQUIRED** |
| H | Cron / background | **EXTERNAL ACTION REQUIRED** — schedule deployed; **`CRON_SECRET` missing** |
| I | Storage | **PASS** (private buckets + upload rate limits in code) |
| J | Monitoring | **PASS** (Sentry active on prod); alerting **EXTERNAL ACTION REQUIRED** |
| K | Backup / restore | **EXTERNAL ACTION REQUIRED** |
| L | Performance / load | **EXTERNAL ACTION REQUIRED** |
| M | Abuse / rate limiting | **PASS** |
| N | Mobile | **PASS** |
| O | Accessibility | **PASS** (axe smoke + Quick Apply a11y) |
| P | Localization | **PASS** |
| Q | SEO | **PASS** (code + scale assessment) |
| R | Privacy technical | **PASS** |
| S | Legal / operator | **FAIL** — `LAUNCH_OPERATOR` unset |
| T | Operations | **PARTIAL** — health routes in code; **404 on prod until deploy** |
| U | Automated quality | **PASS** |

---

## A. Database & migrations

| Check | Result |
|-------|--------|
| Git HEAD migrations | **78** |
| Working tree | **78** |
| Remote applied / pending | **78 / 0** |
| Reproducibility | **PASS** — `docs/migration-reproducibility-status.md` |
| Clean local apply | **EXTERNAL** — Docker required |

---

## B. Security

`npm run test:security` → **93 PASS / 0 FAIL**

---

## C. Auth & email

| Check | Result |
|-------|--------|
| Auth code (blocked user, rate limits) | **PASS** |
| Supabase Auth production config | **EXTERNAL** — `docs/supabase-auth-email-production.md` |
| Resend production | **EXTERNAL** — `docs/resend-production-status.md` |

Verdict: **HUMAN DELIVERY TEST REQUIRED**

---

## G. Email (Resend + Supabase)

See `docs/resend-production-status.md`, `docs/supabase-auth-email-production.md`.

---

## H. Cron

| Check | Result |
|-------|--------|
| `vercel.json` schedule | **PASS** — `0 8 * * *` |
| `vercel crons ls` | **VERIFIED DEPLOYED** |
| Unauthorized public GET | **401** |
| `CRON_SECRET` in Production env | **FAIL — absent** |
| DB pg_cron jobs | **PASS** (archive, deadline notifications) |

See `docs/vercel-cron-public-launch.md`.

---

## I. Storage & uploads

| Check | Result |
|-------|--------|
| Private resume/certificate buckets | **PASS** |
| MIME + size validation | **PASS** |
| Upload rate limits (`/api/uploads/consume`) | **PASS** (code; deploy required) |

See `docs/storage-upload-production.md`.

---

## J. Monitoring (Sentry)

| Check | Result |
|-------|--------|
| Production runtime (`sentry-environment=production`) | **VERIFIED** |
| Privacy scrubbing | **PASS** |
| Dashboard alerts | **EXTERNAL ACTION REQUIRED** |

See `docs/sentry-public-launch-status.md`.

---

## K. Backup / restore

**EXTERNAL ACTION REQUIRED** — `docs/backup-restore-drill.md`

---

## L. Performance / load

**EXTERNAL ACTION REQUIRED** — `docs/load-test-results.md` (not executed)

Pagination improvements merged for launch scale.

---

## M. Abuse / rate limiting

| Surface | Status |
|---------|--------|
| Login / register / reset | **PASS** |
| Job apply / report | **PASS** |
| Saved search create | **PASS** |
| CV / certificate / avatar upload | **PASS** |

---

## O. Accessibility

| Check | Result |
|-------|--------|
| axe smoke (5 routes) | **PASS** |
| Quick Apply keyboard trap | **PASS** |

See `docs/accessibility-public-launch.md`.

---

## Q. SEO scale

**PASS FOR LAUNCH SCALE** — `docs/seo-production-scale.md`

---

## S. Legal / operator

**FAIL** — all `LAUNCH_OPERATOR` fields null. See `docs/operator-launch-input.md`.

Status: **READY WHEN OPERATOR DATA PROVIDED**

---

## T. Operations

| Check | Result |
|-------|--------|
| `/api/health` in codebase | **PASS** |
| `/api/health` on production | **404** (undeployed) |
| Production env audit | **PARTIAL** — `docs/production-env-final.md` |

---

## U. Automated quality

Re-run 2026-08-19:

| Gate | Result |
|------|--------|
| lint | **PASS** (0 errors) |
| typecheck | **PASS** |
| unit | **225 PASS / 0 FAIL** |
| build | **PASS** |
| security | **93 PASS / 0 FAIL** |
| E2E | **34 PASS / 0 FAIL / 9 SKIPPED** (`--workers=1`; includes 5 axe smoke tests) |

Skipped: live seeker/employer/blocked credential tests.

---

## Live flows (D, E, F)

**EXTERNAL ACTION REQUIRED** — `docs/live-flow-production-results.md`

---

## UX availability (Task 16)

**PASS** — `docs/ux-availability-audit.md`

---

## Public launch blockers (must resolve)

1. **Legal operator** — fill `LAUNCH_OPERATOR` (`docs/operator-launch-input.md`)
2. **Production email smoke test** — Supabase Auth + Resend (`docs/HUMAN-ACTIONS-BEFORE-LAUNCH.md`)
3. **`CRON_SECRET`** on Vercel Production + verify cron runs
4. **Deploy latest `main`** — health endpoints, upload rate limits
5. **Live seeker/employer/admin walkthrough**
6. **Backup restore drill**
7. **Staging load test**

---

## Related documentation

- `docs/HUMAN-ACTIONS-BEFORE-LAUNCH.md`
- `docs/operator-launch-input.md`
- `docs/supabase-auth-email-production.md`
- `docs/resend-production-status.md`
- `docs/sentry-public-launch-status.md`
- `docs/vercel-cron-public-launch.md`
- `docs/backup-restore-drill.md`
- `docs/load-test-results.md`
- `docs/accessibility-public-launch.md`
- `docs/seo-production-scale.md`
- `docs/production-env-final.md`
- `docs/ux-availability-audit.md`
- `docs/live-flow-production-results.md`
- `docs/migration-reproducibility-status.md`
- `docs/load-test-plan.md`
- `docs/disaster-recovery.md`
- `docs/production-runbook.md`

---

## Re-run commands

```bash
npm run lint && npm run typecheck && npm test && npm run build
npm run test:security
npx playwright test --workers=1
supabase migration list
curl -sS https://www.kvalifits.ee/api/health
curl -sS https://www.kvalifits.ee/api/health/ready
```
