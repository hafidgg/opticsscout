# NOTES_DEPENDENCIES.md

Evidence log for dependency installation decisions (per Section 43: use evidence, don't
say "should work").

## Prisma version pin

- `npm install prisma @prisma/client zod` initially resolved `prisma@8.0.0-rc.13` — a
  release candidate, not stable — because a transitive dependency graph pulled in
  pre-release packages (`@prisma/dev`, `alchemy`, `@prisma/composer`).
- That RC's dependency tree flagged high-severity advisories in `@hono/node-server` and
  `hono` (path traversal / auth bypass in a dev-tooling HTTP server bundled with the RC's
  experimental tooling, not used by the app itself).
- Action taken: uninstalled, then reinstalled with explicit `--save-exact` versions
  `prisma@7.10.0 @prisma/client@7.10.0` (7.10.0 confirmed via `npm view prisma versions`
  as the latest non-prerelease tag).
- Result: `npm ls prisma @prisma/client` confirms both resolve to `7.10.0`. Verified
  2026-09-04.
- Remaining `npm audit` findings (`deepmerge-ts`, `mysql2`, both high) live inside
  Prisma CLI's MySQL-connector code path, unused by this project (Postgres-only). npm's
  suggested fix (`npm audit fix --force`) would downgrade to `prisma@6.19.3`, which is a
  regression, not a fix, so it was not applied. Flagged here rather than silently ignored.

## npm arborist bug

- Bare `npm install <pkgs>` failed twice with `Cannot read properties of null (reading
  'edgesOut')` — an npm 10.9.7 arborist bug unrelated to this project's dependencies
  (reproduced even after `npm cache clean --force`).
- Workaround: `--legacy-peer-deps` flag avoids the failing code path. This is an
  environment-level npm issue, not a project dependency conflict — noting it so a future
  session doesn't waste time re-diagnosing the same error.

## Prisma engine download blocked by sandbox network policy

- `npx prisma validate` (and by extension `generate`/`migrate`) fails with
  `403 Forbidden` fetching `schema-engine.gz` from `binaries.prisma.sh`.
- Root cause: this container's egress allowlist does not include `binaries.prisma.sh`
  (confirmed against the configured allowed-domains list — it covers npm/GitHub/PyPI/
  crates.io registries but not Prisma's binary CDN). `PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1`
  does not help — the file itself, not just its checksum, is unreachable.
- This is an environment limitation, not a schema error. `prisma/schema.prisma` has not
  been executed against the Prisma engine in this session — it is syntactically written
  to the documented conventions but **UNVERIFIED** by tooling here.
- Status: `BLOCKED — EXTERNAL NETWORK ACCESS REQUIRED`. To unblock: run
  `npx prisma validate` / `npx prisma generate` / `npx prisma migrate dev` in an
  environment with network access to `binaries.prisma.sh` (e.g. your local machine,
  CI, or a container with that domain added to the egress allowlist), and against a real
  `DATABASE_URL`.

## Prisma unblocked (2026-09-07) — different environment, different blocker

- This environment has no egress restriction to `binaries.prisma.sh` at all — `prisma
  validate`/`generate` worked immediately. The `BLOCKED — EXTERNAL NETWORK ACCESS
  REQUIRED` note above was specific to the prior sandbox; it does not apply here.
- The actual blocker here was a real Prisma 7 breaking change: `datasource.url` is no
  longer accepted directly in `schema.prisma`, and `PrismaClient` requires an explicit
  driver adapter rather than reading `DATABASE_URL` implicitly. Resolved by adding
  `prisma.config.ts` (root) and `@prisma/adapter-pg` + `pg`, and creating
  `src/lib/db/client.ts` as the Prisma Client singleton (this file didn't exist before
  since Prisma was blocked). See `prisma.config.ts` and `ARCHITECTURE.md` §2.
- `prisma.config.ts` and `src/lib/db/client.ts` both load `dotenv/config` explicitly —
  the Prisma CLI does not auto-load `.env` for `prisma.config.ts` the way Next.js does
  for app code, and neither does Vitest for test code. `dotenv` is a real (non-dev)
  dependency because `client.ts` imports it at runtime, not just for tooling.
- Local dev DB: PostgreSQL 16, role `pdcp_app`, database `pdcp_dev`, plus a separate
  `pdcp_dev_shadow` database wired via `SHADOW_DATABASE_URL` — `pdcp_app` doesn't have
  `CREATEDB`, so `migrate dev`'s shadow-database mechanism needs a pre-created shadow
  db rather than creating one itself. Both env vars are documented in `.env.example`.

## Running tests against a fresh database

`tests/integration/repository-gate.test.ts` queries the real database via
`src/lib/content/repository.ts` (no more mock-data fallback — see the mock→Prisma
swap-over). This means `npx vitest run` / `npm test` will fail on a freshly migrated,
empty database. Before running tests (or the dev server, for that matter) for the
first time, or after `prisma migrate reset`:

```bash
npx prisma migrate dev   # applies migrations (also runs the seed, per prisma.config.ts)
# or, if the DB is already migrated and just needs (re-)seeding:
npm run db:seed
```

`prisma/seed.ts` is idempotent (upserts keyed by fixed mock ids) — safe to re-run.

## Status

`PASS` — dependency set installed and pinned to stable versions; two pending audit items
are traced to an unused MySQL code path in Prisma CLI, not to app-facing code.
`PASS` — Prisma schema/engine validation, migration, and client generation (this
environment; see "Prisma unblocked" above — the network block was environment-specific
and does not apply here).
