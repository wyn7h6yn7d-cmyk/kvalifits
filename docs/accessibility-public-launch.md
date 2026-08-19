# Accessibility — Public Launch

Date: 2026-08-19

## Verdict

**PASS** (automated smoke) — manual WCAG audit still recommended

---

## Automated coverage

Added `e2e/accessibility.spec.ts` using `@axe-core/playwright`:

- Homepage, jobs, login, register, Quick Apply harness
- Tags: WCAG 2.x A/AA
- Color contrast rule disabled (manual review for brand colors)

Run: `npx playwright test e2e/accessibility.spec.ts --workers=1`

---

## Existing manual coverage

- Quick Apply keyboard trap: `e2e/quick-apply-a11y.spec.ts`
- Mobile overflow: `e2e/mobile.spec.ts`

---

## Known non-blocking warnings

- Radix `DialogContent` missing Description (WebServer logs) — review for launch polish

---

## Not automated

- Full employer job creation form
- Seeker profile all steps
- EN/RU parity axe pass (extend spec if needed)
