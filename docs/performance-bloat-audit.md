# Kvalifits — Performance, Dead Code & Bloat Audit

**Date:** 2026-09-03  
**Scope:** Full-repo static analysis + production `next build` (Next.js 16.2 / Turbopack) + local production server transfer sampling.  
**Constraint:** No blind deletions; only verified-unused code/deps removed. Migration history untouched. No speculative refactors.

---

## Executive verdict

| Rating | Value |
|--------|--------|
| **Bloat class** | **MODERATE BLOAT** |
| **Public launch performance risk** | **MEDIUM** |

Dependency surface is lean (no charts, no rich editor, no Framer). Much of the product UI is correctly server-rendered. The main weight is **shared client runtime** (React + Sentry + Supabase client paths), **full-locale i18n JSON on the client**, **homepage composition depth** (motion + jobs client cards + carousel), and **large source marketing JPEGs**.

Local production `/et` returned **500** in this environment (missing/incomplete public Supabase client env). Web vitals below are therefore **partial** (error shell + static assets), not a green-path Lighthouse run. Treat LCP/INP/CLS as **not fully measured** until re-run against a healthy deploy.

---

## A. Total source size

| Metric | Value |
|--------|--------|
| Tracked source-ish files (`.ts/.tsx/.css/.sql/.json/.md`, excl. `node_modules`/`.next`) | **~4.1 MB**, ~755 files |
| `app` + `components` + `lib` lines | **~59k** |
| `messages/{et,en,ru}.json` | **~455 KB** on disk (ET ~134 KB, EN ~129 KB, RU ~192 KB) |
| `public/marketing/*.jpg` | **~2.5 MB** (with byte-identical duplicates) |
| Local `.next` (incl. cache) | large / not ship cost |
| `node_modules` | ~700 MB install weight (not browser cost) |

Source LOC alone does **not** imply browser bloat; most SQL/docs stay off the client.

---

## B. Actual browser JS size

Production static output under `.next/static`:

| Bucket | Approx. |
|--------|---------|
| All static JS chunks (disk, uncompressed) | **~2.2 MB** total catalog (not all loaded per route) |
| Homepage error-shell script tags (identity / uncompressed) | **~935 KB** across 10 scripts |
| Same, gzip-estimate (level 9) | **~282 KB** |
| Observed browser `transferSize` on `/et` error page | **JS ~380 KB**, CSS ~27 KB, fonts ~92 KB, **~24 requests** |

Largest transferred JS on that load:

| Chunk (hash) | Transfer | Decoded | Likely contents |
|--------------|----------|---------|-----------------|
| `11w5gie7v2g3v.js` | ~136 KB | ~430 KB | **Sentry + React/runtime** |
| `0t.9l~geouqq8.js` | ~61 KB | ~228 KB | **Supabase client / analytics-adjacent** |
| `0vnokvrtacwmq.js` | ~50 KB | ~195 KB | React / framework |

Healthy homepage will add route-specific chunks (hero search, navbar, job cards, carousel, cookie consent) on top of this shared baseline.

---

## C. Largest route (client reference surface)

Turbopack build does **not** print classic “First Load JS” tables. Proxy via `page_client-reference-manifest.js` size (indicates client module graph breadth):

| Route | Manifest size |
|-------|----------------|
| `/[locale]/account/employer/.../applicants/[applicationId]` | **~41 KB** (heaviest) |
| `/[locale]/(site)/tood/[id]` | **~39 KB** |
| `/[locale]` (homepage) | **~38 KB** |
| Employer preview / seeker matches / employer dashboard | **~30–32 KB** |
| `/tood`, auth, companies, admin list pages | **~27–28 KB** |

**Interpretation:** Job detail, homepage, and deep employer applicant views pull the widest client graphs. Admin list pages are not the worst offenders by this proxy.

---

## D. Largest JS chunks (disk)

