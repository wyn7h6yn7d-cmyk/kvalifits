# Sentry — Public Launch Status

Date: 2026-08-19 (updated)

## Verdict

**VERIFIED** (production ingestion) — **HUMAN DASHBOARD CHECK REQUIRED** for alert rules

---

## Production evidence

Live HTML from `https://www.kvalifits.ee`:

- `sentry-environment=production`
- `sentry-release=kvalifits@a748d83…` (matches deployed commit)

---

## Privacy filtering

| Control | Status |
|---------|--------|
| `sendDefaultPii: false` | **PASS** |
| `lib/monitoring/scrub.ts` | **PASS** |
| Unit tests | **PASS** |

---

## Alerting (operator — exact steps)

1. Open Sentry project → **Alerts** → Create Alert
2. **Error rate spike:** When event count > N in 1h for `environment:production` → email/Slack
3. **New issue:** First seen in production → notify on-call
4. Optional: **Application API failures** — filter `transaction:/api/job-applications` if volume warrants

Do not create noisy per-event alerts.

---

## Source maps

Verify in Sentry release view if `SENTRY_AUTH_TOKEN` configured in CI. Not required for error capture.

---

## Safe test

Use **Preview** deployment only — do not crash production user flows.
