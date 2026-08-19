# Email Production Verification

Date: 2026-08-19

## Verdict

**PRODUCTION ENV ACTION REQUIRED**

Code paths and local dev variable **names** are present. Production Vercel delivery and domain verification were **not confirmed** in this session. No test email was sent (no designated operator recipient configured).

---

## Integration map

| Flow | Implementation | Failure-safe |
|------|----------------|--------------|
| Auth verification email | Supabase Auth (hosted) | N/A — Supabase sends |
| Password reset | `app/api/auth/forgot-password/route.ts` → Supabase Auth | Rate-limited |
| Employer application notify | `app/api/job-applications/route.ts` → `sendEmailViaResend` | **PASS** — application persists if email fails; unit test covers outcome |
| Saved search alerts | `runSavedSearchAlertDelivery.ts` → Resend | Skips email when `SAVED_SEARCH_ALERTS_EMAIL !== "1"` or missing API key |

---

## Environment variables

| Variable | Local (`.env.local`) | Production Vercel |
|----------|----------------------|-------------------|
| `RESEND_API_KEY` | **Present** (value redacted) | **NOT VERIFIED** |
| `EMAIL_FROM` | **Present** (value redacted) | **NOT VERIFIED** |
| `SAVED_SEARCH_ALERTS_EMAIL` | Unknown | **NOT VERIFIED** |

Supabase Auth verification/reset emails use **Supabase's mailer**, not Resend, unless custom SMTP is configured in Supabase dashboard.

---

## Security

- Secrets are read from `process.env` only; never logged in `sendEmailViaResend` error paths.
- Provider error bodies are discarded.
- Production missing config reports to Sentry via `reportMessage("email_missing_config")` without throwing.

---

## Sender domain assumptions

- Default fallback in code: `no-reply@kvalifits.ee` when `EMAIL_FROM` unset.
- Resend requires the `EMAIL_FROM` domain to be verified in Resend dashboard.
- Operator must confirm DNS/Resend domain status before beta invites.

---

## Manual smoke test (operator)

1. Confirm `RESEND_API_KEY` and `EMAIL_FROM` exist in **Vercel Production** env (names only in dashboard).
2. Send **one** test message to a designated operator inbox (not a real user):
   - Option A: trigger password reset for a test account you control.
   - Option B: submit a test application where employer contact is your operator email.
3. Confirm message arrives, sender matches `EMAIL_FROM`, links work.
4. Confirm Supabase Auth verification email arrives for a newly registered test seeker.

Do **not** send bulk or unsolicited mail during verification.

---

## Application email failure behavior

Verified by unit test and code review:

- Successful DB insert of `job_applications` is **not rolled back** when Resend returns `{ ok: false }`.
- Failure is logged and reported to monitoring; employer may need to refresh applicants view.

**Status: PASS (code + unit test)**

---

## Blockers for closed beta

Email verification for new signups **must work** via Supabase Auth before inviting users. Confirm in Supabase dashboard:

- Site URL / redirect URLs include production domain
- Email templates enabled
- SMTP or default Supabase mailer operational

Resend is required for employer application notifications and optional saved-search alert emails, not for initial Auth signup unless custom SMTP points to Resend.