| Size | File | Notes |
|------|------|--------|
| **429 KB** | `.next/static/chunks/11w5gie7v2g3v.js` | Sentry-heavy |
| **222 KB** | `0t.9l~geouqq8.js` | Supabase |
| **191 KB** | `0vnokvrtacwmq.js` | Framework |
| **110 KB** | `03~yq9q893hmn.js` | Shared app |
| **164 KB** | `13hl3~fu1nu0m.css` | Global Tailwind CSS (gzip ~25 KB) |

Server SSR chunks include multi‑MB aggregates under `.next/server/chunks` — expected for RSC, not shipped as browser First Load.

---

## E. Largest dependencies (impact)

| Package | Role | Browser risk |
|---------|------|----------------|
| `@sentry/nextjs` | Monitoring | **High** — largest observed client chunk |
| `@supabase/supabase-js` + `@supabase/ssr` | Data/auth | **High** when client modules import browser client |
| `next` / `react` / `react-dom` | Framework | Baseline |
| `next-intl` | i18n | **Medium–High** via full `messages` provider |
| `lucide-react` | Icons | Low–medium if tree-shaken (named imports used) |
| `@radix-ui/react-dialog` (+ slot/separator/visually-hidden) | UI primitives | Medium on interactive routes |
| `@vercel/analytics` / `speed-insights` | Telemetry | Low–medium; gated by consent path |

**Not present (good):** chart libs, TipTap/ProseMirror, Framer Motion package, date-fn monoliths, lodash.

---

## F. Unused dependencies

| Package | Evidence | Action |
|---------|----------|--------|
| `@radix-ui/react-scroll-area` | No imports in `app`/`components`/`lib` | **Removed** (`npm uninstall`) |

No other clearly unused runtime deps found. `@swc/helpers` is a Next/SWC companion — leave.

---

## G. Unused code (verified)

Static import graph + repo search (excluding historical docs). No dynamic string imports found for these symbols.

| File | Evidence | Action |
|------|----------|--------|
| `components/sections/HeroMatchMockup.tsx` | Export only; replaced by `HeroMatchPanel` | **Deleted** |
| `components/sections/HeroPersonPhoto.tsx` | Export only; photo now in `HeroMatchPanel` | **Deleted** |
| `components/sections/HomepageScrollHint.tsx` | Export only | **Deleted** |
| `components/sections/FeaturedJobsSection.tsx` | Superseded by `HomepageJobsSection` | **Deleted** |
| `components/sections/NewJobsSection.tsx` | Superseded by `HomepageJobsSection` | **Deleted** |
| `components/sections/Audience.tsx` | Superseded by `HomepageAudienceSection` | **Deleted** |
| `components/sections/WhyKvalifits.tsx` | Superseded by benefits/intro sections | **Deleted** |
| `components/site/BelowFoldSectionSkeleton.tsx` | Never imported | **Deleted** |
| `components/site/portal-background/PortalBackgroundSignalSweep.tsx` | Never imported | **Deleted** |

**Still present but unused as a component (not deleted — config/types couple):**

- `PortalBackground.tsx` + `PortalBackgroundVariantB.tsx` — no JSX consumer; homepage imports `PortalBackgroundVariantA` directly via `HomepageMotionBackground`. `heroPortal.variant` is `"a"`. Safe follow-up: delete wrapper/B or wire intentionally.

**Registry-only / unused photo slots:**

- `landingSeeker` / `landingEmployer` in `lib/site/marketingPhotos.ts` — no page calls `getMarketingPhotoSrc` for them after landings dropped photos.
- Byte-identical duplicates: `landing-seeker.jpg` ≡ `real-life.jpg`; `landing-employer.jpg` ≡ `audience-employer.jpg` (~700 KB redundant on disk; not necessarily double-downloaded if unused).

---

## H. Duplicate code / assets

| Item | Notes |
|------|--------|
| Homepage jobs sections | Old `FeaturedJobsSection` / `NewJobsSection` duplicated `HomepageJobsSection` (removed) |
| Audience vs `HomepageAudienceSection` | Same product intent (removed old) |
| Marketing JPEGs | Two MD5-identical pairs (see G) |
| Job select column lists | Multiple FALLBACK selects in search/detail loaders — intentional schema resilience, not UI bloat |

