# Cron & Background Jobs — Production Status

Date: 2026-08-19

## Verdict

**PARTIAL — EXTERNAL ACTION REQUIRED** (Vercel saved-search cron)

---

## Database `pg_cron` (verified on `svqdycsticovpudcgqvq`)

| Job | Schedule | Function | Status |
|-----|----------|----------|--------|
| `archive-expired-job-posts` | `0 * * * *` | `private.archive_expired_job_posts()` | **VERIFIED** |
| `notify-saved-jobs-near-deadline` | `15 7 * * *` | `private.notify_saved_jobs_near_deadline()` | **VERIFIED** |

Failure visibility: check Supabase Dashboard → Database → Cron logs / Postgres logs.

---

## Application / Vercel cron

| Route | Repo schedule | Auth | Status |
|-------|---------------|------|--------|
| `/api/cron/saved-search-alerts` | `0 8 * * *` (`vercel.json`) | `Bearer $CRON_SECRET` | **NOT VERIFIED deployed** |

Implementation:

- Idempotency via `saved_search_alert_deliveries` + Resend `Idempotency-Key`
- Email gated: `SAVED_SEARCH_ALERTS_EMAIL=1` + `RESEND_API_KEY`
- In-app notifications may still write when email disabled

---

## Operator verification

1. Vercel → Project → Cron Jobs — confirm route listed after production deploy.
2. Production env: `CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` set (names only in dashboard).
3. Authorized curl to production route — expect not `401`.
4. Unauthorized curl — expect `401`.
5. Double-invoke same window — no duplicate emails (check delivery ledger).

---

## Product promise rule

If UI advertises saved-search **email** alerts, cron + Resend must be operational or copy must state alerts are in-app only.

Current default: email alerts **opt-in** via env flag.

---

## Related

- `docs/vercel-cron-verification.md`
- `app/api/cron/saved-search-alerts/route.ts`
- `lib/jobs/runSavedSearchAlertDelivery.ts`
