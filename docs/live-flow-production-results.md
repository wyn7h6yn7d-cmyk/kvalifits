# Live Flow — Production Results

Date: 2026-08-19  
Target: `https://www.kvalifits.ee`

Automated live registration/admin flows were **not executed** — no operator test credentials in environment.

---

## Seeker flow

| Step | Status |
|------|--------|
| Registration | **HUMAN ACTION REQUIRED** |
| Email verification | **HUMAN ACTION REQUIRED** |
| Login | **HUMAN ACTION REQUIRED** |
| Profile / location / skills / education / certificate | **HUMAN ACTION REQUIRED** |
| Search / filters / match / save | Public search UI **PASS** (E2E offline); logged-in match **HUMAN** |
| Quick Apply | **HUMAN ACTION REQUIRED** (live seeker creds) |
| Application / notification / withdraw | **HUMAN ACTION REQUIRED** |

---

## Employer flow

| Step | Status |
|------|--------|
| Full pipeline register → publish → applicants | **HUMAN ACTION REQUIRED** |

---

## Admin flow

| Step | Status |
|------|--------|
| Login / verify / moderate / block / audit | **HUMAN ACTION REQUIRED** |

---

## Recommended test procedure

1. Create `launch-seeker-*` and `launch-employer-*` test accounts on production
2. Walk through steps in `docs/live-beta-walkthrough.md`
3. Delete/archive test job and accounts when complete
4. Enable `E2E_*` env on staging for CI regression

Blocked-user fixture E2E available with `E2E_TEST_FIXTURES=1` + project ref.
