# Database Index Review

Date: 2026-08-19

## Method

Review based on migration-defined indexes and query entry points (RPCs, paginated account routes). No `EXPLAIN` on production executed in this session.

---

## Job search

| Query | Indexes / objects | Migration |
|-------|-------------------|-----------|
| `search_published_jobs` RPC | GIN/trigram on jobs, facet indexes | `20260817200000_job_search_indexes.sql`, `20260817180000_search_published_jobs.sql` |
| Published job listing | `status`, `published_at`, employer FK | Various job_posts migrations |

**Justification:** RPC is primary public search path; indexes added for text + filter facets.

---

## Candidate discovery

| Query | Indexes | Migration |
|-------|---------|-----------|
| `search_discoverable_candidates` | Seeker profile visibility, cert filters | `2026081600035_*`, `20260820120000_*` |

**Justification:** Employer-only RPC; pagination overlap fix in latest security migration.

---

## Applications

| Query | Indexes | Notes |
|-------|---------|-------|
| By job + status | `job_post_id`, status columns | Application migrations |
| Unique active application | Partial unique index | `20260426_job_applications_unique_active.sql` |
| Employer applicant list | Paginated by job_post_id | Server pagination added |

---

## Notifications

| Query | Pattern |
|-------|---------|
| By user_id, created_at desc | Paginated limit 25 — account notifications page |

Consider index on `(user_id, created_at desc)` if not present — verify on staging with `EXPLAIN`.

---

## Saved jobs / searches

| Table | Access |
|-------|--------|
| `saved_jobs` | seeker_user_id + pagination |
| `saved_job_searches` | seeker_user_id; delivery ledger unique keys |

---

## Companies

| Query | Change |
|-------|--------|
| `employer_public_profiles` directory | Now `count` + `range` with `company_name` order |

View backed by employers with published jobs — index on underlying `employer_profiles` + job_posts publish state.

---

## Recommendations before launch

1. Run `EXPLAIN (ANALYZE, BUFFERS)` on staging for top 5 queries at seeded scale.
2. Enable Supabase query performance insights in dashboard.
3. Add composite index on `notifications(user_id, created_at DESC)` if explain shows seq scan.

No blind index additions on production without plan evidence.
