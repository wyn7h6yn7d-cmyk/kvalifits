# Kvalifits mobile UX audit

Implementation pass for phone and tablet viewports (320 / 360 / 375 / 390 / 430 / ~768). Desktop (`lg` and up, 1024px+) layouts were left in place.

## Global

| Problem | Fix | Remaining |
| --- | --- | --- |
| Wordmark + language + menu overflowed at 320px | Flush mobile header; compact logo below `lg`; full-width bar (no inset floating island) | Logo crop on the wordmark asset is still `object-cover` — a dedicated compact mark would be cleaner |
| `--site-header-top` floated the bar on phones | CSS vars: 0 top/tail below 1024px; desktop floating bar restored from `lg` | — |
| Heavy portal/blur on phones | Hero portal hidden below `lg`; match-ring glow disabled on small screens | Subtle ambient orb remains (soft) |
| Giant section padding (`py-28`+) on landing | `py-16` / `sm:py-24` / `lg:py-40` | Exact rhythm is a design-token decision |
| `whitespace-nowrap` buttons clipped long RU/EN labels | Buttons wrap below `lg` | Some labeled CTAs still feel tight in Russian |
| Sheets sat under bottom nav (`z-50`) | Nav sheet `z-[70]`; apply/filters `z-[80]`/`z-[90]` | — |
| iOS home indicator covered sticky CTAs | `safe-area-inset-bottom` on apply bar, filter footer, cookie banner, report/alerts sheets | Visual keyboard inset is not used (limited browser support) |

## `/` Homepage

| Problem | Fix | Remaining |
| --- | --- | --- |
| Desktop hero mechanically squeezed | Smaller heading scale; stacked search already full-width; portal off | Eyebrow not added (copy did not have a useful short one) |
| Compact match mockup hid candidate + job | Stacked candidate → score → job | Full “why” bullets stay desktop-only in compact mode by design |
| Why / Audience / Final CTA too airy | Reduced vertical padding, gaps, heading size below `lg`; CTAs full width | — |

## Navbar / menu

| Problem | Fix | Remaining |
| --- | --- | --- |
| Seeker sheet cloned desktop nav (overview + certificates) | `SEEKER_MOBILE_NAV`: Tööpakkumised, sobivused, kandideerimised, salvestatud, teavitused, profiil | Certificates only on desktop seeker nav |
| Guest/employer sheet already matched requested items | Unchanged; login/register remain below links | Employer label stays “Tööpakkumised” (glossary), not “Töökuulutused” |
| Language selector | Unchanged: ET / EN / RU, no flags; 44px trigger on mobile | Globe icon kept for scanability |

Menu: Radix sheet — Escape, overlay click, focus trap, closes on navigation.

Seeker bottom nav (Tööd / Sobivused / Kandideerimised / Profiil) unchanged; apply bar sits above it via `--site-bottom-nav-offset`.

## `/tood` Job search

| Problem | Fix | Remaining |
| --- | --- | --- |
| Sidebar already hidden on mobile | Kept | — |
| Filter sheet missing “Eemalda filtrid” in sticky footer | Outline clear + primary “Näita N tööpakkumist” | — |
| Result count only in page title | Count also in sticky mobile toolbar | — |
| “Näita rohkem” tap target small | `min-h-11` | — |
| Copy “Eemalda kõik” | `jobsSearch.clearAll` → Eemalda filtrid / Remove filters / Сбросить фильтры | — |

Filters: full-screen panel, collapsible groups, 6 options then “Näita rohkem”, searchable large facets, independent scroll.

## Job cards

| Problem | Fix | Remaining |
| --- | --- | --- |
| Desktop horizontal card squeezed | Mobile order: title → company · location → salary → badges → match → posted + bookmark + CTA | Match “why” expands in-card (can lengthen a card) |
| Long summary + skill tags on phones | Hidden below `lg` | — |
| Bookmark isolated at top-right | Moved to bottom row with CTA | — |

## `/tood/[id]` Job detail

