# Kvalifits — current-state audit

**Audit date:** 18 August 2026  
**Scope:** repository as inspected (application code, migrations, scripts, messages). No production database dump was available.  
**Method:** route + UI + table + RLS + server/client wiring. A component existing is not treated as proof that the flow works.  
**Constraint:** no application code, migrations, or refactors were changed for this audit. This file is the only deliverable.

**How to read status marks**

| Mark | Meaning |
| --- | --- |
| DONE | Route, UI, persistence, and wiring exist and are connected in code |
| PARTIAL | Some of the chain exists; a required piece is missing, demo-only, or not enforced |
| MISSING | No connected implementation found |
| BROKEN | Implemented path that can fail, contradict itself, or leak/bypass in code |
| Not confirmed | Cannot be proven from this repo (especially remote Supabase apply state) |

---

## Executive summary

### What is already strong

- Public site, ET/EN/RU routing (`localePrefix: always`), job search, job detail, company pages, and legal pages exist as a coherent App Router product.
- Job search filtering, sorting, and pagination are **SQL RPC** (`search_published_jobs`), not browser-side, with page size 20 and match-sort cap 200.
- Matching is a real server TypeScript model (`MATCH_MODEL_VERSION = 8`) with documented weights. Age, disability, health, and work capacity are **not** score inputs. Expired certificates do not count.
- In-app apply, duplicate-application prevention (partial unique index), withdrawal, employer applicant inbox, pipeline statuses, internal notes, and match explanation (lazy) are wired.
- Saved jobs are table + RLS + card/detail/page.
- Certificate private bucket, verification statuses, admin review, and seeker field-lock trigger exist in migrations.
- Company verification is trigger-locked against self-verify; admin UI can set status.
- SEO basics exist: titles, canonical, hreflang, sitemap, robots, JobPosting JSON-LD, noindex on closed jobs and filter URLs.
- Account export and deletion APIs exist.
- Cookie banner gates Vercel Analytics.
- Production `next build` succeeds (Next.js 16.2.3 TypeScript check inside the build).
- Recent mobile composition work is documented in `docs/mobile-ux-audit.md`.

### What is partially built

- Auth is complete for register/login/logout/forgot/reset, but email verification has **no resend route**, blocked users are **not** checked on login or `/api/*`, and middleware **only refreshes the session**.
- Seeker onboarding covers a large profile, but completeness is a hard gate, `completion_percent` is never updated, education history is missing, and work capacity is stored but unused for matching (by design).
- Employer onboarding is one-owner company profile; verification is **manual admin**, not Äriregister. No team members. `UNIQUE(owner_user_id)` is **not** in migrations (onboarding comments assume it).
- Job create **always publishes**; draft exists only as unpublish/archive after the fact. No preview, no duplicate, no structured benefits, no separate duties field.
- Saved searches persist filters and frequency; **email/cron delivery is explicitly off**.
- Seeker “notifications” page is saved searches only — **no `notifications` table**.
- Employer messages route is a stub.
- Admin covers users, employers, jobs, reports, moderation, MFA setup — **no audit-log reader**, first admin still requires a DB role write.
- Pricing page exists for employers; publish is still free; no payment provider.
- Legal operator identity is all `null` (intentional pre-launch placeholders).
- Localization is broad via `messages/*.json`; some hardcoded strings and legal TS files remain.

### What is missing

- In-app notification inbox, unread counts, interview invitations/calendar/Teams, job-alert delivery, status-update emails, certificate-result emails.
- Dedicated education history, job benefits field, job preview, job duplicate.
- Email verification resend UI/API.
- Automated company registry verification.
- Multi-user employer orgs.
- Automated tests (unit / integration / E2E / Playwright / RLS suite in CI).
- Error monitoring (Sentry or similar).
- Stripe or any checkout.

### What is currently risky

- **Blocked users can still log in and call APIs** (`is_blocked` is only used in `getRoleAndNextPath`, not login or `/api`).
- **CVs/PDFs live in the public `avatars` bucket** (world-readable if the path is known).
- **Migration filename order** can overwrite the legal-representative consent lock (`seeker_date_of_birth_minor` after `legal_representative_consent`) and can fail `admin_rls_consistency` before `job_post_reports` exists. Whether production applied repair scripts is **Not confirmed**.
- **`job_applications` INSERT is not field-locked**; a client can set `match_score` on insert. Product apply uses the admin client, but PostgREST remains open.
- **Authenticated SELECT** of `employer_profiles` is full-row; only **anon** is column-limited.
- Apply path **inserts then sends Resend**; if email throws, the client gets 500 after a successful insert.
- **No automated tests.** Security regressions will not be caught in CI.
- Remote schema/RLS/cron (`pg_cron` archive) apply state is **Not confirmed**.

---

## 1. Project overview

| Item | Current state |
| --- | --- |
| Next.js | **16.2.3** (App Router, Turbopack). Build warns: `middleware` convention is deprecated in favour of `proxy` (not changed in this audit). |
| React | **19.2.4** |
| Styling | Tailwind **4**, Radix (dialog, scroll-area, separator, slot, visually-hidden), CVA, lucide-react |
| i18n | **next-intl 4.9** — locales `et` (default), `en`, `ru`; `localePrefix: always`; `localeDetection: false`; cookie `NEXT_LOCALE` |
| Auth | Supabase Auth email/password. `@supabase/ssr` **0.10.2**, `@supabase/supabase-js` **2.103.3**. Session refresh in `middleware.ts`. Role from `profiles.role` (JWT metadata is fallback only). Page-level gates via `getRoleAndNextPath` / `requireAdmin`. Matcher **excludes `/api`**. |
| Localization architecture | UI: `messages/{et,en,ru}.json`. Legal: `lib/content/legal/*.{et,en,ru}.ts`. Cookie copy: `lib/cookies/config.ts`. |
| Deployment assumptions | Origin `https://kvalifits.ee`. Vercel Analytics + Speed Insights. No `vercel.json` in repo. Env via `.env.local` (not audited for secrets). |
| Database | 62 SQL files under `supabase/migrations/`. Many `supabase/scripts/fix-*.sql` repair copies. **Production apply of all 62 is Not confirmed.** |

### Main routes (locale prefix `/{et\|en\|ru}`)

**Public:** `/`, `/tood`, `/tood/[id]`, `/ettevotted`, `/ettevotted/[slug]`, `/toootsijatele`, `/tooandjatele`, `/kontakt`, `/privaatsus`, `/tingimused`, `/kupsised`, `/andmekaitse`, `/ettevote`

**Auth:** `/auth/login`, `/register`, `/forgot-password`, `/reset-password`, `/mfa`, `/auth/callback`, `/auth/logout`

**Seeker:** `/onboarding/seeker`, `/account/seeker`, `/matches`, `/applications`, `/saved`, `/notifications`, `/profile`, `/certificates`

**Employer:** `/onboarding/employer`, `/account/employer`, `/jobs`, `/jobs/new`, `/jobs/[id]/edit`, `/jobs/[id]/applicants`, `/jobs/[id]/applicants/[applicationId]`, `/candidates`, `/messages` (stub), `/hinnakiri` (employer-only, noindex)

