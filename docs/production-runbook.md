# Kvalifits — Production Operations Runbook

This runbook is documentation-only. It describes how to maintain, troubleshoot, and recover the current Kvalifits production deployment using the commands, routes, and environment variable names that exist in this repository.

## Scope

- Next.js app (App Router) deployed on Vercel
- Supabase for Postgres, Auth, RLS, Storage, and (optionally) Realtime + pg_cron
- Resend for transactional email (employer application notifications)
- Sentry for production error monitoring

## Non-goals

- Do not change application behavior.
- Do not include secret values.
- Do not run destructive commands (e.g., production resets, blind DB repair, TRUNCATE).

==================================================
## 1. Deployment
==================================================

### 1.1 Repository workflow (what CI runs)

CI is configured in `.github/workflows/ci.yml`:

- Triggers:
  - `push` to `main`
  - `pull_request`
- Runs (in order):
  - `npm ci`
  - `npm run lint`
  - `npm run typecheck`
  - `npm test`
  - `npm run build`
  - `npx playwright install --with-deps chromium`
  - `npm run test:e2e` (smoke subset)

For manual, live RLS validation there is a separate workflow: `.github/workflows/rls-security.yml` (manual `workflow_dispatch`).

### 1.2 Main branch

The current repository uses `main` as the primary branch:

- `.github/workflows/ci.yml` deploy-prep triggers are for `branches: [main]`.

### 1.3 Vercel production deployment

Production builds are expected to be created by the Vercel Git integration (GitHub -> Vercel), not by committing deployment scripts in this repo.

Operational flow:

1. Open Vercel project → **Deployments**.
2. Find the deployment that corresponds to the desired commit on `main`.
3. Confirm it is labeled as **Production**.
4. If a production deploy was not created automatically, only then consider a manual redeploy (see “avoid duplicate manual deployment” below).

### 1.4 Preview deployments

For `pull_request` events, `.github/workflows/ci.yml` runs CI, and Vercel preview deployments are expected to be created by the Vercel Git integration for PRs.

Operational flow:

1. Open Vercel project → **Deployments**.
2. Filter by PR commit / branch.
3. Validate:
   - “Build succeeded”
   - No runtime errors in monitoring for the preview environment (see Monitoring section).
4. If a preview is failing, fix the commit and re-test; do not patch production blindly.

### 1.5 How to verify the build before push (local)

