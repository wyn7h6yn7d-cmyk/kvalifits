# Kvalifits copy audit report

Date: 18 August 2026  
Scope: ET / EN / RU product UX copy. Legal documents were not rewritten except one terminology synonym.

## 1. Main terminology decisions

Canonical terms (see `docs/ux-copy-glossary.md`):

- Public listing: **tööpakkumine / job / вакансия**. *Töökuulutus*, *töökoht* and *positsioon* are out of user-facing UI.
- Match: **sobivus / match / соответствие**. Not match score, sobivusskoor, or “fit scoring”.
- Verified status: **kontrollitud / verified / проверено**. Not verifitseeritud / kinnitatud / tõendatud for the same state.
- `job_type` facet: **töökoormus / workload / занятость** (täistööaeg, osaline tööaeg, tähtajaline, praktika).
- `work_type` facet: **töö tegemise koht / work arrangement / формат работы** (kohapeal, hübriid, kaugtöö). These are no longer both called *töövorm*.
- Certificates in filters and job detail: **sertifikaadid ja load / certifications & licences / сертификаты и допуски**.
- Job seeker applications: **kandideerimine**, not *avaldus*, in seeker-facing copy.

`job_type` still mixes hours and contract type in the data model. Labels stay honest (*tähtajaline*, *praktika*) under one facet until the schema splits.

## 2. Slogans / headlines changed

Kept a small set:

- Job seekers: *Leia töö, mis sobib sinu oskustega.* / *Find jobs that match your skills.* / *Найдите работу, которая соответствует вашим навыкам.*
- Supporting: *Näe, miks töö sulle sobib.*
- Employers: *Leia kandidaadid, kes vastavad sinu nõuetele.*

Removed:

- “Usaldusväärsed tööandjad. Kvalifitseeritud töötajad”
- “Kaks rolli. Üks loogika.”
- “Otsin tööd” / “Pakun tööd” as primary CTAs
- Unused landing file slogans (“Nutikad sobitused”, “MVP eelvaade”, “Verifitseeritud oskused”)

## 3. Navigation changes

Public: Tööpakkumised, Ettevõtted, Tööotsijale, Tööandjale, Logi sisse, Registreeru.

Seeker: Minu sobivused, Kandideerimised, Salvestatud, Teavitused, Profiil. Mobile short for jobs remains **Tööd**.

Employer: Ülevaade, Tööpakkumised, Kandidaadid, Sõnumid, Ettevõte.

Nav **structure** was not changed (certificates and overview stay in the seeker nav).

## 4. CTA changes

Verb-first, specific:

- Search: **Otsi** (hero and job search)
- Primary seeker: **Otsi tööpakkumisi** / **Loo profiil**
- Employer: **Olen tööandja** / **Lisa tööpakkumine** / **Avalda tööpakkumine**
- Apply: **Kandideeri** → **Saada kandideerimine**
- Save job: **Salvesta**

Dropped “Alusta teekonda”, “Avasta võimalusi”, “Launch”, “Go live”.

## 5. Matching terminology

- UI: `{score}% sobivus` / `{score}% match` / `соответствие {score}%`
- Panel: “Miks see töö sulle sobib?”
- Reasons: concrete (*Asukoht sobib*, *Vajalik sertifikaat puudub*, *Sul on 4 aastat kogemust. Tööandja eelistab 5 aastat.*)
- Legal/working-condition fit is labelled separately from match percentage. The English leak “eligibility staatus” was removed.

## 6. Employer terminology

Operational, not sales-heavy: Lisa tööpakkumine, Avalda tööpakkumine, Kandidaadid, Kutsu vestlusele, Sisemine märkus, Värbamisvoog.

Internal statuses unchanged in meaning: Uus, Ülevaatamisel, Vestlusele, Teine vestlus, Pakkumine tehtud, Palgatud, Ei sobinud, Kandidaat loobus.

90-day package labelled **Parim väärtus** / **Best value** / **Выгоднее**, with an explicit note that payments are not taken yet.

## 7. Job seeker terminology

