# Mobile Final UX QA (Kvalifits)

Date: 2026-08-19

## Scope

- Viewports audited: `320`, `360`, `375`, `390`, `430`, `768`, `1024` (mobile project in Playwright).
- Locales:
  - Full public-route pass: `et`
  - Spot checks: `ru` (`375`, `430`), `en` (`390`)
- Authentication / employer applicant flows:
  - Only partially covered (see “Skipped / needs secrets”).

## Results (issues found + fixed)

### 1) Horizontal overflow on public routes
- Route: `/et/tood`, `/et/ettevotted`, `/et/hinnakiri`, `/et/privaatsus`, `/et/tingimused`, `/et/auth/login`
- Viewport: `320/360/375/390/430/768/1024`
- Problem: Possible `scrollWidth > innerWidth` leading to horizontal scrolling / clipped UI.
- Fix: N/A
- Status: **PASS** (no horizontal overflow detected by Playwright assertions)

### 2) Language switcher dropdown clipping on small screens
- Route: `/et/tood`
- Viewport: `320/360/375/390/430/768/1024`
- Problem: Dropdown menu could render outside the viewport (clipped dropdown / bad positioning).
- Fix: N/A
- Status: **PASS** (language menu bounding box remained within viewport bounds)

### 3) Job search filters dialog positioning
- Route: `/et/tood` (opened via the “Filtrid/Filter” button if present)
- Viewport: `320/360/375/390/430/768/1024`
- Problem: Filter sheet/dialog could be clipped or cause layout overflow.
- Fix: N/A
- Status: **PASS** (no horizontal overflow detected while dialog was open)

### 4) Job detail layout fit (conditional on published jobs existing)
- Route: `/et/tood/[job]` (opened the first job card when a job link exists)
- Viewport: `320/360/375/390/430/768/1024`
- Problem: Job detail page could overflow horizontally or clip important UI.
- Fix: N/A
- Status: **PASS** (no horizontal overflow detected on opened job detail)

### 5) Company detail layout fit (conditional on companies existing)
- Route: `/et/ettevotted/[company]` (opened the first company card when a company link exists)
- Viewport: `320/360/375/390/430/768/1024`
- Problem: Company detail could overflow horizontally or clip content.
- Fix: N/A
- Status: **PASS** (no horizontal overflow detected on opened company detail)

### 6) Quick Apply dialog keyboard + focus trapping
- Route: `/_/internal/e2e/quick-apply-sheet` (used by existing Playwright test harness)
- Viewport: Pixel 5 (from Playwright mobile project default)
- Problem: Focus trapping / keyboard navigation regressions in Quick Apply sheet.
- Fix: N/A (covered by existing automated test)
- Status: **PASS** (existing `quick-apply-a11y.spec.ts` test for focus trap passed)

## Skipped / needs E2E secrets

The following items require authenticated E2E credentials or live seeded data:

- Notifications UI realtime + unread count correctness on mobile
  - Reason: account routes require authenticated user context; existing tests require `E2E_*` secrets.
- Employer applicant flow & employer “applicants” lists on mobile
  - Reason: requires authenticated employer account seeded data; no non-secret Playwright spec exists in this repo.
- Additional “public route” pages not covered by the automated pass:
  - Active filter chips render checks (beyond opening the filter dialog)
  - Sorting + pagination interactions
  - Matching explanation section (beyond general job detail “h1 visible” and overflow checks)

## What still counts as “done”

- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: must be rerun after this change (see below).
- `Playwright mobile`:
  - `e2e/mobile.spec.ts` updated with extra responsive/overflow assertions.
  - `e2e/quick-apply-a11y.spec.ts` already covers Quick Apply dialog focus trapping.

