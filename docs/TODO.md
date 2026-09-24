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

### Change History & Revert

Replaces the review queue. Design: [CHANGE_HISTORY.md](CHANGE_HISTORY.md)

- [ ] Drop `PendingChange` model and `ChangeStatus` enum (unused); keep `ChangeOperation` for change records
- [ ] `ChangeEvent` / `ChangeRecord` models + migration
- [ ] `ChangeLogService`: record before/after rows in the same transaction as each write, with actor and source
- [ ] Route every world write through it (REST services and MCP tools)
- [ ] Snapshot the cascaded subtree on deletes (relationships, timeline links, lore mentions, scene appearances, tags, org members)
- [ ] Revert one event: reverse order, restore original ids, skip and report fields changed since
- [ ] Revert to a point in time as one `REVERT_TO_TIME` event
- [ ] Preview endpoints for both reverts (net effect grouped by entity)
- [ ] History endpoints: paginated list with entity/source filters, earliest revertable time; owner-only
- [ ] Retention job on the maintenance queue: prune events older than 30 days only beyond the newest 500 per project
- [ ] History page: event list, per-event revert, "Revert world to…" with earliest-time banner
- [ ] History tab on entity, lore, and scene pages
- [ ] Revert preview dialog

### Global Design & Polish

- [ ] Global design pass - typography, spacing, color consistency
- [ ] Responsive polish (mobile nav, sidebar behavior)
- [ ] Screenshot/GIF in README (after UX pass)
- [ ] Smoke test: login > create project > create entity > view graph > storyboard flow

### UX Polish

#### Storyboard

- [ ] Scenes: multi-character picker (SceneCharacter join table exists, no UI)
- [ ] Scenes: timeline event link in create/edit forms
- [ ] Plot points: support multiple entities (separate pickers for Characters, Locations, Orgs, item types)

#### Entities

- [ ] Configurable field schemas for Characters, Locations, Organizations (same pattern as Items - add `fieldSchema` JSON column). Hardcoded fields become defaults. Enables RPG stats (STR, DEX, etc.), custom attributes per project
- [ ] Create entity dialog: add secrets, notes fields
- [ ] Organization member management UI (OrgMember table exists, no UI)

#### Lore

- [ ] Add connected entities from the lore article UI
- [ ] What other metadata does lore need? (hierarchy, backlinks, etc.)

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

- [ ] Add `StyleGuide` model to Prisma schema (one per project, structured text fields)
- [ ] Add `voiceNotes` field to `Character` extension
- [ ] Add `styleNotes` field to `Scene` model
- [ ] Prisma migration
- [ ] Style guide service + controller (GET/PUT `/projects/:slug/style-guide`)
- [ ] MCP tool: `get_style_guide` - read tool (blocked on style guide model/service/controller)
- [ ] MCP tool: `set_style_guide` - write tool (blocked on style guide model/service/controller)
- [ ] Style guide wizard UI (step-by-step: dropdowns for POV/tense/voice/tone, text areas for rules/examples)
- [ ] Style guide editor UI (full form view, accessible after wizard or directly)
- [ ] Trigger wizard on project creation (optional) + accessible from style guide page any time
- [ ] Scene create/edit form: add `styleNotes` textarea
- [ ] Character create/edit form: add `voiceNotes` textarea

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
- [ ] Activity feed and entity history: covered by Change History & Revert (see Near-Term)

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