Run these from the repo root (`/Users/kennethalto/Desktop/kvalifits`):

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
```

If you need extra confidence on RLS (requires live Supabase credentials in env):

```bash
node scripts/rls-security-suite.mjs
```

(For the full “remote” variant, see the RLS suite snippet in `docs/local-supabase.md`.)

### 1.6 How to inspect a failed deployment

1. In Vercel **Deployments**, open the failed deployment.
2. Inspect the **Build** logs:
   - “Install dependencies”
   - Typecheck/build steps (`npm run typecheck`, `npm run build`)
3. If build passed but runtime is broken:
   - Check Sentry in `docs/monitoring.md` for the preview vs production `environment` tag.
   - Check whether required env vars are set (notably: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, and `NEXT_PUBLIC_SENTRY_DSN`).
4. If the failure is due to schema/security drift (RLS/storage/cron):
   - Run `node scripts/remote-db-audit.mjs` (read-only inspection) and re-run the RLS security suite (post-migration validation, Section 3).

### 1.7 How to roll back to a known good deployment

Rollback is performed in the Vercel UI:

1. Vercel → **Deployments**
2. Select the last known good production deployment.
3. Use Vercel’s **promote/rollback** action to promote that deployment to production (wording varies by UI version).
4. Re-check:
   - Sentry errors for `environment=production` (Section 12)
   - Critical flows: auth login, application submit, cron-driven notifications.

### 1.8 Avoid duplicate manual deployment if GitHub integration already deploys `main`

If Vercel is configured with GitHub auto-deployments:

- Do not manually redeploy the same `main` commit.
- Only redeploy manually when:
  - a production deployment did not trigger automatically, or
  - you intentionally need to promote an older deployment again (rollback).

If unsure, check Vercel project settings → Git integration / Auto Deploy configuration and compare to the deployment timeline for the commit on `main`.

==================================================
## 2. Required Environment Variables
==================================================

Rules:

- List variable **names only**.
- Group the variables as requested.
- For each: purpose, server/client, required/optional.
- No values.

### 2.1 Supabase

1. `NEXT_PUBLIC_SUPABASE_URL`
   - Purpose: Supabase project URL used to create Supabase clients (including storage signed-URL behavior / Next image remote patterns).
   - Server/Client: Client + server (used in `next.config.ts`, `lib/supabase/env.ts`, and server utilities).
   - Required/Optional: Required in production for correct Supabase connectivity.
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Purpose: Supabase anon key for browser and authenticated client usage.
   - Server/Client: Client + server.
   - Required/Optional: Required in production.
3. `SUPABASE_SERVICE_ROLE_KEY`
   - Purpose: Service role key for admin-level Supabase operations (e.g., admin queries, RLS security suite, cron worker).
   - Server/Client: Server only.
   - Required/Optional: Required for admin actions and cron worker authorization.

### 2.2 Resend

1. `RESEND_API_KEY`
   - Purpose: Resend authentication token for transactional email sends.
   - Server/Client: Server only.
   - Required/Optional: Required for employer application notifications and saved-search email delivery.
2. `EMAIL_FROM`
   - Purpose: “From” address used when sending emails via Resend.
   - Server/Client: Server only.
   - Required/Optional: Optional (code falls back to `no-reply@kvalifits.ee`).

### 2.3 monitoring

1. `NEXT_PUBLIC_SENTRY_DSN`
   - Purpose: Enables Sentry capture in the Next.js app (no-op when unset).
   - Server/Client: Client + server.
   - Required/Optional: Optional.
2. `SENTRY_ORG`
   - Purpose: Sentry org slug used by `withSentryConfig`.
   - Server/Client: Server only.
   - Required/Optional: Required when using Sentry source map upload.
3. `SENTRY_PROJECT`
   - Purpose: Sentry project slug used by `withSentryConfig`.
   - Server/Client: Server only.
   - Required/Optional: Required when using Sentry source map upload.
4. `SENTRY_AUTH_TOKEN`
   - Purpose: Enables Sentry auth for source map upload.
   - Server/Client: Server only.
   - Required/Optional: Optional (Sentry still initializes without it; source maps upload is disabled).

### 2.4 public site config

1. `NEXT_PUBLIC_VERCEL_ENV`
   - Purpose: Sets the Sentry “environment” tag (e.g., `production` / `preview`).
   - Server/Client: Client + server.
   - Required/Optional: Optional (code falls back to `VERCEL_ENV` / `NODE_ENV`).
2. `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`
   - Purpose: Sets the Sentry release tag (`kvalifits@<git sha>`).
   - Server/Client: Client + server.
   - Required/Optional: Optional (code falls back to `VERCEL_GIT_COMMIT_SHA`).

### 2.5 optional features

1. `CRON_SECRET`
   - Purpose: Authorization secret required by `app/api/cron/saved-search-alerts/route.ts` (route checks `Authorization: Bearer <CRON_SECRET>`).
   - Server/Client: Server only.
   - Required/Optional: Required for cron endpoint execution to succeed.
2. `SAVED_SEARCH_ALERTS_EMAIL`
   - Purpose: Enables saved-search alert email delivery (in addition to in-app notifications).
   - Server/Client: Server only.
   - Required/Optional: Optional (in-app notifications are still written by cron; email requires this flag + `RESEND_API_KEY`).
3. `AUTH_RATE_LIMIT_FAIL_OPEN`
   - Purpose: Controls auth rate-limit failure behavior if the rate-limit infra is missing.
   - Server/Client: Server only.
   - Required/Optional: Optional.
4. `AUTH_REQUIRE_EMAIL_VERIFICATION`
   - Purpose: Blocks authenticated app use for unverified emails (default is “require verification”).
   - Server/Client: Server only.
   - Required/Optional: Optional.
5. `ADMIN_MFA_ENFORCE`
   - Purpose: Enforces admin MFA enrollment requirements.
   - Server/Client: Server only.
   - Required/Optional: Optional.
6. `NEXT_PUBLIC_EMPLOYER_COMPANY_SIZE_SYNC`
   - Purpose: Feature flag enabling employer `company_size` field sync/read/write.
   - Server/Client: Client + server.
   - Required/Optional: Optional.

==================================================
## 3. Supabase Migrations
==================================================

This section documents safe vs unsafe operations as requested.

### 3.1 SAFE operations

#### 3.1.1 Inspect migration status

Read-only audit (recommended):

```bash
node scripts/remote-db-audit.mjs
```

This script checks:

- `supabase_migrations.schema_migrations` via PostgREST (read-only)
- table presence and storage buckets
- RPC function existence

Requirements:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

#### 3.1.2 Local migration workflow (local only)

From `docs/local-supabase.md`:

```bash
supabase start
supabase db reset
```

Notes:

- `supabase start` applies migrations sequentially.
- `supabase db reset` wipes and re-applies migrations (local-only guidance).

#### 3.1.3 Remote DB push workflow (schema apply)

From `docs/database-reconciliation-report.md`:

Recommended approaches for applying migrations to remote Supabase:

1. Apply all unapplied migrations in order (safest):

   - `supabase db push`
   - or `supabase migration up`

2. Apply only reconciliation trilogy + remaining migrations (fastest):

   - depends on what is already applied on remote; the report documents the reconciliation trilogy strategy.

Operational rule:

- Confirm remote drift first (use `node scripts/remote-db-audit.mjs`) before applying “option B”.

#### 3.1.4 Post-migration validation

Run the RLS security suite (exact existing command):

```bash
node scripts/rls-security-suite.mjs
```

The local doc also provides a “remote” variant using `.env.local`:

```bash
node --env-file=.env.local scripts/rls-security-suite.mjs
```

Additionally (read-only):

```bash
node scripts/remote-db-audit.mjs
```

### 3.2 UNSAFE operations

#### 3.2.1 Remote db reset

Never run `supabase db reset` against production.

The local Supabase doc explicitly warns:

- “Never run `supabase db reset` against production.”

#### 3.2.2 Blind migration repair

Do not “repair” production by repeatedly running destructive reset/reapply operations or by manually patching schemas without:

- confirming what is missing/present (migration status, read-only audit), and
- validating after the fix (RLS security suite).

If you still execute an unsafe migration repair step in production:

- Immediately stop further changes (roll back to the last known working app version if needed).
- Immediately run the exact RLS security suite command:

```bash
node scripts/rls-security-suite.mjs
```

#### 3.2.3 Destructive SQL

Avoid executing production SQL that drops or truncates data, unless part of an explicitly approved incident response:

- `DROP TABLE ...`
- `TRUNCATE ...`
- `DELETE FROM ...` without a narrow, backed-up target

==================================================
## 4. Backup / Recovery
==================================================

This section lists backup/recovery options that can be proven from the project setup; if something cannot be proven from repo setup, mark it.

### 4.1 Proven local options

From `docs/local-supabase.md`:

- `supabase stop --backup` (local; preserves data)
- `supabase db reset` (local; wipes and re-applies migrations)

### 4.2 Remote options (Supabase managed)

Supabase remote backup/recovery functionality exists in the Supabase dashboard, but the exact provider plan/backup settings are not fully provable from the repo.

Mark for operator verification:

“Verify in Supabase dashboard.”

Conceptual recovery process (remote):

1. Identify the affected scope:
   - schema drift / RLS missing
   - storage bucket/policy drift
   - cron/jobs misconfiguration
2. Restore to a known-good database state using Supabase backup/restore or point-in-time recovery.
3. Re-apply the required migrations (safe workflow from Section 3) if restore rewinds past the fix.
4. Re-run:
   - `node scripts/rls-security-suite.mjs`
   - `node scripts/remote-db-audit.mjs`
5. Re-enable cron/worker processes after validation (Vercel cron + pg_cron jobs).

==================================================
## 5. Local Development
==================================================

Use `supabase/config.toml` and `docs/local-supabase.md`.

### 5.1 Startup

From `docs/local-supabase.md`:

```bash
supabase start
npm run dev
```

### 5.2 Reset local only

From `docs/local-supabase.md`:

```bash
supabase db reset
```

### 5.3 Migrations

From `docs/local-supabase.md`:

- All migrations in `supabase/migrations/` are applied on:
  - `supabase start`
  - `supabase db reset`

To create a new migration locally:

```bash
supabase migration new <name>
```

### 5.4 Test commands

From `package.json`:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

E2E:

```bash
npm run test:e2e
```

RLS suite:

```bash
node scripts/rls-security-suite.mjs
```

The local doc describes local and remote env-file variants.

==================================================
## 6. Auth
==================================================

### 6.1 Account registration

- Endpoint: `POST /api/auth/register`
- Implementation: `app/api/auth/register/route.ts`
- Behavior:
  - requires `termsAccepted === true`
  - allows roles: `seeker` and `employer`
  - creates/upserts:
    - `profiles`
    - `seeker_profiles` (for seeker)
    - `employer_profiles` placeholder row (for employer)
  - if Supabase does not create a session immediately, registration returns:
    - `{ ok: true, needsEmailVerification: true }`

### 6.2 Verification resend

- Endpoint: `POST /api/auth/resend-verification`
- Implementation: `app/api/auth/resend-verification/route.ts`
- Rate limiting:
  - uses IP+email buckets via the Supabase RPC-backed rate-limit system
  - consumes `AUTH_RATE_LIMIT_FAIL_OPEN` if auth rate-limit infra is missing
- Email:
  - calls Supabase Auth `supabase.auth.resend({ type: "signup" ... })`
  - uses email redirect:
    - `/<locale>/auth/callback`

### 6.3 Reset password

- Endpoint: `POST /api/auth/forgot-password`
- Implementation: `app/api/auth/forgot-password/route.ts`
- Behavior:
  - rate-limited via the `password_reset` bucket
  - calls Supabase Auth `resetPasswordForEmail(...)`
  - always returns `{ ok: true }` on provider “unknown email” to avoid enumeration

### 6.4 Blocked users

Login and route authorization block blocked profiles:

- Login route checks:
  - `emailVerificationBlockReason(...)`
  - `loadProfileSecurity(...)`
  - `loginSessionAllowed(...)`
  - and revokes / revokes sessions on block.

- Endpoint: `POST /api/auth/login`
- Implementation: `app/api/auth/login/route.ts`

Session revocation also happens when an admin blocks a user (Section 7).

### 6.5 Admin creation/bootstrap

Admin role is determined by:

- `public.profiles.role = 'admin'`

Non-admin users cannot self-assign `admin` because of the `profiles_guard_security_fields` trigger in migrations.

Operational approach for “first admin”:

1. Use Supabase SQL Editor with service role access.
2. Update a chosen user:
   - set `public.profiles.role = 'admin'`
3. Ensure the user can authenticate and has the expected profile row.

### 6.6 Admin MFA (if applicable)

Admin MFA enforcement is controlled by `ADMIN_MFA_ENFORCE`.

Admin MFA routes:

- MFA setup: `/admin/security?setup=1&next=...` (constructed by `lib/auth/adminMfa.ts`)
- MFA challenge flow: `/<locale>/auth/mfa?next=...`

When `ADMIN_MFA_ENFORCE=1`, the app requires admin MFA enrollment + AAL2.

### 6.7 Session revocation

Admin blocking revokes sessions using:

- `lib/auth/revokeUserSessions.ts`
- Supabase call: `admin.auth.admin.signOut(userId, "global")`

Users are also signed out on blocked login attempts via `signOutAuthSession()` and `revokeUserSessions()`.

Logout route:

- `POST /{locale}/auth/logout`
- Implementation: `app/[locale]/auth/logout/route.ts`

==================================================
## 7. Admin / Moderation
==================================================

### 7.1 Where moderation actions happen (UI)

Main moderation dashboard:

- Page: `GET /[locale]/admin/moderation`
- Implementation: `app/[locale]/admin/moderation/page.tsx`

This page loads:

- `job_post_reports` with status in `["open","reviewing"]`
- certificates in `["submitted","under_review"]`
- employer companies with `verification_status = "under_review"`
- blocked users where `profiles.is_blocked = true`

### 7.2 Moderation API (admin-only write endpoint)

- Endpoint: `POST /api/admin/moderation`
- Implementation: `app/api/admin/moderation/route.ts`

Request body:

- `queue`: one of:
  - `reports`
  - `certificates`
  - `companies`
  - `blocked_users`
- `action` (admin moderation action):
  - `approve`
  - `reject`
  - `hide`
  - `block`
  - `restore`
- `targetId`: UUID (job_report id, certificate id, employer_profile id, or profiles.id)

This route:

- requires authenticated user
- requires `gate.role === "admin"`
- delegates to `lib/admin/runModerationAction.ts`

### 7.3 Verify employer

Use admin moderation:

- `queue`: `companies`
- `action`: `approve` to verify
- effects (from `lib/admin/runModerationAction.ts`):
  - sets `employer_profiles.verification_status = 'verified'`
  - sets `employer_profiles.company_verified = true`
  - sets `verification_source = 'manual'`
  - sets `verified_at = now()`

Reject employer:

- `action`: `reject` (or `hide`)
- sets `verification_status = 'unverified'`
- sets `company_verified = false`
- clears verification fields

### 7.4 Verify / reject certificate

Use admin moderation:

- `queue`: `certificates`
- `action`: `approve` or `reject` (or `hide`)
- effects (from `lib/admin/runModerationAction.ts`):
  - `approve` sets `seeker_certificates.verification_status = 'verified'`
  - `reject` sets `verification_status = 'rejected'` and clears `verified_at`, `verified_by`, `verification_source`
  - `hide` acts like a rejection for storage/reporting visibility

### 7.5 Job moderation + job reports

Job reports are created by public users:

- Endpoint: `POST /api/job-reports`
- Implementation: `app/api/job-reports/route.ts`
- Behavior: inserts into `job_post_reports` with `status = "open"` (server sets `admin_notes` to an empty string; reporters must not read admin notes).

Admin moderation is performed from:

- `GET /[locale]/admin/moderation`
- via `POST /api/admin/moderation` with:
  - `queue`: `reports`
  - `action`: `approve` / `reject` / `hide` / `block` / `restore`

Key effects from `lib/admin/runModerationAction.ts` (reports queue):

- `approve` → report `status = 'resolved'`
- `reject` → report `status = 'dismissed'`
- `hide` → archives the job (`job_posts.status = 'archived'`) and resolves the report
- `block` → blocks the job owner + archives the job + resolves report
- `restore` → publishes the job (`job_posts.status = 'published'`) and reopens report

### 7.6 Block / unblock users

Blocking happens either through moderation action queues:

- `queue`: `blocked_users`
- `action`: `block` or `restore`

Effects:

- sets `public.profiles.is_blocked`
- if blocked, `revokeUserSessions(userId)` is invoked (global sign-out)

### 7.7 Audit log

Audit log viewer:

- Page: `GET /[locale]/admin/audit`
- Implementation: `app/[locale]/admin/audit/page.tsx`

Backend:

- Table: `public.admin_audit_log`
- Loader: `lib/admin/loadAdminAuditLog.ts`

Actions are written with append-only semantics from:

- `lib/admin/auditLog.ts` (`writeAdminAuditLog`).

==================================================
## 8. Email
==================================================

### 8.1 Resend integration (what emails are sent)

Resend is used for:

- Employer application notifications
  - triggered by application submission (`POST /api/job-applications`)
- Saved search alert email (optional)
  - controlled by `SAVED_SEARCH_ALERTS_EMAIL`

Resend implementation:

- `lib/email/resend.ts` (`sendEmailViaResend`)

### 8.2 Required env names (email)

- `RESEND_API_KEY`
- `EMAIL_FROM` (optional; fallback exists in code)

Email from address behavior:

- `EMAIL_FROM` is used when sending emails
- fallback default exists in code (`no-reply@kvalifits.ee`)

### 8.3 Application employer email (ownership / delivery)

Application submission:

- Endpoint: `POST /api/job-applications`
- Implementation: `app/api/job-applications/route.ts`
- Flow:
  1. inserts the `job_applications` row using `createSupabaseAdminClient()` (service role)
  2. sends employer email in best-effort try/catch
  3. idempotency:
     - Resend idempotency key uses `kvalifits-app-notify:{applicationId}`
     - `job_applications.employer_notified_at` prevents repeat sends

Consequences of email failure:

- If the DB insert succeeds, the application is still successful.
- Email failures are logged to Sentry (`area: email`) and never block the candidate’s “application submitted” response.

### 8.4 Verification/reset ownership

Verification and password reset are handled by Supabase Auth:

- Verification resend: `POST /api/auth/resend-verification`
- Password reset request: `POST /api/auth/forgot-password`

Ownership is controlled by Supabase Auth’s email templates and redirect URL handling:

- auth callback:
  - `/<locale>/auth/callback`

### 8.5 What happens if employer email fails

From `docs/reliability-report.md` and `app/api/job-applications/route.ts`:

- Candidate response stays successful when insertion succeeded.
- Employer notification failure is logged (Sentry + `console.error`).
- Operators diagnose via Monitoring (Sentry) and by checking the presence of:
  - the `job_applications` row
  - `employer_notified_at` timestamp

### 8.6 Troubleshooting delivery (Resend)

If employer email notifications are missing:

1. Confirm required env vars are set on Vercel:
   - `RESEND_API_KEY`
   - `EMAIL_FROM` (optional)
2. Check Sentry for events with:
   - `area=email`
   - relevant `code` (e.g., `provider_error`, `employer_notify_failed`)
3. Confirm idempotency markers:
   - query `job_applications` for the application id and check `employer_notified_at`.
4. Confirm employer `contact_email` is present on `employer_profiles` for that job.

==================================================
## 9. Notifications
==================================================

### 9.1 In-app notifications (table + UI)

Notifications are stored in:

- `public.notifications` (RLS protected)

UI behavior:

- Page: `GET /[locale]/account/notifications`
  - server fetches newest 100 notifications for the current user from `public.notifications`
- Components:
  - `components/notifications/NotificationsInbox.tsx`
  - `components/notifications/NotificationBell.tsx`

Base notification types include:

- `saved_job_deadline`
- `saved_search_alert`
- application/maturation events (e.g., `new_application`, `application_status_changed`, etc.)

### 9.2 Saved job deadline cron → in-app notifications

DB function creates `saved_job_deadline` notifications:

- `private.notify_saved_jobs_near_deadline()` in `supabase/migrations/20260819120000_notifications.sql`

### 9.3 Saved search alerts cron → in-app notifications (+ optional email)

The Vercel cron endpoint:

- Vercel config: `vercel.json`
  - `path`: `/api/cron/saved-search-alerts`
  - `schedule`: `0 8 * * *`
- Implementation: `app/api/cron/saved-search-alerts/route.ts`
- Logic: `lib/jobs/runSavedSearchAlertDelivery.ts`

It writes:

- `public.notifications` with `type = 'saved_search_alert'`
- `public.saved_search_alert_deliveries` (dedupe ledger)
- updates cursor fields:
  - `public.saved_job_searches.last_notified_at`

### 9.4 Realtime behavior

When authenticated, the UI subscribes to Supabase Realtime events for:

- `public.notifications` INSERT
- `public.notifications` UPDATE (read_at updates)

Docs:

- `docs/notifications.md`
- Implementation:
  - `lib/notifications/realtime.ts`
  - `components/notifications/NotificationBell.tsx`
  - `components/notifications/NotificationsInbox.tsx`

### 9.5 How to diagnose missing notifications

For missing in-app notifications, check in this order:

1. Is the notification data being written?
   - Inspect `public.notifications` for the user + `type` (saved_job_deadline or saved_search_alert).
2. If notifications exist but UI is stale:
   - Verify Realtime is enabled for `public.notifications` (see `docs/notifications.md` “Remote configuration required”).
   - Refresh browser / focus window triggers (UI fallback reload exists).
3. If notifications do not exist:
   - Cron issue:
     - saved job deadline: verify pg_cron job for `notify-saved-jobs-near-deadline`
     - saved search alerts: verify Vercel cron and cron auth (`CRON_SECRET`)

==================================================
## 10. Cron
==================================================

This section documents the expected cron jobs, their schedules, DB functions (or worker endpoints), verification, and failure meaning.

### 10.1 Expired job archiving (pg_cron)

- Schedule:
  - `0 * * * *` (hourly), from `supabase/migrations/20260817210000_archive_expired_job_posts_cron.sql`
- DB function:
  - `private.archive_expired_job_posts()`
- pg_cron job name:
  - `archive-expired-job-posts` (from `cron.schedule('archive-expired-job-posts', ...)`)
- How to verify it exists:
  - Verify in Supabase dashboard SQL Editor:
    - check pg_cron job list for `jobname = 'archive-expired-job-posts'`
  - “Verify in Supabase dashboard” if pg_cron views are not accessible via API.
- How to verify last execution:
  - Verify recent job runs in pg_cron job run details (SQL Editor)
  - “Verify in Supabase dashboard” if job run tables cannot be queried from the API.
- What failure means:
  - jobs may remain with `status = 'published'` after expiry
  - application apply endpoints should still reject based on lifecycle checks, but UI/admin lists may appear inconsistent

### 10.2 Saved job deadline notifications (pg_cron)

- Schedule:
  - `15 7 * * *` (daily) in `supabase/migrations/20260819120000_notifications.sql`
- DB function:
  - `private.notify_saved_jobs_near_deadline()`
- pg_cron job name:
  - `notify-saved-jobs-near-deadline`
- How to verify it exists:
  - Verify in Supabase dashboard SQL Editor (pg_cron job listing)
- How to verify last execution:
  - Verify pg_cron run details for job name
- What failure means:
  - no new `public.notifications` rows of `type = 'saved_job_deadline'`
  - users may miss deadline nudges (in-app), but apply eligibility is still governed by job lifecycle rules

### 10.3 Saved search alerts (Vercel cron + authenticated route)

- Schedule:
  - from `vercel.json`:
    - `path`: `/api/cron/saved-search-alerts`
    - `schedule`: `0 8 * * *`
- DB function / worker:
  - Not pg_cron DB SQL; the route executes:
    - `lib/jobs/runSavedSearchAlertDelivery.ts`
  - It writes:
    - `public.notifications` (`type='saved_search_alert'`)
    - `public.saved_search_alert_deliveries`
    - updates `public.saved_job_searches.last_notified_at` and `notify_after`
- How to verify it exists:
  - Confirm `vercel.json` crons entry is present (repo-grounded):
    - `/api/cron/saved-search-alerts` + `0 8 * * *`
- How to verify last execution:
  - Check DB writes:
    - newest `public.notifications` for `type='saved_search_alert'`
    - and/or recent updates in `public.saved_job_searches.last_notified_at`
- What failure means:
  - users may receive fewer or no saved-search notifications
  - if `SAVED_SEARCH_ALERTS_EMAIL` is enabled, missing emails are explained by either:
    - missing delivery execution, or
    - `RESEND_API_KEY` missing, or
    - provider errors (Sentry `area=email`)

#### Manual test trigger (safe, authenticated)

The cron route requires a bearer token:

- Route: `/api/cron/saved-search-alerts`
- Header must be:
  - `Authorization: Bearer <CRON_SECRET>`

Manual test (replace env vars locally; do not paste secrets into chat):

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://kvalifits.ee/api/cron/saved-search-alerts
```

