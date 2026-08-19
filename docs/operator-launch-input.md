# Operator Launch Input — Required Human Fields

Date: 2026-08-19  
Source: `lib/content/legal/placeholders.ts`, legal pages, messages, footer

## Final status

**READY WHEN OPERATOR DATA PROVIDED**

No additional legal product decision required beyond registering the entity and supplying real values below. Payment/checkout remains a separate product decision (currently disclosed as not open).

---

## Required fields

| FIELD | WHERE USED | REQUIRED BEFORE PUBLIC LAUNCH? | VALUE CURRENTLY PRESENT? | HUMAN INPUT REQUIRED? |
|-------|------------|-------------------------------|--------------------------|------------------------|
| `legalEntityName` | Privacy controller paragraph, terms provider paragraph, company/contact pages, cookie policy operator lead | **Yes** | **No** (`null`) | **Yes** |
| `registryCode` | Same + company identity lines (Äriregister) | **Yes** | **No** | **Yes** |
| `legalAddress` | Same | **Yes** | **No** | **Yes** |
| `officialEmail` | Public contact, privacy contact fallback, terms | **Yes** (monitored company mailbox) | **No** | **Yes** |
| `privacyEmail` | Privacy policy contact (if different from official) | Recommended | **No** | Optional |
| `phone` | Company/contact pages | Optional unless published | **No** | Optional |
| `vatNumber` | Company identity, privacy/terms if VAT registered | If VAT registered | **No** | If applicable |
| `contactFormMailto` | Contact form mailto, pre-registration contact fallback | **Yes** (operational) | **Yes** (`info@kvalifits.ee`) | Confirm mailbox exists & monitored |

Fill only in `lib/content/legal/placeholders.ts`. Do **not** invent values in code.

---

## Automatic copy switch

When `legalEntityName`, `registryCode`, and `legalAddress` are all non-null, `isLegalEntityRegistered()` becomes true and public legal pages switch from pre-launch to registered-operator wording.

---

## Public copy still stating pre-launch / payments not open

| Location | Wording (summary) |
|----------|-------------------|
| `placeholders.ts` | Pre-launch / no registered entity (ET/EN/RU) |
| `legalPrelaunchFootnote()` | Pre-launch service; counsel review before commercial launch |
| `messages/en.json` | `employerPricingHint`, `pricingNotChargedYet`, `ctaHint`, `packageHint` — payments not taken yet |
| `messages/et.json` | Same (Estonian) |
| `messages/ru.json` | Same (Russian) |
| `Audience.tsx` | Planned package hint |
| `/hinnakiri` | Login-gated, `noindex` — planned prices |

**Do not remove** payment-not-open disclaimers until checkout exists.

---

## Saved-search email honesty

`messages/et.json` → `savedSearches.deliveryLiveNote`: in-app alerts active; **emails not sent** unless `SAVED_SEARCH_ALERTS_EMAIL=1` + Resend configured. Align marketing if email alerts are enabled at launch.

---

## Counsel review (human)

- [ ] Terms (`lib/content/legal/terms.*.ts`) after operator fields filled
- [ ] Privacy (`privacy.*.ts`)
- [ ] Cookie policy (`lib/cookies/buildCookiePolicy.ts`)
- [ ] Data-subject rights pages
- [ ] Payment terms when billing launches

---

## Operator checklist

See `lib/content/legal/LAUNCH_CHECKLIST.md`