**Admin:** `/admin`, `/moderation`, `/jobs`, `/employers`, `/users`, `/reports`, `/security`

**Other:** `/blocked`, `/onboarding` (role router)

**API:** login, register, forgot-password, job-applications, job-reports, jobs/facets, jobs/match-explanation, certificates/signed-url, account delete/export, admin delete/moderation

### Important shared components

Navbar, PublicSiteShell, AuthShell, AccountCalmShell, AccountSiteShell, AdminShell, JobCard, JobsSearch, JobFilterPanel, JobApplyForm, FitScoreExplain, CookieConsent, LanguageSwitcher, Logo, portal background.

### Legacy / debt

| Item | Notes |
| --- | --- |
| `components/sections/SmartMatching.tsx` | **Unused.** Only Framer Motion consumer in the repo. |
| `lib/content/landing.et.ts` + `getLandingContent` | **Unused** (homepage uses `messages/*.json`). |
| `components/jobs/job-filters-config.ts` | Deprecated re-export of `jobSearchFacets`. |
| Duplicate employer routes | `/jobs/[id]/applications` redirects to `/applicants`. Nav maps both “overview” and “company” to `/account/employer`. |
| Employer jobs listed twice | Overview + `/account/employer/jobs`. |
| `FORCE ROW LEVEL SECURITY` | **Never set** in migrations. |
| Repair scripts vs migrations | Parallel `supabase/scripts/fix-*.sql` imply remote drift is expected. |

---

## 2. Public homepage (`/{locale}`)

Shell: `Navbar` (layout) → `Hero` (search + match mockup) → `WhyKvalifits` → `Audience` (seeker + employer) → `FinalCTA` → `Footer`. `LoginAnchor` is present.

| Area | Status | Notes |
| --- | --- | --- |
| Navbar | DONE | Role-aware via `CurrentAuthProvider` |
| Hero | DONE | Real search form; quick filters from live published jobs (`getHeroQuickFilters`) |
| Job search | DONE | Submits to `/tood` with query/filters |
| Matching preview | PARTIAL | **Demo-only:** `DEMO_SCORE = 87`, `DEMO_FILLED = 8`, `DEMO_TOTAL = 10` in `HeroContent.tsx`. Not live matching. |
| Job seeker section | DONE | Audience seeker steps |
| Employer section | DONE | Audience employer preview; decorative **6/10** bars (not live) |
| Benefits | DONE | `WhyKvalifits` |
| Pricing references | PARTIAL | Copy/kicker only. Full `/hinnakiri` is employer-auth + noindex. Publish is still free. |
| Final CTA | DONE | |
| Footer | DONE | Legal + language |
| Responsive | PARTIAL | Recent mobile repair; remaining notes in `docs/mobile-ux-audit.md` (wordmark crop, RU CTA tightness, two sticky bars) |
| ET/EN/RU | DONE | Homepage copy from `messages/*.json` |
| Accessibility | PARTIAL | Reduced motion on hero ring; decorative mockup; focus-visible globally. Full a11y audit not executed in a browser for this task. |
| Performance | PARTIAL | Portal/blur hidden below `lg`. Hero match glow off on small screens. Framer Motion not on homepage (dead `SmartMatching`). |

**Placeholder / demo / fake stats**

- Hero match ring 87% and 8/10 requirements — hardcoded demo.
- Audience employer bars 6/10 — decorative.
- No live inventory counts on the homepage (Not confirmed that any numeric marketing stats are live).

**Visual inconsistencies:** landing uses portal background; inner pages use calmer shells. Intentional, not broken.

---

## 3. Navigation

| Surface | Status | Notes |
| --- | --- | --- |
| Logged-out navbar | DONE | `GUEST_NAV`: jobs, companies, for seekers, for employers |
| Seeker navbar | DONE | Desktop `SEEKER_NAV`; mobile sheet `SEEKER_MOBILE_NAV`; bottom nav `SEEKER_BOTTOM_NAV` |
| Employer navbar | DONE | Jobs, candidates, messages (stub), company (= overview URL) |
| Admin navigation | DONE | Top `ADMIN_NAV` + `AdminSubnav` |
| Mobile menu | DONE | Radix sheet; seeker certificates omitted from mobile sheet by design |
| Language selector | DONE | ET/EN/RU, no flags |
| Active route | DONE | `navIsActive` in Navbar |
| Logout | DONE | POST `/{locale}/auth/logout` (`signOut` global, local fallback) |
| Role switching | DONE | `useCurrentAuth()` from layout `getCurrentAuth` |
| Employer overview vs company | PARTIAL | Two labels, same href `/account/employer` |
| Messages | PARTIAL | Nav item exists; page is “area not implemented” |

Middleware does **not** hide nav by role; UI does.

---

## 4. Authentication

| Flow | Status | End-to-end in code |
| --- | --- | --- |
| Registration | DONE | `/api/auth/register` — role `seeker` \| `employer` only; terms required; rate limited |
| Login | DONE | `/api/auth/login` — rate limited; rejects unverified email |
| Logout | DONE | |
| Email verification | PARTIAL | Enforced on login + `getRoleAndNextPath` (signs out locally). **No resend route** (rate-limit action `resend_verification` exists unused). Supabase Auth templates: **Not confirmed** if customized ET/EN/RU |
| Forgot password | DONE | `/api/auth/forgot-password` |
| Reset password | DONE | `/auth/reset-password` |
| Role selection | DONE | Register body `seeker`/`employer`. Profiles trigger blocks non-admin self-assign of `admin` |
| Protected routes | PARTIAL | Page-level redirects. Middleware does not check role/blocked. `/api/*` excluded from middleware |
| Redirect logic | DONE | `getRoleAndNextPath` → onboarding / account / blocked / login |
| Blocked users | PARTIAL / **BROKEN for APIs** | Page redirect `/blocked`. **Login does not check `is_blocked`. No `/api` handler checks `is_blocked`.** |
| Auth loading | PARTIAL | `CurrentAuthProvider` hydrates from server; ESLint flags setState-in-effect |
| MFA | PARTIAL | Admin TOTP setup + challenge. Enforced only if `ADMIN_MFA_ENFORCE=1` |

**Duplicate auth fetches:** `getAuthUser` / `getCurrentAuth` are `React.cache()`. Account pages still call `supabase.auth.getUser()` **again**, then `getRoleAndNextPath` (cached). Typical account request: **2 getUser calls** (layout cached + page uncached). Not 1.

---

## 5. Job seeker onboarding

**Routes:** `/onboarding/seeker`, later `/account/seeker/profile`  
**Tables:** `seeker_profiles`, `seeker_workplace_needs`, `seeker_work_capacity`, `seeker_certificates`

