# MCP Implementation Plan

Scoped plan for completing the MCP server to a testable state. Covers API prerequisites, auth, review queue, and MCP tool expansion.

**Created:** 2026-04-24
**Updated:** 2026-09-05
**Status:** Phases 1–3 and the OAuth phase complete (SDK v2, per-project URLs, claude.ai connectors); Phase 4 (review queue) next
**Reference:** See TODO.md > Near-Term for task tracking

---

## Review Summary

### What exists today

The MCP server is a stateless Streamable HTTP endpoint built into the API (`apps/api/src/mcp/`), served at `POST /v1/mcp`. The former stdio server (`apps/mcp/`) has been deleted. The module builds a per-request `McpServer` scoped to the authenticated API key's project, with tools calling domain services directly:

- 5 read tools: `search_project`, `get_entity`, `list_entities`, `get_storyboard`, `get_entity_types`
- 4 write tools: `create_entity`, `update_entity`, `create_relationship`, `create_lore_article`
- 1 resource: `project_overview`
- Auth via `Authorization: Bearer lrm_...` header (project API key)
- API key system with generate/list/revoke, project-scoped permissions (READ_ONLY / READ_WRITE)
- `ApiKeyAuthGuard` enforces project scoping (key only works on its own project) and READ_ONLY method restrictions on REST routes; MCP write tools check permissions per tool
- `search_project` merges entity + lore name/content queries via Prisma (real results; OpenSearch full-text is still long-term)

### What's done

**Phase 1 (API Key Auth) — Complete:**

- `ApiKey` Prisma model with SHA-256 hashing, permissions enum, expiration, revocation
- API key service (generate, list, revoke, validate) + controller endpoints
- `ApiKeyAuthGuard` accepts both cookie JWTs and Bearer API keys
- API key management UI in project settings

**Phase 2 (Fix Broken Endpoints) — Complete:**

- `GET /projects/:slug/search` — stub returning empty results (OpenSearch pending for full-text)
- `GET /projects/:slug/entities/:slug` — entity hub aggregation with relationships, lore, timeline, tags
- `GET /projects/:slug/storyboard` — overview with plotlines + works/chapters/scene counts
- `get_entity_hub` tool removed from MCP (entity detail endpoint serves its purpose)

### What's remaining

**Read tool coverage is thin:** Only 5 of ~17 useful read tools exist. Missing: relationships, timeline/eras, lore articles, tags, plotline/work/scene detail. An AI can't fully explore a world yet.

**Search covers entities + lore only:** The `search_project` tool queries entity names and lore content via Prisma `contains`. Timeline events and scenes aren't searched yet, and the REST `GET /projects/:slug/search` endpoint is still a stub.

**Write tools bypass review queue:** All mutation tools write directly to the DB. The spec requires all MCP writes to go through `PendingChange` staging.

**Style Guide doesn't exist yet:** The model, migration, service, controller, and schema fields (`voiceNotes`, `styleNotes`) are all long-term work. The `get_style_guide` and `set_style_guide` MCP tools cannot be built until the Style Guide feature is implemented.

---

## Implementation Order

### Phase 1: API Key Authentication — COMPLETE

**Goal:** Users can generate project-scoped API keys and use them as Bearer tokens.

**Delivered:**

- `ApiKey` Prisma model + migration (SHA-256 hash, `lrm_` prefix, permissions enum)
- API key service: generate, list, revoke, validate with `lastUsedAt` tracking
- Controller: `POST/GET/DELETE /projects/:slug/api-keys`
- `ApiKeyAuthGuard` accepts both cookie JWTs and Bearer API keys
- Management UI in project settings

### Phase 2: Fix Broken API Endpoints — COMPLETE

**Goal:** MCP read tools no longer 404.

**Delivered:**

- `GET /projects/:slug/search` — stub (returns empty, OpenSearch is long-term)
- `GET /projects/:slug/entities/:slug` — entity detail with full hub data (relationships, lore, timeline, tags)
- `GET /projects/:slug/storyboard` — overview with plotlines + works/chapters/scene counts
- Removed `get_entity_hub` MCP tool (entity detail endpoint covers it)

### Phase 3: Complete MCP Read Tools + Search — COMPLETE

Delivered 2026-09-05: `SearchService` (entities, lore, timeline events, scenes) behind both `GET /projects/:slug/search` and `search_project`; 16 read tools; 20 write tools (incl. eras, plotlines, works, chapters, scenes with prose); tool annotations, deterministic ordering, error shaping, response slimming; tags on entities.

### Phase 3b: OAuth 2.1 + SDK v2 — COMPLETE

Delivered 2026-09-05 (see `apps/api/src/oauth/`, `apps/api/src/mcp/`):

- Per-project MCP URL `/v1/mcp/:projectSlug` as the RFC 8707 resource; `McpAuthGuard` enforces audience binding for OAuth tokens and project match for API keys, and advertises `WWW-Authenticate: Bearer resource_metadata=…` on 401.
- Authorization server: RFC 8414 / 9728 discovery, RFC 7591 registration, PKCE S256, single-use codes consumed atomically, opaque hashed tokens, rotating refresh tokens with reuse → connection revocation, RFC 7009 revocation, RFC 9207 `iss`.
- Web consent page (`/authorize`) with project + permission choice; Google sign-in `return_to`; connected-apps list and disconnect in project settings.
- Migrated to `@modelcontextprotocol/server` v2 (`createMcpHandler`, stateless), serving 2026-07-28 and 2025-era clients.

