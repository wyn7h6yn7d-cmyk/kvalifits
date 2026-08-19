# Load Test Plan — Public Launch (~1000 users)

Date: 2026-08-19

## Verdict

**EXTERNAL ACTION REQUIRED** — no load test executed in this session.

---

## Assumptions

- ~1000 registered users over first weeks
- Launch spike: 50–200 concurrent sessions (not 1000 simultaneous)
- Primary region: eu-west-1 (Supabase + Vercel)

---

## Staging requirements

1. Vercel preview/staging deployment mirroring production build.
2. Supabase staging project or branch — **never load-test production**.
3. Seed data targets:
   - 1,000 seeker profiles (mixed completeness)
   - 500–1,000 published jobs
   - 5,000+ applications distributed
   - 10,000 saved jobs / notifications sample

---

## Scenarios

| ID | Scenario | Tool suggestion |
|----|----------|-----------------|
| A | Anonymous job search | k6 / Artillery on `/et/tood` |
| B | Filtered search | k6 with query params |
| C | Job detail SSR | `/et/tood/{slug}` |
| D | Seeker dashboard + match sort | Authenticated session cookie |
| E | POST `/api/job-applications` | Low rate, realistic mix |
| F | Employer applicants list (paginated) | `/account/employer/jobs/{id}/applicants` |
| G | Candidate discovery RPC | Employer session |
| H | Notifications inbox | Paginated account route |
| I | Company directory | `/et/ettevotted?page=N` |

---

## Concurrency stages

Run each scenario at: **10 → 25 → 50 → 100 → 200** VUs (stop if error rate >1% or p95 TTFB >3s on reads).

Measure: p50, p95, p99, error rate, TTFB, API latency.

---

## Launch targets (directional)

| Metric | Target |
|--------|--------|
| Public read p95 | < 2.5s TTFB |
| Apply mutation success | > 99.5% under 50 concurrent applies |
| Error rate | < 0.5% at 100 VUs reads |
| DB CPU | < 70% sustained on staging tier |

Adjust after first staging run.

---

## Known architecture notes

- Job search uses RPC `search_published_jobs` with indexes (`20260817200000_job_search_indexes.sql`)
- Companies directory now uses DB pagination (not full 1000-row memory load)
- Employer applicants paginated at 25/page

---

## Next step

Operator runs staging load test, records results in this file, fixes bottlenecks found.
