# Live Flow — Production Results

Date: 2026-08-19 (final pass)

Target: `https://www.kvalifits.ee`  
Deployment: `main` @ `a748d83`

No launch-test credentials (`E2E_SEEKER_*`, `E2E_EMPLOYER_*`, admin) configured in environment. **Full live walkthrough not executed.**

---

## Seeker flow

| Step | Status |
|------|--------|
| 1 Register | **HUMAN ACTION REQUIRED** |
| 2 Verification email | **HUMAN ACTION REQUIRED** |
| 3 Login | **HUMAN ACTION REQUIRED** |
| 4–9 Profile / location / skills / education / certificate / preferences | **HUMAN ACTION REQUIRED** |
| 10–13 Search / filter / match / explanation | Public UI **PASS** (offline E2E); logged-in match **HUMAN** |
| 14 Save job | **HUMAN ACTION REQUIRED** |
| 15 Quick Apply | **HUMAN ACTION REQUIRED** |
| 16–19 Application / notification / withdraw | **HUMAN ACTION REQUIRED** |

---

## Employer flow

| Step | Status |
|------|--------|
| 1–18 Full pipeline | **HUMAN ACTION REQUIRED** |

Coordinate test job with seeker account; archive after test.

---

## Admin flow

| Step | Status |
|------|--------|
| 1–10 Full admin ops | **HUMAN ACTION REQUIRED** |

Blocked-user fixture E2E available with `E2E_TEST_FIXTURES=1` + project ref guard (not full admin suite).

---

## Procedure

See `docs/live-beta-walkthrough.md` and `docs/HUMAN-ACTIONS-BEFORE-LAUNCH.md`.
