# Resend — Production Status

Date: 2026-08-19

## Verdict

**HUMAN DELIVERY TEST REQUIRED**

Production variables exist on Vercel; live delivery not smoke-tested in this session.

---

## Vercel production env (names only — verified via `vercel env ls`)

| Variable | Production present? |
|----------|---------------------|
| `RESEND_API_KEY` | **Yes** (Sensitive) |
| `EMAIL_FROM` | **Yes** |
| `SAVED_SEARCH_ALERTS_EMAIL` | **Not listed** — email alerts opt-in off unless set to `1` |

---

## Call sites

| Flow | File | Failure-safe? |
|------|------|---------------|
| Employer application notify | `app/api/job-applications/route.ts` | **Yes** — application persists; unit test |
| Saved search alerts | `lib/jobs/runSavedSearchAlertDelivery.ts` | Skips email when disabled/missing key |
| Idempotency | `sendEmailViaResend` + `Idempotency-Key` | Prevents duplicate sends on retry |

---

## Sender domain

Verify in [Resend Dashboard](https://resend.com/domains) that `EMAIL_FROM` domain is verified (SPF/DKIM as shown by Resend).

Do not print API key or full sender secrets.

---

## Smoke test (operator)

1. Ensure `EMAIL_FROM` domain verified in Resend
2. Trigger one controlled email to **your operator inbox**:
   - Option A: test job application where employer contact is operator email
   - Option B: temporary Resend API test from dashboard
3. Confirm received, correct From header, no PII leakage in logs

**Not executed here** — no designated operator test address in repo config.

---

## Application email failure

Verified in code + `lib/jobs/applicationSubmitOutcome.test.ts`: failed Resend does **not** roll back `job_applications` insert.
