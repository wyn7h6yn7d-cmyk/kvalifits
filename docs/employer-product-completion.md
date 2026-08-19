# Employer product completion — audit report

Branch: `reliability/email-monitoring`

## Summary

All six requested employer product features were audited. Every feature was already implemented and tested. One navigation cleanup was applied.

## Task 1 — Draft-first job creation

**Status: Already implemented.**

`EmployerNewJobForm.tsx` has three distinct save intents via `persist(intent)`:
- `"draft"` → `status: "draft"`, no publish lifecycle dates, redirects to edit page
- `"preview"` → `status: "draft"`, redirects to preview page
- `"publish"` → `status: "published"`, sets `published_at`, `expires_at`, `application_deadline`

The form default submit action is `persist("draft")`. Three buttons in the UI:
- "Salvesta mustand" (save draft) — form submit default
- "Vaata eelvaadet" (preview) — calls `persist("preview")`
- "Avalda tööpakkumine" (publish) — calls `persist("publish")`

Draft save only requires a title (`validateDraftSave`). Publish requires full validation (`validateJobForPublish`).

## Task 2 — Job preview

**Status: Already implemented.**

- Page: `app/[locale]/account/employer/jobs/[id]/preview/page.tsx`
- Authorization: `getEmployerJobIfOwned` — server-side owner check via `employer_profiles` join
- Labelled: "Eelvaade" banner with `previewBanner` / `previewBannerBody` i18n keys
- `noindex`: uses `NOINDEX_ROBOTS` metadata
- Reuses `JobListingDetailView` component with `preview` prop
- `EmployerJobPreviewActions` provides edit/publish controls

## Task 3 — Job duplicate

**Status: Already implemented.**

- Logic: `lib/jobs/duplicateJobPost.ts`
- `DUPLICATE_CONTENT_KEYS`: copies title, description, duties, benefits, requirements, skills, certificates, languages, location, work arrangement, workload, salary
- `DUPLICATE_STRIP_KEYS`: never copies id, created_at, published_at, status, expires_at, slug, search_text, view_count, impressions, moderation_status
- Status forced to `"draft"`, `published_at`/`expires_at` set to `null`
- `safeDuplicateApplicationDeadline`: expired deadlines get a fresh 30-day default
- New slug generated via `generateJobSlug`
- Owner-only via `canDuplicateEmployerJob` (same gate as preview)
- Tests: `duplicateJobPost.test.ts` (7 tests)

## Task 4 — Job duties + benefits

**Status: Already implemented.**

Schema columns: `duty_lines` (string[]), `benefit_lines` (string[])

Form: `EmployerNewJobForm` has separate `JobLinesEditor` components for duties and benefits with distinct i18n labels:
- "Tööülesanded" (duties section)
- "Soodustused" (benefits section)

Public detail: `JobListingDetailView` renders duties and benefits as separate `DetailSection` blocks, only when populated. Benefits are optional.

Validation: `jobContentLines.ts` validates and sanitizes both line arrays.

## Task 5 — Candidate discovery server-side

**Status: Already implemented.**

- Server-side pagination via Postgres RPC `search_discoverable_candidates`
- Page size: 24 (within 20–30 range), clamped by `clampDiscoveryPageSize`
- Filters passed as typed RPC arguments (`rpcArgsFromDiscoveryFilters`)
- Facets loaded via separate RPC `discoverable_candidate_facets`
- Authorization: `mayLoadDiscoverableCandidates` requires `isAuthenticated && isEmployer`
- Allowed fields explicitly listed in `DISCOVERY_ALLOWED_PROFILE_FIELDS`
- Forbidden fields (`DISCOVERY_FORBIDDEN_PROFILE_FIELDS`): phone, cv_url, date_of_birth, work_capacity, salary_expectation, is_minor, legal_representative_consent_status, full_name, email
- Certificate forbidden fields: image URLs, storage paths, file URLs
- Any leaked field is stripped by `mapDiscoveryRpcRow`
- Tests: `candidateDiscovery.test.ts`, `candidateDiscoverySql.test.ts`

## Task 6 — Employer nav cleanup

**Status: Applied one fix.**

- "Sõnumid" (messages) was already excluded from `EMPLOYER_NAV` with comment: "Messaging is not shipped"
- Messages page route exists but is not linked from navigation
- **Fix applied:** Removed duplicate `employerCompany` entry that pointed to the same `/account/employer` URL as `employerOverview`
- Added test verifying no duplicate hrefs in `EMPLOYER_NAV`

## Localization

All employer UI (form labels, preview banner, action buttons, validation errors) has ET/EN/RU translations in `messages/*.json`.

## Tests

All requested test scenarios already existed:

| Test | File | Status |
| --- | --- | --- |
| Draft is not public | `jobVisibility.test.ts` | ✅ |
| Preview owner-only | `jobVisibility.test.ts` | ✅ |
| Publish works | `jobVisibility.test.ts` | ✅ |
| Duplicate creates separate draft | `duplicateJobPost.test.ts` | ✅ |
| Candidate discovery authorization | `candidateDiscovery.test.ts` | ✅ |
| Candidate discovery pagination | `candidateDiscovery.test.ts` | ✅ |
| Nav no duplicate hrefs | `navConfig.test.ts` | ✅ (new) |

**Verification:** 190 unit tests pass, typecheck clean, lint clean, build succeeds.