---

## I. Unnecessary client components

~92 `"use client"` modules. Homepage-relevant:

| Component | Client? | Assessment |
|-----------|---------|------------|
| `HeroContent` / `HeroJobSearch` | Yes | Justified for interactive search; whole hero text hydrates with it |
| `Navbar` | Yes | Auth/menu — expected |
| `HomepageCompanyCarousel` | Yes | Timer/resize — candidate for `dynamic(..., { ssr:false })` **below fold** |
| `JobCard` + `FitScoreExplain` + save/alerts | Yes | **Heavy for homepage** — score explain + save pull client matching UI into first jobs section |
| `CookieConsent` / `ScrollToTopButton` / `LanguageSwitcher` | Yes | Layout-global — expected |
| `HomepageMatchDemoSection` | Server | Good — static demo |
| Most homepage content sections | Server | Good |

**Code-splitting today:** almost only `PortalBackgroundVariantB` via `next/dynamic` — and that path is unused. Charts/editors N/A. Admin UI is route-separated (good). Rich match UI on job cards is the main “should lazy” candidate.

**Do not lazy-load** hero search without a strong reason (LCP/INP tradeoff).

---

## J. Image / font issues

### Images

| Finding | Detail |
|---------|--------|
| `hero-person.jpg` | **~773 KB** source; used with `priority` in hero (`sizes` ~28vw desktop / 100vw mobile) — **primary LCP risk** |
| Next Image | AVIF/WebP enabled in `next.config.ts`; remote Supabase pattern OK |
| Below-fold photos | Real-life / audience use `sizes`; no priority (good) |
| Duplicate landing files | Disk bloat; unused slots |
| Logo in navbar | `priority` — reasonable for brand |

### Fonts

| Setting | Value |
|---------|--------|
| Family | IBM Plex Sans via `next/font` |
| Weights | **400, 500, 600, 700** — all used (`font-medium` / `semibold` / `bold` dominant) |
| Subsets | `latin`, `latin-ext`, `cyrillic` — needed for ET/EN/RU |
| `display` | `swap` |
| Transfer (error page) | **~92 KB** fonts |

No unused weight found worth cutting without a design change. Cyrillic subset is required for RU, not waste.

---

## K. DB / query issues

### Positive

- Job search indexes exist (published_at, salary, GIN skills/keywords, tsv/trgm in migrations) — see also `docs/database-index-review.md`.
- Homepage/new/featured loaders use **explicit column lists**, not `SELECT *`.
- Homepage jobs capped (`JOBS_LIMIT = 6`, query limit 24).
- Published count uses `head: true` where applicable.
- Employer logos for cards batched via `loadEmployerPublicRowsByIds` in search fallback.

### Concerns

| Area | Issue |
|------|--------|
| Account export | `lib/account/exportAccountData.ts` uses **`select("*")`** — acceptable for export, not public path |
| `getHeroQuickFilters` | **4×** `limit(12)` lifecycle row fetches on every homepage render (cached per request). Prefer existence/`count`/`limit(1)` |
| Homepage jobs | Featured + new in parallel, then matching for logged-in seekers — can add TTFB; keep server-side |
| Search fallback | Client-side expiry filter after fetch can shrink page below page size (logic debt, not SELECT *) |
| EXPLAIN ANALYZE | **Not run** here — no safe live DB session in this audit environment |

N+1 risk is mostly mitigated on public search; re-check employer applicant detail and candidate discovery under load.

---

## L. Animation issues

