# Disaster Recovery

Date: 2026-08-19  
Project: `svqdycsticovpudcgqvq` (Supabase, eu-west-1)

## Verdict

**EXTERNAL ACTION REQUIRED** — confirm backup tier and run restore drill on disposable project.

---

## Supabase backup capabilities

Verify in **Supabase Dashboard → Project Settings → Database → Backups**:

| Capability | Action |
|------------|--------|
| Daily automatic backups | Confirm enabled for plan |
| Retention period | Record days (plan-dependent) |
| Point-in-time recovery (PITR) | Confirm if Pro+; note retention window |
| Manual backup / export | `pg_dump` via CLI or dashboard export |

Do not assume features — check current subscription.

---

## Scenario playbooks

### DATABASE LOSS

1. Stop writes: maintenance mode or pause Vercel deploy traffic.
2. Supabase Dashboard → Database → Backups → restore to **new** project or restore point.
3. Update Vercel env: `NEXT_PUBLIC_SUPABASE_URL`, keys to restored project if new.
4. Run `supabase migration list` — must match 78 applied.
5. Run `npm run test:security` against restored project.
6. Resume traffic.

### BAD MIGRATION

1. Do **not** run destructive `supabase db reset` on production.
2. If migration partially applied: inspect `supabase_migrations.schema_migrations`.
3. Forward-fix with new migration (preferred) or restore from pre-migration backup.
4. Git must remain source of truth — never edit applied migration files.

### ACCIDENTAL DATA CHANGE

1. Identify scope (table, time).
2. PITR restore to staging fork at time before incident **or** row-level recovery from audit tables (`admin_audit_log`).
3. Merge corrected rows back via controlled SQL script reviewed by operator.

### STORAGE DOCUMENT ISSUE

1. Supabase Storage has separate lifecycle — check bucket backups (may require manual export).
2. Re-upload from user if object lost; CVs/certificates are user-owned.
3. RLS policies reapplied via migrations on new project.

### BAD DEPLOY

1. Vercel → Deployments → instant rollback to last green deployment.
2. If env var regression: restore previous env snapshot in Vercel.
3. Smoke: `/api/health`, login, job search, apply flow.

### COMPROMISED SECRET

1. Rotate `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `RESEND_API_KEY`, `SENTRY_AUTH_TOKEN` immediately in Supabase/Vercel/Resend.
2. Invalidate sessions if anon/service keys leaked (`supabase auth admin` sign-out all if needed).
3. Review `admin_audit_log` and Sentry for anomalous activity.

---

## Restore drill (required before public launch)

**On disposable environment only:**

1. Create staging Supabase project or branch.
2. Restore latest backup into it **or** `supabase db reset --local` + `db push` from Git.
3. Point staging Vercel preview env at drill project.
4. Verify login, job list, apply, employer dashboard.
5. Document actual time-to-recover.

**Never overwrite production for drill.**

---

## Recovery contacts

- Supabase support / status: https://status.supabase.com
- Vercel status: https://www.vercel-status.com
- Resend status: https://resend.com/status

Operator on-call rotation: _document human names outside repo._
