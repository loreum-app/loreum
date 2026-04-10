# Loreum

A worldbuilding and story planning platform for writers, game designers, and storytellers. Build interconnected fictional worlds with characters, locations, organizations, and custom entity types. Visualize relationships as a knowledge graph, track history on a timeline, write canonical lore as wiki articles, and plot your narratives with a full storyboard system.

## Features

- **Entities** — Characters, locations, organizations, and custom types with configurable field schemas
- **Knowledge Graph** — Visual relationship editor showing how everything in your world connects
- **Timeline** — Events and eras on an interactive Gantt chart with drag-to-edit
- **Lore Wiki** — Markdown articles with entity mentions, categories, and tags
- **Storyboard** — Plotlines, works, chapters, and scenes cross-referenced to your world data
- **Maps** — Upload map images and pin locations with coordinates
- **Public Wiki** — Share your world as a beautiful read-only site, keeping secrets private
- **AI Integration** — MCP server lets AI tools read and write your world data
- **Search** — Full-text search across all content

See the full [Product Specification](docs/PRODUCT_SPEC.md) for planned features.

## Tech Stack

| Layer    | Technology                                       |
| -------- | ------------------------------------------------ |
| Frontend | Next.js 16, React 19, shadcn/ui, Tailwind        |
| API      | NestJS, Prisma 7, PostgreSQL                     |
| Queue    | BullMQ + Redis                                   |
| Auth     | OAuth2 (Google, Discord, GitHub, LinkedIn) + JWT |
| Storage  | Cloudflare R2                                    |
| AI       | MCP protocol                                     |
| Monorepo | Turborepo + pnpm                                 |

## Quick Start

```sh
# Install dependencies
pnpm install

# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Start Postgres + Redis
docker compose up -d

# Run migrations and seed demo data
pnpm --filter api db:migrate
pnpm --filter api db:seed

# Start development (all apps)
pnpm dev
```

API: `http://localhost:3021` | Web: `http://localhost:3020` | Swagger: `http://localhost:3021/docs`

## Project Structure

```
apps/
  api/          NestJS API (Prisma, BullMQ, WebSocket)
  web/          Next.js frontend (shadcn/ui, React Flow, Tiptap)
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

|                                       |                                                 |
| ------------------------------------- | ----------------------------------------------- |
| [Contributing](CONTRIBUTING.md)       | Development setup, code conventions, PR process |
| [Code of Conduct](CODE_OF_CONDUCT.md) | Community standards                             |
| [Security](SECURITY.md)               | How to report vulnerabilities                   |

## License

[AGPL-3.0](LICENSE)
