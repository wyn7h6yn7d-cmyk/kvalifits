# Production error monitoring

Kvalifits uses **Sentry only** (`@sentry/nextjs`). There is no second error platform. Vercel Analytics / Speed Insights stay for consented product analytics; they are not error monitoring.

SDK init is a no-op when `NEXT_PUBLIC_SENTRY_DSN` is unset, so ordinary CI and local `npm run build` do not need Sentry secrets.

## What is collected

When a DSN is set, Sentry receives:

- Unhandled server exceptions (`instrumentation.ts` `onRequestError`)
- Unhandled client / React render crashes (`app/global-error.tsx`, `app/[locale]/error.tsx`)
- Explicit reports for unexpected API 500s, tagged with `area`:
  - `api` — reports, account export/delete, admin hard-delete
  - `job_application` — apply insert failures and unhandled apply route errors
  - `auth` — `login_unavailable`, signup profile 500s, missing rate-limit table
  - `email` — Resend provider errors; employer-notify best-effort failures (application id only)
  - `storage` — CV / certificate / avatar upload failures; signed-URL `sign_failed`
- Client network failures on login, verification resend, and apply submit (`catch` of `fetch`)

Each event is tagged with `environment` (`production` / `preview` / `development` from `VERCEL_ENV`) and `release` (`kvalifits@<git sha>` on Vercel).

Sampling:

- Errors: 100% when the DSN is set
- Traces: 10% production, 20% preview, 0% local
- Session Replay: **off**
- Sentry console log forwarding: **off**
- `sendDefaultPii`: **false**

Source maps upload only when `SENTRY_AUTH_TOKEN` is present. Maps are deleted after upload. Browser source maps are not published.

Client events are tunneled through `/monitoring-tunnel` so ad blockers are less likely to drop them. Locale middleware does not run on that path.

## What is excluded

`beforeSend` (`lib/monitoring/scrub.ts`) strips:

- Passwords, cookies, `Authorization`, API keys, service-role material, access/refresh tokens, OAuth `code`
- Request bodies
- User email / IP / username (user id may remain)
- CV / resume / certificate fields and object paths
- Work-capacity and health fields
- Cover letters, `noteForEmployer`, full `application_answers`
- Email HTML and recipient addresses

Expected user outcomes are **not** reported:

- Invalid credentials, blocked account, unverified email
- Validation 400s, duplicate apply (409), closed job (410)
- Normal auth rate limits (429), except missing rate-limit table (infra)
- Verification resend / password-reset “unknown email” (anti-enumeration)
- Local/dev missing `RESEND_API_KEY` (`missing_config` is reported only when `VERCEL_ENV=production`)

## How to inspect an error

1. Open the Sentry project Issues list.
2. Filter **environment** `production` vs `preview`.
3. Filter tag **area** (`auth`, `email`, `job_application`, `storage`, `api`, `client`).
4. Open an issue: stack + release SHA. Request bodies, CVs, and emails should not be present; if a field leaked, treat it as a bug in the scrubber.
5. Vercel logs remain a fallback. Prefer Sentry for grouping and alerts.

## Vercel / Sentry env vars

Set on the Vercel project (Production + Preview):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SENTRY_DSN` | Public DSN; enables capture |
| `SENTRY_ORG` | Org slug for source-map upload |
| `SENTRY_PROJECT` | Project slug for source-map upload |
| `SENTRY_AUTH_TOKEN` | Source-map upload token (server-only) |

Do not put the auth token in `NEXT_PUBLIC_*`. Ordinary GitHub CI must keep these unset.
