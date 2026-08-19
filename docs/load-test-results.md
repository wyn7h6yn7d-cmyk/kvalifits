# Load Test Results

Date: 2026-08-19

## Verdict

**PERFORMANCE FIX REQUIRED** (assessment incomplete) — **no staging load test executed**

---

## Status

A staging environment with seeded data (~1000 profiles/jobs) was **not available** in this session. No concurrency tests run.

Plan: `docs/load-test-plan.md`

---

## Architecture improvements already merged (pre-test)

- Public companies: DB `count` + `range` pagination (not 1000-row memory load)
- Employer applicants: server pagination (25/page)
- Notifications: paginated inbox
- Admin tables: server pagination

---

## Sitemap scale note

Current limits: 5000 jobs / 2000 companies in `app/sitemap.ts`. At launch with <5000 jobs this is **acceptable**. Revisit split sitemap if catalog exceeds limits.

---

## Launch capacity conclusion

**CANNOT certify PASS FOR ~1000 EARLY USERS** until staging load test completes.

Directional expectation: architecture supports early scale; validate with measured p95 on job search RPC and applicant lists.

---

## Next step

Operator runs k6/Artillery against staging per load-test-plan, records metrics here, fixes bottlenecks if p95 > 2.5s or error rate > 0.5%.
