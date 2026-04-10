# API Reference

Complete reference for the Loreum REST API, WebSocket events, and MCP tools.

**Status key:** Built = implemented and functional | Planned = defined in spec, not yet built

---

## Overview

| Property | Value |
| -------- | ----- |
| Base URL | `http://localhost:3021/api/v1` |
| Auth | Cookie-based JWT (`auth_token`) or Bearer token |
| Content-Type | `application/json` |
| CSRF | Required for state-changing requests when using cookie auth (`x-csrf-token` header) |
| Rate Limiting | 10 req/sec, 50 req/10s, 200 req/min (global) |
| Docs (local) | `http://localhost:3021/docs` (Swagger, dev only) |

---

## Authentication

### Methods

| Method | Usage | Notes |
| ------ | ----- | ----- |
| Cookie | Browser sessions | JWT in `auth_token` httpOnly cookie, CSRF token in `csrf_token` cookie |
| Bearer | MCP server, API keys | `Authorization: Bearer <token>` header, no CSRF required |
| OAuth | Login flow | Google OAuth2 (Discord, GitHub, LinkedIn planned) |

### JWT Payload

```typescript
{
  sub: string        // userId
  email: string
  roles: Role[]      // ["USER"] or ["USER", "ADMIN"]
  sessionId: string
  tokenFamily: string
  iat: number
  exp: number
}
```

### Token Lifecycle

- Access token TTL: 2 hours (configurable via `JWT_ACCESS_TTL`)
- Token rotation: every 100 minutes (configurable via `TOKEN_ROTATION_MINUTES`)
- Session TTL: 60 days (configurable via `SESSION_TTL_DAYS`)
- Token family tracking for refresh token reuse detection

### CSRF Protection

State-changing requests (POST/PUT/PATCH/DELETE) using cookie auth must include:

```
x-csrf-token: <url-encoded csrf_token cookie value>
```

Skipped for Bearer auth and OAuth callback routes.

---

## Error Handling

### Prisma Exception Mapping

| Prisma Code | HTTP Status | Meaning |
| ----------- | ----------- | ------- |
| P2002 | 409 Conflict | Unique constraint violation |
| P2025 | 404 Not Found | Record not found |
| P2003 | 400 Bad Request | Foreign key constraint failure |
| P2018 | 400 Bad Request | Required relation not found |
| Other | 500 Internal Server Error | Unexpected database error |

### Validation

Global `ValidationPipe` with:
- `whitelist: true` - strips unknown properties
- `transform: true` - transforms payloads to DTO instances
- `enableImplicitConversion: true` - type coercion from query strings

---

## REST Endpoints

All authenticated endpoints require `JwtAuthGuard`. Ownership is enforced - users can only access their own projects and nested resources.

### System

#### `GET /health` - Built

Health check. No authentication required.

**Response:**
```json
{
  "status": "healthy",
  "checks": { "database": "ok" }
}
```

---

### Auth

#### `GET /auth/google` - Built

Initiate Google OAuth flow. Redirects to Google login.

#### `GET /auth/google/callback` - Built

Google OAuth callback. Sets `auth_token` and `csrf_token` cookies, redirects to `CORS_ORIGIN`.

#### `GET /auth/me` - Built

Get current authenticated user.

**Response:** User object with profile, preferences, accounts.

#### `GET /auth/sessions` - Built

List active sessions for the current user.

**Response:** Array of session objects (id, ipAddress, userAgent, lastActiveAt, createdAt).

#### `DELETE /auth/sessions/:sessionId` - Built

Invalidate a specific session.

**Response:** 204 No Content

#### `DELETE /auth/sessions` - Built

Invalidate all sessions except the current one.

**Response:** `{ "invalidated": number }`

#### `POST /auth/logout` - Built

Logout. Clears `auth_token` and `csrf_token` cookies.

**Response:** 204 No Content

---

### Projects

**Prefix:** `/projects`

#### `POST /projects` - Built

Create a new project.

