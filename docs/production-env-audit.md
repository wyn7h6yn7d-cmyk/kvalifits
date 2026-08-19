# Production Environment Audit

Date: 2026-08-19

Names only — **never commit or log values**.

---

## REQUIRED (production)

| Variable | Status | Notes |
|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | **VERIFY on Vercel** | Must be `https://svqdycsticovpudcgqvq.supabase.co` — not localhost or `example.invalid` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **VERIFY** | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **VERIFY** | Server/cron/rate-limit only |
| `RESEND_API_KEY` | **VERIFY** | Application + alert emails |
| `EMAIL_FROM` | **VERIFY** | Verified sender domain in Resend |
| `NEXT_PUBLIC_SENTRY_DSN` | **MISSING locally; VERIFY prod** | Required for public launch monitoring |
| `CRON_SECRET` | **VERIFY** | Vercel cron auth |

---

## OPTIONAL / FEATURE FLAGS

| Variable | Purpose |
|----------|---------|
| `SAVED_SEARCH_ALERTS_EMAIL` | `1` to send alert emails |
| `AUTH_REQUIRE_EMAIL_VERIFICATION` | Enforce verified email |
| `AUTH_RATE_LIMIT_FAIL_OPEN` | Should be unset/0 in production |
| `NEXT_PUBLIC_EMPLOYER_COMPANY_SIZE_SYNC` | Feature flag |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | Source maps |
| `E2E_*`, `E2E_TEST_FIXTURES` | **Must NOT be set in production** |

---

## PREVIEW / CI ONLY

| Variable | |
|----------|--|
| `PLAYWRIGHT_*` | CI E2E |
| `E2E_HARNESS` | Test server |

---

## Anti-patterns to check

| Check | |
|-------|--|
| Production using dev Supabase project | **Must not** |
| `example.invalid.supabase.co` | **Must not** (E2E placeholder only) |
| Test recipient hardcoded in prod env | **Must not** |

---

## Verification method

1. Vercel Dashboard → Settings → Environment Variables → Production column (names only).
2. Compare against `docs/production-runbook.md` §2.
3. After deploy smoke: `/api/health/ready` returns `{ ok: true }`.

Vercel CLI not installed on audit machine — dashboard review required.
