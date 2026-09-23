# Changelog

## [Unreleased]

### Fixes

- **Creating a custom entity type, or saving its name or description, failed with "Invalid request data".** The API build never regenerated the Prisma client, so a deploy that kept the previous client could not write the `description` column added in 0.2.2. `build` in `apps/api` now runs `prisma generate` first, and Turborepo caches the generated client with the build output. A query the client rejects is a server fault, so it now answers `500` instead of a `400` that blamed the caller's input.

**Operator:** rebuild the API (or run `pnpm --filter api db:generate`) and restart it. No migration is needed.

## [0.2.3] - 2026-09-18

### Items can be filed, moved, and untyped

- The item page has a type selector while editing: file an item that belongs to no custom type, move it between types, or clear its type back to none. Saving follows the item to its new page. Until now the untyped-items page showed such items but gave no way to act on them, so they stayed there.
- Changing an item's type can collide with a name in the destination exactly as a rename can. The uniqueness check now runs whenever the name **or** the type changes; previously a move into a type that already held that name succeeded, creating the duplicate the rule exists to prevent.
- `PATCH /projects/:slug/entities/:slug` accepts `item.itemTypeId: null` to clear a type.

Moving an entity between the built-in kinds (character, location, organization, item) is not supported: each keeps its own fields and references, so a conversion would discard data.

## [0.2.2] - 2026-09-18

### Custom entity types can be edited and deleted

- Rename a type, give it a description, or change its icon and colour from a menu beside it in the sidebar. The description replaces the generated "{name} in your world" subtitle on the type's page.
- Deleting a type now says what happens to its entities. It used to detach them silently, and because every item list is scoped to a type, those entities then appeared nowhere in the app: they could not be opened, renamed, re-typed, or deleted, though MCP clients could still read and change them. A type that still holds entities must be deleted with a disposition — move them to another type, or delete them along with it — and the API answers `409` otherwise, so no caller can strand them.
- Deleting an item cascades to its relationships, timeline links, lore mentions, scene appearances, and tags, so the confirmation reports those counts before anything is destroyed and asks for the type's name to be typed.

### Projects can be renamed, described, and deleted

- A Project panel in settings for the name, description, and visibility, plus a delete confirmed by typing the project name. Renaming updates the URL, breadcrumb, and sidebar in place.
- Visibility is chosen when a project is created, not only afterwards from the overview page where people could not find it. Private is still the default.

### Fixes

- **Entities created on a custom type's page were not filed under it.** The create dialog never sent the type, so every item was stored untyped and vanished from the page that had just created it. Items with no type now also have a page of their own, reachable from the sidebar whenever any exist, so nothing is stranded.
- **Entity names are unique within a type.** Two characters called "Guard" are refused; a "Guard" character and a "Guard" location are fine, as are an "Excalibur" in Weapons and one in Relics. Comparison ignores case and surrounding space.
- Entity pickers name the real type — "Sting (Weapons)", "John (Character)" — instead of the built-in `ITEM`. Public wiki pages do the same.
- Failed project and entity creation shows the server's own message instead of a generic one.
- Clearing a description stores it as empty rather than keeping the old text.

### Free plan

- Plan limits are not enforced while billing is disabled: there is no way to pay yet, so blocking a second project would be a dead end. Free users instead see a warning on the projects page that creating several private projects is temporary, and what the Free plan will include when paid plans launch. `GET /billing/me` gained `planLimits` to support it.

### MCP

- `create_entity_type`, `update_entity_type`, `delete_entity_type`, `get_entity_type_deletion_impact`, and `update_project` (name, description, visibility). Write tools stay hidden from read-only credentials, and `delete_entity_type` refuses to strand entities exactly as the REST endpoint does.

### Deployment

- Migration `20260916120000_item_type_description` adds a nullable `description` column to `item_types`. Additive and safe to apply online.
- `BILLING_ENABLED` is declared in `turbo.json`; default behaviour is unchanged.

## [0.2.1] - 2026-09-18

### ChatGPT

- `search` and `fetch` tools implementing ChatGPT's connector contract (`structuredContent` mirrored as text; citation URLs to the wiki for public/unlisted worlds, to the app for private ones). ChatGPT's regular connectors and deep research work; developer mode exposes every tool.

### MCP OAuth

- **Client ID Metadata Documents** (the registration method MCP recommends and claude.ai prefers): `https` client ids are resolved to their metadata document with an SSRF-hardened fetch (public addresses only, socket pinned to the validated address, no redirects, 5 s / 64 KiB limits), cached for an hour. Advertised via `client_id_metadata_document_supported`. Dynamic registration remains available.
- Bearer scheme accepted case-insensitively; every OAuth and MCP request outcome is logged.

