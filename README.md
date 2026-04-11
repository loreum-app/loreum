<p align="center">
  <img src="apps/web/public/loreum-logomark.png" alt="Loreum" width="80" />
</p>

<h1 align="center">Loreum</h1>

<p align="center">
  The worldbuilding platform that makes AI useful.<br/>
  Structure your fictional universe. Let AI read all of it.
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
  <a href="https://discord.gg/A2s5gZ8rcz"><img src="https://img.shields.io/discord/000000000000000000?color=5865F2&label=discord" alt="Discord" /></a>
</p>

---

Loreum is a database for fictional worlds. Track characters, relationships, timelines, organizations, maps, lore, and story structure in a purpose-built platform with instant search across everything. No scattered files, no lost notes, no contradictions.

AI plugs into all of it. Connect Claude, Cursor, or any MCP-compatible assistant, and it reads your entire world: entities, relationships, timeline, lore, style guide, and storyboard. It can also propose changes that land in a review queue for you to accept, edit, or reject before anything touches your canon.

**For novelists, screenwriters, game designers, tabletop RPG game masters, comic book writers, and anyone building a fictional universe that needs structure.**

## Features

- **Entities** - Characters, locations, organizations, and custom types with configurable field schemas, backstories, and secrets
- **Knowledge Graph** - Visual relationship editor showing how everything in your world connects (React Flow)
- **Timeline** - Events and eras on an interactive Gantt chart with drag-to-edit and custom calendar support
- **Lore Wiki** - Canonical world articles with entity mentions, categories, and tags
- **Storyboard** - Plotlines, works, chapters, and scenes cross-referenced to your world data
- **Style Guide** - Voice, tone, POV, pacing, dialogue rules, scene overrides, and per-character voice notes
- **AI Integration (MCP)** - 11 read tools and 16 write tools so any MCP-compatible AI can query and modify your world
- **Review Queue** - AI-proposed changes land in a staging area with diff view. Accept, edit, or reject individually or in batch
- **API Key Auth** - Project-scoped keys with read-only or read-write permissions for MCP authentication
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
| AI       | MCP protocol (Model Context Protocol)     |
| Storage  | Cloudflare R2 (S3-compatible)             |
| Infra    | Cloudflare CDN + Tunnel                   |
| Testing  | Vitest, Supertest, GitHub Actions CI      |
| Monorepo | Turborepo + pnpm                          |

## Quick Start

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

# Start Postgres + Redis
docker compose up -d

# Generate Prisma client, run migrations, and seed demo data
pnpm --filter api db:generate
pnpm --filter api db:migrate
pnpm --filter api db:seed

# Start development (all apps)
pnpm dev
```

API: `http://localhost:3021` | Web: `http://localhost:3020` | Swagger: `http://localhost:3021/docs`

## MCP Server

Connect any MCP-compatible AI to read and write your world data. Generate a project-scoped API key from project settings, then configure your client:

```json
{
  "mcpServers": {
    "loreum": {
      "command": "node",
      "args": ["path/to/loreum/apps/mcp/dist/index.js"],
      "env": {
        "MCP_API_BASE_URL": "https://loreum.app/api/v1",
        "MCP_API_TOKEN": "your-api-key"
      }
    }
  }
}
```

All write operations go through the review queue. [Full MCP documentation](https://loreum.app/docs/mcp).

## Project Structure

```
apps/
  api/          NestJS API (Prisma, BullMQ, WebSocket)
  web/          Next.js frontend (shadcn/ui, React Flow)
  mcp/          MCP server for AI tool integration
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
