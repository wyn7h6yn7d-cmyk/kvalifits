# Testing

Kvalifits automated test baseline. These commands do **not** require production secrets unless noted.

## Commands

| Command | What it runs |
| --- | --- |
| `npm test` | Unit / integration tests (`lib/**/*.test.ts`) via Node’s test runner + tsx |
| `npm run test:e2e` | Playwright smoke (public pages, locales, auth chrome, one mobile seeker flow) |
| `npm run test:security` | Live remote RLS suite (`scripts/rls-security-suite.mjs`) |
| `npm run typecheck` | `tsc --noEmit -p tsconfig.typecheck.json` (ignores stale `.next/dev` types) |
| `npm run lint` | ESLint |
| `npm run build` | Production Next.js build |

First-time Playwright browsers:

```bash
npx playwright install chromium
```

## Ordinary CI

`.github/workflows/ci.yml` runs **lint → typecheck → unit tests → build → selected E2E**.

It uses dummy `NEXT_PUBLIC_SUPABASE_*` values so a live project and service-role key are **not** required.

Authenticated Playwright flows are skipped unless you set optional env vars:

- `E2E_SEEKER_EMAIL` / `E2E_SEEKER_PASSWORD`
- `E2E_EMPLOYER_EMAIL` / `E2E_EMPLOYER_PASSWORD`
- `E2E_BLOCKED_EMAIL` / `E2E_BLOCKED_PASSWORD`

Point `PLAYWRIGHT_BASE_URL` at an already-running app to skip Playwright’s webServer.

## Live RLS (not in ordinary CI)

`npm run test:security` seeds ephemeral seeker A/B and employer A/B against the configured Supabase project, asserts negative/positive RLS, then deletes the users.

Requires `SUPABASE_SERVICE_ROLE_KEY` (and normally `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`):

```bash
node --env-file=.env.local scripts/rls-security-suite.mjs
# or
npm run test:security
```

Manual GitHub workflow: **RLS security (live remote)** (`.github/workflows/rls-security.yml`).

### Suite coverage (high level)

- Seeker A cannot read seeker B private profile / work-capacity
- Employer A cannot edit employer B (profile or jobs)
- Employer cannot read work-capacity
- Candidate cannot self-verify a certificate (`verification_status`)
- Candidate cannot forge `match_score`
- Private CV (`resumes` bucket)
- Saved jobs are owner-only
- Employer can create/update own jobs; other employer’s jobs and applicants are out of reach

Application insert vs email failure, duplicate apply, and field-lock rules are covered by unit tests in `lib/jobs/` (they do not need a live database).

## Coverage map

| Area | Where |
| --- | --- |
| Seeker / employer login gate, blocked user | `lib/auth/accountBlocked.test.ts`; login form E2E; live login skipped without env |
| Logout | Playwright live test (skipped without env); logout control is on the signed-in chrome |
| Forgot / reset | `e2e/auth.spec.ts` pages; anti-enumeration is in the forgot-password API |
| Verification resend | `lib/auth/resendVerification.test.ts`; login `?error=email_not_confirmed` E2E |
| Published jobs, query, filters, pagination, sort | `lib/jobs/jobSearch*.test.ts`, `jobLifecycle.test.ts`; jobs listing E2E |
| Apply / duplicate / email failure / forged fields | `lib/jobs/applicationSubmitOutcome.test.ts`, `jobApplicationFieldLock.test.ts` |
| Withdrawal | `lib/employer/applicationPipeline.test.ts`; live RLS seeker withdraw |
| RLS isolation, CV, certificates, match_score | `npm run test:security` + unit field/CV/certificate tests |
| Saved jobs owner-only | `lib/jobs/savedJobs.test.ts` + live RLS |
| Employer own job vs other employer / applicants | `lib/employer/getEmployerJobIfOwned.test.ts` + live RLS |
| ET / EN / RU | `lib/i18n/localeSmoke.test.ts` + `e2e/locales.spec.ts` |
| Public homepage / jobs / detail | `e2e/public.spec.ts` |
| Mobile seeker flow | `e2e/mobile.spec.ts` (Pixel 5 project) |

## What lives where

- **Unit / integration:** `lib/**/*.test.ts` — auth gates, job search URL/filters/sort, apply outcomes, field lock, CV paths, employer field classes, i18n key smoke
- **E2E smoke:** `e2e/` — homepage, `/tood`, job detail when a listing exists, ET/EN/RU, login / forgot / reset / resend CTA, mobile seeker search
- **Live RLS:** `scripts/rls-security-suite.mjs`
