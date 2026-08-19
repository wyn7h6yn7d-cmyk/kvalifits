# Backup & Restore Drill

Date: 2026-08-19  
Project: `svqdycsticovpudcgqvq`

## Verdict

**HUMAN ACTION REQUIRED** — drill not executed

---

## BACKUP METHOD

Confirm in Supabase Dashboard → Database → Backups:

| Capability | Status |
|------------|--------|
| Automatic daily backups | **Verify plan** |
| PITR | **Verify if Pro+** |
| Manual `pg_dump` | Available via CLI with DB credentials |

Do not assume — record actual plan tier.

---

## FREQUENCY / RETENTION

Document from dashboard after human inspection.

Typical Supabase Pro: daily backups, 7-day retention; PITR varies by plan.

---

## RESTORE STEPS (disposable env only)

1. Create new Supabase project or use branch
2. Restore backup snapshot to that project
3. Update staging env vars to restored project
4. Run `supabase migration list` — expect 78/78
5. Run `npm run test:security`
6. Smoke login + job search

**Never restore over production for drill.**

---

## RTO / RPO assumptions

| Metric | Assumption until drill |
|--------|------------------------|
| RPO | Up to 24h if daily backups only |
| RTO | 2–4h operator time + Supabase restore duration |

Update after real drill.

---

## DRILL RESULT

**NOT RUN** in this session.

See also: `docs/disaster-recovery.md`
