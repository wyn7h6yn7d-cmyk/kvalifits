# UX Availability Audit — Marketing vs Product

Date: 2026-08-19

## Verdict

**PASS** with documented honest limitations

---

## Feature claims vs implementation

| Marketing claim | Product reality | Status |
|-----------------|-----------------|--------|
| Skills-based matching | `calculateJobMatch`, match explanation API | **PASS** |
| Quick Apply | In-app apply flow + a11y harness | **PASS** |
| Verified qualifications | Admin certificate verification + badges | **PASS** (admin action required) |
| Verified companies | Admin company verification | **PASS** |
| In-app notifications | `notifications` table + bell | **PASS** |
| Saved job alerts (in-app) | Saved searches + cron path | **PASS** |
| Saved job **email** alerts | Requires env + cron + Resend | **Disclosed off** in UI copy |
| Employer pricing / pay for job | No checkout | **Disclosed** — "payments not taken yet" |
| Candidate discovery | Employer RPC | **PASS** |

---

## ET / EN / RU

Message files present for all three locales; E2E covers ET public routes.

---

## No dead CTAs found in automated pass

Register/login CTAs route to auth flows. Pricing CTAs route to register, not fake checkout.

---

## Optional features correctly not over-promised

- No Stripe/checkout links
- `/hinnakiri` hidden from nav, noindex
- Pre-launch legal disclaimers visible
