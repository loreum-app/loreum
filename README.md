<p align="center">
  <img src="apps/web/public/loreum-logomark.png" alt="Loreum" width="80" />
</p>

<h1 align="center">Loreum</h1>

<p align="center">
  Every character, faction, and timeline in one searchable place.<br/>
  The worldbuilding platform that makes AI useful.
</p>

<p align="center">
  <a href="https://loreum.app">Website</a> ·
  <a href="https://discord.gg/A2s5gZ8rcz">Discord</a> ·
  <a href="https://loreum.app/roadmap">Roadmap</a> ·
  <a href="https://loreum.app/docs">Docs</a>
</p>

<p align="center">
  <a href="https://github.com/loreum-app/loreum/actions"><img src="https://github.com/loreum-app/loreum/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue" alt="License" /></a>
  <a href="https://discord.gg/A2s5gZ8rcz"><img src="https://img.shields.io/discord/1492392236867125422?color=5865F2&label=discord" alt="Discord" /></a>
</p>

---

Loreum is a database for fictional worlds. Track characters, relationships, timelines, organizations, maps, lore, and story structure in a purpose-built platform with instant search across everything. No scattered files, no lost notes, no contradictions.

AI plugs into all of it. Connect Claude, Cursor, or any MCP-compatible assistant with one URL per world, approve read or read-and-write access, and it reads your entire world: entities, relationships, timeline, lore, and storyboard. With write access it can create and edit them too; a review queue for AI-proposed changes is next on the roadmap.

**For novelists, screenwriters, game designers, tabletop RPG game masters, comic book writers, and anyone building a fictional universe that needs structure.**

## Features

- **Entities** - Characters, locations, organizations, and custom types with configurable field schemas, backstories, and secrets
- **Knowledge Graph** - Visual relationship editor showing how everything in your world connects (React Flow)
- **Timeline** - Events and eras on an interactive Gantt chart with drag-to-edit and custom calendar support
- **Lore Wiki** - Canonical world articles with entity mentions, categories, and tags
- **Storyboard** - Plotlines, works, chapters, and scenes cross-referenced to your world data
- **Style Guide** - Voice, tone, POV, pacing, dialogue rules, scene overrides, and per-character voice notes
- **AI Integration (MCP)** - Remote MCP server (SDK v2) with 36 tools; connect claude.ai, Claude Code, Cursor and others with one URL per world
- **OAuth 2.1 + API Keys** - Built-in authorization server (PKCE, rotating refresh tokens, per-world token binding, connected-apps management) plus project-scoped API keys
- **Public Wiki** - Share your world as a read-only site while keeping secrets and drafts private
- **Maps** - Upload map images and pin locations with coordinates
- **Search** - Full-text search across all content

## How It Works

1. **Build your world** in the Loreum web app with entities, relationships, timelines, lore, and a style guide
2. **Add AI** by bringing your own via MCP or using the built-in assistant. Build solo or invite collaborators
3. **Write with context** as AI reads your canon to generate grounded content. Proposed changes go through a review queue

## Tech Stack

| Layer    | Technology                                |
| -------- | ----------------------------------------- |
| Frontend | Next.js 16, React 19, shadcn/ui, Tailwind |
| API      | NestJS, Prisma 7, PostgreSQL 18           |
| Queue    | BullMQ + Redis 7                          |
| Auth     | OAuth2 (Google) + JWT with token rotation |
| Graph    | React Flow (@xyflow/react)                |
| AI       | MCP (SDK v2, Streamable HTTP, OAuth 2.1)  |
| Storage  | Cloudflare R2 (S3-compatible)             |
| Infra    | Cloudflare CDN + Tunnel                   |
| Testing  | Vitest, Supertest, GitHub Actions CI      |
| Monorepo | Turborepo + pnpm                          |

## Quick Start

```sh
# Clone the repo
git clone https://github.com/loreum-app/loreum.git
cd loreum

# Install dependencies (pnpm 12, Node 22.12+)
pnpm install

# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start Postgres + Redis
docker compose up -d

# Generate Prisma client, run migrations, and seed demo data
pnpm --filter api db:generate
pnpm --filter api db:migrate
pnpm --filter api db:seed

# Start development (all apps)
pnpm dev
```

API: `http://localhost:3021` | Web: `http://localhost:3020` | Swagger: `http://localhost:3021/docs` (requires `ENABLE_SWAGGER=true` in `apps/api/.env`)

## MCP Server

Loreum is a remote MCP server. Every world has its own URL, shown under **Settings → Connect AI**:

```
https://api.loreum.app/v1/mcp/<project-slug>
```

Paste it into Claude (Settings → Connectors → Add custom connector), Cursor, or Claude Code:

```sh
claude mcp add --transport http loreum https://api.loreum.app/v1/mcp/<project-slug>
```

The client sends you to Loreum to sign in and approve read or read-and-write access. No keys to copy. Connected apps are listed in the world's settings and can be disconnected at any time. For scripts and header-only clients, project API keys still work as `Authorization: Bearer lrm_…`.

Self-hosted instances serve the same endpoint at `<PUBLIC_API_URL>/v1/mcp/<project-slug>` and act as their own OAuth 2.1 authorization server. [Full MCP documentation](https://loreum.app/docs/mcp).

## Project Structure

```
apps/
  api/          NestJS API (Prisma, BullMQ, MCP endpoint)
  web/          Next.js frontend (shadcn/ui, React Flow)
packages/
  types/        Shared TypeScript interfaces
  ui/           Shared UI components
  typescript-config/
  eslint-config/
docs/
  PRODUCT_SPEC.md         Full feature specification
  SYSTEM_ARCHITECTURE.md  Architecture diagrams
  API_REFERENCE.md        REST, WebSocket, MCP docs
  USER_JOURNEYS.md        User flow documentation
  ERD.md                  Entity-relationship diagram
  DEPLOYMENT.md           Production deployment guide
  TODO.md                 MVP checklist and roadmap
```

## Documentation

| Document                                           | Description                                   |
| -------------------------------------------------- | --------------------------------------------- |
| [Product Spec](docs/PRODUCT_SPEC.md)               | Complete feature specification with tiers     |
| [System Architecture](docs/SYSTEM_ARCHITECTURE.md) | Component, data flow, and deployment diagrams |
| [API Reference](docs/API_REFERENCE.md)             | REST, WebSocket, and MCP tool documentation   |
| [User Journeys](docs/USER_JOURNEYS.md)             | User flow documentation                       |
| [ERD](docs/ERD.md)                                 | Entity-relationship diagram                   |
| [Deployment](docs/DEPLOYMENT.md)                   | Production deployment guide                   |
| [TODO](docs/TODO.md)                               | MVP checklist and roadmap                     |
| [Changelog](CHANGELOG.md)                          | Version history                               |

## Community

- [Discord](https://discord.gg/A2s5gZ8rcz) - Questions, feedback, and discussion
- [Contributing](CONTRIBUTING.md) - Development setup, code conventions, PR process
- [Code of Conduct](CODE_OF_CONDUCT.md) - Community standards
- [Security](SECURITY.md) - How to report vulnerabilities

## License

[AGPL-3.0](LICENSE)