| Field | UI | DB | Notes |
| --- | --- | --- | --- |
| Basic profile (name, title, phone, about, avatar) | DONE | DONE | Completeness requires avatar upload, name, title, phone, about ≥ 40 chars |
| Location | DONE | DONE | Profile location + preferred locations |
| Birth date | DONE | DONE | Required for completeness; derives minor flags |
| Work preferences | DONE | DONE | `pref_*` columns |
| Desired workload / hours | DONE | DONE | weekly min/desired/max, full/part time |
| Availability | PARTIAL | PARTIAL | Profile hints; **apply-time** start date is application-specific |
| Salary expectation | PARTIAL | DONE | Free-text `salary_expectation` on profile; structured again on apply |
| Languages | DONE | DONE | text[] + taxonomy ids |
| Experience | DONE | DONE | `experience_level` + background flags + duration years |
| Education | MISSING | MISSING | Only `exp_is_student` flag. No institution/degree history |
| Skills | DONE | DONE | ≥ 2 required for completeness |
| Certificates | DONE | DONE | Optional for completeness |
| Workplace preferences / needs | DONE | DONE | Private table; opt-in share on apply |
| Work capacity | DONE | DONE | Private; **not** used in matching or employer discovery |
| Profile completeness | PARTIAL | PARTIAL | `seekerCoreComplete()` is the real gate. `completion_percent` inserted as **0 and never updated** |

**Validation:** client + completeness function. Age cannot be future (trigger). Minor 16–17 need learning-obligation status.

**UX:** completeness is strict (photo + long about + 2 skills) before search ranking / apply eligibility. Duplicate salary (profile text vs apply structured). Certificates optional but still a dedicated nav item.

---

## 6. Employer onboarding

| Item | Status |
| --- | --- |
| Employer registration | DONE (role on sign-up) |
| Company profile | DONE — name, email, description ≥ 40, location, industry |
| Company verification | PARTIAL — `unverified` / `under_review` / `verified`; **manual admin**; no Äriregister |
| Company logo | DONE — stored under public `avatars` `{uid}/employer-logo/…` (not a logos bucket) |
| Company description | DONE |
| Public vs private fields | PARTIAL — public view `employer_public_profiles` limits columns; **authenticated** still `GRANT SELECT` on full `employer_profiles` |
| Members / owners | MISSING — one `owner_user_id`; no team |
| Own-company only | DONE in RLS (owner policies + verification trigger). **UNIQUE(owner_user_id) not found in migrations** — race could create two rows; onboarding *comments* assume uniqueness |

---

## 7. Job creation / editing

**Routes:** `/account/employer/jobs/new`, `/account/employer/jobs/[id]/edit`, list on `/account/employer/jobs`

| Lifecycle | Status |
| --- | --- |
| Draft create | MISSING — `EmployerNewJobForm.saveDraft` always `status: "published"` (including “payment” mode) |
| Unpublish → draft | DONE — list `setStatus(..., "draft")` |
| Edit | DONE |
| Preview | MISSING (landing `EmployerProductPreview` is marketing demo) |
| Publish | DONE — free; no Stripe |
| Close / expire | DONE — archive action; `expires_at` / deadline; cron `private.archive_expired_job_posts` **if pg_cron applied (Not confirmed in prod)** |
| Delete | DONE — owner delete RLS |
| Duplicate | MISSING |

| Field | Status | Structured vs free-text |
| --- | --- | --- |
| Title | DONE | text |
| Company | DONE | FK `employer_profile_id` (owner’s company) |
| Location | DONE | text |
| Industry | DONE | taxonomy `industry_id` when catalog available |
| Profession | DONE | taxonomy `profession_id` required when catalog available |
| Salary | DONE | structured mode/min/max/tax/period/currency |
| Workload | DONE | `job_type` enum-like + optional weekly/daily hours |
| Employment type | DONE | `job_type` (full-time / part-time / contract / internship) |
| Work arrangement | DONE | `work_type` (on-site / hybrid / remote) |
| Description | DONE | free-text |
| Duties | PARTIAL | **No duties column.** Detail page shows `description` under “duties” and `short_summary` as summary |
| Required / preferred requirements | DONE | `job_requirements` with priority; also `requirement_lines` |
| Skills | DONE | taxonomy + leftover text |
| Certificates / licences | DONE | taxonomy ids + free-text `certificate_requirements` |
| Languages | DONE | taxonomy / text[] |
| Experience | DONE | `experience_level_required` including `not_required` |
| Schedule | DONE | shift times, night, hazardous |
| Benefits | MISSING | not in insert payload |
| Application deadline | DONE | required for publish |

`suitable_for_ages_16_17` is **derived** in the form, not a manual toggle. **No DB trigger locking that column** (comment only).

---

## 8. Job search (`/tood`)

**Where filtering / sorting / pagination happen:** **SQL RPC** `search_published_jobs` (SECURITY INVOKER, RLS). Fallback PostgREST path in `loadPublishedJobSearch.ts` is weaker if RPC is missing.

**Match sort:** RPC fetches up to **200** rows, scores in **server TypeScript**, then slices page 20.

| Capability | Status | Notes |
| --- | --- | --- |
| Keyword | DONE | Title, summary, skills, **company_name ILIKE** |
| Company search | PARTIAL | Keyword only; **no company facet** |
| Profession | PARTIAL | Title facet, not a dedicated profession facet |
| Location | DONE | Facet + SQL |
| Industry / domain | DONE | |
| Salary | DONE | Buckets in SQL |
| Workload | DONE | `jobType` facet; **no weekly-hours slider** |
| Employment type | DONE | `jobType` |
| Work arrangement | DONE | `workType` |
| Experience | DONE | |
| Skills | DONE | |
| Certificates | DONE | |
| Languages | DONE | |
| URL query state | DONE | |
| Sorting | DONE | SQL except match sort (TS after RPC) |
| Pagination | DONE | SQL offset; page size **20** |
| Facet counts | DONE | Same RPC payload |
| Active filters / reset | DONE | |
| Mobile filters | DONE | Sheet |

**Numbers**

| Knob | Value |
| --- | --- |
| Page size | **20** (`JOB_SEARCH_PAGE_SIZE`) |
| RPC max page size | **200** (`least(..., 200)`) |
| Match-sort candidate cap | **200** |
| Facet catalog cap (client) | **40** (`FACET_CLIENT_CATALOG_LIMIT`) |
| Facet search API limit | **20** |
| Initial visible facet options | **6** |
| Keyword debounce | **180 ms** (`JobsSearch`) |
| Facet typeahead debounce | **280 ms** |

---

## 9. Job result cards

`components/jobs/JobCard.tsx` — data from `mapPublishedJobToCard` (published rows), not demo.

| Element | Status |
| --- | --- |
| Title | DONE |
| Company | DONE (link if slug) |
| Logo | DONE (letter fallback) |
| Location | DONE |
| Salary | DONE when structured salary present |
| Work type / arrangement | DONE (badges) |
| Published date | DONE (relative) |
| Deadline | DONE |
| Match score | DONE for seekers with complete profile; live `calculateJobMatch`, not demo |
| Requirements count | DONE when match present (`FitScoreExplain` collapsed counts) |
| Save button | DONE (seeker / guest can attempt; guests cannot persist) |
| Verified company badge | DONE |
| Responsive | DONE (mobile order documented in mobile audit) |

List-card **match “why”** is lazy (`/api/jobs/match-explanation`). Score on the card is real.

---

## 10. Job detail (`/tood/[id]`)