Original Phase 3 scope for reference:

**Goal:** Full read coverage — every content type in Loreum is readable via MCP, and search covers all content types.

**Scope:** `apps/api/src/mcp/` (tools call domain services directly).

#### 3a. Search expansion

`search_project` currently queries entities and lore. Extend to timeline events (title, description) and scenes (title, content), with `types` filter values `entity`, `lore`, `timeline`, `scene` and a unified result format `{ results: [{ kind, slug, name/title, excerpt }], total }`. Prisma `contains` is sufficient for now (OpenSearch is long-term).

#### 3b. New MCP read tools

All domain services already exist. MCP module only.

| Tool                 | Service call                            | Notes                                              |
| -------------------- | --------------------------------------- | -------------------------------------------------- |
| `list_relationships` | `RelationshipsService.findAllByProject` | Relationships, optionally filtered by entity       |
| `get_timeline`       | `TimelineService.findAllByProject`      | Timeline events with optional filters              |
| `list_eras`          | `ErasService.findAllByProject`          | Eras for a project                                 |
| `list_lore_articles` | `LoreService.findAllByProject`          | Filter lore articles                               |
| `get_lore_article`   | `LoreService.findBySlug`                | Single lore article                                |
| `list_tags`          | `TagsService.findAllByProject`          | All tags in a project                              |
| `get_plotline`       | `StoryboardService.findPlotlineBySlug`  | Plotline with plot points                          |
| `get_work`           | `StoryboardService.findWorkBySlug`      | Work with chapters and scene structure             |
| `list_scenes`        | `StoryboardService.findScenesByChapter` | Scenes in a chapter (the actual narrative content) |

#### 3c. Quality pass

- Improve tool descriptions (clear, specific, no jargon)
- Add response shaping (strip `createdAt`/`updatedAt`/internal IDs where noisy, flatten nesting)

**Test gate:** From Claude Desktop, an AI can navigate from projects → entities → relationships → lore → timeline → storyboard scenes without hitting any dead ends. Search returns real results.

### Phase 4: Review Queue (API + MCP + UI)

**Goal:** All MCP write operations stage changes as `PendingChange` records instead of writing directly. Users review and accept/reject from the web UI.

**Scope:** API-side service + controller, MCP tool handler updates, web UI.

#### API work (`apps/api/`)

1. PendingChange service:
   - `create(projectId, apiKeyId, batchId, operation, targetModel, targetId, proposedData, previousData)`
   - `listByProject(projectId, { status?, batchId? })`
   - `accept(id)` — apply `proposedData` to target model, set status ACCEPTED
   - `reject(id)` — set status REJECTED
   - `batchAccept(batchId)` — accept all PENDING in batch, in dependency order (creates before relationships)
   - Snapshot `previousData` on update/delete for diff display

2. PendingChange controller:
   - `GET /projects/:slug/pending-changes?status=&batchId=`
   - `POST /projects/:slug/pending-changes/:id/accept`
   - `POST /projects/:slug/pending-changes/:id/reject`
   - `POST /projects/:slug/pending-changes/batch-accept` (body: `{ batchId }`)

#### MCP work (`apps/api/src/mcp/`)

3. Update existing write tools (`create_entity`, `update_entity`, `create_relationship`, `create_lore_article`) to:
   - Call the PendingChange service instead of the direct CRUD services
   - Return confirmation that the change was staged, not applied
   - Include `batchId` (generated per MCP session or conversation)

#### Web UI work (`apps/web/`)

5. Review queue page: list pending changes grouped by batch
6. Per-change accept/reject buttons
7. Batch accept/reject buttons
8. Diff view for updates (before/after)
9. Preview for creates
10. Sidebar badge showing pending count

**Test gate:** From Claude Desktop, create an entity via MCP. Verify it appears in the review queue (not in the entity list). Accept it from the web UI. Verify it now appears in the entity list.

### Phase 5: Expand MCP Write Tools (blocked on Phase 4)

**Goal:** Add the remaining mutation tools, all routing through PendingChange.

| Tool                    | API Endpoint             | Notes |
| ----------------------- | ------------------------ | ----- |
| `update_lore_article`   | Staged via PendingChange |       |
| `delete_entity`         | Staged via PendingChange |       |
| `delete_relationship`   | Staged via PendingChange |       |
| `delete_lore_article`   | Staged via PendingChange |       |
| `create_timeline_event` | Staged via PendingChange |       |
| `update_timeline_event` | Staged via PendingChange |       |
| `delete_timeline_event` | Staged via PendingChange |       |
| `create_scene`          | Staged via PendingChange |       |
| `update_scene`          | Staged via PendingChange |       |
| `create_plot_point`     | Staged via PendingChange |       |
| `update_plot_point`     | Staged via PendingChange |       |

---

## Out of Scope

These are explicitly deferred and should not be built during this work:

- **Style Guide MCP tools** (`get_style_guide`, `set_style_guide`) — blocked on Style Guide model/migration/service/controller which is long-term work
- **CIMD client registration** — follow-up to DCR (needs SSRF-hardened metadata fetch)

---

## Architecture Boundaries

- The MCP endpoint lives in `apps/api/src/mcp/` and calls domain services directly — it does NOT go through HTTP or the REST controllers.
- The MCP layer contains no business logic. If a handler needs an if/else that makes a domain decision, it belongs in the domain service.
- Tool handlers do: input schema (zod) → service call → JSON response shaping. Nothing else.
- Review queue UI work happens in `apps/web/`.
