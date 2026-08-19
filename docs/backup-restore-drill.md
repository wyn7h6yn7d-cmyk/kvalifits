# Backup & Restore Drill

Date: 2026-08-19 (updated)

## Verdict

**HUMAN PROVIDER ACTION REQUIRED** — backup tier confirmed partially; restore drill not executed

---

## Supabase project `svqdycsticovpudcgqvq` (CLI audit)

| Capability | Status |
|------------|--------|
| Region | `eu-west-1` |
| WAL archiving (`walg_enabled`) | **true** |
| Point-in-time recovery (`pitr_enabled`) | **false** |
| Listed backups via CLI | **empty** — confirm retention in Dashboard |

Do not assume PITR. Confirm daily backup schedule and retention on current plan tier.

---

## BACKUP METHOD

- **Automatic:** Supabase Dashboard → Database → Backups (plan-dependent daily snapshots)
- **Manual:** `pg_dump` via connection string (operator credentials; never commit)

---

## FREQUENCY / RETENTION

**Human:** Record from Dashboard after inspection.

Directional (typical Pro): daily backups, ~7-day retention without PITR.

---

## RESTORE STEPS (disposable env only)

1. Create new Supabase project or branch
2. Restore from dashboard backup snapshot
3. Point staging env vars to restored project
4. Run `supabase migration list` — expect **78/78**
5. Run `npm run test:security` — expect **93/0**
6. Smoke login + job search

**Never restore over production for drill.**

---

## RTO / RPO (until drill completes)

| Metric | Assumption |
|--------|------------|
| RPO | Up to 24h if daily backups only (no PITR) |
| RTO | 2–4h operator time + Supabase restore duration |

---

## DRILL RESULT

**NOT RUN** — requires operator on disposable project.

See: `docs/disaster-recovery.md`