| Section | Status |
| --- | --- |
| Title / company | DONE |
| Salary | DONE |
| Location / workload / arrangement | DONE |
| Description / duties | PARTIAL — summary + description-as-duties |
| Required / preferred requirements | DONE |
| Skills / certificates / languages | DONE |
| Benefits | MISSING |
| Deadline / published | DONE |
| Verified employer | DONE |
| Save | DONE |
| Report | DONE (`job_post_reports` + `/api/job-reports`) |
| Apply | DONE (in-app panel) |
| Match panel | DONE (seeker; eligibility banner) |
| Similar jobs | DONE (`SimilarJobsSection`) |
| JSON-LD | DONE when listing accepts applications |
| Closed listing | PARTIAL — `NOINDEX_FOLLOW`; still viewable |

---

## 11. Matching system

**Where:** `lib/matching/calculateJobMatch.ts` — **server TypeScript** (also imported on apply client for live preview). **Not SQL.**  
**Version:** `MATCH_MODEL_VERSION = 8`  
**Role:** advisory ranking only (`MATCH_SCORE_ROLE`); must not auto-reject.

**Weights (sum 100)**

| Dimension | Weight |
| --- | --- |
| Skills / keywords | 17 |
| Certificates | 14 |
| Mandatory requirements | 18 |
| Recommended requirements | 3 |
| Experience | 10 |
| Location | 7 |
| Languages | 6 |
| Work mode | 5 |
| Arrangement | 5 |
| Workload | 5 |
| Work hours | 5 |
| Availability | 5 |

| Check | Result |
| --- | --- |
| Age negatively scored | **No** — not an input |
| Disability / health / work capacity negatively scored | **No** — work capacity never loaded for matching |
| Optional experience incorrectly reducing score | Open-to-beginners jobs (`not_required` / `entry`) are handled; zero-year background is explicit. Residual risk if a senior job is compared to first-job seekers (intended) |
| Expired certificates | Excluded (`isCertificateValidForMatching`) |
| Night / hazardous | **Eligibility only**, not score |
| Availability on search/list | **Always ~0.55** because apply answers are **not** passed into list scoring |
| Availability on apply | Uses structured answers (client preview + server recompute on submit) |

**List vs detail**

- List: score + optional collapsed X/Y counts; “why” **lazy**, cap **8** criteria (`MATCH_EXPLANATION_CRITERIA_CAP`).
- Search extra calls: **1×** `get_job_match_inputs` RPC per seeker search (up to 200 job ids), plus 1 search RPC. Explanations: **1 HTTP per opened card**.

**Seeker matches page** (`/account/seeker/matches`): loads up to **80** published jobs, ranks, shows **40**. Weaker than `/tood` match sort (no full SQL search pipeline).

---

## 12. Saved jobs

| Item | Status |
| --- | --- |
| Table | DONE `saved_jobs` |
| Unique | DONE `(seeker_user_id, job_post_id)` |
| RLS | DONE own seeker; employers cannot see savers; anon no grants |
| Save / remove | DONE |
| Job card / detail | DONE |
| Saved jobs page | DONE `/account/seeker/saved` |
| Expired saved jobs | PARTIAL — row remains; listing lifecycle still applies when opened |
| Mobile | DONE |

---

## 13. Saved searches / job alerts

| Layer | Status |
| --- | --- |
| UI | DONE — `/account/seeker/notifications`, `JobSearchAlertsButton` |
| DB | DONE `saved_job_searches` (fingerprint unique per seeker, frequency, min match, locale) |
| Filter persistence | DONE |
| Notification preferences | PARTIAL — frequency stored; copy tells user delivery is **not** live when flag is false |
| Email alerts | **UI + DB only.** `SAVED_SEARCH_ALERTS_DELIVERY_ENABLED = false`. No cron. |
| In-app alerts | MISSING (no notifications table) |
| Seekers can UPDATE `last_notified_at` | Present in schema — worker cursor is client-writable (delivery unused today) |

**Do not describe this as working alerts.** Persistence only.

---

## 14. Application flow

**UI:** `JobApplyForm` → POST `/api/job-applications` (admin client insert).

| Step | Status |
| --- | --- |
| Apply button | DONE |
| Duplicate prevention | DONE — partial unique index excluding `withdrawn`; API 409 |
| Salary / start / notice / hours / interview pref / note | DONE — application-specific (`application_answers`) |
| Final review | DONE (panel mode `review`) |
| Submit / success | DONE |
| Withdraw | DONE |

**From profile (not re-typed if present):** name, contact, skills, certs, languages, CV URL, completeness, eligibility (age/hours). Salary text may **prefill** structured apply fields (`quickApply.ts`).

**Asked again on apply (intentional job-specific):** salary numbers, start date, notice, weekly hours, schedule fit, interview format, optional note.

**Risk:** insert succeeds then Resend throws → HTTP 500; retry hits unique index unless first row was withdrawn. Employer may have the application with no email.

---

## 15. Application status

**Employer internal** (`APPLICATION_PIPELINE_STATUSES`): new, reviewing, interview, interview_2, offer, hired, rejected, withdrawn — **DONE** (UI select + DB `status`; audit table `job_application_status_events`).

**Seeker-facing** (`seekerFacingStatus.ts`): sent, reviewing, interview (collapses interview_2), offer, hired, process ended (rejected **and** withdrawn) — **DONE**.

**Timestamps:** `status_updated_at` / `updated_at` / `created_at` + status events.

**Authorization:** seeker updates own row but column grants limit seeker UPDATE to `status, updated_at, cover_letter, application_answers`. Employer updates own jobs’ applications. **UPDATE field trigger** locks match/consent/identity.

**Internal notes:** `job_application_internal_notes` — employer-only RLS. Seekers must not see them (policies intend this; **GRANT/REVOKE Not confirmed** on that table).

---

## 16. Employer candidate management

**Two products:**

1. **Applicants per job** (`/account/employer/jobs/[id]/applicants`) — **fully functional** for pipeline, match %, salary/availability from answers, cert names, filters/sort **in the browser** after server load, detail drawer, notes, status history.
2. **Discovery** (`/account/employer/candidates`) — **partially connected**: server loads discoverable `profile_visible` seekers (certs limit **500**, B-licence profiles **300**), then **client-side** filter/sort. Not an ATS for a single job. No match % against a selected job on this page (Not confirmed as job-scoped).

Not a UI-only prototype; not a full ATS.

---

## 17. Interview flow

| Item | Status |
| --- | --- |
| Invitation / datetime / type / Teams / onsite / phone | MISSING as a product |
| Candidate response | MISSING |
| Notifications | MISSING |
| Interview preference string on apply | DONE (preference only; comment: no calendar/Teams integration) |

Absence is a gap vs a full hiring suite, not a broken feature.

---

## 18. Certificate system

| Item | Status |
| --- | --- |
| Upload | DONE private `certificates` bucket |
| Metadata | DONE name, issuer, dates, taxonomy id |
| Storage / private access | DONE — path in DB, signed URL API |
| Verification | DONE admin; seeker cannot set verified (trigger + stash on delete/reinsert) |
| Statuses stored | `submitted`, `under_review`, `verified`, `rejected` |
| Expired | **Derived** from `certificate_valid_until`, not a stored status |
| Admin review | DONE moderation / certificates path |
| Employer visibility | DONE for applicants / discovery (verification fields selected) |
| Seeker edit of protected fields | Blocked on UPDATE/INSERT by trigger (if that migration is applied) |

