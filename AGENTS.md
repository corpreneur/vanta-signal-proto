# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Vanta Signal is a React SPA (TypeScript + Vite) that connects to a hosted Supabase backend for database, auth, and edge functions. There is no local backend to run — the Supabase project is cloud-hosted.

### Running the app

- `npm run dev` — starts Vite dev server on port **8080** (binds to `::`, all interfaces)
- The app requires Supabase credentials in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`); these are already committed

### Key commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Lint | `npm run lint` |
| Unit tests | `npm test` (vitest) |
| Build | `npm run build` |

### Notes

- ESLint has pre-existing warnings (`react-refresh/only-export-components`, `react-hooks/exhaustive-deps`) and errors (`@typescript-eslint/no-explicit-any`) in the codebase; these are not regressions.
- Both `package-lock.json` and `bun.lock` exist; use **npm** as the primary package manager (matches lockfile and `package.json` scripts).
- Supabase Edge Functions (26 Deno-based functions in `supabase/functions/`) are deployed to Supabase cloud and do not need to run locally for frontend development.
- Playwright is configured but requires browser installation (`npx playwright install`) before e2e tests can run.
