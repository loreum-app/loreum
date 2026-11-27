# TODO

Tracked tasks for Loreum. Near-term is the next couple weeks, long-term is everything after.

## Done

- [x] Project visibility (private / public / unlisted)
- [x] Public wiki view (read-only, clean URLs, secrets hidden)
- [x] Landing page, about, pricing, 404
- [x] Blog, comparison pages, templates gallery
- [x] Site footer, powered-by wiki footer
- [x] Rename to Loreum
- [x] Deploy production at loreum.app (PM2 + Cloudflare Tunnel)
- [x] Create open source repo (fresh git history) - https://github.com/Loreum-App/loreum
- [x] MCP Authentication & API Keys (ApiKey model, service, controller, Bearer token auth, management UI)
- [x] Broken MCP Endpoints (search stub, entity hub aggregation, storyboard overview)
- [x] MCP OAuth 2.1 authorization server (DCR, PKCE, per-project audience binding, rotating refresh tokens, consent page, connected-apps UI) — claude.ai / Claude Code / Cursor connect with one URL
- [x] MCP SDK v2 (protocol 2026-07-28 with 2025-era fallback), per-credential rate limiting
- [x] MCP read tools (16) + cross-content search, write tools (20) incl. scene prose, tags on entities
- [x] Cross-project reference checks on raw-id fields (timeline events, scenes, item types, maps, parent orgs)
- [x] Billing switch (`BILLING_ENABLED`, plan/limits table, dormant by default)

---

## Near-Term (Next 2 Weeks)

### MCP follow-ups

- [ ] Structured tool output (`outputSchema` / `structuredContent`) once major clients consume it
- [ ] Response-size caps / pagination on large list tools
- [ ] Refresh-token grace window for dropped token responses (strict rotation today)

### Audit Ledger ✅

Append-only audit ledger replaces the planned review queue. Design: [audit-ledger-design.md](superpowers/specs/2026-11-27-audit-ledger-design.md)

- [x] Drop `PendingChange` model and `ChangeStatus`/`ChangeOperation` enums (unused)
- [x] `LedgerEntry` model + `LedgerOperation` enum + migration
- [x] `AuditLedgerService`: append, paginated query, find-by-id, undo (compensating entry), count-based pruning gated by plan
- [x] Wire every domain service (Entities, Relationships, Lore, Timeline, Eras, Storyboard, EntityTypes, Projects) with optional `AuditContext`
- [x] Wire all REST controllers to pass `auditContextFromUser(user)` on write endpoints
- [x] Wire all MCP tool files to pass `auditContextFromMcp(ctx)` on write endpoints
- [x] History REST endpoints: paginated list with targetModel/targetId filters, single entry, undo
- [x] History page UI at `/projects/:slug/history` with pagination, filtering, undo
- [x] History link in project sidebar
- [x] Plan-gated retention: FREE 500, PRO 5,000, TEAM 50,000 entries per project
- [x] History tab on entity, lore, and scene detail pages (filter by targetModel + targetId)
- [x] Undo preview dialog (show before/after data diff before confirming)

### Global Design & Polish

- [x] Global design pass - shared Breadcrumb component, standardized spacing (py-8, max-w-4xl) across all detail pages
- [ ] Responsive polish (mobile nav, sidebar behavior)
- [ ] Screenshot/GIF in README (after UX pass)
- [ ] Smoke test: login > create project > create entity > view graph > storyboard flow

### UX Polish

#### Storyboard

- [x] Scenes: multi-character picker (SceneCharacter join table exists, no UI)
- [x] Scenes: timeline event link in create/edit forms
- [x] Plot points: location picker (uses existing `locationId` FK)
- [x] Plot points: multi-entity support via join table (PlotPointEntity, chip+combobox picker)

#### Entities

- [ ] Configurable field schemas for Characters, Locations, Organizations (same pattern as Items - add `fieldSchema` JSON column). Hardcoded fields become defaults. Enables RPG stats (STR, DEX, etc.), custom attributes per project
- [x] Create entity dialog: add description, secrets, notes fields
- [x] Organization member management UI (add/remove members with role)

#### Lore

- [x] Add connected entities from the lore article UI
- [x] Lore article hierarchy (parentArticleId self-referential FK, parent picker, child articles section, cycle detection)
- [ ] Wiki-style backlinks (depends on `[[entity]]` linking in Phase 1)

#### Architecture

- [ ] Extract detail page content into reusable components for future tabbed/split-pane views

---

## Long-Term

### Site Pages

