# Changelog

## [Unreleased]

### MCP Authentication & Review Queue

- **API key model**: `ApiKey` table with project scoping, bcrypt-hashed keys, read-only/read-write permissions, expiration, revocation, last-used tracking
- **Review queue model**: `PendingChange` table with operation type (CREATE/UPDATE/DELETE), target model, proposed data, previous data snapshot for diffs, batch grouping by AI session, accept/reject status
- **Prisma schema**: Added `ApiKeyPermission`, `ChangeOperation`, `ChangeStatus` enums; `ApiKey` and `PendingChange` models with relations on `Project`

### Product Spec Updates

- **Section 12 (AI Features)**: Full MCP tool surface documented (11 read tools, 16 write tools), API key authentication flow, resource table
- **Section 16 (Review Queue)**: Complete staging area spec with PendingChange model, write flow, diff UX for updates/creates/deletes, batch operations, collaborator suggestion mode
- **Section 21 (API & Integrations)**: API key management added to feature table

### Landing Page & Marketing

- **Homepage**: New hero ("Every character, faction, and timeline in one searchable place"), "What AI can do" section (6 use cases), expanded audiences (6 types: novelists, screenwriters, game designers, TTRPG GMs, comic book writers, collaborative teams), "How it works" 3-step flow
- **About page**: Reframed as "structured creative backend for AI-assisted writing", added Style Guide, Review Queue, and API Key Authentication feature sections
- **Pricing**: Free tier now lists style guide, MCP read+write, API keys, review queue; new FAQ about review queue; added comparison rows for style guide, API keys, review queue
- **MCP docs**: Full rewrite with API key auth, separate read/write tool tables, review queue section
- **Roadmap**: New v0.2 phase "AI Integration" (style guide, API keys, review queue, expanded tools), phases renumbered
- **What's New**: Added v0.2.0 "AI Integration" entry (coming soon)
- **Blog**: MCP post rewritten with review queue, style guide, expanded tools
- **Compare**: Added AI review queue and style guide rows, updated competitor differentiators
- **Navigation**: Pricing pulled to top-level nav link, Compare moved into Product dropdown, Resources cleaned up
- **Site-wide**: Meta description and footer tagline updated to "Structured worldbuilding for AI-assisted writing"

### TODO

- Added MCP Authentication & Review Queue section with API keys, staging area backend, review queue UX, and all planned MCP tools as individual tasks

## [0.1.0] - 2026-04-02

Initial open source release.

### Core Platform

- **Monorepo**: Turborepo + pnpm workspaces with apps (api, web, mcp) and packages (types, ui, typescript-config, eslint-config)
- **NestJS API**: Global validation pipe, Swagger docs (dev), helmet, CORS, cookie-parser, health check endpoint
- **Prisma 7.6**: PostgreSQL with full schema — users, projects, entities (characters, locations, organizations, custom items), relationships, timeline events, eras, lore articles, tags, plotlines, works, chapters, scenes, maps, notifications
- **Next.js 16 frontend**: Project dashboard, entity CRUD for all types, relationship graph (React Flow), timeline with Gantt chart, lore articles, storyboard with plotlines/works/chapters/scenes
- **Docker Compose**: PostgreSQL 18 + Redis 7 + OpenSearch 2.14 with health checks

### Auth

- Google OAuth2 with Passport
- Database sessions with token family rotation and replay detection
- JWT with rolling refresh (configurable TTL)
- CSRF protection (HMAC-signed tokens)
- Dual transport: httpOnly cookies for web, bearer tokens for MCP/mobile
- Session management UI (list, invalidate, logout)

### Worldbuilding

- Entity system with polymorphic extensions (Character, Location, Organization, Item)
- Custom entity types with configurable field schemas
- Bidirectional relationships with visual knowledge graph editor
- Timeline with eras, Gantt visualization, drag-to-edit, custom calendar support
- Lore wiki with categories, tags, and entity mentions
- Tags system with per-entity and per-article tagging

### Storyboard

- Plotlines with hierarchical sub-plotlines and thematic statements
- Plot points linked to entities, scenes, and timeline events
- Works with chronological/release ordering and status tracking
- Chapters and scenes with POV character, location, and plotline linking
- Inline edit/delete for all storyboard items

### AI Integration

- MCP server with stdio transport
- Query tools: search, get entity, entity hub, list entities, storyboard, entity types
- Mutation tools: create/update entities, relationships, lore articles
- Project overview resource

### Infrastructure

- BullMQ queue system with event-driven architecture (notifications, search indexing, maintenance)
- 3-tier rate limiting via @nestjs/throttler
- Prisma exception filter (P2002/P2025/P2003/P2018 → proper HTTP status codes)
- Shared types package (`@loreum/types`) covering all domain modules

### Testing & CI

- Vitest + Supertest test suite (unit + integration)
- GitHub Actions CI: lint, type-check, unit tests, integration tests (ephemeral Postgres/Redis), build
- Pre-commit hooks via Husky + lint-staged (Prettier + ESLint)

### Documentation

- Product specification with feature tiers (free/pro)
- System architecture diagrams (context, component, data flow, deployment)
- API reference (REST, WebSocket, MCP)
- User journeys
- Deployment guide
- Contributing guide, code of conduct, security policy
- Star Wars demo seed data
