# MCP Implementation Plan

Scoped plan for completing the MCP server to a testable state. Covers API prerequisites, auth, review queue, and MCP tool expansion.

**Created:** 2026-04-24
**Updated:** 2026-04-24
**Status:** Phases 1–2 complete, Phase 3 next
**Reference:** See TODO.md > Near-Term for task tracking

---

## Review Summary

### What exists today

The MCP server (`apps/mcp/src/index.ts`) is a single-file stdio server with:

- 5 read tools: `search_project`, `get_entity`, `list_entities`, `get_storyboard`, `get_entity_types`
- 4 write tools: `create_entity`, `update_entity`, `create_relationship`, `create_lore_article`
- 1 resource: `project_overview`
- A simple `api()` helper that throws on HTTP errors
- Auth via `MCP_API_TOKEN` env var (API key with `lrm_` prefix, Bearer token)
- API key system with generate/list/revoke, project-scoped permissions (READ_ONLY / READ_WRITE)

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

**Read tool coverage is thin:** Only 5 of ~17 useful read tools exist. Missing: project navigation, relationships, timeline/eras, lore articles, tags, plotline/work/scene detail. An AI can't fully explore a world yet.

**Search is a stub:** The `search_project` tool calls the endpoint but always gets empty results. Needs a real Prisma `contains` implementation across entities, lore, timeline, and scenes.

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

### Phase 3: Complete MCP Read Tools + Search

**Goal:** Full read coverage — every content type in Loreum is readable via MCP, and search actually works.

**Scope:** MCP tools in `apps/mcp/`, plus API work for search.

#### 3a. Search implementation (`apps/api/`)

The search endpoint is currently a stub returning empty results. Implement basic Prisma `contains` search across all content types:

- Query entities (name, summary, description), lore articles (title, content), timeline events (title, description), scenes (title, content)
- Filter by `types` array (entity, lore, timeline, scene)
- Return unified result format: `{ results: [{ type, slug, name/title, excerpt }], total }`
- Prisma `contains` is sufficient for now (OpenSearch is long-term)

#### 3b. New MCP read tools (`apps/mcp/`)

All API endpoints already exist. MCP-side only.

| Tool                 | API Endpoint                                         | Notes                                              |
| -------------------- | ---------------------------------------------------- | -------------------------------------------------- |
| `list_projects`      | `GET /projects`                                      | List user's projects                               |
| `get_project`        | `GET /projects/:slug`                                | Project detail (replaces resource-only access)     |
| `list_relationships` | `GET /projects/:slug/relationships?entity=`          | Relationships, optionally filtered by entity       |
| `get_timeline`       | `GET /projects/:slug/timeline?entity=&significance=` | Timeline events with optional filters              |
| `get_timeline_event` | `GET /projects/:slug/timeline/:id`                   | Single event detail                                |
| `list_eras`          | `GET /projects/:slug/timeline/eras`                  | Eras for a project                                 |
| `list_lore_articles` | `GET /projects/:slug/lore?q=&category=&entity=`      | Filter lore articles                               |
| `get_lore_article`   | `GET /projects/:slug/lore/:slug`                     | Single lore article                                |
| `list_tags`          | `GET /projects/:slug/tags`                           | All tags in a project                              |
| `get_plotline`       | `GET /projects/:slug/storyboard/plotlines/:slug`     | Plotline with plot points                          |
| `get_work`           | `GET /projects/:slug/storyboard/works/:slug`         | Work with chapters and scene structure             |
| `list_scenes`        | `GET /projects/:slug/storyboard/scenes?chapterId=`   | Scenes in a chapter (the actual narrative content) |

#### 3c. Quality pass

- Improve tool descriptions (clear, specific, no jargon)
- Add response shaping (strip `createdAt`/`updatedAt`/internal IDs where noisy, flatten nesting)
- Fix `api()` error handling (return structured MCP errors instead of throwing)

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

#### MCP work (`apps/mcp/`)

3. Update existing write tools (`create_entity`, `update_entity`, `create_relationship`, `create_lore_article`) to:
   - Call a new pending change endpoint instead of the direct CRUD endpoint
   - Return confirmation that the change was staged, not applied
   - Include `batchId` (generated per MCP session or conversation)

4. Update `api()` helper to return structured MCP errors instead of throwing (if not done in Phase 3)

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
- **Streamable HTTP transport** — stdio is sufficient for testing; HTTP transport is a follow-up
- **OAuth2 discovery endpoint** — depends on HTTP transport
- **Redis rate limiting** — not needed until remote HTTP transport exists
- **Permission-scoped tool filtering** — nice-to-have after auth works, not required for testability

---

## Architecture Boundaries

- The MCP server is an HTTP client to the API. It does NOT import services or access the database directly.
- API endpoint work (search, hub, storyboard, auth, review queue) happens in `apps/api/`.
- MCP tool work (handlers, response shaping, error handling) happens in `apps/mcp/`.
- Review queue UI work happens in `apps/web/`.
- The MCP server contains no business logic. If a handler needs an if/else that makes a domain decision, it belongs in the API.
