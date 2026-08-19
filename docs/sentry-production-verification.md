# Sentry Production Verification

Date: 2026-08-19

## Verdict

**PRODUCTION ENV ACTION REQUIRED**

Sentry is integrated in application code with PII scrubbing. Production `NEXT_PUBLIC_SENTRY_DSN` and optional source-map upload tokens were **not verified** on Vercel in this session.

Sentry misconfiguration **does not block closed beta** if otherwise functional, but should be configured before wider rollout.

---

## Code integration

| Component | Path | Status |
|-----------|------|--------|
| Server SDK | `sentry.server.config.ts` | **PASS** |
| Edge SDK | `sentry.edge.config.ts` | **PASS** |
| Shared options | `lib/monitoring/sentryOptions.ts` | **PASS** |
| Exception helper | `lib/monitoring/report.ts` | **PASS** — never throws |
| Scrubbing | `lib/monitoring/scrub.ts` + tests | **PASS** |

---

## Environment variables

| Variable | Purpose | Local | Production |
|----------|---------|-------|------------|
| `NEXT_PUBLIC_SENTRY_DSN` | Client + server reporting | **Not set** | **NOT VERIFIED** |
| `SENTRY_ORG` | Source map upload | — | **NOT VERIFIED** |
| `SENTRY_PROJECT` | Source map upload | — | **NOT VERIFIED** |
| `SENTRY_AUTH_TOKEN` | CI/build upload | — | **NOT VERIFIED** |

Values must never be printed or committed.

---

## Sensitive data exclusions

Scrubber filters keys matching:

- Auth tokens, cookies, secrets, API keys
- `email`, `phone`, `cv`, `resume`, `certificate`
- `application_answers`, `work_capacity`, `date_of_birth`, cover letter fields

`sendDefaultPii: false` in Sentry options.

Unit tests: `lib/monitoring/scrub.test.ts`.

**Status: PASS (code)**

---

## Environment distinction

`sentryEnvironment()` uses:

1. `NEXT_PUBLIC_VERCEL_ENV`
2. `VERCEL_ENV`
3. `NODE_ENV`

Trace sampling: 10% production, 20% preview, 0% development.

---

## Operator verification steps

1. Vercel **Production** → Environment Variables → confirm `NEXT_PUBLIC_SENTRY_DSN` is set.
2. Deploy preview; trigger a controlled test error (e.g. temporary `/api/debug/sentry-test` route in preview only — **do not crash production intentionally**).
3. Confirm event appears in Sentry with environment tag `production` or `preview`.
4. Inspect event payload — no CV, certificate, or auth token content.
5. Optional: configure `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` for source maps on build.

---

## Preview test pattern (safe)

Use Vercel preview deployment:

```bash
# After adding a guarded preview-only route or using an existing non-production error path
curl -sS "https://<preview-host>/api/..." 
```

Verify in Sentry Issues within a few minutes. Remove test route before production promotion if added temporarily.

---

## Classification for release gate

| Risk if missing | Assessment |
|-----------------|------------|
| Security/data integrity | **None** — monitoring only |
| Beta operability | **Low** — errors may go unnoticed |
| Recommended before closed beta | **Yes, but not blocking** |