==================================================
## 11. Storage
==================================================

Storage is implemented via Supabase Storage buckets and two signed-url API routes.

### 11.1 Buckets and access expectations

1. `avatars` bucket (public read)
   - Used for:
     - seeker profile photos
     - employer logos
     - legacy CV PDFs may have existed in this bucket historically
   - Public vs private:
     - Public read for display
     - Writes are constrained to the object owner folder (first path segment equals `auth.uid()`)
   - Source:
     - `supabase/migrations/20260816_avatars_storage_security.sql`
     - `lib/employer/employerLogoUpload.ts` validates public avatars upload URLs

2. `resumes` bucket (private)
   - Used for:
     - seeker CV/resume PDFs via signed URLs
   - Public vs private:
     - bucket is private
     - access via `/api/resumes/signed-url` after auth + authorization check
   - Source:
     - `supabase/migrations/20260818140000_private_cv_resumes_storage.sql`
     - `lib/seeker/cvStorage.ts` (`RESUMES_BUCKET`, `CV_SIGNED_URL_TTL_SEC`)
     - Signed URL route: `app/api/resumes/signed-url/route.ts`

3. `certificates` bucket (private)
   - Used for:
     - seeker certificate images/PDFs via signed URLs
   - Source:
     - `supabase/migrations/20260816_certificates_private_storage.sql`
     - Signed URL route: `app/api/certificates/signed-url/route.ts`

