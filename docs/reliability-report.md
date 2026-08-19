# Reliability and email — audit report

Branch: `reliability/email-monitoring`

## Task 1 — Application submission failure-safe

**Status: Already implemented.**

The application submission API (`app/api/job-applications/route.ts`) correctly separates DB insert from email notification:

1. Request validated, seeker profile confirmed, job lifecycle checked.
2. `job_applications` row inserted via admin client.
3. If insert succeeds → application is SUCCESS regardless of email outcome.
4. `notifyEmployerBestEffort` sends employer email in a try/catch. Failures are logged to Sentry (`area: email`) and `console.error` but never propagate to the candidate response.
5. Duplicate insert (unique constraint `23505`) returns `409 duplicate_application` with `alreadyApplied: true`.
6. Resend idempotency key (`kvalifits-app-notify:{applicationId}`) prevents duplicate emails.
7. `employer_notified_at` timestamp prevents re-sending on retry.

Tests: `lib/jobs/applicationSubmitOutcome.test.ts` covers DB fail, DB+email success, DB success+email fail, duplicate retry, and idempotency key.

**Outbox pattern:** Not implemented. Current best-effort with idempotency key is sufficient. If email reliability requirements increase, add an `application_notify_outbox` table + pg_cron or edge-function worker.

## Task 2 — Email verification resend

**Status: Already implemented.**

- API: `app/api/auth/resend-verification/route.ts`
- Logic: `lib/auth/resendVerification.ts`
- UI: `components/auth/LoginForm.tsx` — shows resend button when `unverified` state is set (triggered by `email_not_confirmed` login response)
- Rate limit: IP spray bucket + IP+email bucket (5 hits / 60 min)
- Anti-enumeration: generic `{ ok: true }` response for unknown users, confirmed users, and send failures
- i18n: ET (`Saada kinnitusmeil uuesti`), EN (`Resend confirmation email`), RU (`Отправить письмо подтверждения снова`)
- Success state: `resendVerificationSent` message shown after successful resend
- Tests: `lib/auth/resendVerification.test.ts`

## Task 3 — Email configuration audit

### Supabase Auth emails

Supabase Auth handles verification and password-reset emails. Configuration is in the Supabase Dashboard under Authentication → Email Templates. The repo does not store these templates.

**Required Supabase Dashboard configuration:**

| Setting | Location | Notes |
| --- | --- | --- |
| Confirmation email template | Auth → Email Templates → Confirm signup | Must include `{{ .ConfirmationURL }}` |
| Password reset template | Auth → Email Templates → Reset password | Must include `{{ .ConfirmationURL }}` |
| Email OTP expiry | Auth → Email Templates | Default 24h; consider 1h for security |
| SMTP provider | Auth → SMTP Settings | Default: Supabase built-in (rate-limited). Production should use custom SMTP (e.g. Resend SMTP relay) |
| Sender address | Auth → SMTP Settings → Sender email | Should match `kvalifits.ee` domain |
| Site URL | Auth → URL Configuration | Must match production origin |
| Redirect URLs | Auth → URL Configuration | Must include `https://<domain>/*/auth/callback` |

### Resend (transactional email)

Used for employer application notification emails only (not auth flows).

**Required environment variables:**

| Variable | Purpose | Where |
| --- | --- | --- |
| `RESEND_API_KEY` | Resend API authentication | Vercel env (server-only) |
| `EMAIL_FROM` | Sender address for employer notifications | Vercel env; defaults to `no-reply@kvalifits.ee` |

**Domain requirements:**

- `kvalifits.ee` must be verified in Resend dashboard (DNS records: SPF, DKIM, DMARC)
- `EMAIL_FROM` address must use the verified domain
- If using Resend as Supabase SMTP relay, the same domain verification applies

### Locale handling

- Auth emails: Supabase does not natively support locale-specific templates. The `emailRedirectTo` includes the locale path (`/{locale}/auth/callback`), so the callback page renders in the correct locale.
- Employer notification: locale is passed from the client and validated against `routing.locales`. Falls back to `et`.
- Password reset: redirect includes locale in the `next` query parameter.

### What cannot be verified from repo

- Whether Supabase email templates are actually configured
- Whether custom SMTP is set up in Supabase
- Whether DNS records (SPF/DKIM/DMARC) are properly configured for `kvalifits.ee`
- Whether Resend domain is verified
- Supabase rate limits for auth emails

## Task 4 — Production error monitoring

**Status: Already integrated.**

See `docs/monitoring.md` for full details. Summary:

- Sentry (`@sentry/nextjs`) integrated with server, edge, and client configs
- `beforeSend` scrubber strips passwords, tokens, CVs, certificates, work-capacity, PII
- Error boundaries at global and locale level
- `instrumentation.ts` captures `onRequestError`
- All API routes use `reportException`/`reportMessage` for server-side logging
- Environment separation via `VERCEL_ENV` tag
- No-op when `NEXT_PUBLIC_SENTRY_DSN` is unset

## Task 5 — Consistent error handling

**Changes made in this branch:**

Removed raw Supabase/provider error messages from API responses. These were leaking internal details to clients:

| File | Field removed |
| --- | --- |
| `app/api/auth/register/route.ts` | `message: error.message` from auth_failed, profile_failed (×3) |
| `app/api/auth/login/route.ts` | `message: error.message` from auth_failed |
| `app/api/job-reports/route.ts` | `message: insErr.message` from insert_failed |
| `app/api/certificates/signed-url/route.ts` | `message: signError` from sign_failed, `message` from legacy_public_file |
| `app/api/resumes/signed-url/route.ts` | `message: signError` from sign_failed |

Client-side `mapAuthError` updated to handle `weak_password` error code (previously relied on message string matching).

All error codes remain for client-side i18n mapping. Server-side details are captured via `reportMessage`/`reportException` to Sentry.

**Audit of all 17 API routes:** No remaining `message` fields that expose internal errors.
