# Legal Operator Input Required

Fill **only** in `lib/content/legal/placeholders.ts` → `LAUNCH_OPERATOR`. Values propagate automatically via `isLegalEntityRegistered()`, `controllerParagraph()`, terms, privacy, footer, and contact pages.

---

## Required before public commercial launch

| Field | One-line: where it appears |
|-------|---------------------------|
| **LEGAL ENTITY NAME** (`legalEntityName`) | Privacy controller, terms provider, company/contact identity lines (ET/EN/RU) |
| **REGISTRY CODE** (`registryCode`) | Same pages — Äriregister / business registry reference |
| **LEGAL ADDRESS** (`legalAddress`) | Same pages — registered office address |

When all three are set, pre-launch disclaimers switch to registered-operator wording automatically.

---

## Strongly recommended

| Field | One-line: where it appears |
|-------|---------------------------|
| **CONTACT EMAIL** (`officialEmail`) | Public contact, terms, privacy general contact (replaces contact-form-only fallback) |
| **PRIVACY EMAIL** (`privacyEmail`) | Privacy policy data-subject contact (optional if same as official) |

---

## If applicable only

| Field | One-line: where it appears |
|-------|---------------------------|
| **VAT NUMBER** (`vatNumber`) | Company identity block when VAT registered |
| **PHONE** (`phone`) | Company/contact pages if you publish a phone line |

---

## Already set (confirm operational)

| Field | Status |
|-------|--------|
| `contactFormMailto` | `info@kvalifits.ee` — confirm mailbox exists and is monitored |

---

## Do NOT change without product decision

- Payment/checkout copy — payments intentionally **not** taken yet (see Task 15 audit)
- Pre-launch footnotes remain until entity registered **and** counsel review complete

---

## Checklist

- [ ] Fill `LAUNCH_OPERATOR` in `lib/content/legal/placeholders.ts`
- [ ] Counsel review terms + privacy + cookies
- [ ] Verify `/et/tingimused`, `/et/privaatsus`, `/et/kontakt` show registered operator (not pre-launch text)