| Field | Type | Required | Validation |
| ----- | ---- | -------- | ---------- |
| `name` | string | yes | 1-100 chars |
| `description` | string | no | max 2000 chars |

**Response:** 201, project object (slug auto-generated from name).

#### `GET /projects` - Built

List all projects owned by the current user.

**Response:** Array of project objects.

#### `GET /projects/:slug` - Built

Get a project by slug.

#### `PATCH /projects/:slug` - Built

Update a project.

| Field | Type | Required | Validation |
| ----- | ---- | -------- | ---------- |
| `name` | string | no | 1-100 chars |
| `description` | string | no | max 2000 chars |
| `visibility` | enum | no | `PRIVATE`, `PUBLIC`, `UNLISTED` |

#### `DELETE /projects/:slug` - Built

Delete a project and all nested resources.

**Response:** 204 No Content

#### `GET /projects/:slug/graph-layout` - Built

Get saved node positions for the knowledge graph.

**Response:** `{ [entitySlug]: { x: number, y: number } }`

#### `PATCH /projects/:slug/graph-layout` - Built

Update graph layout positions.

**Body:** `{ [entitySlug]: { x: number, y: number } }`

#### `GET /projects/:slug/timeline-config` - Built

Get timeline configuration for a project.

**Response:** `{ timelineMode, timelineStart, timelineEnd, timelineLabelPrefix, timelineLabelSuffix }`

#### `PUT /projects/:slug/timeline-config` - Built

Save timeline configuration.

**Body:** `{ timelineMode?, timelineStart?, timelineEnd?, timelineLabelPrefix?, timelineLabelSuffix? }`

---

### Entities

**Prefix:** `/projects/:projectSlug/entities`

#### `POST /projects/:projectSlug/entities` - Built