### 11.2 Signed URL endpoints

1. CV / resume signed URL:
   - Route: `GET /api/resumes/signed-url`
   - Implementation: `app/api/resumes/signed-url/route.ts`
   - Query params:
     - `path` (preferred) or `ref`
     - `ttl` (optional, clamped in code)
   - Auth/authorization:
     - requires authenticated user
     - checks access with `authorizeApplicantDocumentAccess(...)`
   - Legacy handling:
     - if the primary signed URL in `resumes` bucket fails, it attempts signing in `avatars` for legacy objects

2. Certificate signed URL:
   - Route: `GET /api/certificates/signed-url`
   - Implementation: `app/api/certificates/signed-url/route.ts`
   - Query params:
     - `path` or `ref`
     - `ttl` (optional)
   - Legacy behavior:
     - the route rejects legacy public avatar-style certificate URLs with `legacy_public_file`

### 11.3 How to troubleshoot signed URL issues

Symptoms and checks:

1. `400 invalid_path`
   - The signed-url parser rejected the object reference.
   - Ensure `path` matches expected object path format:
     - CV: `{ownerUserId}/cv/...` (or a legacy public avatars URL that matches the legacy regex)
     - Certificate: `{ownerUserId}/...` (or a legacy public avatars URL that is recognized by the certificate ref parser)

