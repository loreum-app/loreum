# MCP Implementation Plan

Scoped plan for completing the MCP server to a testable state. Covers API prerequisites, auth, review queue, and MCP tool expansion.

**Created:** 2026-04-24
**Status:** In progress
**Reference:** See TODO.md > Near-Term for task tracking

---

## Review Summary

### What exists today

The MCP server (`apps/mcp/src/index.ts`) is a single-file stdio server with:

- 6 read tools: `search_project`, `get_entity`, `get_entity_hub`, `list_entities`, `get_storyboard`, `get_entity_types`
- 4 write tools: `create_entity`, `update_entity`, `create_relationship`, `create_lore_article`
- 1 resource: `project_overview`
- A simple `api()` helper that throws on HTTP errors
- Auth via `MCP_API_TOKEN` env var (raw JWT copied from browser)

### What's broken or missing

**3 existing tools call API endpoints that don't exist:**

| MCP Tool         | Expected Endpoint                              | Issue                                                                                    |
| ---------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `search_project` | `GET /projects/:slug/search`                   | No search controller — entity/lore `?q=` provides partial coverage but no unified search |
| `get_entity_hub` | `GET /projects/:slug/entities/:slug/hub`       | No hub aggregation endpoint — standard entity GET includes some connected data           |
| `get_storyboard` | `GET /projects/:slug/storyboard?book=&detail=` | No unified storyboard endpoint — API has separate plotline/work/scene endpoints          |

**Auth is incomplete:** No API key system. Users must copy raw JWTs from browser cookies. No project-scoped permissions, no key management UI.

**Write tools bypass review queue:** All mutation tools write directly to the DB. The spec requires all MCP writes to go through `PendingChange` staging.

**Style Guide doesn't exist yet:** The model, migration, service, controller, and schema fields (`voiceNotes`, `styleNotes`) are all long-term work. The `get_style_guide` and `set_style_guide` MCP tools cannot be built until the Style Guide feature is implemented.

---

## Implementation Order

### Phase 1: API Key Authentication

**Goal:** Users can generate project-scoped API keys and use them as Bearer tokens. Unblocks testing the full remote flow via cloudflared with existing read tools.

**Scope:** API-side work in `apps/api/`.

1. Run Prisma migration for `ApiKey` + `PendingChange` models (already in schema)
2. API key service: generate (bcrypt hash, return plaintext once), list, revoke, validate
3. API key controller: `POST /projects/:slug/api-keys`, `GET /projects/:slug/api-keys`, `DELETE /projects/:slug/api-keys/:id`
4. Update JWT/auth strategy to accept API keys as Bearer tokens, resolving to project + permissions (`READ_ONLY` / `READ_WRITE`)
5. Track `lastUsedAt` on each API key usage
6. API key management UI in project settings (generate, copy, revoke, list with last-used)

**Test gate:** Generate an API key in the UI, configure Claude Desktop with it as `MCP_API_TOKEN`, and successfully call `list_entities` against the production API via cloudflared.

### Phase 2: Fix Broken API Endpoints

**Goal:** The 3 existing MCP tools that currently 404 should work.

**Scope:** API-side work in `apps/api/`. The MCP server already has the tool handlers wired up — they just need working endpoints to call.

1. **Search endpoint** — `GET /projects/:slug/search?q=&types=&limit=`
   - Query entities, lore articles, timeline events, scenes
   - Filter by type array
   - Return unified result format with type labels
   - Can use Prisma `contains` queries for now (OpenSearch is long-term)

2. **Entity hub endpoint** — `GET /projects/:slug/entities/:slug/hub`
   - Return entity with all connected data: relationships (outgoing + incoming), lore articles, timeline events, scene appearances, tags
   - Single query with Prisma includes, or parallel queries assembled in the service

3. **Storyboard aggregation endpoint** — `GET /projects/:slug/storyboard?book=&detail=`
   - Return `{ plotlines: [...], works: [...] }` in one response
   - `book` param filters to a specific work
   - `detail=outline` returns structure only (no scene content), `detail=full` includes everything

**Test gate:** All 6 existing read tools return real data when called from Claude Desktop.

### Phase 3: Review Queue (API + MCP)

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

4. Update `api()` helper to return structured MCP errors instead of throwing

#### Web UI work (`apps/web/`)

5. Review queue page: list pending changes grouped by batch
6. Per-change accept/reject buttons
7. Batch accept/reject buttons
8. Diff view for updates (before/after)
9. Preview for creates
10. Sidebar badge showing pending count

**Test gate:** From Claude Desktop, create an entity via MCP. Verify it appears in the review queue (not in the entity list). Accept it from the web UI. Verify it now appears in the entity list.

### Phase 4: Expand MCP Read Tools

**Goal:** Add the remaining read tools that map to existing API endpoints.

**Scope:** MCP-side only. All endpoints already exist.

| Tool                 | API Endpoint                                    | Notes                                              |
| -------------------- | ----------------------------------------------- | -------------------------------------------------- |
| `list_projects`      | `GET /projects`                                 | List user's projects                               |
| `get_project`        | `GET /projects/:slug`                           | Single project detail                              |
| `get_timeline`       | `GET /projects/:slug/timeline`                  | Timeline events, supports `?entity=&significance=` |
| `list_eras`          | `GET /projects/:slug/timeline/eras`             | Eras for a project                                 |
| `get_lore_article`   | `GET /projects/:slug/lore/:slug`                | Single lore article                                |
| `list_lore_articles` | `GET /projects/:slug/lore?q=&category=&entity=` | Filter lore articles                               |
| `get_relationships`  | `GET /projects/:slug/relationships?entity=`     | Relationships, optionally filtered by entity       |

Also in this phase:

- Improve tool descriptions (clear, specific, no jargon)
- Add response shaping (strip `createdAt`/`updatedAt`/internal IDs, flatten nesting)
- Fix `api()` error handling if not done in Phase 3

### Phase 5: Expand MCP Write Tools (blocked on Phase 3)

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
