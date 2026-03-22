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
├── smoke.spec.ts              # @smoke — fast critical-path checks
├── auth.spec.ts               # @auth — authentication flows
├── dashboard.spec.ts          # @dashboard — dashboard & onboarding
├── signal-map.spec.ts         # @graph — relationship graph interactions
├── workflow.spec.ts           # @workflow — alert rule creation
├── alerts.spec.ts             # @alerts — cooling alerts & signal detail
└── navigation.spec.ts         # @navigation — route coverage
```

## E2E Test Labels

Tests are tagged with labels for selective execution:

| Tag | Scope | CI Policy |
|-----|-------|-----------|
| `@smoke` | Critical path (login form, redirects, 404) | Runs on every PR |
| `@auth` | Authentication flows | Runs on every PR |
| `@auth-required` | Needs active session | Runs on merge to main only |
| `@dashboard` | Dashboard rendering | Split: unauthenticated on PR, authenticated on main |
| `@graph` | Signal map / relationship graph | Authenticated only |
| `@workflow` | Workflow/alert rule builder | Authenticated only |
| `@alerts` | Cooling alerts & signal drill-down | Authenticated only |
| `@navigation` | All route loading | Split by auth requirement |
| `@failure-path` | Error/network failure scenarios | Runs on every PR |

### Running by tag

```bash
# Smoke tests only (fast)
npx playwright test --grep "@smoke"

# All auth-related tests
npx playwright test --grep "@auth"

# Everything except auth-required tests
npx playwright test --grep-invert "@auth-required"

# Failure path tests
npx playwright test --grep "@failure-path"

# Full suite
npx playwright test
```

## Writing Tests

- **Unit tests**: Co-locate with source files (`Component.test.tsx`) or place in `src/test/`
- **API mocking**: Add handlers to `src/test/mocks/handlers.ts` using MSW
- **E2E tests**: Add `.spec.ts` files to the `e2e/` directory with appropriate tag labels

### Adding data-testid selectors

When adding new testable UI elements, use `data-testid` attributes for stable selectors:

```tsx
<button data-testid="my-action-btn">Click me</button>
```

In tests:
```ts
await page.getByTestId("my-action-btn").click();
```

**Current data-testid inventory:**

| Selector | Component | Purpose |
|----------|-----------|---------|
| `auth-form` | Login.tsx | Auth form container |
| `email-input` | Login.tsx | Email field |
| `password-input` | Login.tsx | Password field |
| `auth-submit` | Login.tsx | Submit button |
| `auth-error` | Login.tsx | Error message |
| `auth-message` | Login.tsx | Success message |
| `dashboard-root` | Index.tsx | Dashboard container |
| `dashboard-greeting` | Index.tsx | Greeting heading |
| `graph-page` | Graph.tsx | Graph page container |
| `force-graph-container` | RelationshipGraph.tsx | Force graph canvas |
| `workflow-builder` | WorkflowBuilder.tsx | Workflow section |
| `new-workflow-btn` | WorkflowBuilder.tsx | New workflow button |
| `workflow-name-input` | WorkflowBuilder.tsx | Workflow name field |
| `create-workflow-submit` | WorkflowBuilder.tsx | Create workflow button |
| `cooling-alerts` | CoolingAlerts.tsx | Cooling alerts section |

## CI Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on PRs and pushes to `main`:

### On Pull Requests
1. **Lint & Type Check** — `tsc --noEmit` + `eslint`
2. **Unit Tests** — `vitest run --coverage` (fails on threshold miss)
3. **E2E Smoke Tests** — `@smoke` tagged tests only (fast)

### On Merge to Main
All of the above plus:
4. **E2E Full Suite** — all Playwright tests including `@auth-required`

### CI Configuration

- **Retries**: 2 retries in CI for flaky test mitigation
- **Screenshots**: Captured on failure only
- **Traces**: Captured on first retry
- **Reporter**: GitHub reporter in CI, HTML reporter locally
- **Parallelism**: Single worker in CI for stability

### Required GitHub Secrets

| Secret | Purpose |
|--------|---------|
| `VITE_SUPABASE_URL` | Backend URL for builds |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Anon/publishable key for builds |
| `E2E_AUTHENTICATED` | Set to `1` to enable authenticated E2E tests |

Add these in **GitHub repo → Settings → Secrets and variables → Actions**.

## Authenticated E2E Tests

Tests tagged `@auth-required` need a live session. Options:

1. **Locally**: Log in via the preview browser, then run tests (shared cookie jar)
2. **CI**: Set `E2E_AUTHENTICATED=1` secret and provide session tokens via `storageState`

For Google OAuth testing in CI:
- OAuth is NOT tested via browser automation (Google blocks headless browsers)
- OAuth flow is verified via integration tests with MSW mocking
- The redirect and callback handling is tested at the component level

## Failure Path Testing

The `@failure-path` tag covers error scenarios:
- Network errors when loading signal data
- API returning 500 errors
- Empty state handling when no data exists

These use Playwright's `page.route()` to intercept and mock API responses.