- Profile completion: “Profiil on {percent}% valmis”
- Empty applications: “Sa pole veel ühelegi tööle kandideerinud.”
- Empty saved: “Sul pole veel salvestatud tööpakkumisi.”
- External statuses: Kandideerimine saadetud → Tööandja vaatab kandideerimist → Kutsutud vestlusele → Pakkumine tehtud → Valituks osutunud / Värbamisprotsess lõppenud
- Hired is shown to seekers as **Valituks osutunud**, not the employer’s *Palgatud*

## 8. ET / EN / RU parity

- All three files have **1804** leaf keys. No missing/extra keys.
- EN/RU were rewritten for intent, not word-for-word Estonian.
- Russian match nav is **Подходящие вакансии**, not “Мои совпадения”.
- Russian apply CTA remains **Откликнуться**.

## 9. Legal wording left for human/legal review

Intentionally **not** rewritten (except `töökuulutusi` → `tööpakkumisi` in `lib/content/legal/terms.et.ts`, same meaning):

- Privacy, terms, cookies, data-rights, company pages
- Operator / VAT / registry placeholders
- Retention periods
- Cookie consent legal body
- “Teenus pakutakse nagu on” and other liability clauses

These still mix product language (*pädevuspõhine töövahendus*) with legal text. A lawyer should review before launch. Do not copy another portal’s legal documents.

## 10. Remaining questionable wording

- Some job-form helper texts are still longer than a CV.ee-style hint (minimum character counts, field format). Shortening further would hide validation rules.
- Translation **keys** still contain `taxonomy`, `facet`, `pipeline`, `eligibility`. Values do not, except employer “Hiring flow” / “Värbamisvoog”.
- Employer/seeker save errors may still prepend the raw Supabase `error.message` before the generic hint. Copy no longer includes SQL filenames; sanitising `raw` would be a logic change.
- `lib/content/landing.et.ts` is unused by the live homepage (copy lives in `messages/*.json`) but was updated so it cannot drift back into SaaS tone.
- Seeker bottom nav uses **Tööd** instead of **Tööpakkumised** for space.
- Brand logo `alt="Kvalifits"` and footer © remain hardcoded brand names.

## Files changed

- `messages/et.json`, `messages/en.json`, `messages/ru.json`
- `components/jobs/JobCard.tsx` (relative “Avaldatud täna / 2 päeva tagasi”)
- `lib/jobs/jobSeo.ts`, `app/[locale]/(site)/tood/[id]/page.tsx` (SEO fallback titles)
- `lib/content/landing.et.ts`
- `lib/content/legal/terms.et.ts` (one synonym)
- `docs/ux-copy-glossary.md` (new)
- `docs/brand-voice.md` (new)
- `docs/copy-audit-report.md` (this file)

## Translation strings

Measured against `HEAD`:

| Locale | Values changed | Keys added | Total leaves |
|---|---:|---:|---:|
| ET | 393 | 4 | 1804 |
| EN | 267 | 4 | 1804 |
| RU | 161 | 4 | 1804 |

Added keys: `jobCard.postedToday`, `postedYesterday`, `postedDaysAgo`, `postedOn`.

## Hardcoded strings remaining (and why)

| Location | Why it stays |
|---|---|
| Legal TS content (`lib/content/legal/*`, `lib/cookies/*`) | Legal copy exception; not a marketing rewrite |
| `Logo` alt, footer ©, `SITE_NAME` | Brand name |
| Admin MFA `friendlyName: "Kvalifits Admin"` | Internal authenticator label |
| Code comments / types (`matchScore`, eligibility types) | Not user-facing |
| Some email subjects still built in code with translated fragments | Already wired through `jobs.applicationEmail*` |

## Build / test result

- **JSON:** all three locale files parse; key sets are identical.
- **Production build:** `next build` succeeded (TypeScript inside the build: pass). 138 pages generated.
- **Lint:** full `eslint` still reports **pre-existing** errors/warnings in unrelated files (hooks in cookie consent, prefer-const on admin employers, unused vars). **No new issues** in files touched for this copy pass.
- **Standalone `tsc`:** fails on stale `.next/dev/types/validator.ts` route stubs; `next build` TypeScript is the source of truth here.
- **Tests:** no unit/e2e test suite in the repo (`npm test` is not defined).
