# Production Environment — Final Audit

Date: 2026-08-19  
Source: `vercel env ls production`, code references, live probes

Values **not** printed.

| VARIABLE | PURPOSE | PRODUCTION PRESENT? | PREVIEW PRESENT? | PUBLIC/SECRET | STATUS |
|----------|---------|---------------------|------------------|---------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API | **Yes** | Yes | Public | **VERIFY** points to `svqdycsticovpudcgqvq` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client auth | **Yes** | Yes | Public | **PASS** |
| `SUPABASE_SERVICE_ROLE_KEY` | Server/cron/RLS tests | **Yes** | Yes | Secret | **PASS** |
| `RESEND_API_KEY` | Transactional email | **Yes** | Yes | Secret | **PASS** |
| `EMAIL_FROM` | Sender | **Yes** | Yes | Public | **VERIFY** domain in Resend |
| `CRON_SECRET` | Vercel cron auth | **No** | Unknown | Secret | **FAIL — add before launch** |
| `NEXT_PUBLIC_SENTRY_DSN` | Error monitoring | Not in CLI list | — | Public | **PASS** (runtime verified on live site) |
| `SAVED_SEARCH_ALERTS_EMAIL` | Email alerts opt-in | **No** | — | Public | **OK** if in-app only |
| `SENTRY_AUTH_TOKEN` | Source maps | Not listed | — | Secret | Optional |
| `E2E_*` / `E2E_TEST_FIXTURES` | Tests | Must be absent | — | — | **VERIFY absent** |

---

## Anti-pattern checks

| Check | Result |
|-------|--------|
| `example.invalid.supabase.co` in production | **Not expected** (E2E only) |
| localhost Site URL in Supabase Auth | **Verify dashboard** — local config is localhost |
| Production URL | `https://www.kvalifits.ee` (Vercel) vs `SITE_ORIGIN` `https://kvalifits.ee` — **align www** |

---

## Undeployed code note

`/api/health` and `/api/health/ready` return **404** on current production — deploy latest `main` to activate.

---

## Verification

After deploy: `curl -sS https://www.kvalifits.ee/api/health` → `{"ok":true}`
