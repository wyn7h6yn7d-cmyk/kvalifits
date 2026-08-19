# Kvalifits — Safe Code Cleanup Report

## What changed

This cleanup is intentionally conservative: it removes only duplicated/leftover artifacts that are not part of the active code paths (e.g., “` 2`” filename leftovers created during earlier iterations) and that are not referenced by imports or used as Next.js route filenames.

No migration history, RLS/security suite code, or reconciliation/backfill scripts were removed.

## Files removed

### 1) Duplicate Next route/view leftovers (`* 2.tsx`)
- `app/[locale]/error 2.tsx`
- `app/[locale]/admin/audit/page 2.tsx`
- `app/[locale]/not-found 2.tsx`
- `app/[locale]/account/employer/jobs/[id]/preview/page 2.tsx`
- `app/[locale]/account/notifications/page 2.tsx`
- `app/[locale]/account/seeker/alerts/page 2.tsx`
- `app/global-error 2.tsx`
- `components/admin/AdminAuditLogView 2.tsx`
- `components/account/SeekerCompletenessPanel 2.tsx`
- `components/account/SeekerEducationSection 2.tsx`
- `components/employer/ApplicantEducationList 2.tsx`
- `components/jobs/EmployerJobPreviewActions 2.tsx`
- `components/jobs/JobListingDetailView 2.tsx`
- `components/jobs/JobLinesEditor 2.tsx`
- `components/jobs/QuickApplyA11yHarness 2.tsx`
- `components/jobs/QuickApplySheet 2.tsx`
- `components/notifications/NotificationBell 2.tsx`
- `components/notifications/NotificationsInbox 2.tsx`
- `components/seeker/PrivateCvOpenLink 2.tsx`

### 2) Duplicate scripts leftovers (`* 2.mjs`)
- `scripts/check-migration-order 2.mjs`
- `scripts/run-unit-tests 2.mjs`
- `scripts/verify-migration-sequence 2.mjs`
- `scripts/remote-db-audit 2.mjs`
- `scripts/migrate-public-cvs-to-resumes 2.mjs`

### 3) Duplicate TypeScript modules/specs/libs (`* 2.ts`)
- `app/api/auth/resend-verification/route 2.ts`
- `e2e/auth-live.spec 2.ts`
- `e2e/auth.spec 2.ts`
- `e2e/helpers 2.ts`
- `e2e/job-search.spec 2.ts`
- `e2e/locales.spec 2.ts`
- `e2e/mobile.spec 2.ts`
- `e2e/privacy.spec 2.ts`
- `e2e/public.spec 2.ts`
- `e2e/quick-apply-a11y.spec 2.ts`
- `instrumentation 2.ts`
- `instrumentation-client 2.ts`
- `playwright.config 2.ts`
- `sentry.edge.config 2.ts`
- `sentry.server.config 2.ts`
- `lib/admin/auditLogView 2.ts`
- `lib/admin/loadAdminAuditLog 2.ts`
- `lib/auth/accountBlocked 2.ts`
- `lib/auth/authorizeApplicantDocument 2.ts`
- `lib/auth/profileSecurity 2.ts`
- `lib/auth/requireActiveAccountPage 2.ts`
- `lib/auth/requireAuthenticatedUser 2.ts`
- `lib/auth/resendVerification 2.ts`
- `lib/auth/revokeUserSessions 2.ts`
- `lib/companies/loadPublicEmployerFields 2.ts`
- `lib/cookies/useCookieConsent 2.ts`
- `lib/employer/candidateDiscovery 2.ts`
- `lib/employer/candidateDiscoveryUrl 2.ts`
- `lib/employer/employerOwnerUniqueness 2.ts`
- `lib/employer/employerProfileFields 2.ts`
- `lib/employer/loadDiscoverableCandidates 2.ts`
- `lib/i18n/errorCopy 2.ts`
- `lib/jobs/applicationSubmitOutcome 2.ts`
- `lib/jobs/duplicateJobPost 2.ts`
- `lib/jobs/jobApplicationFieldLock 2.ts`
- `lib/jobs/jobContentLines 2.ts`
- `lib/jobs/jobDetailPresentation 2.ts`
- `lib/jobs/jobPublishFromRow 2.ts`
- `lib/jobs/jobPublishValidation 2.ts`
- `lib/jobs/jobVisibility 2.ts`
- `lib/jobs/runSavedSearchAlertDelivery 2.ts`
- `lib/jobs/savedJobSearchFieldLock 2.ts`
- `lib/jobs/savedSearchAlertDelivery 2.ts`
- `lib/monitoring/report 2.ts`
- `lib/monitoring/scrub 2.ts`
- `lib/monitoring/sentryOptions 2.ts`
- `lib/notifications/access 2.ts`
- `lib/notifications/savedJobDeadline 2.ts`
- `lib/notifications/types 2.ts`
- `lib/seeker/cvStorage 2.ts`
- `lib/seeker/cvUpload 2.ts`
- `lib/seeker/education 2.ts`

### 4) Duplicate docs artifacts (`* 2.md`)
- `docs/pre-beta-review 2.md`
- `docs/current-state-audit 2.md`
- `docs/employer-product-completion 2.md`
- `docs/quality-polish-report 2.md`
- `docs/monitoring 2.md`
- `docs/security-hardening-report 2.md`
- `docs/database-reconciliation-report 2.md`
- `docs/testing 2.md`
- `docs/seeker-product-completion 2.md`
- `docs/reliability-report 2.md`

### 5) Duplicate docs/config artifacts (`* 2.json`)
- `docs/remote-db-audit-results 2.json`
- `vercel 2.json`
- `tsconfig.typecheck 2.json`

## Code removed

Removed whole-file duplicated implementations that were present as leftover artifacts with ` 2` suffixes (including some unreferenced Next.js route/view files and unreferenced helper modules).

## Dependencies removed

None. No `package.json` / lockfile changes were made during this cleanup.

## Intentionally retained

Kept, per project safety constraints:
- Migration history and all active/reconciliation migration SQL (no deletions under `supabase/migrations/`).
- RLS/security suite scripts and related test code.
- Remote migration documentation (non-duplicated, canonical docs).
- Legal history required by the project.
- Any “active” production compatibility code without proving it obsolete.

Also retained canonical (non-` 2`) modules and docs.

## Verification (post-cleanup)

Commands run successfully after the deletions:
- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

No failing lint/typecheck/tests/build observed.

