# Testing

This document covers how to run the Vanta Signal test suite locally and in CI.

## Prerequisites

```bash
npm install                          # install all deps
npx playwright install --with-deps   # install browser binaries for E2E
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run unit & integration tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:ci` | Run tests with V8 coverage (fails if below 70% threshold) |
| `npm run e2e` | Run Playwright E2E tests (starts preview server) |
| `npm run e2e:ci` | Run Playwright with GitHub reporter |

## Coverage Thresholds

Configured in `vitest.config.ts` — CI will fail if any metric drops below:

| Metric | Threshold |
|--------|-----------|
| Statements | 70% |
| Branches | 70% |
| Functions | 70% |
| Lines | 70% |

Coverage reports are written to `./coverage/` in lcov and JSON formats.

## Test Structure

```
src/
├── test/
│   ├── setup.ts              # Global setup (jest-dom + MSW server)
│   ├── mocks/
│   │   ├── handlers.ts       # MSW request handlers
│   │   └── server.ts         # MSW server instance
│   ├── fixtures/
│   │   ├── otter-webhook.json
│   │   ├── fireflies-webhook.json
│   │   └── zoom-webhook.json
│   └── example.test.ts       # Smoke test
e2e/
└── smoke.spec.ts              # Playwright smoke tests
```

## Writing Tests

- **Unit tests**: Co-locate with source files (`Component.test.tsx`) or place in `src/test/`
- **API mocking**: Add handlers to `src/test/mocks/handlers.ts` using MSW
- **E2E tests**: Add `.spec.ts` files to the `e2e/` directory

## CI Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on PRs and pushes to `main`:

1. **Lint & Type Check** — `tsc --noEmit` + `eslint`
2. **Unit Tests** — `vitest run --coverage` (fails on threshold miss)
3. **E2E Tests** — Playwright against a built preview (parallel with unit tests)

### Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `VITE_SUPABASE_URL` | Backend URL for builds |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key for builds |

Add these in **GitHub repo → Settings → Secrets and variables → Actions**.
