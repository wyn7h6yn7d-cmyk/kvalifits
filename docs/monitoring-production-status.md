# Monitoring Production Status

Date: 2026-08-19

## Verdict

**EXTERNAL ACTION REQUIRED**

Code integration is complete; production/preview DSN and alerting are not verified in this session.

---

## Implemented

| Component | Status |
|-----------|--------|
| `@sentry/nextjs` server/edge/client | **PASS** |
| `lib/monitoring/report.ts` | **PASS** — never throws |
| PII scrubbing | **PASS** — `lib/monitoring/scrub.ts` + tests |
| `sendDefaultPii: false` | **PASS** |
| Environment tagging | **PASS** — `VERCEL_ENV` / `NODE_ENV` |
| Health endpoints | **PASS** — `/api/health`, `/api/health/ready` |

---

## Required production configuration

| Variable | Purpose | Verified |
|----------|---------|----------|
| `NEXT_PUBLIC_SENTRY_DSN` | Error reporting | **NOT VERIFIED** |
| `SENTRY_ORG` | Source maps (optional) | **NOT VERIFIED** |
| `SENTRY_PROJECT` | Source maps (optional) | **NOT VERIFIED** |
| `SENTRY_AUTH_TOKEN` | CI source map upload | **NOT VERIFIED** |

Never print DSN values in logs or docs.

---

## Safe test procedure

1. Set DSN on **Vercel Preview** (not production users).
2. Trigger a controlled error in preview (e.g. temporary guarded test route or known failing preview action).
3. Confirm event in Sentry with correct `environment` tag.
4. Inspect payload — no CV, certificate, tokens, or application answer bodies.
5. Promote DSN to production before launch.

---

## Alerting recommendation

Configure Sentry alerts for:

- Error rate spike (>10 events / 5 min on production)
- New issue on `area:auth` or `area:job_application`
- Cron route failures (`code: saved_search_alert_cron`)

Uptime: probe `/api/health` every 1–5 minutes from external monitor.

---

## Public launch requirement

**Required before ~1000 users** — unmonitored production is not acceptable for a public employment platform.

Missing Sentry alone is **operational risk**, not a security/data-integrity failure, but launch gate treats it as **required for public launch**.
