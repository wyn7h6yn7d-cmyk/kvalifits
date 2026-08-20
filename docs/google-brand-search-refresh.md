# Google brand search refresh

Date: 2026-08-20

After production deploy of homepage brand SEO (title `Kvalifits`, WebSite JSON-LD, www canonical, favicon sizes).

## Why Google may still show old text

Google can rewrite titles and site names. Providing correct signals does not guarantee instant SERP updates.

Old appearance such as “jobs in Estonia - Kvalifits” was **not** present in current homepage metadata (title was already absolute `Kvalifits`). Remaining issues addressed in code:

- Canonical origin now matches live redirect host: `https://www.kvalifits.ee`
- WebSite JSON-LD added (`name: Kvalifits`)
- Favicon exposed at 48 / 96 / 192 (+ ICO)
- Homepage meta description refreshed (ET / EN / RU)

## Human steps (Search Console)

1. Open [Google Search Console](https://search.google.com/search-console) for the Kvalifits property.
2. Use **URL Inspection** on the canonical homepage: `https://www.kvalifits.ee/` (and `/et` if that is your default indexed locale).
3. Confirm Google can crawl the URL (no `noindex`, 200 OK).
4. Click **Request indexing**.
5. Inspect favicon URLs are crawlable, for example:
   - `https://www.kvalifits.ee/favicon-48.png`
   - `https://www.kvalifits.ee/favicon-96.png`
   - `https://www.kvalifits.ee/favicon-192.png`
   - `https://www.kvalifits.ee/favicon.ico`
6. Optionally submit / refresh sitemap: `https://www.kvalifits.ee/sitemap.xml`
7. Wait for recrawl. Brand/favicon updates often take **days to weeks**.

## What not to expect

Do not expect the Google result for “Kvalifits” to change immediately after deploy.
