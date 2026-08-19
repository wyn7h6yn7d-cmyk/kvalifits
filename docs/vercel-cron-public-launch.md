# Vercel Cron — Public Launch

Date: 2026-08-19 (updated after deploy)

## Verdict

**PASS** (configuration) — **HUMAN VERCEL CHECK REQUIRED** for first successful scheduled run log

---

## Verified programmatically

| Check | Result |
|-------|--------|
| `vercel.json` schedule | `/api/cron/saved-search-alerts` → `0 8 * * *` |
| `vercel crons ls` | **1 cron job** deployed |
| Unauthorized GET/POST | **401** `{"error":"unauthorized"}` |
| `CRON_SECRET` in Production env | **Yes** (added 2026-08-19; Sensitive) |
| Production redeploy after secret | **Yes** — release `kvalifits@a748d83…` |
| Idempotency (code) | Delivery ledger + Resend idempotency key |

---

## Authenticated invocation

Vercel CLI `env pull` does **not** export sensitive values locally. Authenticated cron smoke test must be verified by operator:

1. Vercel → Project → Cron Jobs → confirm next run **not 401**
2. Or: `curl -H "Authorization: Bearer <CRON_SECRET>" https://www.kvalifits.ee/api/cron/saved-search-alerts` using secret from Vercel dashboard (do not log secret)

Expected success body shape: `{"ok":true,...}` with delivery summary counts.

---

## Database cron (separate — verified)

| Job | Schedule |
|-----|----------|
| `archive-expired-job-posts` | `0 * * * *` |
| `notify-saved-jobs-near-deadline` | `15 7 * * *` |

---

## Email alerts note

Email delivery requires `SAVED_SEARCH_ALERTS_EMAIL=1` + Resend. In-app alerts work without email flag.
