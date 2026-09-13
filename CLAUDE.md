# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Graceful-giving ("Grace Ledger" / เกรซเลดเจอร์) is a church financial management and member-communication system: offerings/tithes, expenses, funds, budgets, withdrawal approvals, ministries, members, and a news/events feed. Fullstack TypeScript, single deployable Node process (Express serves both the API and the built SPA).

The codebase is more feature-complete than `README.md` describes — the README documents an earlier "news & events" milestone only. Prefer reading `server/routers.ts` and `drizzle/schema.ts` over the README for current scope.

## Commands

Package manager is **pnpm** (see `packageManager` in `package.json`).

```bash
pnpm install          # install deps (also applies the wouter patch via patches/)
pnpm dev              # dev server: tsx watch on server/_core/index.ts, Vite middleware for the client
pnpm build            # vite build (client) + esbuild bundle of server/_core/index.ts -> dist/
pnpm start            # run the production build (dist/index.js)
pnpm check            # tsc --noEmit (project-wide type check)
pnpm format           # prettier --write .
pnpm test             # vitest run (server/**/*.test.ts only, see vitest.config.ts)
pnpm db:push          # drizzle-kit generate && drizzle-kit migrate (requires DATABASE_URL)
```

Run a single test file: `pnpm exec vitest run server/updates.access.test.ts`. Tests live under `server/` and are named `*.test.ts`; the vitest config only includes `server/**/*.test.ts` and `server/**/*.spec.ts` — client-side tests are not wired up.

There is no separate lint script; `pnpm check` (tsc) and `pnpm format` (prettier) are the enforced checks. `tsconfig.json` excludes `*.test.ts`.

## Environment

No `.env` is committed. Required variables (read in `server/_core/env.ts`):

- `DATABASE_URL` — MySQL connection string (drizzle-orm/mysql2). If unset, `getDb()` returns `null` and every DB-backed function degrades to a no-op/empty read rather than throwing — keep this behavior in mind when adding new `db.ts` functions.
- `VITE_APP_ID`, `JWT_SECRET` (session cookie signing), `OAUTH_SERVER_URL`, `OWNER_OPEN_ID` (the openId that gets auto-promoted to `role: "admin"` on first upsert), `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`.

## Architecture

### Directory layout and path aliases

- `client/` — Vite root. React 19 SPA, path alias `@` → `client/src`, `@shared` → `shared`, `@assets` → `attached_assets`.
- `server/` — Express + tRPC backend. Domain logic (`routers.ts`, `db.ts`, `storage.ts`) sits at the top of `server/`; framework plumbing (auth, context, vite dev middleware, oauth, the SDK client) lives under `server/_core/` — treat `_core` as scaffolding you extend carefully, not where new business features go.
- `shared/` — Code imported by both client and server: constants, error helpers, `shared/const.ts` (cookie name, OAuth state encode/decode, error message strings shared with the tRPC error codes on the client).
- `drizzle/` — `schema.ts` (source of truth for tables/types) and `relations.ts`, plus generated SQL migrations and `meta/` snapshots. Edit `schema.ts`, then run `pnpm db:push` to generate+apply migrations — do not hand-write migration SQL.

### Request flow

`server/_core/index.ts` boots one Express app: body parsing → storage proxy routes → OAuth routes (`server/_core/oauth.ts`) → tRPC router mounted at `/api/trpc` (`createExpressMiddleware`) → Vite dev middleware (development) or static file serving (production). Port selection auto-probes for a free port starting at `PORT`/3000.

Auth: `server/_core/context.ts` builds the tRPC context per-request by calling `sdk.authenticateRequest(req)` (reads/verifies the session cookie via `server/_core/sdk.ts`); failures just yield `user: null` rather than throwing, so public procedures keep working. The OAuth callback flow (`server/_core/oauth.ts`) exchanges a code for a token, upserts the user (`db.upsertUser`, which promotes `OWNER_OPEN_ID` to `admin`), mints a session token, and sets the `app_session_id` cookie. The OAuth `state` param carries a CSRF nonce bound to a `__Host-oauth_state` cookie — see the comments in `shared/const.ts`/`server/_core/oauth.ts` before touching this flow.