---

## 19. Company verification

| Status | DB |
| --- | --- |
| unverified | default |
| checking | `under_review` |
| verified | `verified` + `company_verified` boolean synced by trigger |

Admin UI: `/admin/employers`. Public badge when verified. Employers cannot self-set verification (trigger). Source is `manual` when admin verifies. **No registry API.**

---

## 20. Admin

| Tool | Status |
| --- | --- |
| Users (block / unblock / hard delete) | DONE |
| Employer verification | DONE |
| Certificate verification | DONE (moderation) |
| Job reports | DONE `/admin/reports` |
| Job moderation | DONE |
| Audit log writes | PARTIAL — table `admin_audit_log`; **no admin UI to read it** |
| Permissions | PARTIAL — `profiles.role = admin`; MFA optional |
| First admin | **Requires direct DB** (`profiles.role = 'admin'`) |

**Still likely to need Supabase SQL:** creating the first admin; applying repair scripts; inspecting `admin_audit_log`; confirming cron; taxonomy seed if empty (**Not confirmed** whether taxonomy is seeded in prod).

---

## 21. Notifications (in-app)

| Item | Status |
| --- | --- |
| Table / model | **MISSING** — no `notifications` table |
| RLS / unread / mark read | MISSING |
| Seeker notifications route | PARTIAL — saved searches UI only |
| Types (application, interview, cert, match, deadline) | MISSING as in-app events |

---

## 22. Email

| Email | Status | Provider |
| --- | --- | --- |
| Verification | PARTIAL | **Supabase Auth default templates** — customization ET/EN/RU **Not confirmed** |
| Password reset | PARTIAL | Same |
| Application confirmation to seeker | MISSING | — |
| New applicant to employer | DONE if `RESEND_API_KEY` + `EMAIL_FROM` | Resend (`lib/email/resend.ts`) |
| Status update | MISSING | |
| Interview invitation | MISSING | |
| Certificate verification result | MISSING | |
| Job alerts | MISSING (flag false) | |

Default `EMAIL_FROM` fallback in code: `no-reply@kvalifits.ee`. Whether that domain is verified in Resend: **Not confirmed**.

---

## 23. Mobile (code / route level)

Recent pass documented in `docs/mobile-ux-audit.md`. This audit does not re-run a device lab.

| Surface | Code-level notes |
| --- | --- |
| Homepage | Portal off below `lg`; stacked hero |
| Navbar | Flush bar below 1024px; 44px language trigger |
| Job search / filters | Sidebar desktop; sheet mobile |
| Cards | Stacked layout below `lg`; tags hidden on small screens |
| Job detail | Sticky apply bar + seeker bottom nav (stacked, not overlapping by CSS vars) |
| Apply | Custom sheet: **no full focus trap** (mobile audit) |
| Seeker / employer dashboards | Cards/lists; admin tables are **horizontal scroll** (`AdminSubnav` `overflow-x-auto`) — desktop-ish tables |
| Pricing | Simple stacked card |
| Auth | Forms in AuthShell |

**Remaining obvious risks:** two sticky regions; apply keyboard covering fields; admin tables on phones; RU label tightness; wordmark `object-cover` crop.

---

## 24. Localization (ET / EN / RU)

| Item | Status |
| --- | --- |
| next-intl messages | DONE for most UI |
| Fallback | Missing locale → `et` (`i18n/request.ts`) |
| Legal | Separate TS per locale (not JSON) |
| Hardcoded | Company 404/missing metadata: `"Ettevõte \| Kvalifits"` always ET. Job 404 uses locale ternaries in places. |
| Mixed-language routes | Paths are Estonian (`/tood`, `/tooandjatele`) for all locales by design |
| Admin / system states | Mostly translated; some API error codes surface as keys |
| Unused keys | **Not confirmed** (no unused-key checker) |
| Naturalness | Not a copy-edit pass; glossary exists in `docs/ux-copy-glossary.md` |

---

## 25. UX copy inconsistencies

Canonical glossary: **tööpakkumine / job / вакансия**, **sobivus**, **kontrollitud**.

**Still inconsistent or leftover**

- Email key `applicationEmailMatchScore` (developer key; user-facing string may still say “match”).
- English privacy line uses “match scores” in work-capacity explanation (`messages/en.json` `workCapacityPrivacy`).
- Employer nav and overview both labelled as company/overview for the same URL (IA, not synonym).
- Seeker notifications vs saved-search alerts share the word “teavitus” while no inbox exists.

No remaining `töökuulutus` in `messages/et.json` (grep). `verifitseeritud` not in messages (grep).

---

## 26. Accessibility (critical from code)

| Issue | Severity |
| --- | --- |
| Apply sheet is custom, not Radix — **no full focus trap** | Critical on mobile apply |
| Job card overlay `<Link>` covering the card plus inner links (company, save) | Keyboard/hit-area complexity |
| Admin tables: horizontal scroll, small controls | Mobile a11y |
| Decorative homepage match mockup may look like real results | Comprehension |
| `FitScoreExplain` ESLint **refs during render** | Potential update bugs |
| Focus-visible + reduced-motion **do exist** globally | Positive |
| Contrast of `text-white/45`–`/62` on dark | May fail WCAG in places — **Not confirmed** with a contrast tool |
| Tap targets recently raised to ~44px in nav/filters | Positive |

No axe/Playwright a11y suite.

---

## 27. Security / RLS

`FORCE ROW LEVEL SECURITY` is **not** used. Table owner can bypass RLS. App uses anon/authenticated + service role for admin APIs.

| TABLE | RLS enabled in migrations | SELECT | INSERT | UPDATE | DELETE | ADMIN | RISK |
| --- | --- | --- | --- | --- | --- | --- | --- |
| profiles | YES | own; admin list | own (role constrained) | own; privilege cols trigger-locked | own | YES | Privilege trigger exists. First admin is a DB write. |
| seeker_profiles | YES | own; employer applicant; employer discovery if `profile_visible` | own | own **all columns** including `discovery_*`, consent | own | via policies | **Seekers can UPDATE discovery flags and possibly consent** if later trigger overwritten |
| seeker_certificates | YES | own; employer limited; admin | own (status forced submitted) | own (verification locked) | own (stash) | YES | Depends on trigger apply |
| seeker_workplace_needs | YES | own | own | own | own | Not confirmed grants | **GRANT/REVOKE Not confirmed** |
| seeker_work_capacity | YES | own | own | own | own | Not confirmed grants | Intended private; **GRANT Not confirmed** |
| employer_profiles | YES | own; published-job rows; admin | own | own (verification locked) | no client delete | YES | **Anon column-limited; authenticated full-row SELECT** |
| job_posts | YES | published for public; owner; admin | owner | owner | owner | YES | |
| job_applications | YES | seeker own; employer own jobs; admin | seeker own **all columns** | column-limited + trigger | not typical | YES | **INSERT not field-locked (`match_score`)** |
| job_application_internal_notes | YES | employer own | employer | employer | employer | | **GRANT Not confirmed** |
| saved_jobs | YES | seeker | seeker | n/a | seeker | | Strong |
| saved_job_searches | YES | seeker | seeker | seeker (incl. `last_notified_at`) | seeker | | Cursor writable |
| job_post_reports | YES | admin; insert reporter | authenticated | admin | | | Filename order vs `admin_rls_consistency` |
| admin_audit_log | YES | admin | service/admin | | | YES | No UI |
| taxonomy_* | YES | public read typical | | | | | |
| notifications | — | — | — | — | — | — | Table missing |

