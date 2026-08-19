# Privacy Technical Audit

Date: 2026-08-19

Not legal advice — technical behavior vs privacy messaging.

## Verdict

**PASS** (consent-gated analytics, export/delete implemented)  
Legal copy still pre-launch — see `docs/public-launch-legal-required-fields.md`

---

## Cookies set

| Cookie / storage | Category | Consent required |
|------------------|----------|------------------|
| Supabase auth cookies | Necessary | No |
| `NEXT_LOCALE` | Necessary | No |
| `kvalifits_cookie_consent_v1` (localStorage) | Necessary | No |
| Vercel Analytics | Analytics | **Yes** — gated |
| Vercel Speed Insights | Analytics | **Yes** — gated |

Config: `lib/cookies/config.ts`  
UI: `components/cookies/CookieConsent.tsx`  
Analytics loader: `components/cookies/ConsentedAnalytics.tsx` (only after consent)

Marketing cookies: **inactive placeholder** — no tracking initialized.

---

## Account privacy features

| Feature | Implementation |
|---------|----------------|
| Data export | `app/api/account/export/route.ts` |
| Account deletion | `app/api/account/delete/route.ts` + workflow |
| Legal acceptance tracking | `profiles` legal acceptance migration |
| Marketing consent separation | Check schema/messages if field exists |

---

## Monitoring PII

Sentry scrubber removes tokens, CV, certificates, application answers, work capacity, health fields (`lib/monitoring/scrub.ts`).

---

## Unresolved legal decisions (human)

- Final retention periods for applications after account deletion
- DPA with Supabase, Resend, Vercel
- Registered operator identity before commercial launch

---

## Recommendation

If only necessary + consented analytics cookies: current banner is appropriate. Do not add fake marketing consent complexity.

If adding new trackers: update `lib/cookies/config.ts` and policy page first.
