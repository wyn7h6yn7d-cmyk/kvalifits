# Local Supabase Development

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running
- Supabase CLI: `brew install supabase/tap/supabase`
- Node.js 20+

## Quick Start

```bash
# Start local Supabase (applies all migrations automatically)
supabase start

# The CLI prints local URLs and keys — copy them to .env.local:
#   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<printed anon key>
#   SUPABASE_SERVICE_ROLE_KEY=<printed service_role key>

# Start the Next.js dev server
npm run dev
```

## Local Ports

| Service | Port |
|---------|------|
| API (PostgREST) | 54321 |
| Database (Postgres) | 54322 |
| Studio | 54323 |
| Inbucket (email) | 54324 |
| SMTP | 54325 |

## Migrations

All 77 migrations in `supabase/migrations/` are applied sequentially on
`supabase start` or `supabase db reset`.

```bash
# Apply new migrations to a running local instance
supabase db reset

# Create a new migration
supabase migration new <name>
```

**Never run `supabase db reset` against production.** The config targets
only the local Docker environment.

## Email Testing

Local Supabase uses [Inbucket](http://localhost:54324) for email. All
verification and password-reset emails are captured there — no real
emails are sent.

## Auth Callback

The local auth config allows redirects to `http://localhost:3000/*/auth/callback`
matching all three locales (et, en, ru).

## Storage Buckets

Buckets are created by migrations:
- `avatars` (public)
- `certificates` (private)
- `resumes` (private)
- `company-logos` (public)

## RLS Security Suite

The security suite requires a running Supabase with the service role key:

```bash
# Against local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=<local service_role key> \
node scripts/rls-security-suite.mjs

# Against remote (use .env.local with production keys)
node --env-file=.env.local scripts/rls-security-suite.mjs
```

## Remote DB Audit (read-only)

The remote DB audit is read-only and uses `SUPABASE_SERVICE_ROLE_KEY` to query schema state via PostgREST.

It will also attempt to read `.env.local` from the repo root automatically (so you typically do not need to pass `--env-file`).

```bash
node scripts/remote-db-audit.mjs
```

If `SUPABASE_SERVICE_ROLE_KEY` is missing locally, the script will fail with:
`SUPABASE_SERVICE_ROLE_KEY required`.

## pg_cron

pg_cron is not available in local Supabase by default. Migrations that
reference pg_cron use exception guards and degrade gracefully with a
`RAISE NOTICE`. Cron-dependent features (expired job archival, deadline
notifications, search alerts) will not run automatically in local dev.

To test cron jobs manually, call the underlying functions:

```sql
SELECT private.archive_expired_job_posts();
SELECT private.notify_saved_job_deadlines();
```

## Stopping

```bash
supabase stop        # preserves data
supabase stop --backup  # preserves data with backup
supabase db reset    # wipes and re-applies migrations
```
