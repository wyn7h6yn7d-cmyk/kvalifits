# Supabase Auth Email — Production

Date: 2026-08-19  
Project: `svqdycsticovpudcgqvq`  
Production site: `https://www.kvalifits.ee`

## Verdict

**HUMAN DELIVERY TEST REQUIRED**

Remote auth URL configuration could not be read via CLI (Management API token unavailable in this session). Local `supabase/config.toml` reflects **dev only** (`site_url = http://localhost:3000`). Production redirect URLs must be confirmed in Supabase Dashboard.

---

## What to verify (Dashboard → Authentication → URL Configuration)

| Item | Expected for public launch |
|------|---------------------------|
| Site URL | `https://www.kvalifits.ee` or `https://kvalifits.ee` (match live canonical) |
| Redirect URLs | Include `https://www.kvalifits.ee/*/auth/callback` (and `/et/`, `/en/`, `/ru/` variants) |
| Email confirmations | **Enabled** if `AUTH_REQUIRE_EMAIL_VERIFICATION` is used |
| Password reset redirect | Production domain, not localhost |

---

## SMTP / sender

| Check | Action |
|-------|--------|
| Custom SMTP configured? | Dashboard → Authentication → SMTP Settings |
| If default Supabase mail | Document rate limits; verify deliverability to major providers |
| SMTP passwords | **Never log or commit** |

---

## Code alignment

- App callback: `app/[locale]/auth/callback/route.ts`
- Register: `app/api/auth/register/route.ts`
- Forgot password: `app/api/auth/forgot-password/route.ts`
- Resend verification: `app/api/auth/resend-verification/route.ts`
- `SITE_ORIGIN` in code: `https://kvalifits.ee` (verify www vs non-www consistency with Supabase Site URL)

---

## Smoke test procedure (operator)

Use a **dedicated test mailbox you control** (not a real user):

1. Register new seeker at `https://www.kvalifits.ee/et/auth/register?role=seeker`
2. Confirm verification email arrives; link completes auth
3. Log out → Forgot password → confirm reset email arrives
4. Delete test account via admin or account deletion when done

**No safe test recipient was configured in this environment** — test not executed here.

---

## Limitations of Supabase default mail

- Shared sending infrastructure; may have lower deliverability vs custom domain SMTP/Resend
- For production scale (~1000 users), consider custom SMTP aligned with `EMAIL_FROM` domain
