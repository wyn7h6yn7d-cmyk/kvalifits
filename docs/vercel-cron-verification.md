# Vercel Cron Verification

Date: 2026-08-19  
Project link: `.vercel/project.json` → `kvalifits` (`prj_JCvmknHBLNYaHGLhfTLnLgz4TVhk`)

## Verdict

**CODE READY — VERCEL ACTION REQUIRED**

Repository and route implementation are correct. Actual Vercel Cron schedule deployment and production secrets were **not verified** (Vercel CLI not installed in this environment).

---

## Saved-search alert route

| Check | Result |
|-------|--------|
| Route exists | **PASS** — `app/api/cron/saved-search-alerts/route.ts` |
| HTTP methods | **PASS** — `GET` and `POST` delegate to shared handler |
| Auth protection | **PASS** — `cronBearerAuthorized()` requires `Authorization: Bearer $CRON_SECRET` (constant-time compare) |
| Unauthorized rejection | **PASS** (code) — missing/wrong secret → `401 { error: "unauthorized" }` |
| Service role required | **PASS** — returns `500` if admin client unavailable |
| Cron schedule in repo | **PASS** — `vercel.json` → `/api/cron/saved-search-alerts` at `0 8 * * *` |
| Deployed on Vercel | **NOT VERIFIED** |
| `CRON_SECRET` in production | **NOT VERIFIED** |

---

## Database pg_cron (verified separately — not Vercel)

These run inside Supabase Postgres, not via Vercel:

| Job | Schedule | Status |
|-----|----------|--------|
| `archive-expired-job-posts` | `0 * * * *` | **VERIFIED** on remote |
| `notify-saved-jobs-near-deadline` | `15 7 * * *` | **VERIFIED** on remote |

---

## Idempotency and duplicate protection

| Mechanism | Location | Status |
|-----------|----------|--------|
| Delivery ledger table | `saved_search_alert_deliveries` | **PASS** — RLS suite denies seeker INSERT/SELECT |
| Unique delivery key | `runSavedSearchAlertDelivery.ts` | **PASS** — `uniqueViolation()` handles duplicate insert |
| Resend idempotency key | `sendEmailViaResend()` | **PASS** — `Idempotency-Key` header when provided |
| Cursor fields protected | `saved_job_searches` triggers | **PASS** — RLS suite: JWT cannot forge `last_notified_at` / `notify_after` |
| Email opt-in gate | `savedSearchAlertsEmailEnabled()` | **PASS** — requires `SAVED_SEARCH_ALERTS_EMAIL=1` **and** `RESEND_API_KEY` |

Saved-search **in-app notifications** can still be written when email is disabled; email is explicitly gated.

---

## Required environment variable names (production)

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Bearer token for `/api/cron/saved-search-alerts` |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin client inside cron handler |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `RESEND_API_KEY` | Optional — email leg of alerts |
| `EMAIL_FROM` | Optional — sender address |
| `SAVED_SEARCH_ALERTS_EMAIL` | Must be `1` to send alert emails |

Do **not** commit values. Verify presence only in Vercel dashboard or `vercel env ls` (when CLI available).

---

## Operator verification steps

1. **Vercel dashboard → Project → Settings → Cron Jobs**  
   Confirm `/api/cron/saved-search-alerts` appears with schedule `0 8 * * *`.

2. **Vercel dashboard → Settings → Environment Variables (Production)**  
   Confirm `CRON_SECRET` is set (value hidden).

3. **Manual authorized probe** (replace host and use production secret locally — do not log secret):
   ```bash
   curl -sS -o /dev/null -w "%{http_code}\n" \
     -H "Authorization: Bearer $CRON_SECRET" \
     "https://<production-host>/api/cron/saved-search-alerts"
   ```
   Expect `200` with JSON `{ ok: true, ... }` (or `200`/`500` with structured error if data preconditions missing — not `401`).

4. **Unauthorized probe** — omit header or use wrong token; expect `401`.

5. **Retry test** — invoke twice within same delivery window; confirm ledger prevents duplicate emails for the same delivery key.

---

## If cron is missing from Vercel UI

1. Ensure latest commit including `vercel.json` is deployed to production.
2. Redeploy production from the linked Git branch.
3. If still absent, open Vercel support/docs — Cron requires compatible plan and production deployment.

No repository change needed unless schedule path is wrong (currently correct).
