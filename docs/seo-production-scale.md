# SEO — Production Scale

Date: 2026-08-19

## Verdict

**PASS FOR LAUNCH SCALE** (current catalog small; limits documented)

---

## Sitemap (`app/sitemap.ts`)

| Source | Limit | Launch risk |
|--------|-------|-------------|
| Published jobs | 5000 | **Low** at early launch |
| Company slugs | 2000 | **Low** |
| Static paths × 3 locales | Fixed | **Low** |

Generation is server-side per request; with <1000 jobs memory/CPU acceptable.

**Action if catalog >5000 jobs:** split sitemap index (future).

---

## Verified behaviors (code)

| Feature | Status |
|---------|--------|
| Canonical + hreflang | `lib/seo/site.ts` |
| Filter URLs noindex | Companies/jobs duplicate landing |
| JobPosting JSON-LD | Only when job accepts applications |
| Expired jobs excluded | `jobAcceptsApplications` in sitemap + detail |
| robots.txt | Disallows account/admin/auth |
| Private pages noindex | Account routes |

---

## Live check

Remote `employer_public_profiles` count: **0** (beta catalog empty). Sitemap generation succeeds with static entries only.

---

## Human verification after content seed

- View source on published job → validate JSON-LD
- Fetch `/sitemap.xml` after jobs published
- Search Console submit