| Surface | Notes |
|---------|--------|
| `HomepageMotionBackground` + `AmbientBackground` + `HeroMotionAurora` + `PortalBackgroundVariantA` | Multiple layered blurs/SVG motion in hero — **CPU cost on low-end mobile**; prefers opacity/transform but `blur-3xl` is expensive |
| `HomepageBodyAtmosphere` | Soft `blur-3xl` washes — lighter |
| Company carousel | `requestAnimationFrame`/interval style motion; respects `prefers-reduced-motion` |
| FAQ | Moved off homepage to `/kkk` — good for home |
| CSS | `globals.css` ~680 lines; several `@keyframes` / blur utilities |

Recommendation: pause or simplify hero SVG network animation when offscreen / `prefers-reduced-motion`; keep search/hero copy static.

---

## M. Fixes made (this audit)

1. Deleted nine verified-unused components (see G).
2. Removed unused npm dependency `@radix-ui/react-scroll-area`.
3. Documented findings; **no** migration deletes; **no** behavior refactors without evidence.

---

## N. Remaining recommendations (priority order)

1. **Re-measure Web Vitals** on a healthy production-like deploy (desktop + mobile): LCP, CLS, INP, TTFB, JS/total transfer, request count. This audit’s local `/et` was an error shell.
2. **Trim client i18n**: `app/[locale]/layout.tsx` passes `getMessages()` wholesale into `NextIntlClientProvider`. Split namespaces so public pages do not hydrate `admin` + `onboarding` + full `jobs` dictionaries (~130–192 KB JSON / locale before gzip).
3. **Sentry budget**: ensure browser SDK is tree-shaken / delayed until after interaction or consent; 430 KB decoded chunk is the #1 shared JS cost.
4. **Homepage `JobCard`**: render a server-only compact card on `/`; lazy-load `FitScoreExplain` / save button only when score exists or user is seeker.
5. **Compress `hero-person.jpg`** source (target ≪ 300 KB master) and keep `priority` + tight `sizes`.
6. **Deduplicate or drop** unused `landing-*.jpg` slots after confirming no external CDN links.
7. **Delete or wire** unused `PortalBackground` + `VariantB`; avoid dead dynamic-import paths.
8. **Lazy** `HomepageCompanyCarousel` below fold (`dynamic` + skeleton).
9. **Hero quick filters**: replace 4×12 row probes with cheaper existence checks.
10. Optional: split large CSS if unused Tailwind grows; currently gzip ~25 KB is acceptable.

---

## Route notes (requested surfaces)

| Route | Notes |
|-------|--------|
| `/` | Many server sections (good) + client hero/nav/jobs cards + motion stack; 4 filter queries + featured/new jobs |
| `/tood` | Client `JobsSearch` / filters — expected; search RPC + indexes OK |
| Job detail | Wide client graph (apply sheet, match explain) — split apply UI if First Load hurts |
| `/ettevotted` | Generally lighter; watch logo images |
| Auth | Moderate; avoid pulling account dashboards |
| Seeker / employer dashboards | Heavier by nature; keep out of public layout (currently OK) |
| Admin | Separate routes; full `admin` messages still risk via global provider |

---

## Web performance sample (local production, incomplete)

| Metric | Desktop sample on `/et` |
|--------|-------------------------|
| HTTP | **500** (error UI) |
| TTFB | ~35 ms (local) |
| FCP | ~156 ms (error text — not representative) |
| LCP | **Not measured** on real hero |
| CLS / INP | **Not measured** |
| JS transfer | ~380 KB |
| Font transfer | ~92 KB |
| CSS transfer | ~27 KB |
| Requests | ~24 |

**Mobile:** not separately instrumented in this run; assume hero image + blur motion worse on mid-tier phones → keep risk **MEDIUM**.

---

## Final scores (restated)

- **Bloat:** **MODERATE BLOAT** — lean deps and solid RSC usage, but shared JS (Sentry/Supabase), full client messages, homepage client job cards, hero asset/motion weight, and leftover portal/landing dead ends.
- **Public launch performance risk:** **MEDIUM** — fixable before launch with i18n splitting, Sentry/image/homepage card work; not a “rewrite” situation, but not LOW until green-path vitals are proven.