2. `401/403 unauthorized`
   - Signed URL endpoints require an authenticated session (`requireAuthenticatedUser()`).
   - Confirm the user is signed in and token refresh is working.

3. `500 sign_failed`
   - `createSignedUrl` returned no signed URL.
   - Check:
     - storage bucket exists (`resumes` / `certificates`)
     - storage policies are applied (RLS/security suite may catch drift)
     - object path exists

4. Employer “can’t open certificate/CV”
   - Storage access is gated by product rules:
     - `consent_to_share = true`
     - application is not `withdrawn`
   - Use the storage authorization logic in `authorizeApplicantDocumentAccess` and related tables to confirm those conditions.

==================================================
## 12. Monitoring
==================================================

Kvalifits uses **Sentry only** (`@sentry/nextjs`).

Reference: `docs/monitoring.md`.

### 12.1 Where errors are visible

- Sentry Issues grouped by:
  - `environment`: `production` vs `preview` (from `VERCEL_ENV` / `NEXT_PUBLIC_VERCEL_ENV`)
  - tags `area`:
    - `api`
    - `client`
    - `job_application`
    - `auth`
    - `email`
    - `storage`
2. Vercel logs are a fallback when Sentry is unavailable.

### 12.2 Production vs preview

Use Sentry filters:

- `environment = production` for urgent production issues
- `environment = preview` for pre-release regressions