### Tests no longer destroy development data

- The API integration suite truncates every table between tests and, locally, inherited `DATABASE_URL` from `apps/api/.env` — the development database. Running the suite emptied the worlds and sessions being worked on. Global setup now creates `<name>_test`, applies the committed migrations to it with `prisma migrate deploy`, points the suite there, and drops it when the run ends.
- A guard in `cleanDatabase` and `createTestApp` refuses to touch any database whose name does not end in `_test`, so a misconfigured environment fails loudly instead of deleting data.

### Web test harness

- Vitest with jsdom and Testing Library in `apps/web`, a `test` script, and a CI step in the unit-tests job. Covers the `api()` client: success, 204, the server's own error message, status on `ApiError`, joined validation lists, non-JSON bodies.

### Documentation

- Real-time features are marked planned rather than shipped: there is no WebSocket gateway, no SSE handler, and no notifications module. Records the transport decision — **SSE** for one-directional server-to-client events, **WebSockets** reserved for bidirectional collaboration (Yjs sync, presence).
- Cloudflare's "Block AI training bots" setting returns 403 to hosted MCP clients at the edge; the deployment guide and MCP docs now give the WAF skip rule.
- `CONTRIBUTING.md` matched an older layout (Node 20 / pnpm 9, an `apps/mcp` package that does not exist, primitives under `components/ui`). It now reflects the engines in `package.json`, the real structure, the four CI jobs and the commands they run, and asks for red-green tests.

## [0.2.0] - 2026-09-05

### Toolchain

- pnpm 12, Node >= 22.12 (CommonJS API now `require()`s NestJS 12's ESM packages).
- NestJS 12, TypeScript 6.0, ESLint 10, Vitest 5, bullmq 6 (+ `ioredis`), lucide-react 1.x, react-day-picker 10, Next 16.3, React 19.2.8, Prisma 7.10 (Prisma 8 is still a release candidate).
- `eslint-plugin-react` removed from the shared config (no ESLint 10 release); Next and react-hooks plugins remain. TypeScript 7 is held back until typescript-eslint supports it.

### MCP: OAuth connectors, SDK v2, full tool surface

- **Per-project MCP URL** `/v1/mcp/:projectSlug`; the URL is the OAuth resource so tokens for one world are rejected by every other world. Legacy `/v1/mcp` kept for API keys.
- **OAuth 2.1 authorization server** in the API: RFC 8414/9728 discovery, RFC 7591 dynamic client registration, PKCE S256, single-use codes consumed atomically, opaque hashed access/refresh tokens, rotating refresh with reuse detection (revokes the connection), RFC 7009 revocation, RFC 9207 `iss`, loopback redirect matching for Claude Code. 401s advertise `WWW-Authenticate: Bearer resource_metadata=…` so claude.ai, Claude Code, and Cursor connect from the URL alone.
- **Consent page** (`/authorize`) in the web app with world and permission choice; Google sign-in honours `return_to`.
- **Connected apps** list + disconnect in project settings; new "Connect AI" panel with per-client instructions. API keys repositioned as the fallback for scripts/header-only clients.
- **MCP SDK v2** (`@modelcontextprotocol/server` + `node`): stateless `createMcpHandler`, serves protocol 2026-07-28 and 2025-era clients.
- **Tools**: 16 read + 20 write tools with titles, read-only/destructive annotations, deterministic ordering, slimmed responses, error shaping; read-only credentials never see write tools. New: eras, plotlines, works, chapters, scenes (with prose), tags on entities (auto-created), cross-content `search_project` (entities, lore, timeline, scenes) also backing `GET /projects/:slug/search`.
- **Security**: cross-project reference checks on raw-id fields (timeline events, scenes, item types, maps, parent organizations); rate limiting per credential instead of per IP for bearer traffic; CORS opened only for OAuth/MCP paths.
- **Billing switch**: `Subscription` model, `EntitlementsService` with plan feature/limit table, `BILLING_ENABLED=false` by default (no payment provider).
- **Schema**: `OAuthClient`, `OAuthAuthorizationCode`, `McpConnection`, `OAuthAccessToken`, `OAuthRefreshToken`, `Subscription` (+ `Plan`, `SubscriptionStatus`). Migration `20260905120000_mcp_oauth_connections`.
- **Config**: `PUBLIC_API_URL`, `WEB_URL`, `OAUTH_*`, `BILLING_ENABLED`.
- **Tests**: 50 new integration tests covering the OAuth flow, audience binding, refresh rotation, revocation, tool visibility, and a full world-building round trip.

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