| Problem | Fix | Remaining |
| --- | --- | --- |
| Labeled save duplicated sticky bar | Header save/report desktop-only; report kept on mobile under title | — |
| Salary buried in fact grid | Prominent salary on mobile | Salary also remains in facts |
| Sticky apply bar icon-only save | [Salvesta] [Kandideeri], safe-area, page bottom padding includes bar + nav | Two sticky regions (apply + seeker nav) stack, do not overlap |
| Sidebar already `lg` only | Kept | — |

## Quick Apply

| Problem | Fix | Remaining |
| --- | --- | --- |
| Already full-screen on mobile | z-index above sticky bars; Escape closes; body scroll lock | Custom sheet (not Radix) — no full focus trap |
| Two-column choice chips cramped | Salary/start/interview/schedule stack until `sm` | Min/max salary still 2-col (short numeric) |
| Sticky submit footer | Already present with safe-area | Keyboard covering fields: relies on `dvh` + scroll, not visualViewport |

## `/toootsijatele` / `/tooandjatele`

| Problem | Fix | Remaining |
| --- | --- | --- |
| `PageHero` `text-4xl` + large padding | Smaller type and padding below `lg` | — |
| Section padding / full-width CTAs | Reduced; register buttons `w-full` on phone | Employer product preview is still visually rich (demo, not live data) |
| Matching demo squeezed 3-across | Already stacks until `lg`; glow reduced | — |

## `/ettevotted`

| Problem | Fix | Remaining |
| --- | --- | --- |
| Search actions in one cramped row | Stack submit/reset on phone | Industry + location still 2-col from `sm` (640+) |

## Auth (`/auth/login`, `/auth/register`)

| Problem | Fix | Remaining |
| --- | --- | --- |
| Card padding + title oversized | Tighter padding, `text-xl` on phone | Role picker remains 2-col (two equal choices) |

## Seeker account

| Problem | Fix | Remaining |
| --- | --- | --- |
| Overview CTAs collided with titles | Stack on xs; 44px links | Still several cards below the fold — by design with bottom nav |
| Applications actions wrapping | Full-width buttons on phone | — |
| Matches / saved | Reuse job cards | — |
| Notifications | Existing list | Email alerts still pending (product) |

## Employer account

| Problem | Fix | Remaining |
| --- | --- | --- |
| Job list | Already stacked cards with full-width actions | Many actions per card (publish/archive/delete) — dense but usable |
| Candidate inbox | Desktop table `lg` only; mobile cards already had name/match/salary/start/status | — |
| Talent search filters inline on mobile | Already full-screen; added footer clear + show results | Experience/hours min–max stay 2-col (short inputs) |
| Applicant drawer | Full width on phone | — |
| Job create/edit | `sm:grid-cols-2` from 640; inputs `h-12` on mobile | Long forms still lengthy — not a layout bug |

## `/hinnakiri`

| Problem | Fix | Remaining |
| --- | --- | --- |
| Hero type oversized | `PageHero` scale | Single stacked pricing card; no 3-column desktop pricing to break |

## Admin / legal / settings

| Problem | Fix | Remaining |
| --- | --- | --- |
| Admin reports | Already cards; select `h-11`; save full-width on phone | — |
| Legal `text-3xl` + `py-16` | Reduced on phone | Long documents still scroll (expected) |
| Cookie / report / alerts modals | Bottom sheets on phone, internal scroll, larger checkboxes | Cookie banner + seeker bottom nav stack (banner uses `--site-bottom-nav-offset`) |

## Tablet (~768)

Uses the mobile composition until 1024px: hamburger header, stacked hero, filter sheet, job-card column, no desktop sidebars. Intentional — avoids a broken half-desktop layout.

## Viewport QA notes

Checked in implementation against 320–430 and 768:

- No page-level horizontal scroll intended; `html/body` still `overflow-x: clip` as a backstop.
- Sticky: header (top) / job filters (under header) / apply bar (above bottom nav) / seeker bottom nav. Apply + bottom nav stack; they do not overlap.
- Skeletons updated for job card, search toolbar, and job detail.

Human design approval still useful for: compact wordmark crop, employer job-card action density, Quick Apply focus trap vs Radix dialog, and whether certificates belong in the seeker sheet.