### 12.3 Errors that require urgent attention

Urgent conditions:

1. Auth failures that block login:
   - Sentry `area=auth`
   - and frequent `login_unavailable`, or blocked-account failures
2. Email configuration failures:
   - Sentry `area=email`
   - especially `email_missing_config` / `provider_error`
3. Cron worker failures:
   - Sentry `area=api` with `code=saved_search_alert_cron`
4. Storage signed-url failures:
   - Sentry `area=storage`
   - codes like `sign_failed` / upload failures

==================================================
## 13. Incident Response
==================================================

This section provides procedures for:

- EXPOSED SECRET
- COMPROMISED USER
- BAD DEPLOY
- BAD MIGRATION
- PRIVATE DOCUMENT EXPOSURE

### 13.1 EXPOSED SECRET

Identify the secret (examples in this repo):

- `RESEND_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SENTRY_AUTH_TOKEN`
- `CRON_SECRET`

Procedure:

1. Revoke/rotate the secret:
   - Vercel: update the relevant environment variable(s) in the Vercel project.
   - Supabase:
     - rotate `SUPABASE_SERVICE_ROLE_KEY` (if compromised)
     - “Verify in Supabase dashboard” for the exact rotation procedure.
2. Redeploy:
   - promote/redeploy the current version on Vercel so runtime uses the rotated secret.
