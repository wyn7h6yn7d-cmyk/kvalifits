# Kvalifits

Estonian skills-first job board (Next.js + TypeScript + Supabase). Locales: Estonian, English, Russian.

## Getting started

```bash
npm install
# Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app always prefixes locales (`/et`, `/en`, `/ru`).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript (`tsc --noEmit -p tsconfig.typecheck.json`) |
| `npm test` | Unit / integration tests |
| `npm run test:e2e` | Playwright smoke tests |
| `npm run test:security` | Live remote RLS suite (needs `SUPABASE_SERVICE_ROLE_KEY`) |

Details, CI notes, and optional authenticated E2E env vars: [docs/testing.md](docs/testing.md).

Production error monitoring (Sentry): [docs/monitoring.md](docs/monitoring.md).