**Protected columns users may still modify (code-level):**

- `seeker_profiles.legal_representative_consent_status` if DOB migration overwrote the consent trigger.
- `seeker_profiles.discovery_*` via normal UPDATE (sync trigger exists if applied).
- `job_applications.match_score` on **INSERT**.
- `saved_job_searches.last_notified_at`.

---

## 28. Storage security

| Bucket | Public? | Limits | Ownership | Notes |
| --- | --- | --- | --- | --- |
| `avatars` | **YES** | 10 MiB; jpeg/png/webp/gif/**pdf** | first path segment = `auth.uid()` | Avatars + **employer logos** + **CVs** (`{uid}/cv/…`). Public read. **CV PDFs are world-readable if URL known.** |
| `certificates` | **NO** | 10 MiB; images + pdf | owner prefix; admin select | Signed URLs via `/api/certificates/signed-url` |
| Logos bucket | MISSING | — | — | Logos reuse `avatars` |

MIME + size set on buckets in migrations. Overwrite: owner can update own prefix. Production bucket settings: **Not confirmed**.

---

## 29. Database integrity

| Topic | State / risk |
| --- | --- |
| FKs | Applications → jobs/users; saved jobs cascade; workplace needs PK = user |
| Unique applications | Partial unique **active** (not withdrawn) |
| Unique saved jobs | YES |
| Unique saved searches | fingerprint per seeker |
| Unique employer owner | **Not in migrations** |
| Unique company slug | YES (partial unique on `public_slug`) |
| Enums / checks | Many CHECKs (roles, verification, frequency, work capacity) |
| Cascade | Job delete cascades applications/saves |
| Timestamps | created_at / updated_at generally present |
| Cron archive | Migration exists; **prod pg_cron Not confirmed** |
| Same-day migration order | `admin_rls_consistency` alphabetically **before** `job_post_reports` — sequential apply may **fail** |
| Consent trigger order | `legal_representative_consent` then `seeker_date_of_birth_minor` **replaces** the function **without** consent lock |

---

## 30. Performance (current code)

| Topic | Current |
| --- | --- |
| Jobs per search request | 20, or 200 when sorting by match |
| Filter/sort/page | SQL RPC (except match sort scoring in TS) |
| Facet counts | Included in search RPC |
| Match query count | 1× `get_job_match_inputs` per seeker search |
| Duplicate auth | Extra `getUser` on account pages |
| Dynamic routes | Almost all `ƒ` dynamic; sitemap/robots/manifest static |
| Heavy client | `JobsSearch`, apply form, employer lists, candidate discovery |
| Framer Motion | Unused `SmartMatching` only |
| Blur | Portal/ambient on desktop; reduced on mobile |
| Image priority | Logos `loading="lazy"` on cards. Hero LCP **Not confirmed** in this pass |
| Caching | Match explanation `Cache-Control: private, no-store`. Search is request-time |
| Employer candidates | Up to 500 cert rows + 300 profiles then **client filter** |
| Seeker matches page | 80 jobs fetched |
| Request-path writes | Search does not write. Archive cron is not request-path. Apply writes + email |

Compared with earlier known issues (unbounded client filter of all jobs): **search is now SQL-paginated**. Match sort still pulls 200. Discovery and matches pages are still relatively heavy.

---

## 31. SEO

| Item | Status |
| --- | --- |
| Titles / descriptions | DONE `publicPageMetadata` |
| Canonical + hreflang | DONE (`x-default` → et) |
| Sitemap | DONE `app/sitemap.ts` (static paths + published jobs that accept applications) |
| robots.txt | DONE disallow auth/account/admin/onboarding/blocked/hinnakiri |
| noindex | DONE prefixes; filter query URLs `NOINDEX_FOLLOW`; closed jobs `NOINDEX_FOLLOW` |
| JobPosting JSON-LD | DONE |
| Company page metadata | PARTIAL — missing company hardcoded ET title |
| Expired jobs | noindex,follow; still in HTML |
| Query parameter indexing | Filter params noindex,follow |

---

## 32. Legal / pre-launch (technical consistency only — not legal advice)

| Item | State |
| --- | --- |
| Fake Kvalifits OÜ | **Not used as a filled legal entity.** `LAUNCH_OPERATOR` fields are `null`. Checklist tells implementers not to invent registry data. |
| Placeholders | Operator identity, planned pricing copy |
| Pricing / payment claims | Planned duration copy; **not charged**; no checkout |
| Privacy / terms links | DONE |
| Consent checkbox | Combined terms+privacy on register (`RegistrationConsentText`) |
| Marketing consent separation | **MISSING at signup.** Cookie marketing category exists but **inactive** (“not used”) |
| Account deletion / export | DONE APIs + privacy settings UI |
| Cookie consent | localStorage; gates analytics scripts |

Inconsistent with a commercial launch: empty operator identity, planned prices, publish free, combined legal checkbox, public CV bucket.

---

## 33. Analytics / monitoring

| Item | Status |
| --- | --- |
| Analytics | Vercel Analytics **after** analytics cookie consent |
| Speed Insights | Same gate |
| Error monitoring | **MISSING** (no Sentry/etc.) |
| Server logging | Ad hoc; no structured prod logger found |
| Query timing | **MISSING** as a product |
| Production alerting | **Not confirmed** (Vercel project settings outside repo) |

---

## 34. Testing

| Kind | Status |
| --- | --- |
| Unit / integration / E2E / Playwright | **MISSING** — no `*.test.*` / `*.spec.*`, no Playwright config |
| `package.json` scripts | `dev`, `build`, `start`, `lint`, `favicon:circular` — **no `test` or `typecheck`** |
| RLS negative tests | `scripts/rls-security-suite.mjs` exists (live Supabase, service role). **Not in CI.** Not run in this audit (needs secrets / remote). |
| i18n / mobile / a11y tests | MISSING |

**Commands that exist**

```bash
npm run lint
npm run build
npx tsc --noEmit   # not a project script; see QA results
npm start          # after build
node --env-file=.env.local scripts/rls-security-suite.mjs  # live RLS; not CI
```

`npm test` → **Missing script: "test"**.

---

## 35. Repo quality

| Item | State |
| --- | --- |
| Dead components | `SmartMatching.tsx`; unused landing content module |
| Duplicate helpers | Search facet deprecated re-export; duplicate job-applications create migrations historically |
| Old navbar / landing variants | SmartMatching unused; homepage is the current landing |
| Stale migrations / repair scripts | 62 migrations + many `fix-*.sql` |
| Unused translation keys | Not confirmed |
| TODO/FIXME | None in `*.ts/tsx` grep |
| TypeScript | `strict: true`. Production build TypeScript **passed**. Raw `tsc` failed on **stale** `.next/dev/types` (see QA) |
| Lint | **6 errors, 32 warnings** (see QA) |

---

## 36. End-to-end user journeys (from code)

### Seeker

| Step | Verdict |
| --- | --- |
| Register | WORKS |
| Create profile | PARTIAL — works but completeness gate is heavy; education missing; `completion_percent` unused |
| Add skills / certificates | WORKS (certs optional) |
| Search | WORKS (SQL) |
| Filter | WORKS |
| Understand match | PARTIAL — live score; list availability always mid; why is lazy |
| Save | WORKS |
| Apply | WORKS (email-after-insert risk) |
| Track application | PARTIAL — collapsed statuses; no interview invites; withdrawn+rejected look the same (“process ended”) |

### Employer

| Step | Verdict |
| --- | --- |
| Register | WORKS |
| Create company | WORKS (single owner; verify later) |
| Create job | PARTIAL — publishes immediately; no draft-create/preview/duplicate |
| Requirements | WORKS |
| Publish | WORKS (free; payment UI is a no-op path) |
| Receive candidates | WORKS if Resend configured; else insert still happens then 500 |
| Review match | WORKS on applicant inbox |
| Move through process | PARTIAL — status pipeline only; no interview product |
| Messages | MISSING (stub) |

---

## Prioritized issues

### P0 — blocks public beta / security / data integrity

| ID | Route / component / table | Current state | Problem | Recommended next step | Complexity | Product decision? |
| --- | --- | --- | --- | --- | --- | --- |
| P0-1 | `/api/*`, `/api/auth/login`, `profiles.is_blocked` | PARTIAL | Blocked users can authenticate and call APIs | Check `is_blocked` on login and in API auth helpers; revoke session on block | M | No |
| P0-2 | Storage `avatars` + `cv_url` | DONE but public | CVs/PDFs are publicly readable | Move CVs to a private bucket + signed URLs; stop allowing PDF in public avatars | M | No |
| P0-3 | `seeker_profiles` consent trigger vs `20260816_seeker_date_of_birth_minor.sql` | BROKEN if migrations applied in filename order | Later function can drop the lock that prevents self-`confirmed` consent | Confirm remote function body; re-apply consent lock (repair script exists) | S | No |
| P0-4 | `job_applications` INSERT | PARTIAL | Authenticated INSERT can set `match_score` / shared_profile | INSERT trigger or column grants mirroring UPDATE lock; keep server as only writer | M | No |
| P0-5 | `supabase/migrations` order (`admin_rls_consistency` vs `job_post_reports`) | RISKY | Fresh sequential apply may fail | Confirm remote migration history; do not assume all 62 applied | M | No |
| P0-6 | Remote RLS/cron/taxonomy | Not confirmed | Product may be running on a drifted schema | Dump remote policies vs migrations; apply missing repair scripts deliberately | L | No |
| P0-7 | POST `/api/job-applications` + Resend | BROKEN edge | Email failure after insert returns 500 | Send email after commit in a non-failing path or queue; return 201 if row exists | M | No |

### P1 — major product / UX before beta

| ID | Location | Current state | Problem | Next step | Complexity | Product decision? |
| --- | --- | --- | --- | --- | --- | --- |
| P1-1 | Saved searches | UI+DB | No alert delivery | Cron + Resend **or** hide frequency as “coming later” consistently | L | Yes (alerts vs not) |
| P1-2 | In-app notifications | MISSING | Nav “teavitused” is not an inbox | Build table+RLS+UI or rename nav to saved searches | L | Yes |
| P1-3 | Email verification resend | MISSING | Users stuck after missed mail | API + UI using existing rate-limit action | S | No |
| P1-4 | Job create draft/preview | MISSING | Cannot save unpublished draft from new form | `status: draft` save; preview route | M | Yes (draft UX) |
| P1-5 | Employer messages | Stub | Nav lies | Remove nav or ship messaging | S–L | Yes |
| P1-6 | Interview product | MISSING | Pipeline says “interview” with no invite | Keep status-only **or** add invitations | L | Yes |
| P1-7 | Authenticated `employer_profiles` SELECT | RISKY | Logged-in users can read private employer columns on published companies | Column grants for authenticated matching anon | M | No |
| P1-8 | UNIQUE owner_user_id | MISSING in SQL | Duplicate company rows possible | Unique constraint + backfill | S | No |
| P1-9 | Legal operator + pricing | Placeholders | Pre-launch identity/prices | Fill `LAUNCH_OPERATOR` only with real data; keep honest pricing | S | Yes (legal entity) |
| P1-10 | First admin | DB-only | No in-app bootstrap | Documented SQL runbook or one-time invite | S | Yes (who is admin) |
| P1-11 | Admin audit log UI | MISSING | Writes unused by operators | Simple admin table | M | No |
| P1-12 | List match availability | PARTIAL | Always mid weight without apply answers | Exclude availability from list score or persist profile availability | M | Yes |
| P1-13 | Marketing vs terms consent | PARTIAL | Single checkbox | Split marketing opt-in | S | Yes |
| P1-14 | Tests | MISSING | No CI safety net | Start with RLS suite in CI + Playwright smoke | L | No |
| P1-15 | Education / benefits | MISSING | Gaps vs audit checklist | Add fields or explicitly out of scope | M | Yes |
| P1-16 | Employer candidate discovery load | PARTIAL | 500-row client filter | Server/RPC pagination | M | Yes (keep discovery?) |

### P2 — quality

| ID | Location | Current state | Problem | Next step | Complexity | Product decision? |
| --- | --- | --- | --- | --- | --- | --- |
| P2-1 | ESLint | 6 errors / 32 warnings | Hooks/refs/prefer-const | Fix lint errors | S | No |
| P2-2 | Duplicate `getUser` | PARTIAL | Extra auth round-trips | Use `getAuthUser()` on account pages | S | No |
| P2-3 | `completion_percent` | Dead | Always 0 | Update on save or drop column from product | S | Yes |
| P2-4 | Dead `SmartMatching` / landing.et | Unused | Debt | Delete or wire | S | No |
| P2-5 | Hardcoded `"Ettevõte \| Kvalifits"` | BROKEN i18n | Wrong language metadata | Use next-intl | S | No |
| P2-6 | Apply a11y focus trap | PARTIAL | Custom sheet | Radix Dialog | M | No |
| P2-7 | Job duplicate | MISSING | Re-create from existing | Clone action | M | Yes |
| P2-8 | Seeker matches page vs `/tood` | Weaker query | Two ranking paths | Reuse search RPC | M | No |
| P2-9 | FORCE RLS | Missing | Owner bypass | Enable FORCE on public tables | M | No |
| P2-10 | Middleware → proxy | Deprecation warning | Next 16 convention | Later, when chosen | S | No |
| P2-11 | Company facet | MISSING | Company only via keyword | Facet if needed | M | Yes |
| P2-12 | Error monitoring | MISSING | Blind in prod | Sentry or equivalent | M | Yes |

### P3 — later

| ID | Location | Current state | Problem | Next step | Complexity | Product decision? |
| --- | --- | --- | --- | --- | --- | --- |
| P3-1 | Stripe / paid publish | MISSING | Payment path is copy | After legal/pricing decision | L | Yes |
| P3-2 | Äriregister verification | MISSING | Manual verify only | Integration | L | Yes |
| P3-3 | Employer orgs / members | MISSING | Single owner | Multi-user | L | Yes |
| P3-4 | Status/cert/alert emails | MISSING | Only new-applicant email | Template set ET/EN/RU | L | Yes |
| P3-5 | Teams/calendar interviews | MISSING | Preference string only | Full interview flow | L | Yes |
| P3-6 | Unused i18n keys | Not confirmed | Bloat | Key linter | S | No |
| P3-7 | Weekly-hours search slider | MISSING | Hours only on job record | Facet if needed | M | Yes |

---

## Feature matrix

Legend: ✅ Done · 🟡 Partial · ❌ Missing · 🔴 Broken/Risky

| FEATURE | UI | BACKEND | DB | RLS | MOBILE | ET | EN | RU | TESTED | STATUS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Public homepage | ✅ | ✅ | — | — | 🟡 | ✅ | ✅ | ✅ | ❌ | 🟡 Demo match stats |
| Guest / seeker / employer / admin nav | ✅ | ✅ | — | — | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Register / login / logout | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Email verification | 🟡 | 🟡 | ✅ Auth | — | 🟡 | 🟡 | 🟡 | 🟡 | ❌ | 🟡 No resend |
| Forgot / reset password | ✅ | ✅ | ✅ Auth | — | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Blocked users | ✅ page | 🔴 APIs | ✅ | 🟡 | ✅ | ✅ | ✅ | ✅ | ❌ | 🔴 |
| Seeker onboarding / profile | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ❌ | 🟡 Completeness / education |
| Employer onboarding / company | ✅ | ✅ | ✅ | 🟡 | 🟡 | ✅ | ✅ | ✅ | ❌ | 🟡 No unique owner |
| Company verification | ✅ | ✅ admin | ✅ | ✅ trigger | ✅ | ✅ | ✅ | ✅ | ❌ | 🟡 Manual |
| Job create / edit / publish | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ❌ | 🟡 No draft-create |
| Job preview / duplicate | ❌ | ❌ | ❌ | — | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Job search + filters | ✅ | ✅ RPC | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Job cards | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Job detail + apply + similar | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ❌ | 🟡 Duties/benefits |
| Matching scores | ✅ | ✅ TS | — | — | ✅ | ✅ | ✅ | ✅ | ❌ | 🟡 List availability |
| Saved jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Saved searches / alerts | ✅ | 🟡 persist only | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | 🟡 No delivery |
| In-app notifications | 🟡 misnamed | ❌ | ❌ | ❌ | 🟡 | 🟡 | 🟡 | 🟡 | ❌ | ❌ |
| Applications | ✅ | ✅ | ✅ | 🔴 INSERT | 🟡 | ✅ | ✅ | ✅ | ❌ | 🟡 / 🔴 insert lock |
| Application pipeline | ✅ | ✅ | ✅ | 🟡 | 🟡 | ✅ | ✅ | ✅ | ❌ | ✅ |
| Employer applicants | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ❌ | ✅ |
| Employer discovery | ✅ | 🟡 | ✅ | 🟡 | 🟡 | ✅ | ✅ | ✅ | ❌ | 🟡 Client filter |
| Interviews | 🟡 pref only | ❌ | ❌ | — | 🟡 | 🟡 | 🟡 | 🟡 | ❌ | ❌ |
| Certificates | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ❌ | ✅ |
| Admin users / jobs / reports | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ❌ | 🟡 No audit UI |
| Employer messages | 🟡 stub | ❌ | ❌ | — | 🟡 | ✅ | ✅ | ✅ | ❌ | ❌ |
| Email (applicant notify) | — | 🟡 Resend | — | — | — | 🟡 | 🟡 | 🟡 | ❌ | 🟡 |
| Cookie consent + analytics | ✅ | ✅ | — | — | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Account export / delete | ✅ | ✅ | ✅ | ✅ | 🟡 | ✅ | ✅ | ✅ | ❌ | ✅ |
| SEO / JSON-LD | ✅ | ✅ | — | — | — | 🟡 | 🟡 | 🟡 | ❌ | 🟡 Hardcoded titles |
| Payments | 🟡 copy | ❌ | ❌ | — | 🟡 | ✅ | ✅ | ✅ | ❌ | ❌ |
| Automated tests | ❌ | ❌ | 🟡 live script | 🟡 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## QA results (this audit)

Run on 18 August 2026 from repo root. No application files were modified.

### Lint — `npm run lint`

**Failed.** `✖ 38 problems (6 errors, 32 warnings)`.

Errors:

1. `app/[locale]/admin/employers/page.tsx` — `prefer-const`
2. `components/auth/CurrentAuthProvider.tsx` — `react-hooks/set-state-in-effect`
3. `components/cookies/ConsentedAnalytics.tsx` — `react-hooks/set-state-in-effect`
4. `components/cookies/CookieConsent.tsx` — `react-hooks/set-state-in-effect`
5. `components/jobs/FitScoreExplain.tsx` — `react-hooks/refs` (ref write during render)
6. `components/jobs/JobFilterPanel.tsx` — `react-hooks/set-state-in-effect`

Warnings: unused vars, unused eslint-disable, exhaustive-deps (32 total warnings).

### Typecheck — `npx tsc --noEmit`

**Failed** with stale generated types under `.next/dev/types/validator.ts` looking for pages at `app/[locale]/page.js` etc. Those routes live under `app/[locale]/(site)/`. This is a **dev-cache validator mismatch**, not a proven source error.

There is **no** `typecheck` npm script.

### Typecheck via production build

**Passed.** `next build` → “Finished TypeScript in 4.5s”.

### Tests — `npm test`

**Failed:** `Missing script: "test"`. No test files in the repo.

### Production build — `npm run build`

**Passed.** Next.js 16.2.3 (Turbopack), compiled successfully.

Warning: middleware file convention deprecated (use `proxy`).

139 static pages generated. Almost all app routes are dynamic (`ƒ`). Static: `manifest.webmanifest`, `robots.txt`, `sitemap.xml`.

---

## What this audit could not confirm

- Whether all 62 migrations and/or `supabase/scripts/fix-*.sql` are applied on the production Supabase project.
- Whether `pg_cron` archive job is scheduled in production.
- Whether Resend domain / `EMAIL_FROM` / `RESEND_API_KEY` are set in production.
- Whether Supabase Auth email templates are customized in ET/EN/RU.
- Live RLS behaviour (suite exists but was not executed here).
- Visual contrast ratios, real-device overflow, and Lighthouse scores (code-level only; prior mobile notes in `docs/mobile-ux-audit.md`).
- Unused translation keys at a key-by-key level.
