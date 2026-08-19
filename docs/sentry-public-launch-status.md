# Sentry — Public Launch Status

Date: 2026-08-19

## Verdict

**VERIFIED** (production runtime active) — **HUMAN DASHBOARD CHECK REQUIRED** for alerting rules

---

## Production evidence

Live HTML from `https://www.kvalifits.ee` includes Sentry meta tags:

- `sentry-environment=production`
- `sentry-release=kvalifits@<git-sha>`
- `sentry-trace` / `baggage` headers on responses

This confirms Sentry SDK is initialized in the **currently deployed** production build.

---

## Vercel env listing

`NEXT_PUBLIC_SENTRY_DSN` does **not** appear in `vercel env ls` output — may be injected via Sentry–Vercel integration or build-time secret not shown in CLI summary. Runtime behavior confirms DSN is effective.

---

## Privacy filtering

| Control | Status |
|---------|--------|
| `sendDefaultPii: false` | **PASS** |
| `lib/monitoring/scrub.ts` | **PASS** — tokens, CV, certificates, application answers, work capacity |
| Unit tests | `lib/monitoring/scrub.test.ts` |
| Tunnel route | `/monitoring-tunnel` in `next.config.ts` |

---

## Operator dashboard checks

1. Open Sentry project for Kvalifits
2. Confirm events from `environment:production`
3. Create alert: error rate spike
4. Optional: verify source maps if `SENTRY_AUTH_TOKEN` configured in CI

---

## Safe test error

Use **Preview** deployment only — do not intentionally crash production user flows.

---

## Not verified here

- Alert rules configured
- On-call notification routing