3. Inspect impact via audit logs and monitoring:
   - Sentry: filter by `environment=production`
   - Admin audit log:
     - `GET /[locale]/admin/audit`
     - look for moderation/admin-change actions around the time of compromise.

### 13.2 COMPROMISED USER

1. Block the user:
   - `GET /[locale]/admin/moderation` → block via `blocked_users` moderation action
   - or call `POST /api/admin/moderation` with:
     - `queue=blocked_users`
     - `action=block`
     - `targetId=<profile_id>`
2. Confirm session revocation:
   - blocking triggers `revokeUserSessions(userId)` which uses:
     - `admin.auth.admin.signOut(userId, "global")`
3. Verify no persistence:
   - In Sentry, check `area=api` and `area=storage` around the incident time.
4. Document actions:
   - check `GET /[locale]/admin/audit` for the audit entries.

### 13.3 BAD DEPLOY

1. Roll back in Vercel to the last known-good production deployment (Section 1.7).
2. Confirm monitoring:
   - Sentry `environment=production` should stabilize
3. Confirm cron and critical routes:
   - `/api/auth/login`
   - `/api/job-applications`
   - `/api/cron/saved-search-alerts` (if scheduled)

### 13.4 BAD MIGRATION

Symptoms:

- RLS suite failures after deploying a new schema
- storage buckets/policies missing
- cron jobs missing or failing

Procedure:

1. Stop write impact as early as possible:
   - Roll back the application deployment first (BAD DEPLOY section), so new code doesn’t add more inconsistent writes.
2. Assess recovery state without destructive DB actions:
   - Run `node scripts/remote-db-audit.mjs` (read-only)
   - Run `node scripts/rls-security-suite.mjs` (validation)
3. Recover using the safe migration workflow (Section 3):
   - apply missing migrations via `supabase db push` or `supabase migration up`
4. Re-run validations:
   - RLS security suite
   - remote-db-audit
5. Re-enable cron:
   - Vercel cron: verify saved-search-alerts schedule
   - pg_cron: verify scheduled jobs exist and are running

Rules:

- Do not blindly reset the remote DB.
- Do not use destructive SQL in place of reconciliation.

### 13.5 PRIVATE DOCUMENT EXPOSURE

Private documents are stored in:

- `resumes` bucket (CVs)
- `certificates` bucket (certificates)

Procedure:

1. Revoke access:
   - Block the affected user (Section 13.2). Storage policies + access checks depend on authenticated identity, and blocked users are denied writes and access paths.
   - If `SUPABASE_SERVICE_ROLE_KEY` might be involved in signed URL generation, rotate it (Section 13.1).
2. Identify affected objects:
   - CV objects are referenced by `public.seeker_profiles.cv_url` object paths.
   - Certificate objects are referenced by `public.seeker_certificates.certificate_image_url`.
   - Query the affected user id(s) to list stored object paths (read-only SQL).
3. Rotate signed access as appropriate:
   - Signed URLs are short-lived (see `CV_SIGNED_URL_TTL_SEC` and `CERTIFICATE_SIGNED_URL_TTL_SEC` in code).
   - Previously issued signed URLs may still be valid until expiry; to limit ongoing impact, rotate credentials that can mint signed URLs (service role key) and block the user.

