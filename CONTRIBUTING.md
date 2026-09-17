# Contributing to Loreum

Thank you for your interest in contributing to Loreum! This guide covers everything you need to get started.

## Getting Started

### Prerequisites

- Node.js 22.12+
- pnpm 12 (`corepack enable` picks up the pinned version from `package.json`)
- Docker (for PostgreSQL and Redis)

### Setup

```sh
# Clone the repo
git clone https://github.com/loreum-app/loreum.git
cd loreum

# Install dependencies
pnpm install

# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start infrastructure (Postgres + Redis)
docker compose up -d

# Generate the Prisma client and run database migrations
pnpm --filter api db:generate
pnpm --filter api db:migrate

# Seed demo data (optional)
pnpm --filter api db:seed

# Start all apps in development
pnpm dev
```

The API runs on `http://localhost:3021`, the web app on `http://localhost:3020`.

## Project Structure

```
apps/
  api/          NestJS API (Prisma, BullMQ, OAuth server, MCP endpoint under src/mcp)
  web/          Next.js frontend (App Router, React Flow)
packages/
  types/        Shared TypeScript interfaces (@loreum/types)
  ui/           Shared UI primitives (@loreum/ui, shadcn on top of Base UI)
  typescript-config/
  eslint-config/
docs/           Product spec, architecture, ERD, deployment guide
```

## Development Workflow

### Branch Naming

```
feat/short-description     # New feature
fix/short-description      # Bug fix
docs/short-description     # Documentation
refactor/short-description # Code refactoring
chore/short-description    # Tooling, dependencies, repo hygiene
```

### Commit Messages

Lead with the area, then what changed. The PR description carries the why.

```
mcp: tell callers how to fill timeline dates for the world's calendar mode
oauth: support Client ID Metadata Documents (CIMD)
entities: enforce FREE project limit
```

A pre-commit hook (husky + lint-staged) runs Prettier and ESLint on staged files.

### Pull Request Process

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** — keep PRs focused on one thing
3. **Write the test first** (see [Testing](#testing)), then the change
4. **Run the checks locally** before pushing — these are the same four jobs CI runs:
   ```sh
   pnpm check-types            # tsc across every package
   pnpm lint                   # ESLint; CI fails on errors, warnings are capped
   pnpm build                  # every package compiles
   pnpm --filter api test:unit # API unit tests (no database)
   pnpm --filter web test      # web component tests (jsdom)
   pnpm --filter api test      # API integration tests (needs Postgres + Redis running)
   ```
5. **Open a PR** against `main` with a clear description:
   - What does this change?
   - Why is it needed?
   - How was it tested?
   - Screenshots if it's a UI change
6. **Respond to review feedback** — we aim to review PRs within 48 hours

### What Makes a Good PR

- **Small and focused** — one feature or fix per PR, not a kitchen sink
- **Tests included** — new code has tests, bug fixes include a regression test
- **No unrelated changes** — don't refactor surrounding code unless that's the purpose of the PR
- **Screenshots for UI changes** — before/after if modifying existing UI

## Testing

Both apps use [Vitest](https://vitest.dev). Work red-green: write the test that
describes the behaviour you want, watch it fail for the reason you expect, then
make it pass. A test that was only ever seen passing has not proven much.

### API (`apps/api`)

- Integration specs live next to the module they cover (`src/<module>/<module>.spec.ts`)
  and boot the real NestJS app against a real Postgres via Supertest. Every
  domain module should have one; use the existing specs as templates.
- `src/test/helpers.ts` provides `createTestApp`, `createAuthenticatedUser`,
  `giveSubscription`, and `cleanDatabase`. Test users start on the FREE plan
  (one project); call `giveSubscription(prisma, userId, "PRO")` when a test
  needs more.
- The suite truncates every table between tests, so never point `DATABASE_URL`
  at a database you care about.
- `pnpm --filter api test:unit` runs only `src/common` and needs no database.

### Web (`apps/web`)

- Tests are colocated as `*.test.tsx` next to the component or hook.
- The environment is jsdom with React Testing Library; `vitest.setup.ts`
  registers the jest-dom matchers and unmounts between tests.
- Mock the network at the `@/lib/api` boundary, not inside components. Keep
  `ApiError` real so the code under test sees the same error shape as production:
  ```ts
  vi.mock("@/lib/api", async (importOriginal) => ({
    ...(await importOriginal<typeof import("@/lib/api")>()),
    api: vi.fn(),
  }));
  ```
- Test through what a user sees (labels, roles, text), not implementation details.

## Code Conventions

### TypeScript

- Strict mode enabled
- No `any` unless absolutely necessary (and documented why)
- Use types from `@loreum/types` for anything the API returns. Don't redeclare
  an API shape locally; narrow the shared type with `Pick<...>` if a component
  only needs some fields.

### API (NestJS)

- One module per domain (entities, timeline, lore, etc.)
- Services contain business logic, controllers are thin
- DTOs for all request validation (class-validator)
- Use the global Prisma exception filter - don't catch Prisma errors in services
- Throw NestJS HTTP exceptions (`NotFoundException`, `ForbiddenException`, etc.) from services
- Normalise optional text at the boundary: an empty string from a client is stored as `null`

### Frontend (Next.js)

- App Router with file-based routing under `app/`
- Client components (`"use client"`) only when state/effects are needed
- Colocate route-specific components in `_components` directories; shared
  components live in `components/`
- UI primitives (button, dialog, dropdown, …) come from `@loreum/ui`
- Surface API error messages from `ApiError` rather than a generic fallback
  when the server's message is meaningful to the user (plan limits, validation)
- Reset dialog form state by remounting the form (a keyed child rendered only
  while `open`) rather than syncing props into state in an effect

### Database

- All migrations go through Prisma Migrate; write them with `prisma migrate dev --create-only` and review the SQL
- New columns are nullable or have a default
- Never modify a migration file after it's been applied
- Seed data should be idempotent (use `upsert`)

## Architecture Decisions

Key architectural decisions are documented in [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md) and [`docs/SYSTEM_ARCHITECTURE.md`](docs/SYSTEM_ARCHITECTURE.md).

If you're proposing a significant architectural change, please open an issue first to discuss the approach before writing code.

## Reporting Issues

- Use GitHub Issues for bugs, feature requests, and questions
- Include reproduction steps for bugs
- Check existing issues before opening a new one

## License

By contributing, you agree that your contributions will be licensed under the project's license.
