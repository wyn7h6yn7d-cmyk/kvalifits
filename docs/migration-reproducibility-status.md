# Migration Reproducibility Status

Date: 2026-08-19

## Verdict

**PASS** (Git ↔ remote alignment)  
**EXTERNAL ACTION REQUIRED** (clean local apply drill — no Docker on audit machine)

## Counts

| Source | Count |
|--------|------:|
| Git HEAD (`supabase/migrations/`) | **78** |
| Working tree | **78** |
| Remote applied | **78** |
| Remote pending | **0** |

`supabase db push --linked --dry-run` → up to date.

## Integrity checks

| Check | Result |
|-------|--------|
| Duplicate migration timestamps | **PASS** — unique prefixes including `2026081600001`–`0035` |
| macOS `* 2.sql` duplicates in migrations | **PASS** — none in `supabase/migrations/` |
| Latest security migration in Git | **PASS** — `20260820120000_rls_security_final_fixes.sql` |
| Static order guards | **PASS** — `scripts/check-migration-order.mjs`, `scripts/verify-migration-sequence.mjs` |

## Clean apply from zero

**Not executed** on this machine (Docker/Podman unavailable).

Operator drill (required before public launch):

```bash
git clone <repo> kvalifits-fresh && cd kvalifits-fresh
supabase start          # requires Docker
supabase db reset --local
# Expect: 78 migrations, no errors
npm run test:security   # against local stack OR remote linked project
```

Verify objects exist after reset:

- `notifications`, `seeker_education`, `seeker_work_capacity`, `seeker_workplace_needs`
- Storage buckets `resumes`, `certificates`, `avatars`
- RPCs `search_published_jobs`, `search_discoverable_candidates`
- Trigger `reject_blocked_user_dml`, `employer_profiles_guard_verification`

## Remote-only schema

**None detected** — all 78 remote versions have matching local files.
