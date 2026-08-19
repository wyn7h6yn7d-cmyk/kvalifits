# Vercel Cron — Public Launch

Date: 2026-08-19  
Production: `https://www.kvalifits.ee`

## Verdict

**HUMAN VERCEL CHECK REQUIRED** — schedule **VERIFIED DEPLOYED**; **`CRON_SECRET` missing from production env list**

---

## Verified programmatically

| Check | Result |
|-------|--------|
| `vercel.json` schedule | `/api/cron/saved-search-alerts` → `0 8 * * *` |
| `vercel crons ls` | **1 cron job** on project `kvalifits` — same path/schedule |
| Unauthorized GET | **401** `{"error":"unauthorized"}` on production URL |
| Idempotency | Delivery ledger + Resend idempotency key (code) |

---

## Critical gap: `CRON_SECRET`

`vercel env ls production` shows **no `CRON_SECRET`**.

Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the variable is set. **Without it, scheduled invocations likely receive 401** and saved-search email delivery will not run.

**Human action:** Vercel → Settings → Environment Variables → add `CRON_SECRET` (Production) → redeploy.

---

## Verify after setting secret

1. Vercel → Cron Jobs → confirm last run status (not 401)
2. Optional manual invoke with Bearer token (operator only, do not log secret)
3. Confirm `saved_search_alert_deliveries` rows on test data

---

## Database cron (separate — verified)

| Job | Schedule |
|-----|----------|
| `archive-expired-job-posts` | `0 * * * *` |
| `notify-saved-jobs-near-deadline` | `15 7 * * *` |

These run in Supabase Postgres, not Vercel.

---

## Product copy alignment

In-app saved-search alerts work without email. Email requires `SAVED_SEARCH_ALERTS_EMAIL=1` + Resend + working cron.

UI note (`savedSearches.deliveryLiveNote`): emails not sent unless configured.