4. Confirm through monitoring:
   - check Sentry `area=storage` for sign_failed / upload failures around the incident window.

==================================================
## 14. Common Support Issues
==================================================

These troubleshooting answers reference concrete routes and data paths from the repo.

### 14.1 “Verification email did not arrive”

Check:

1. Confirm whether the resend was attempted:
   - `POST /api/auth/resend-verification`
2. Check rate-limit behavior:
   - errors may be rate-limited (429) based on buckets in `lib/auth/resendVerification.ts`
3. If on production:
   - Sentry `area=auth` events
4. Ensure Supabase Auth email templates exist in the Supabase dashboard and include `{{ .ConfirmationURL }}` (see `docs/reliability-report.md`).

### 14.2 “User says application failed but employer sees it”

Possible cause (by design):

- The DB insert may succeed, but the employer email send may fail after insertion.
- In that case the candidate may receive `500` while the employer still sees the application row.

Check:

1. Confirm application row exists:
   - `public.job_applications` for the `job_post_id` + `seeker_user_id`
2. Check `employer_notified_at`:
   - if null, email send likely failed
3. Check Sentry `area=email` for the timeframe.

Route:

- Candidate submits to `POST /api/job-applications`.

### 14.3 “User already applied”

This is returned as a duplicate response:

- `jsonForApplicationSubmit(...)` returns:
  - HTTP 409
  - `error = "duplicate_application"`

Operator actions:

1. Identify the user’s existing `job_applications` row for that job.
2. Confirm status is not `withdrawn`.

### 14.4 “Employer does not see applicant”

Employer applicant visibility depends on consent and application state:

- Employer access to application-linked docs is tied to:
  - `job_applications.consent_to_share = true`
  - application status not equal to `withdrawn`

Check:

1. Does the application exist (`public.job_applications`)?
2. Is `consent_to_share` true?
3. Is the application withdrawn?
4. Is the employer profile associated with the job post?

### 14.5 “Certificate cannot be opened”

Certificate signed URL flow:

- `GET /api/certificates/signed-url?path=<...>`
- Route: `app/api/certificates/signed-url/route.ts`

Check:

1. The request is authenticated.
2. The certificate reference in DB is correct:
   - `public.seeker_certificates.certificate_image_url`
3. Bucket existence and policies:
   - bucket `certificates` is private
4. If the object path is legacy public:
   - the route may return `legacy_public_file` and requires re-upload/migration.

### 14.6 “CV cannot be opened”

CV signed URL flow:

- `GET /api/resumes/signed-url?path=<...>`
- Route: `app/api/resumes/signed-url/route.ts`

Check:

1. Authenticated session exists
2. Correct object path format in `public.seeker_profiles.cv_url`
3. Legacy handling:
   - route attempts `resumes`, then falls back to legacy signing in `avatars`

### 14.7 “Job expired unexpectedly”

Job lifecycle is controlled by:

- `supabase/migrations/20260817210000_archive_expired_job_posts_cron.sql` cron to archive:
  - `private.archive_expired_job_posts()`
  - marks status `published` -> `archived`

Also apply gating uses job lifecycle checks:

- `jobAcceptsApplications(...)` checks deadline/expiry (used in `app/api/job-applications/route.ts`)

Check:

1. job row timestamps:
   - `expires_at`
   - `application_deadline`
   - `status`
2. Cron health:
   - pg_cron job for `archive-expired-job-posts`

### 14.8 “User is blocked”

Blocking:

- sets `public.profiles.is_blocked`
- revokes sessions on block

Check:

1. `public.profiles.is_blocked`
2. Confirm sessions are revoked:
   - admins call `revokeUserSessions(userId)`

### 14.9 “Delete/export account request”

There are account workflows implemented under:

- `app/api/account/delete/route.ts`
- `app/api/account/export/route.ts`

Use the appropriate workflow for:

- GDPR export/delete
- ensure the user is properly authenticated / authorized

==================================================
## 15. Pre-Beta Checklist
==================================================

Concise pre-launch checklist grounded in repo ops:

1. Migrations:
   - Remote schema has all migration files applied (77 migrations in `supabase/migrations/`).
   - Recommended verification:
     - `node scripts/remote-db-audit.mjs`
2. RLS suite passes:
   - Run `node scripts/rls-security-suite.mjs`
3. Cron checked:
   - Verify pg_cron jobs exist for:
     - `archive-expired-job-posts`
     - `notify-saved-jobs-near-deadline`
   - Verify Vercel cron exists for:
     - `/api/cron/saved-search-alerts` (from `vercel.json`)
4. Resend configured:
   - `RESEND_API_KEY` set
   - `EMAIL_FROM` correct (or rely on fallback)
5. Monitoring configured:
   - `NEXT_PUBLIC_SENTRY_DSN` set
   - `SENTRY_ORG` / `SENTRY_PROJECT` configured (and `SENTRY_AUTH_TOKEN` if you want source maps uploaded)
6. Build passes:
   - `npm run build`
7. Unit tests pass:
   - `npm test`
8. E2E critical flow passes:
   - `npm run test:e2e`
9. Legal pre-launch state acknowledged:
   - Operator confirms the legal placeholders (`LAUNCH_OPERATOR` etc.) are replaced with real identity if required by policy (see `lib/content/legal/placeholders.ts`).

