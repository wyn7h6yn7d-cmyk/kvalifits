# Pricing & Commercial Claims — Public Launch Audit

Date: 2026-08-19 (re-evaluated)

## Verdict

**PAYMENT PRODUCT DECISION NOT REQUIRED FOR FREE LAUNCH** — UI accurately discloses that payments are not taken yet.

---

## Are employers charged at launch?

**No.** No Stripe/checkout integration exists.

---

## Is checkout implemented?

**No.**

---

## Payment model at launch

**Free / manual / deferred** — employers can register, create drafts, and publish jobs without payment. Copy states this explicitly in ET/EN/RU:

- `employerPricingHint` — planned package; payments not open yet
- `pricingNotChargedYet` — prices planned; may change
- `ctaHint` — account free; pay for active job later; payments not taken yet
- Job creation subtitle — payment connected later

---

## Public CTAs audit

| CTA | Behavior | Misleading? |
|-----|----------|-------------|
| Register (seeker/employer) | Auth flow | **No** |
| Create job | Draft/publish without checkout | **No** |
| `/hinnakiri` pricing page | Login-gated, `noindex`, planned prices + disclaimer | **No** |
| “Buy” / “Pay now” | **Not present** on public CTAs | **No** |

---

## If switching to paid launch later

Requires separate product decision: checkout provider, VAT invoicing, updated terms, and removal of “payments not taken yet” copy.

Do **not** enable paid CTAs until checkout exists.
