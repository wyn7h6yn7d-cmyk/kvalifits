# Public Launch — Legal & Operator Required Fields

Date: 2026-08-19

## Verdict

**EXTERNAL PUBLIC LAUNCH BLOCKER**

`LAUNCH_OPERATOR` in `lib/content/legal/placeholders.ts` has **all identity fields null**. Public terms, privacy, contact, and company pages display **pre-launch disclaimers**, not a registered operator.

Do **not** invent registry codes, VAT numbers, addresses, or official emails in code.

---

## Required operator-provided fields

Fill `LAUNCH_OPERATOR` before commercial public launch:

| Field | Required for launch | Current |
|-------|----------------------|---------|
| `legalEntityName` | **Yes** | `null` |
| `registryCode` | **Yes** (Estonia) | `null` |
| `legalAddress` | **Yes** | `null` |
| `vatNumber` | If VAT registered | `null` |
| `officialEmail` | **Yes** | `null` |
| `privacyEmail` | Recommended (or reuse official) | `null` |
| `phone` | Recommended | `null` |
| `contactFormMailto` | Operational mailbox | `info@kvalifits.ee` (confirm exists) |

Until filled, `isLegalEntityRegistered()` returns **false** and legal copy uses pre-launch language.

---

## Pages affected

- Terms (`lib/content/legal/terms.*.ts`)
- Privacy (`lib/content/legal/privacy.*.ts`)
- Contact / Company (`lib/content/legal/contact.*.ts`, `company.*.ts`)
- Cookie policy operator lead (`lib/cookies/buildCookiePolicy.ts`)

Footer shows product name only — no registered entity block.

---

## Professional review still needed

- Terms of service (EE law, employment platform specifics)
- Privacy policy / GDPR DPIA alignment
- Cookie policy accuracy vs actual cookies (Supabase auth, Vercel Analytics when consented)
- Pricing copy once paid plans launch
- Minor/consent flows (legal representative) — product implemented; legal sign-off advised

---

## Pricing / payment claims

**No checkout implemented.** Public copy states payments are not open yet (`Audience.tsx`, employer landing). `/hinnakiri` is login-gated and `noindex`.

Do not enable paid CTAs until billing exists.

---

## Checklist reference

See `lib/content/legal/LAUNCH_CHECKLIST.md` in repository.
