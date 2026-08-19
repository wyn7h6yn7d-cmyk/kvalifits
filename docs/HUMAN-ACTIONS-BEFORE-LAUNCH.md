# Human Actions Before Public Launch

Complete these in order. Code and automated gates are otherwise ready pending deploy.

---

## Legal & operator (BLOCKING)

- [ ] **Register legal entity**  
  Where: Estonian Business Register  
  Needed: Company name, registry code, registered address  
  Verify: Fill `LAUNCH_OPERATOR` in `lib/content/legal/placeholders.ts`; terms/privacy show registered operator (not pre-launch text)

- [ ] **Legal counsel review**  
  Where: Your lawyer  
  Needed: Review terms, privacy, cookies after operator fields filled  
  Verify: Sign-off documented internally

---

## Supabase Auth email (BLOCKING)

- [ ] **Set production Site URL & redirects**  
  Where: [Supabase Dashboard](https://supabase.com/dashboard/project/svqdycsticovpudcgqvq/auth/url-configuration)  
  Needed: `https://www.kvalifits.ee` + `/*/auth/callback` patterns  
  Verify: Register test user → verification email arrives → link works

- [ ] **Password reset smoke test**  
  Where: Production login → forgot password  
  Needed: Same test mailbox  
  Verify: Reset email arrives and link works

---

## Resend (BLOCKING for application emails)

- [ ] **Verify sender domain**  
  Where: [Resend Domains](https://resend.com/domains)  
  Needed: Domain matching `EMAIL_FROM`  
  Verify: SPF/DKIM green in Resend

- [ ] **One test application email**  
  Where: Test apply flow with employer contact = your inbox  
  Verify: Email received with correct From

---

## Vercel cron (BLOCKING if email alerts enabled)

- [ ] **Add `CRON_SECRET` to Production**  
  Where: Vercel → kvalifits → Settings → Environment Variables  
  Needed: Strong random secret  
  Verify: Redeploy; Cron Jobs tab shows successful runs (not 401)

- [ ] **Optional: enable email alerts**  
  Where: Vercel Production env  
  Set: `SAVED_SEARCH_ALERTS_EMAIL=1`  
  Verify: Only if product promises email alerts

---

## Deploy latest code (BLOCKING)

- [ ] **Deploy `main` to production**  
  Where: Vercel  
  Verify: `curl https://www.kvalifits.ee/api/health` → `{"ok":true}`

---

## Sentry alerting (RECOMMENDED)

- [ ] **Confirm production events in Sentry dashboard**  
  Where: sentry.io project  
  Verify: Recent production events visible; create error-rate alert

---

## Live walkthrough (BLOCKING)

- [ ] **Full seeker + employer + admin test**  
  Where: Production with labeled test accounts  
  Guide: `docs/live-flow-production-results.md`  
  Verify: All critical steps PASS; delete test data

---

## Backup drill (BLOCKING)

- [ ] **Confirm backup tier & run restore drill**  
  Where: Supabase Dashboard → Backups; disposable project  
  Guide: `docs/backup-restore-drill.md`  
  Verify: Document RTO/RPO

---

## Load test (RECOMMENDED)

- [ ] **Staging load test ~1000 user scale**  
  Guide: `docs/load-test-plan.md`  
  Verify: p95 acceptable; update `docs/load-test-results.md`

---

## Clean local migration drill (RECOMMENDED)

- [ ] **Fresh clone + `supabase db reset --local`** on Docker machine  
  Verify: 78 migrations apply; `npm run test:security`
