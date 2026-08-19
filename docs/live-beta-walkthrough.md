# Live Beta Walkthrough

Date: 2026-08-19  
Environment: not executed against a deployed beta URL in this session

## Summary

Live seeker, employer, and admin flows were **not automated end-to-end** in this gate run. No dedicated beta account credentials (`E2E_SEEKER_*`, `E2E_EMPLOYER_*`, admin login) were configured for a full browser walkthrough against production or staging.

Use this document as the operator checklist template. Mark each step after manual verification on the target beta deployment.

---

## Seeker flow

| Step | Status | Notes |
|------|--------|-------|
| Register | **NOT TESTED — EXTERNAL ACTION REQUIRED** | Requires human email inbox for verification link |
| Email verification | **NOT TESTED — EXTERNAL ACTION REQUIRED** | Click Supabase Auth / app verification link |
| Login | **NOT TESTED — EXTERNAL ACTION REQUIRED** | Set `E2E_SEEKER_EMAIL` / `E2E_SEEKER_PASSWORD` for automated partial coverage |
| Complete profile | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |
| Add skill | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |
| Add education | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |
| Add certificate metadata/document | **NOT TESTED — EXTERNAL ACTION REQUIRED** | Use test document only |
| Search job | **PASS** (automated UI) | Offline E2E covers `/et/tood` search UI without live data |
| Filter | **PASS** (automated UI) | Filter dialog opens in mobile E2E |
| Inspect match | **NOT TESTED — EXTERNAL ACTION REQUIRED** | Requires signed-in seeker with profile + published jobs |
| Save job | **NOT TESTED — EXTERNAL ACTION REQUIRED** | Requires live auth |
| Apply | **NOT TESTED — EXTERNAL ACTION REQUIRED** | Quick Apply a11y E2E skipped without live seeker creds |
| Application state | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |
| Notification | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |
| Withdraw | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |

---

## Employer flow

| Step | Status | Notes |
|------|--------|-------|
| Register | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |
| Company profile | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |
| Create draft | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |
| Edit | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |
| Preview | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |
| Publish | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |
| Receive applicant | **NOT TESTED — EXTERNAL ACTION REQUIRED** | Depends on seeker apply step |
| Candidate detail | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |
| Match explanation | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |
| Pipeline update | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |
| Internal note | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |

Automated partial coverage: employer login/logout E2E skipped without `E2E_EMPLOYER_*`.

---

## Admin flow

| Step | Status | Notes |
|------|--------|-------|
| Admin login | **NOT TESTED — EXTERNAL ACTION REQUIRED** | No admin E2E credentials configured |
| Verify company | **NOT TESTED — EXTERNAL ACTION REQUIRED** | RLS suite proves admin JWT can set `verification_status` |
| Verify/reject certificate | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |
| Moderate report/job | **NOT TESTED — EXTERNAL ACTION REQUIRED** | Use test content only |
| Block/unblock beta user | **NOT TESTED — EXTERNAL ACTION REQUIRED** | Blocked-user fixture E2E available when `E2E_TEST_FIXTURES=1` |
| View audit log | **NOT TESTED — EXTERNAL ACTION REQUIRED** | |

---

## Automated coverage that substitutes for parts of this walkthrough

| Area | Evidence |
|------|----------|
| RLS security | 93/0 on remote (`npm run test:security`) |
| Public job/company UI | 29 E2E pass (offline harness) |
| Blocked login | `e2e/auth-blocked.spec.ts` when fixture env configured |
| Application email failure-safe | Unit test `applicationSubmitOutcome.test.ts` |

---

## Required configuration for live automation

```bash
# .env.local (never commit)
NEXT_PUBLIC_SUPABASE_URL=https://svqdycsticovpudcgqvq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon>
SUPABASE_SERVICE_ROLE_KEY=<service role>   # fixture tests only

E2E_SEEKER_EMAIL=...
E2E_SEEKER_PASSWORD=...
E2E_EMPLOYER_EMAIL=...
E2E_EMPLOYER_PASSWORD=...

# Ephemeral blocked-user fixture (optional)
E2E_TEST_FIXTURES=1
E2E_SUPABASE_PROJECT_REF=svqdycsticovpudcgqvq
```

Human steps that cannot be fully automated: email verification link click, first admin password setup if not already done, Resend deliverability confirmation.
