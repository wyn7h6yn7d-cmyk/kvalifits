# Testing

## Commands

| Command | What it runs | CI? |
| --- | --- | --- |
| `npm test` | All unit/integration tests (`lib/**/*.test.ts`) via Node test runner + tsx | Yes |
| `npm run test:unit` | Same as `npm test` | Yes |
| `npm run test:e2e` | Playwright E2E specs (`e2e/*.spec.ts`) | Yes |
| `npm run test:security` | Live RLS security suite against a real Supabase project | Manual only |
| `npm run typecheck` | TypeScript check via `tsconfig.typecheck.json` | Yes |
| `npm run lint` | ESLint (flat config) | Yes |
| `npm run build` | Next.js production build | Yes |

## Test structure

```
lib/
  **/*.test.ts          # 33 unit/integration test files, 189 tests
                        # Node test runner + tsx for path alias resolution
                        # No external test framework needed

e2e/
  auth.spec.ts          # Auth page rendering (login, forgot, reset, resend CTA, blocked)
  auth-live.spec.ts     # Live seeker/employer login+logout, blocked user (needs credentials)
  public.spec.ts        # Homepage, job listing, job detail
  job-search.spec.ts    # Search, URL state, pagination, sort
  locales.spec.ts       # ET/EN/RU smoke (lang attr + UI text)
  mobile.spec.ts        # Mobile viewport seeker browse
  privacy.spec.ts       # Access isolation (guest redirect, seeker/employer boundaries)
  quick-apply-a11y.spec.ts  # Keyboard accessibility for Quick Apply sheet
  helpers.ts            # Shared helpers (login fill, cookie banner dismiss)

scripts/
  rls-security-suite.mjs   # Live RLS tests against Supabase (INSERT/SELECT/UPDATE probes)
  run-unit-tests.mjs        # Discovers and runs lib/**/*.test.ts via tsx
```

## What is covered

### Unit tests (189 tests across 33 files)

**Auth:** blocked user gate, account auth reads, email verification resend (rate limit, anti-enumeration, locale normalization)

**Job search:** filters, sort, URL state parsing/building, facets, job visibility (published only), job lifecycle (expired, closed)

**Application:** submit outcome (DB fail, DB+email success, DB success+email fail), duplicate prevention (23505 unique constraint), withdrawal, field lock (forged match_score rejected, forged status rejected), idempotency key

**Saved jobs:** owner-scoped save/unsave, saved search fingerprints, alert delivery (frequency, job selection, cron auth)

**Certificates:** seeker cannot self-verify, CV storage refs are private

**Employer:** job ownership gate, profile field classification (public vs private), owner uniqueness, candidate discovery (authorization, pagination, SQL security), job duplication, application pipeline

**Privacy:** employer profile read authorization (public fields only for non-owners), candidate discovery SQL never leaks across employers

**Localization:** ET/EN/RU smoke for all message files, localized metadata, error copy

**Monitoring:** Sentry scrubber (strips passwords, tokens, CVs, PII), sampling config

**Other:** admin audit log, navigation config, notifications access

### E2E tests (Playwright)

**Desktop Chrome:**
- Auth pages render correctly (login form, forgot password, reset, verification resend CTA, blocked error)
- Guest redirected from protected routes (seeker, employer, admin)
- Homepage and job listing render
- Job search: keyword updates URL, URL state persisted on load, sort/pagination controls
- Live login/logout for seeker and employer (needs credentials)
- Live blocked user cannot use session
- Quick Apply accessibility (focus trap, Escape, keyboard navigation)
- Privacy: seeker cannot reach employer dashboard, employer cannot access other's applicants
- Locale smoke: ET/EN/RU `lang` attribute and UI text

**Mobile (Pixel 5):**
- Job search on mobile viewport
- Quick Apply accessibility

### RLS security suite (manual)

Live tests against a real Supabase project. Probes INSERT/SELECT/UPDATE operations with different roles. Verifies RLS policies are correctly applied for all tables.

## CI

**`.github/workflows/ci.yml`** — runs on push to `main` and all PRs:
1. `npm run lint` — ESLint
2. `npm run typecheck` — TypeScript
3. `npm test` — 189 unit tests
4. `npm run build` — production build
5. `npm run test:e2e` — Playwright (Chromium + mobile)

No production credentials required. Dummy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set so Next.js builds without a live project. E2E tests that need real accounts use `test.skip()`.

**`.github/workflows/rls-security.yml`** — manual dispatch only. Requires GitHub secrets for `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Local environment requirements

**Unit tests:** No environment variables needed. Run with `npm test`.

**E2E (no-auth specs):** No environment variables needed. Playwright starts a dev server with dummy Supabase vars.

**E2E (live auth specs):** Set in `.env.local` or shell:
- `E2E_SEEKER_EMAIL` / `E2E_SEEKER_PASSWORD`
- `E2E_EMPLOYER_EMAIL` / `E2E_EMPLOYER_PASSWORD`
- `E2E_BLOCKED_EMAIL` / `E2E_BLOCKED_PASSWORD`
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (real project)

**RLS security suite:** Requires `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` pointing to a real Supabase project.

## Remaining untested risks

| Area | Risk | Mitigation |
| --- | --- | --- |
| Application email delivery | Cannot E2E test Resend sending without a real inbox | Unit-tested; `sendEmailViaResend` returns `{ ok }` result |
| Supabase Auth email templates | Template content not in repo | Manual Supabase Dashboard verification |
| Storage upload | File upload roundtrip not E2E tested | Private bucket + signed URL logic unit-tested |
| Admin moderation | No E2E for admin actions | Admin routes have auth gates; RLS covers DB layer |
| Password reset flow | Requires real email delivery | Page renders tested; Supabase handles the flow |
| Real payment/billing | N/A (no billing in current product) | — |
| Cross-browser | Only Chromium in CI | Add WebKit/Firefox projects if needed |
| Performance regression | No lighthouse/budget tests | Could add `@playwright/test` performance assertions |
