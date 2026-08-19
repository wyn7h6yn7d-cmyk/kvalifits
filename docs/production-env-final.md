# Production Environment — Final Audit

Date: 2026-08-19 (post-deploy recheck)

Values **not** printed.

| VARIABLE | PURPOSE | PRODUCTION PRESENT? | PUBLIC/SECRET | STATUS |
|----------|---------|---------------------|---------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API | **Yes** | Public | **PASS** — production project ref |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client auth | **Yes** | Public | **PASS** |
| `SUPABASE_SERVICE_ROLE_KEY` | Server/cron/RLS | **Yes** | Secret | **PASS** |
| `RESEND_API_KEY` | Transactional email | **Yes** | Secret | **PASS** |
| `EMAIL_FROM` | Sender | **Yes** | Public | **VERIFY** domain in Resend dashboard |
| `CRON_SECRET` | Vercel cron auth | **Yes** (added) | Secret | **PASS** |
| Sentry DSN | Error monitoring | Runtime confirmed | Public | **PASS** — `sentry-environment=production` on live HTML |
| `SAVED_SEARCH_ALERTS_EMAIL` | Email alert opt-in | **No** | Public | **OK** — in-app alerts only |
| `E2E_*` | Test credentials | **Absent** | — | **PASS** |

---

## Live route verification (post-deploy)

| Route | Status |
|-------|--------|
| `/api/health` | **200** `{"ok":true}` |
| `/api/health/ready` | **200** `{"ok":true}` |
| `/api/uploads/consume` (unauthenticated) | **401** `not_authed` |
| `/api/cron/saved-search-alerts` (unauthenticated) | **401** |

---

## Anti-pattern checks

| Check | Result |
|-------|--------|
| `example.invalid.supabase.co` in production | **Not expected** |
| localhost in production Site URL | **Verify Supabase Dashboard** (local config is localhost only) |
| Health endpoints leak secrets | **PASS** — unit + live probe |

---

## Production deployment

- URL: `https://www.kvalifits.ee`
- Git: `main` @ `a748d83` (pushed and deployed)
- Prior gap (health 404): **resolved**
