# Contributing to Loreum

Thank you for your interest in contributing to Loreum! This guide covers everything you need to get started.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL and Redis)

### Setup

```sh
# Clone the repo
git clone https://github.com/your-org/loreum.git
cd loreum

# Install dependencies
pnpm install

# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/mcp/.env.example apps/mcp/.env

# Start infrastructure (Postgres + Redis)
docker compose up -d

# Run database migrations
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
  api/          NestJS API (Prisma, BullMQ, WebSocket gateway)
  web/          Next.js frontend (shadcn/ui, Tiptap, React Flow)
  mcp/          MCP server for AI tool integration
packages/
  types/        Shared TypeScript interfaces (@loreum/types)
  ui/           Shared UI components
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
```

### Commit Messages

Use concise, descriptive commit messages. Lead with what changed, not why (the PR description covers why).

```
add character member management UI
fix timeline event date parsing for UTC
update entity service to handle extension fields
```

### Pull Request Process

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** — keep PRs focused on one thing
3. **Write/update tests** for any new functionality
4. **Run the checks locally** before pushing:
   ```sh
   pnpm build        # Ensure all packages compile
   pnpm lint         # Check code style
   pnpm test         # Run test suites
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

## Code Conventions

### TypeScript

- Strict mode enabled
- No `any` unless absolutely necessary (and documented why)
- Use types from `@loreum/types` for shared interfaces between API and frontend
- Prefer `interface` over `type` for object shapes

### API (NestJS)

- One module per domain (entities, timeline, lore, etc.)
- Services contain business logic, controllers are thin
- DTOs for all request validation (class-validator)
- Use the global Prisma exception filter - don't catch Prisma errors in services
- Throw NestJS HTTP exceptions (`NotFoundException`, `ConflictException`, etc.) from services

### Frontend (Next.js)

- App router with file-based routing
- Client components (`"use client"`) only when state/effects are needed
- Colocate components with routes in `_components` directories
- Global/shared UI primitives go in `components/ui/`
- Use `@loreum/types` for API response types
- Install shadcn components: `pnpm dlx shadcn@latest add [component] -c apps/web`

### Database

- All migrations go through Prisma Migrate
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
