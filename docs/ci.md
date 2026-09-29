# CI pipeline

MindVault runs automated checks on every **pull request** and on pushes to **`main`** and **`develop`**.

Workflow file: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

## What runs

| Job | Purpose |
|-----|---------|
| **Lint & types** | `prisma validate`, TypeScript (`tsc --noEmit`), ESLint |
| **Unit tests** | Deterministic Node test suites (URL ingestion / SSRF) |
| **Migrations** | Fresh PostgreSQL 16 with **pgvector**; `prisma migrate deploy` + `migrate status` |
| **Production build** | `next build` (runs only if the other jobs pass) |

## Local parity

Run the same checks before pushing:

```bash
npm run ci:check
```

Individual steps:

```bash
npm ci
npx prisma generate
npx prisma validate
npm run check:types
npm run lint
npm run test:ci
npm run build
```

For migration checks locally (requires Postgres + pgvector):

```bash
export DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/mindvault_test"
npx prisma migrate deploy
npx prisma migrate status
```

## Tests in CI vs excluded

**Included**

- `src/lib/ingestion/url/*.test.ts` — URL validation, SSRF/DNS pinning, fetch limits, extraction, ingest handler (mocked network; includes ingest API **401** without session)

**Excluded (by design)**

- Live Gemini / embedding API calls
- Live public URL fetching
- Browser E2E (no Playwright/Cypress in repo yet)
- DB-backed integration tests (migrations are verified; app routes are not full integration-tested in CI yet)

## Environment variables in CI

CI uses **disposable** values only (see workflow `env`). Never commit real secrets. Names and purpose are documented in [`.env.example`](../.env.example).

## Branch protection (recommended)

On GitHub, for `main` (and optionally `develop`):

- Require a pull request before merging
- Require status checks: **Lint & types**, **Unit tests**, **Migrations (PostgreSQL + pgvector)**, **Production build**
- Require branch to be up to date before merge

## Security / dependencies

`npm audit` is not a required CI gate (many findings are transitive or CLI-only). Review advisories manually or in a scheduled workflow later.

## Optional developer workflow

Pre-push hooks (Husky, lint-staged) are **not** installed by default. CI remains the source of truth.