- [ ] `/migrate` - Migration guides from World Anvil, Campfire, Notion, ChatGPT/AI exports
- [ ] `/whats-new` - Changelog/updates feed (pulled from releases or markdown)
- [ ] `/docs` - User documentation (getting started, features walkthrough)
- [ ] `/docs/mcp` - MCP server setup guide for Claude Desktop, API keys
- [ ] `/docs/api` - REST API documentation (link to Swagger + key endpoints)
- [ ] `/updates` - Development blog / release notes with screenshots

### Infrastructure

- [ ] Deploy staging at staging.loreum.app (when needed)
- [ ] Dev tunnel with Cloudflare Access (dev.loreum.app)
- [ ] PR → staging → main workflow
- [ ] Webhook-based deploy from GitHub

### Style Guide

- [x] Add `StyleGuide` model to Prisma schema (one per project, structured text fields)
- [x] Add `voiceNotes` field to `Character` extension
- [x] Add `styleNotes` field to `Scene` model
- [x] Prisma migration
- [x] Style guide service + controller (GET/PUT `/projects/:slug/style-guide`)
- [x] MCP tool: `get_style_guide` - read tool
- [x] MCP tool: `update_style_guide` - write tool
- [x] Style guide editor UI (full form view, accessible from style guide page)
- N/A: wizard UI — MCP-first approach; agents use `update_style_guide` tool directly
- [x] Scene create/edit form: add `styleNotes` textarea
- [x] Character create/edit form: add `voiceNotes` textarea

### Onboarding

- [ ] Template wizard - guided onboarding flow: pick a genre template → name your world → create first characters/locations/factions → launch into a pre-configured project. Eliminates blank canvas problem. Templates pre-configure entity types, field schemas, tags, and optional plot structures

### Entities

- [ ] Image upload per entity (needs R2/S3 integration)

### Phase 1 - Polish

- [ ] Rich text editor (TipTap + ProseMirror)
- [ ] Wiki-style linking (`[[entity]]`)
- [ ] Search filters (type, tag, date range)
- [ ] Export as JSON/markdown
- [ ] OpenSearch integration for full-text search

### Phase 2 - Pro + Billing

- [ ] Stripe integration (checkout, webhooks, subscriptions)
- [ ] Free/Pro tier gating
- [ ] Additional OAuth providers (Discord, GitHub)
- [ ] Email notifications via Resend

### Phase 3 - Collaboration

- [ ] Team invitations + roles (owner, editor, viewer, commenter)
- [ ] Real-time collaborative editing (Yjs + y-websocket + TipTap)
- [ ] Presence indicators (cursors)
- [ ] Activity feed and entity history: foundation is the Audit Ledger (see Near-Term); needs per-entity history tabs and activity feed UI

### Phase 4 - Game Design

- [ ] Quest/story flowchart - branching narrative editor using React Flow node graph. Model quest paths, decision points, and outcomes as connected nodes with choice/condition edges
- [ ] Dialogue editor - conversation tree builder with speakers, lines, conditions, and branching responses. Structured tree UI distinct from the flowchart
- [ ] Maps - interactive pan/zoom, pin entity locations with coordinates, multiple layers, drawing tools (borders, routes)
- [ ] Plot structure templates - Hero's Journey, Save the Cat, Snowflake Method, or create your own

### Phase 5 - AI + Advanced

- [ ] In-app AI chat (query your world, talk to characters, roleplay - grounded in your lore)
- [ ] AI writing assistance in scene editor
- [ ] Consistency checking - AI-powered contradiction and timeline conflict detection
- [ ] AI image generation (Pro) - character portraits, location art, scene illustrations from lore context. Also produces marketing/promo assets for the platform
- [ ] PDF export (world bible / campaign sourcebook with entity cards, chapters, lore - ready to print)
- [ ] PDF/image import - upload existing notes, campaign PDFs, handwritten scans to bootstrap a project
- [ ] Free generators (no account required) - character, name, location, monster generators. SEO acquisition funnel
- [ ] i18n

### Phase 6 - Platform

- [ ] Offline desktop app - work without internet, sync when reconnected
- [x] API key generation + bearer auth
- [ ] REST API documentation page (`/docs/api`)
- [x] Rate limiting per API key / credential
- [ ] Webhook support (entity created/updated/deleted events)
- [ ] Cultures & species modules - dedicated modules for languages, rituals, value systems, biological traits
- [ ] Discovery & magic systems - track technologies, magic schools, spells, and their interactions
- [ ] Session notes (TTRPG) - per-session notes linked to timeline events, with audio summary import
