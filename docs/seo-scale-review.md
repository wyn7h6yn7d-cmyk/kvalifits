# SEO Scale & Job Lifecycle Review

Date: 2026-08-19

This review assumes the current SEO baseline is already in place (page metadata, canonical URLs, hreflang ET/EN/RU, Open Graph, sitemap + robots, JobPosting JSON-LD, noindex handling for private pages + filter URLs, and closed/expired job behavior).

Scope: verify what’s already good and fix only remaining lifecycle/scalability issues.

---

## 1) Expired / Closed Jobs

### What’s already good (baseline)
- **Job detail page SEO**:
  - `JobDetailPage.generateMetadata()` loads the job for SEO and sets:
    - `robots: NOINDEX_FOLLOW` when the listing **does not accept applications** (`jobAcceptsApplications(...) === false`)
    - indexable metadata otherwise.
  - `JobPostingJsonLd` is **omitted** for non-accepting listings (`buildJobPostingJsonLd(...)` returns `null` when `jobAcceptsApplications(...)` is false).
- **Sitemap**:
  - `app/sitemap.ts` includes only published jobs that pass `jobAcceptsApplications(...)`, so expired/closed listings are not promoted in the sitemap.
- **Similar jobs UX/SEO**:
  - `loadSimilarJobsForDetail()` filters candidates through `jobAcceptsApplications(...)` before selecting similar jobs, so a “closed” job can still show **similar active** roles.

### Remaining problem found
- **Active job search fallback path** (`loadPublishedJobSearch`):
  - When the search RPC is unavailable and the code falls back to `fallbackPublishedSearch()`, it previously filtered only by `status='published'`.
  - That meant expired/closed listings could accidentally appear in the “active jobs” listing under fallback conditions.

### Fixes made
- Updated `fallbackPublishedSearch()` to filter results with:
  - `filterPublishedJobsAcceptingApplicationsForSearch(...)` (existing lifecycle logic via `jobAcceptsApplications`)
- This ensures expired/closed jobs do **not** surface in the active job search UI even when the RPC path fails.

### Unit-test coverage added
- `lib/jobs/jobLifecycle` already had lifecycle tests.
- Added tests asserting:
  - `buildJobPostingJsonLd(...)` returns `null` for expired jobs.
  - active JobPosting JSON-LD emits required fields.
  - fallback filtering excludes expired/closed listings.

---

## 2) JobPosting Structured Data (JSON-LD)

### What’s already good (baseline)
- `buildJobPostingJsonLd(...)` only emits JobPosting JSON-LD when:
  - the job **accepts applications**
  - it has visible, supported data needed for required JSON-LD fields (title, description, company name, datePosted, and either jobLocation or remote handling).
- Optional fields are included only when their underlying values are present and supported:
  - `validThrough` only when a computed apply-until date exists
  - `employmentType` only when mapping from `job_type` works
  - `jobLocation` only when location is visible (and for non-remote listings; otherwise structured data is omitted)
  - `baseSalary` only when min/max + currency + salary period map all exist.

### Unit-test coverage added
- Added `lib/jobs/jobSeo.test.ts` to validate:
  - active listing emits JobPosting JSON-LD with expected fields
  - expired listing emits **no** JobPosting JSON-LD
  - missing salary currency/period does not invent `baseSalary`
  - non-remote jobs without location do not emit misleading JSON-LD

---

## 3) Sitemap Scalability

### What the current sitemap does
- `app/sitemap.ts` generates:
  - **static** pages from `PUBLIC_STATIC_PATHS`
  - **job detail** URLs by querying published jobs (bounded)
  - **company directory detail** URLs by querying public slugs (bounded)

### Current scalability characteristics (bounded + safe)
- Published jobs: `limit(5000)` then expand to 3 locales (ET/EN/RU).
- Public company slugs: `limit(2000)` then expand to 3 locales.
- Dynamic sitemap URLs worst-case (before static):
  - `(5000 jobs + 2000 companies) * 3 locales = 21,000 dynamic URLs`
- This is comfortably bounded in-memory for typical Next metadata route generation.

### Remaining scalability design path (documented)
- If the catalog grows such that **dynamic sitemap URLs** approach “too large to safely build in one go” (practical risk threshold: tens of thousands of URLs),
  - move to a **sitemap index + partitioned sitemap files** (jobs-partitioned and companies-partitioned),
  - using paged fetching to avoid loading unbounded catalogs into memory.

### Threshold (when to scale further)
- For this codebase’s current “single sitemap.xml build” approach, plan to switch architecture when:
  - `publishedJobsCount * 3` or `companySlugsCount * 3` pushes the total dynamic URL count toward **~50,000+ URLs**.

### Unit-test coverage added
- Added pure unit tests for sitemap entry expansion logic (`lib/seo/sitemapEntries.test.ts`) to ensure:
  - hreflang + locale expansion is correct and stable
  - expansion functions remain deterministic and do not embed query parameters.

---

## 4) Company Directory Pagination

### What’s already good (baseline)
- Listing page metadata (`app/[locale]/(site)/ettevotted/page.tsx`) uses:
  - canonical URLs derived from the path (query params do not alter canonical)
  - `robots: NOINDEX_FOLLOW` when query params indicate a duplicate landing page (filters + pagination).
- Company detail pages (`app/[locale]/(site)/ettevotted/[slug]/page.tsx`) remain indexable and emit JSON-LD from public company fields only.

### Pagination/duplicate canonical safety
- Pagination uses `page` query param.
- The metadata robots/noindex logic treats `page` as a duplicate landing input (so it prevents accidental duplication indexing).
- Canonical URLs are queryless because canonical is generated from path/slug.

---

## 5) Search / Filter URLs

### What’s already good (baseline)
- Job search and company directory listing metadata apply `NOINDEX_FOLLOW` when search/filter query params indicate a duplicate landing page.
- Tracking parameters are ignored for the “duplicate landing” check.
- Result: the site does not create uncontrolled index bloat for arbitrary filter combinations unless the project intentionally changes this policy.

---

## 6) Metadata (locale correctness + fallbacks)

### What’s already good (baseline)
- Locale-aware SEO helpers use `locale` explicitly, not a hardcoded ET-only fallback.
- Missing metadata (missing job/company) uses translated copies via `next-intl`.

---

## 7) Company Pages (metadata + JSON-LD privacy)

### What’s already good (baseline)
- Company profile JSON-LD is built only from public company fields returned by `loadPublicCompanyBySlug`.
- Metadata/JSON-LD does not expose employer private fields via structured data.

---

## Summary of fixes made (this review)
- Fixed lifecycle leak in `loadPublishedJobSearch` fallback:
  - expired/closed listings no longer appear in “active jobs” when RPC search is unavailable.

## Summary of “already good”
- Expired/closed job detail pages:
  - no misleading JobPosting JSON-LD
  - robots noindex follow for non-accepting listings
  - similar jobs remain active-only
- Sitemap already avoids expired/closed jobs by using `jobAcceptsApplications`.
- Query parameter indexing policy is already conservative to prevent SEO bloat.

## When sitemap architecture must scale further
- When dynamic URL volume approaches ~50k+ URLs, switch from “single sitemap.xml build” to:
  - sitemap index + partitioned job/company sitemaps
  - paged data fetching with strict caps per generated sitemap file