Create an entity.

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `type` | enum | yes | `CHARACTER`, `LOCATION`, `ORGANIZATION`, `ITEM` |
| `name` | string | yes | 1-100 chars. Slug auto-generated |
| `summary` | string | no | Short description |
| `description` | string | no | Full description |
| `backstory` | string | no | History/origin |
| `secrets` | string | no | Never shown in public wiki |
| `notes` | string | no | Author's private notes |
| `imageUrl` | string | no | Entity image URL |
| `tags` | string[] | no | Tag names (created if they don't exist) |
| `character` | object | no | `{ status?, species?, age?, role? }` |
| `location` | object | no | `{ region?, condition?, mapId? }` |
| `organization` | object | no | `{ ideology?, territory?, status?, parentOrgId? }` |
| `item` | object | no | `{ itemTypeId?, fields? }` |

**Response:** 201, entity object.

#### `GET /projects/:projectSlug/entities` - Built

List entities with optional filters.

| Query Param | Type | Notes |
| ----------- | ---- | ----- |
| `type` | string | Filter by entity type |
| `q` | string | Search query |

#### `GET /projects/:projectSlug/entities/:slug` - Built

Get entity with all connected data: relationships, timeline events, lore articles, scene appearances.

#### `PATCH /projects/:projectSlug/entities/:slug` - Built

Update an entity. Same body shape as create, all fields optional.

#### `DELETE /projects/:projectSlug/entities/:slug` - Built

**Response:** 204 No Content

---

### Entity Types (Custom Item Types)

**Prefix:** `/projects/:projectSlug/entity-types`

#### `POST /projects/:projectSlug/entity-types` - Built

Create a custom entity type (e.g. "Weapons", "Spells").

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `name` | string | yes | 1-50 chars |
| `icon` | string | no | Emoji or icon identifier |
| `color` | string | no | Hex color code |
| `fieldSchema` | array | no | Field definitions (see below) |

**Field definition shape:**

```json
{
  "key": "strength",
  "label": "Strength",
  "type": "number",
  "options": [],
  "entityTypeSlug": null,
  "required": false,
  "description": "Physical power rating"
}
```

Field types: `text`, `textarea`, `number`, `boolean`, `select`, `multi_select`, `date`, `url`, `entity_ref`

#### `GET /projects/:projectSlug/entity-types` - Built

List all entity types for a project.

#### `GET /projects/:projectSlug/entity-types/:slug` - Built

#### `PATCH /projects/:projectSlug/entity-types/:slug` - Built

#### `DELETE /projects/:projectSlug/entity-types/:slug` - Built

**Response:** 204 No Content

---

### Relationships

**Prefix:** `/projects/:projectSlug/relationships`

#### `POST /projects/:projectSlug/relationships` - Built

Create a relationship between two entities.

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `sourceEntitySlug` | string | yes | |
| `targetEntitySlug` | string | yes | |
| `label` | string | yes | e.g. "Mentor", "Ally", "Located in" |
| `description` | string | no | |
| `metadata` | object | no | Arbitrary JSON |
| `bidirectional` | boolean | no | Default false |

#### `GET /projects/:projectSlug/relationships` - Built

| Query Param | Type | Notes |
| ----------- | ---- | ----- |
| `entity` | string | Filter by entity slug |

#### `GET /projects/:projectSlug/relationships/:id` - Built

#### `PATCH /projects/:projectSlug/relationships/:id` - Built

| Field | Type | Notes |
| ----- | ---- | ----- |
| `label` | string | |
| `description` | string or null | |
| `metadata` | object | |
| `bidirectional` | boolean | |

#### `DELETE /projects/:projectSlug/relationships/:id` - Built

**Response:** 204 No Content

---

### Tags

**Prefix:** `/projects/:projectSlug/tags`

#### `POST /projects/:projectSlug/tags` - Built

| Field | Type | Required | Validation |
| ----- | ---- | -------- | ---------- |
| `name` | string | yes | 1-50 chars, unique per project |
| `color` | string | no | Hex color code |

#### `GET /projects/:projectSlug/tags` - Built

#### `GET /projects/:projectSlug/tags/:name` - Built

#### `PATCH /projects/:projectSlug/tags/:name` - Built

#### `DELETE /projects/:projectSlug/tags/:name` - Built

**Response:** 204 No Content

---

### Timeline Events

**Prefix:** `/projects/:projectSlug/timeline`

#### `POST /projects/:projectSlug/timeline` - Built

Create a timeline event.

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `name` | string | yes | |
| `date` | string | yes | Human-readable label, e.g. "19 BBY", "March 1945" |
| `sortOrder` | number | yes | Integer for ordering |
| `description` | string | no | |
| `dateValue` | number | no | Numeric value for Gantt positioning |
| `endDate` | string | no | End date label (for duration events) |
| `endDateValue` | number | no | End numeric value |
| `periodStart` | string | no | |
| `periodEnd` | string | no | |
| `significance` | enum | no | `minor`, `moderate` (default), `major`, `critical` |
| `eraSlug` | string | no | Assign to an era |
| `entitySlugs` | string[] | no | Link entities to this event |

#### `GET /projects/:projectSlug/timeline` - Built

| Query Param | Type | Notes |
| ----------- | ---- | ----- |
| `entity` | string | Filter by entity slug |
| `significance` | string | Filter by significance level |

#### `GET /projects/:projectSlug/timeline/:id` - Built

#### `PATCH /projects/:projectSlug/timeline/:id` - Built

Same fields as create, all optional.

#### `DELETE /projects/:projectSlug/timeline/:id` - Built

**Response:** 204 No Content

---

### Eras

**Prefix:** `/projects/:projectSlug/timeline/eras`

#### `POST /projects/:projectSlug/timeline/eras` - Built

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `name` | string | yes | 1-100 chars |
| `description` | string | no | |
| `color` | string | no | Hex color, used as Gantt band background |
| `startDate` | number | yes | Numeric boundary |
| `endDate` | number | yes | Numeric boundary |
| `sortOrder` | number | no | |

#### `GET /projects/:projectSlug/timeline/eras` - Built

#### `GET /projects/:projectSlug/timeline/eras/:slug` - Built

#### `PATCH /projects/:projectSlug/timeline/eras/:slug` - Built

#### `DELETE /projects/:projectSlug/timeline/eras/:slug` - Built

**Response:** 204 No Content

---

### Lore Articles

**Prefix:** `/projects/:projectSlug/lore`

#### `POST /projects/:projectSlug/lore` - Built

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `title` | string | yes | Min 1 char |
| `content` | string | yes | Markdown. Min 1 char |
| `category` | string | no | Grouping label |
| `entitySlugs` | string[] | no | Link entities to this article |
| `tags` | string[] | no | Tag names |

#### `GET /projects/:projectSlug/lore` - Built

| Query Param | Type | Notes |
| ----------- | ---- | ----- |
| `q` | string | Full-text search |
| `category` | string | Filter by category |
| `entity` | string | Filter by linked entity |

#### `GET /projects/:projectSlug/lore/:slug` - Built

#### `PATCH /projects/:projectSlug/lore/:slug` - Built

#### `DELETE /projects/:projectSlug/lore/:slug` - Built

**Response:** 204 No Content

---

### Style Guide

**Prefix:** `/projects/:projectSlug/style-guide`

#### `GET /projects/:projectSlug/style-guide` - Planned

Get the project's style guide.

**Response:** StyleGuide object or 404 if not yet created.

```json
{
  "id": "cuid",
  "projectId": "cuid",
  "overview": "Sparse, grounded sci-fi prose...",
  "voice": "Third-person limited, terse...",
  "tone": "Melancholic with moments of dark humor",
  "pov": "Rotating third limited between Kael and Sera by chapter",
  "tense": "Past tense",
  "pacing": "Short sentences in action, longer in introspection",
  "dialogue": "Naturalistic, characters interrupt each other...",
  "vocabulary": "No modern slang, technical jargon for ship systems...",
  "proseRules": "Never use 'suddenly'. Avoid adverbs. Prefer specific verbs...",
  "examples": "Example passage text here...",
  "notes": "Additional notes...",
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}
```

#### `PUT /projects/:projectSlug/style-guide` - Planned

Create or update the style guide. Idempotent - creates if it doesn't exist, updates if it does. Only provided fields are updated.

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `overview` | string | no | High-level style description |
| `voice` | string | no | Narrative voice |
| `tone` | string | no | Emotional register |
| `pov` | string | no | POV conventions |
| `tense` | string | no | Past/present tense |
| `pacing` | string | no | Pacing guidelines |
| `dialogue` | string | no | Dialogue conventions |
| `vocabulary` | string | no | Word choice, dialect, register |
| `proseRules` | string | no | Do's and don'ts |
| `examples` | string | no | Example passages |
| `notes` | string | no | Anything else |

---

### Storyboard

**Prefix:** `/projects/:projectSlug/storyboard`

#### Plotlines

##### `POST /projects/:projectSlug/storyboard/plotlines` - Built

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `name` | string | yes | Min 1 char |
| `description` | string | no | |
| `thematicStatement` | string | no | The theme this arc explores |
| `parentPlotlineSlug` | string | no | For subplot hierarchy |

##### `GET /projects/:projectSlug/storyboard/plotlines` - Built

##### `GET /projects/:projectSlug/storyboard/plotlines/:slug` - Built

##### `PATCH /projects/:projectSlug/storyboard/plotlines/:slug` - Built

| Field | Type | Notes |
| ----- | ---- | ----- |
| `name` | string | 1-100 chars |
| `description` | string | |
| `thematicStatement` | string | |

##### `DELETE /projects/:projectSlug/storyboard/plotlines/:slug` - Built

**Response:** 204 No Content

#### Plot Points

##### `POST /projects/:projectSlug/storyboard/plotlines/:plotlineSlug/points` - Built

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `title` | string | yes | |
| `sequenceNumber` | number | yes | Order within plotline |
| `description` | string | no | |
| `label` | string | no | e.g. "Inciting Incident", "Climax" |
| `sceneId` | string | no | Link to a scene |
| `timelineEventId` | string | no | Link to a timeline event |
| `entitySlug` | string | no | Main character/entity |

##### `PATCH /projects/:projectSlug/storyboard/points/:id` - Built

Same fields, all optional. Nullable fields accept `null` to clear.

##### `DELETE /projects/:projectSlug/storyboard/points/:id` - Built

**Response:** 204 No Content

#### Works

##### `POST /projects/:projectSlug/storyboard/works` - Built

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `title` | string | yes | Min 1 char |
| `chronologicalOrder` | number | yes | In-world order |
| `releaseOrder` | number | yes | Publication order |
| `synopsis` | string | no | |
| `status` | enum | no | `concept` (default), `outlining`, `drafting`, `revision`, `complete` |

##### `GET /projects/:projectSlug/storyboard/works` - Built

##### `GET /projects/:projectSlug/storyboard/works/:slug` - Built

Returns work with chapters array.

##### `PATCH /projects/:projectSlug/storyboard/works/:slug` - Built

| Field | Type | Notes |
| ----- | ---- | ----- |
| `title` | string | 1-200 chars |
| `synopsis` | string | |
| `status` | enum | `concept`, `outlining`, `drafting`, `revision`, `complete` |

##### `DELETE /projects/:projectSlug/storyboard/works/:slug` - Built

**Response:** 204 No Content

#### Chapters

##### `POST /projects/:projectSlug/storyboard/works/:workSlug/chapters` - Built

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `title` | string | yes | Min 1 char |
| `sequenceNumber` | number | yes | Order within work |
| `notes` | string | no | Author notes |

##### `PATCH /projects/:projectSlug/storyboard/chapters/:id` - Built

##### `DELETE /projects/:projectSlug/storyboard/chapters/:id` - Built

**Response:** 204 No Content

#### Scenes

##### `POST /projects/:projectSlug/storyboard/scenes` - Built

| Field | Type | Required | Notes |
| ----- | ---- | -------- | ----- |
| `chapterId` | string | yes | |
| `sequenceNumber` | number | yes | Order within chapter |
| `title` | string | no | |
| `description` | string | no | What happens |
| `plotlineSlug` | string | no | Which arc this scene belongs to |
| `povCharacterSlug` | string | no | POV character |
| `locationSlug` | string | no | Where it takes place |
| `timelineEventId` | string | no | When it happens |

##### `GET /projects/:projectSlug/storyboard/scenes` - Built

| Query Param | Type | Required | Notes |
| ----------- | ---- | -------- | ----- |
| `chapterId` | string | yes | Filter by chapter |

##### `PATCH /projects/:projectSlug/storyboard/scenes/:id` - Built

Same fields, all optional. Nullable fields accept `null` to clear.

##### `DELETE /projects/:projectSlug/storyboard/scenes/:id` - Built

**Response:** 204 No Content

---

### Public Wiki

**Prefix:** `/worlds`

No authentication required. Only returns data from projects with `PUBLIC` or `UNLISTED` visibility. The `secrets` field is never exposed.

#### `GET /worlds` - Built

List public worlds. Optional `?q=` search query.

#### `GET /worlds/:slug` - Built

Get public project overview: `{ id, name, slug, description }`.

#### `GET /worlds/:slug/entities` - Built

List public entities. Optional `?type=` filter.

#### `GET /worlds/:slug/entities/:entitySlug` - Built

Get a public entity with relationships, timeline events, lore articles.

#### `GET /worlds/:slug/relationships` - Built

#### `GET /worlds/:slug/timeline` - Built

Timeline events with era and entity info.

#### `GET /worlds/:slug/eras` - Built

#### `GET /worlds/:slug/lore` - Built

#### `GET /worlds/:slug/lore/:loreSlug` - Built

#### `GET /worlds/:slug/storyboard` - Built

Returns `{ plotlines: [...], works: [...] }`.

---

## WebSocket Events

**Endpoint:** `wss://localhost:3021/ws`

Authentication required via the same session cookie or bearer token.

| Event | Direction | Description | Status |
| ----- | --------- | ----------- | ------ |
| `entity:updated` | Server -> Client | An entity was modified | Planned |
| `entity:deleted` | Server -> Client | An entity was deleted | Planned |
| `storyboard:updated` | Server -> Client | A storyboard scene was modified | Planned |
| `relationship:updated` | Server -> Client | A relationship was added/modified/removed | Planned |

---

## MCP Server

The MCP server exposes Loreum's worldstate to AI assistants via the [Model Context Protocol](https://modelcontextprotocol.io). It runs as a stdio transport for local integration with Claude Desktop, Claude Code, Cursor, and other MCP-compatible clients.

### Connection

```json
{
  "mcpServers": {
    "loreum": {
      "command": "node",
      "args": ["path/to/apps/mcp/dist/index.js"],
      "env": {
        "MCP_API_BASE_URL": "http://localhost:3021/api/v1",
        "MCP_API_TOKEN": "your-bearer-token"
      }
    }
  }
}
```

### Environment Variables

| Variable | Required | Default | Notes |
| -------- | -------- | ------- | ----- |
| `MCP_API_BASE_URL` | no | `http://localhost:3021/api/v1` | Loreum API base URL |
| `MCP_API_TOKEN` | no | - | Bearer token for authentication |

### Resources

#### `project_overview`

- **URI:** `loreum://project/{projectSlug}/overview`
- **Returns:** Project metadata (JSON)
- **API call:** `GET /projects/{projectSlug}`

### Query Tools

#### `search_project` - Built

Search across all content in a project.

| Parameter | Type | Required | Notes |
| --------- | ---- | -------- | ----- |
| `projectSlug` | string | yes | |
| `query` | string | yes | Search text |
| `types` | string[] | no | Filter: `entity`, `lore`, `scene`, `timeline` |
| `limit` | number | no | Max results |

**API call:** `GET /projects/{projectSlug}/search?q={query}&types={types}&limit={limit}`

#### `get_entity` - Built

Retrieve a specific entity with relationships and linked content.

| Parameter | Type | Required | Notes |
| --------- | ---- | -------- | ----- |
| `projectSlug` | string | yes | |
| `entitySlug` | string | yes | |
| `include` | string[] | no | `relationships`, `lore`, `timeline`, `scenes` |

**API call:** `GET /projects/{projectSlug}/entities/{entitySlug}?include={include}`

#### `get_entity_hub` - Built

Get the full aggregated lore page for an entity - everything connected to it.

| Parameter | Type | Required | Notes |
| --------- | ---- | -------- | ----- |
| `projectSlug` | string | yes | |
| `entitySlug` | string | yes | |

**API call:** `GET /projects/{projectSlug}/entities/{entitySlug}/hub`

#### `list_entities` - Built

List and filter entities in a project.

| Parameter | Type | Required | Notes |
| --------- | ---- | -------- | ----- |
| `projectSlug` | string | yes | |
| `type` | string | no | Entity type filter |
| `tag` | string | no | Tag name filter |
| `q` | string | no | Search query |

**API call:** `GET /projects/{projectSlug}/entities?type={type}&tag={tag}&q={q}`

#### `get_storyboard` - Built

Get narrative structure: plotlines, works, chapters, scenes.

| Parameter | Type | Required | Notes |
| --------- | ---- | -------- | ----- |
| `projectSlug` | string | yes | |
| `bookSlug` | string | no | Filter to specific work |
| `detail` | enum | no | `outline` or `full` |

**API call:** `GET /projects/{projectSlug}/storyboard?book={bookSlug}&detail={detail}`

#### `get_entity_types` - Built

List all entity types and their field schemas for a project.

| Parameter | Type | Required | Notes |
| --------- | ---- | -------- | ----- |
| `projectSlug` | string | yes | |

**API call:** `GET /projects/{projectSlug}/entity-types`

#### `get_style_guide` - Planned

Get the project's style guide. When writing a scene, also returns scene-level `styleNotes` and `voiceNotes` for characters present.

| Parameter | Type | Required | Notes |
| --------- | ---- | -------- | ----- |
| `projectSlug` | string | yes | |
| `sceneId` | string | no | If provided, includes scene styleNotes and character voiceNotes for that scene |

**API call:** `GET /projects/{projectSlug}/style-guide` (+ scene context resolution)

### Mutation Tools

#### `create_entity` - Built

| Parameter | Type | Required | Notes |
| --------- | ---- | -------- | ----- |
| `projectSlug` | string | yes | |
| `type` | enum | yes | `CHARACTER`, `LOCATION`, `ORGANIZATION`, `ITEM` |
| `name` | string | yes | |
| `summary` | string | no | |
| `description` | string | no | |
| `backstory` | string | no | |
| `secrets` | string | no | |
| `notes` | string | no | |
| `tags` | string[] | no | |

**API call:** `POST /projects/{projectSlug}/entities`

#### `update_entity` - Built

| Parameter | Type | Required | Notes |
| --------- | ---- | -------- | ----- |
| `projectSlug` | string | yes | |
| `entitySlug` | string | yes | |
| `updates` | object | yes | Fields to update |

**API call:** `PATCH /projects/{projectSlug}/entities/{entitySlug}`

#### `create_relationship` - Built

| Parameter | Type | Required | Notes |
| --------- | ---- | -------- | ----- |
| `projectSlug` | string | yes | |
| `sourceEntitySlug` | string | yes | |
| `targetEntitySlug` | string | yes | |
| `type` | string | yes | Relationship type |
| `label` | string | no | |
| `metadata` | object | no | |
| `bidirectional` | boolean | no | |

**API call:** `POST /projects/{projectSlug}/relationships`

#### `create_lore_article` - Built

| Parameter | Type | Required | Notes |
| --------- | ---- | -------- | ----- |
| `projectSlug` | string | yes | |
| `title` | string | yes | |
| `content` | string | yes | Markdown |
| `category` | string | no | |
| `tags` | string[] | no | |
| `entitySlugs` | string[] | no | Link to entities |

**API call:** `POST /projects/{projectSlug}/lore`

---

## Configuration

### Required Environment Variables

| Variable | Description |
| -------- | ----------- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL |
| `CORS_ORIGIN` | Allowed origin for CORS |
| `API_PORT` | API port (default: 3021) |
| `NODE_ENV` | `production` or `development` |

### Optional Environment Variables

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `JWT_ACCESS_TTL` | `2h` | JWT expiration |
| `TOKEN_ROTATION_MINUTES` | `100` | Token rotation interval |
| `SESSION_TTL_DAYS` | `60` | Session TTL |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |
| `COOKIE_DOMAIN` | - | Cookie domain scope |
| `R2_ACCOUNT_ID` | - | Cloudflare R2 account |
| `R2_ACCESS_KEY_ID` | - | R2 access key |
| `R2_SECRET_ACCESS_KEY` | - | R2 secret key |
| `R2_BUCKET_NAME` | - | R2 bucket name |
| `R2_PUBLIC_URL` | - | R2 public URL |

---

## Gaps & Planned Work

Features referenced in the MCP tools or product spec that don't have REST endpoints yet:

| Gap | Notes |
| --- | ----- |
| `GET /projects/:slug/search` | MCP `search_project` calls this, but no dedicated search controller exists yet. Entity/lore listing with `?q=` provides partial coverage |
| `GET /projects/:slug/entities/:slug/hub` | MCP `get_entity_hub` calls this. The standard entity GET includes connected data, but hub may need a dedicated aggregation endpoint |
| `GET /projects/:slug/storyboard?book=&detail=` | MCP `get_storyboard` expects query params. Current storyboard endpoints are per-resource (plotlines, works, scenes separately) |
| Style guide endpoints | `GET/PUT /projects/:slug/style-guide` - planned |
| `Scene.styleNotes` | Field not yet in schema |
| `Character.voiceNotes` | Field not yet in schema |
| Pagination | No endpoints support pagination. Will be needed for projects with many entities |
| `content` field on Scene | Exists in schema but no dedicated scene content/prose endpoint |