### tRPC API (`server/routers.ts`)

Single `appRouter` composed of sub-routers by domain: `auth`, `church`, `finance`, `offerings`, `expenses`, `withdrawals`, `reports`, `updates` (legacy news/events), plus `system` (`server/_core/systemRouter.ts`). Client consumes it type-safely via `@trpc/react-query` (`client/src/lib/trpc.ts` imports `AppRouter` directly from `server/routers.ts` — client and server are not independently deployable packages).

Procedure layering, all defined in `routers.ts` on top of the base `publicProcedure`/`protectedProcedure` from `server/_core/trpc.ts`:
- `adminProcedure` — `user.role === "admin"`
- `financeProcedure` — admin or `churchRole` in `TREASURER`/`SUPER_ADMIN` (see `canManageFinance`)
- `churchLeaderProcedure` — admin or `churchRole` in `SUPER_ADMIN`/`PASTOR` (see `canManageChurchSettings`)

Donor names on offerings are only ever returned when `canViewDonorNames(ctx.user)` is true (same check as `financeProcedure`) — this filtering happens in `db.listOfferings`, not just at the router layer, so don't bypass it when adding new offering read paths. All mutation inputs are validated with Zod schemas inline in `routers.ts`; money fields are `z.number()` on input but persisted as decimal strings (`amount.toFixed(2)`) matching the Drizzle `decimal` column type.

There are two authorization concepts on `User` (`drizzle/schema.ts`): the coarse `role` (`user`/`admin`, used for admin-only content management like `updates.*`) and the finer-grained `churchRole` (`SUPER_ADMIN`/`PASTOR`/`TREASURER`/`MEMBER`, used for financial permissions). Both are checked independently in the permission helpers — read both when adding a new gated procedure.

### Data layer

`server/db.ts` holds all Drizzle queries as plain exported async functions (no repository classes/ORM abstraction beyond Drizzle itself). `getDb()` lazily creates a single `drizzle(DATABASE_URL)` instance and caches it in module scope; it returns `null` (never throws) if `DATABASE_URL` is missing, so callers must handle the `null`/empty case. `DEFAULT_CHURCH_ID = "demo-church"` — the schema supports multi-church (`churchId` column on most tables) but the app is currently single-tenant, hardcoded to this constant everywhere.

`server/storage.ts` and `server/_core/storageProxy.ts`/`server/_core/dataApi.ts` handle file/object storage (S3 via `@aws-sdk/client-s3`) separately from the relational data.

### Frontend

`client/src/App.tsx` is a flat `wouter` `<Switch>` of top-level routes (no nested layouts/route config file) — grouped by comment into Core/Auth, Transactions, Offerings, Expenses, Funds, Budgets, Ministries, Members, Reports, Approvals, Notifications, Settings, Updates. Pages live directly under `client/src/pages/` (one file per route, not per-feature folders). Server state goes through `@tanstack/react-query` + the tRPC client; `client/src/components/ui/` is the shadcn/Radix primitive layer — extend it rather than duplicating a primitive.

### Testing

Only server-side unit tests exist today (`server/*.test.ts`), run against `appRouter.createCaller(context)` directly (no HTTP layer in tests) — see `server/updates.access.test.ts` and `server/dashboard.contract.test.ts` for the pattern: build a fake `TrpcContext` with a plain `User` object, call procedures via the caller, and assert on thrown tRPC error codes (`UNAUTHORIZED`/`FORBIDDEN`/`BAD_REQUEST`) for access-control tests.

## Notable local tooling

- `vite.config.ts` includes Manus-specific dev plugins (`vite-plugin-manus-runtime`, a custom debug-log collector writing to `.manus-logs/`) — these are dev-only (no-op/absent in production) and unrelated to app business logic; don't remove them assuming they're dead code.
- `pnpm.overrides` and `patchedDependencies` in `package.json` pin `tailwindcss`'s nested `nanoid` and patch `wouter@3.7.1` (see `patches/wouter@3.7.1.patch`) — if upgrading either package, check whether the override/patch is still needed.
