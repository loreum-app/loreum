# Loreum - Product Specification

## Vision

Loreum is a worldbuilding and story planning platform for writers, game designers, and storytellers. It provides a structured workspace to build interconnected fictional worlds populated by characters, locations, organizations, and custom entity types. A knowledge graph shows how everything relates, a timeline with Gantt visualization tracks events across eras, and a wiki-style lore system keeps canonical details organized. A storyboard lets you plot narratives across multiple works, and an integrated writing environment gives you the space to draft the actual story, whether that's a novel, screenplay, game storyline, or tabletop campaign.

## Who It's For

- Fiction authors (novels, series, shared universes)
- TTRPG world builders (D&D, Pathfinder, homebrew systems)
- Game narrative designers
- Writing groups and collaborative worldbuilding teams
- Anyone building a fictional universe that needs structure

## Core Differentiators

1. **AI that knows your world** - Every entity, relationship, timeline event, lore article, and style rule is structured data the AI can query. The AI reads your canon instead of guessing. Writers can bring their own AI via MCP (free) or use the hosted conversation loop where Loreum orchestrates everything (Pro).
2. **Style guide** - A structured writing guide covering voice, tone, POV, pacing, and dialogue rules that the AI follows when generating content. Scenes can override the base guide for dream sequences, flashbacks, and tonal shifts. Each character carries voice notes for consistent dialogue. The AI maintains your voice across sessions.
3. **Knowledge graph** - Relationships are first-class objects with labels, descriptions, and metadata. Writers visualize their world as a connected network, and the AI queries it to understand who knows whom, which factions are allied, and how characters connect.
4. **Timeline + Gantt** - Temporal structure with eras, draggable events, and duration bars. Writers see their world's history at a glance, and the AI checks it for continuity so characters cannot be in two places at once.
5. **Storyboard** - Plotlines, plot points, works, chapters, and scenes are all cross-referenced to entities and timeline. Writers plan narrative structure alongside their world.
6. **Custom entity types** - Writers define "Weapons", "Spells", "Vehicles", or whatever their world needs, with custom field schemas.
7. **Public wiki** - Writers share their world publicly as a read-only wiki while keeping secrets and drafts private.

---

## Feature Specification

### 1. Authentication & Users

| Feature                                  | Status  | Tier |
| ---------------------------------------- | ------- | ---- |
| Google OAuth                             | Built   | Free |
| Discord OAuth                            | Planned | Free |
| LinkedIn OAuth                           | Planned | Free |
| GitHub OAuth                             | Planned | Free |
| User profiles (avatar, bio, public page) | Partial | Free |
| Account settings (theme, notifications)  | Partial | Free |
| Subscription management                  | Planned | -    |

No email/password authentication. OAuth only - avoids the burden of managing passwords and 2FA.

### 2. Projects & Collaboration

| Feature                                          | Status  | Tier |
| ------------------------------------------------ | ------- | ---- |
| Multi-project per user                           | Built   | Free |
| Project visibility (private / public / unlisted) | Planned | Free |
| Public wiki view (read-only, clean URLs)         | Planned | Free |
| Entity/article-level visibility (hidden/public)  | Planned | Free |
| Secrets field never shown publicly               | Planned | Free |
| Team invitations                                 | Planned | Pro  |
| Roles: owner, editor, viewer, commenter          | Planned | Pro  |
| Real-time collaboration (live editing)           | Planned | Pro  |
| Activity feed / audit log                        | Planned | Pro  |
| Project templates (genre starters)               | Planned | Free |

#### Public Wiki

Public projects expose a read-only wiki view with:

- Clean public URLs (`loreum.app/worlds/star-wars`)
- Beautiful layout optimized for reading
- Entity pages, lore articles, timeline, relationship graph (view-only)
- Author controls what's visible vs hidden (draft content, secrets, spoilers)
- The `secrets` field on any entity is **never** exposed in public view

### 3. Entities (World Objects)

| Feature                                           | Status  | Tier |
| ------------------------------------------------- | ------- | ---- |
| Characters (with extension fields)                | Built   | Free |
| Locations (with extension fields)                 | Built   | Free |
| Organizations (with extension fields + hierarchy) | Built   | Free |
| Custom item types with field schemas              | Built   | Free |
| Custom fields on Characters/Locations/Orgs        | Planned | Free |
| Image upload per entity (R2/S3)                   | Planned | Free |
| Entity versioning / history                       | Planned | Pro  |
| Entity comments / annotations                     | Planned | Pro  |

#### Entity Architecture

Three structural types with fixed behaviors:

- **Characters** - can be members of organizations, present in scenes (as POV or participant)
- **Locations** - can be pinned on maps with coordinates
- **Organizations** - have hierarchy (parent/child), membership roster

All three support user-defined custom fields (like Items already do with `fieldSchema`). The hardcoded fields (species, status, condition, etc.) become the **defaults** that users can modify or extend per project.

**Custom types** (Items) are fully user-defined - name, icon, color, field schema. Examples: Weapons, Spells, Vehicles, Artifacts, Concepts.

### 4. Knowledge Graph

| Feature                                    | Status  | Tier |
| ------------------------------------------ | ------- | ---- |
| Relationships with labels and descriptions | Built   | Free |
| Bidirectional relationships                | Built   | Free |
| Visual graph editor (React Flow)           | Built   | Free |
| Graph filtering (by entity type, tags)     | Planned | Free |
| Saved graph views / snapshots              | Planned | Free |
| Relationship type categories               | Planned | Free |

### 5. Timeline

| Feature                                 | Status  | Tier |
| --------------------------------------- | ------- | ---- |
| Timeline events with dates              | Built   | Free |
| Gantt chart visualization               | Built   | Free |
| Eras (colored bands on Gantt)           | Built   | Free |
| Drag to move/resize events              | Built   | Free |
| Standard calendar mode (ISO dates)      | Built   | Free |
| Custom numeric mode (fantasy calendars) | Built   | Free |
| Multiple timeline tracks                | Planned | Free |
| Event-entity linking                    | Built   | Free |

#### Multiple Timelines

A project can have multiple timelines (parallel dimensions, alternate histories, different calendar systems). Each timeline owns its own events and eras. The Gantt shows one timeline at a time with a switcher. Events can optionally reference events in other timelines.

#### Custom Calendar Systems

For fantasy/sci-fi worlds that don't use the Gregorian calendar, a `CalendarSystem` defines:

- Name (e.g. "Reckoning of the Shire")
- Months (JSON array: `[{name: "Afteryule", days: 30}, ...]`)
- Days per week
- Year zero label

Dates within a custom calendar store as `{year, month, day}`. The Gantt converts these to a linear numeric value for positioning. Standard calendar mode (ISO dates) remains the default.

### 6. Lore (Wiki)

| Feature                                    | Status          | Tier |
| ------------------------------------------ | --------------- | ---- |
| Articles with markdown                     | Built           | Free |
| Categories + tags                          | Built           | Free |
| Entity mentions                            | Built (partial) | Free |
| Rich text editor (WYSIWYG)                 | Planned         | Free |
| Article hierarchy (parent/child, TOC)      | Planned         | Free |
| Cross-article linking (`[[Article Name]]`) | Planned         | Free |
| Backlinks (see what links to this article) | Planned         | Free |

#### Article Hierarchy

Articles can have a `parentArticleId`, creating a tree structure with auto-generated table of contents:

```
The Secession
├── Causes of the Secession
├── The War
│   ├── Battle of Calgary
│   └── The Siege
└── Aftermath
```

#### Wiki-Style Linking

In any rich text field, typing `[[` opens a search popup to find and link to any entity or article. Renders as a styled inline link with hover preview.

### 7. Storyboard

| Feature                                 | Status  | Tier |
| --------------------------------------- | ------- | ---- |
| Plotlines with plot points              | Built   | Free |
| Plotline hierarchy (parent/child)       | Built   | Free |
| Works → Chapters → Scenes               | Built   | Free |
| Scene ↔ plotline linking                | Built   | Free |
| Multi-entity per scene/plot point       | Planned | Free |
| Scene prose content (writing)           | Planned | Free |
| Scene status (outline/draft/final)      | Planned | Free |
| Word count tracking                     | Planned | Free |
| Scene drag-and-drop reordering          | Planned | Free |
| Edit/delete UI for all storyboard items | Planned | Free |

#### Multi-Entity Plot Points

Plot points and scenes should support multiple entity references, organized by type:

- Characters (who's involved)
- Locations (where it happens)
- Organizations (which factions)
- Any custom item type (relevant objects, concepts)

Each gets its own selector in the UI.

### 8. Style Guide

| Feature                                       | Status  | Tier |
| --------------------------------------------- | ------- | ---- |
| Project-level style guide (structured fields) | Planned | Free |
| Style guide wizard                            | Planned | Free |
| Scene-level style overrides                   | Planned | Free |
| Character voice notes                         | Planned | Free |
| Style guide editor UI                         | Planned | Free |
| MCP tool: `get_style_guide`                   | Planned | Free |

#### Project Style Guide

One style guide per project with structured fields: voice, tone, POV conventions, tense, pacing, dialogue rules, vocabulary/dialect, prose do's and don'ts, and example passages. All fields are optional - writers fill in what matters for their project. Markdown content in each field.

#### Style Guide Wizard

A guided setup flow offered on project creation and accessible any time from the style guide page. Walks the user through each aspect of their writing style step by step, rather than presenting a wall of empty fields.

**Dropdown / selector fields** (seed the value, user can expand with free text):

- **POV** - First person, Third limited, Third omniscient, Second person, Rotating
- **Tense** - Past, Present
- **Voice** - Sparse, Ornate, Lyrical, Clinical, Conversational, Poetic
- **Tone** - Dark, Lighthearted, Melancholic, Tense, Whimsical, Gritty, Hopeful

**Free text fields:**

- Prose rules - do's and don'ts ("never use adverbs", "prefer active voice")
- Dialogue conventions - how characters speak, tag style, dialect approach
- Vocabulary / dialect - register, period-appropriate language, slang rules
- Example passages - paste prose they admire or have written that captures the target style

Dropdown selections write an initial value into the corresponding text field (e.g. "Third person limited"). The user can then expand it with specifics ("Third person limited, rotating between Kael and Sera by chapter, no head-hopping within scenes").

#### Scene-Level Overrides

Scenes carry a `styleNotes` field for tonal shifts. Examples:

- Dream sequence: "Present tense, fragmented sentences, surreal imagery, no dialogue tags"
- Flashback: "Past perfect into simple past, sepia-toned description, more sensory detail"
- Epistolary section: "First person, letter format, formal register"

The AI reads the base style guide, then applies scene overrides when generating or assisting with that scene.

#### Character Voice

Each character has a `voiceNotes` field: speech patterns, verbal tics, vocabulary, dialect. When the AI writes dialogue for a character, it pulls their voice notes alongside the project style guide.

#### AI Composition

When assisting with a scene, the AI layers three sources: **base style guide → scene overrides → character voices** for present characters. This gives consistent prose that adapts to narrative context without the writer re-explaining their style every session.

### 9. Maps

| Feature                         | Status        | Tier |
| ------------------------------- | ------------- | ---- |
| Upload map images               | Schema exists | Free |
| Pin locations with coordinates  | Schema exists | Free |
| Multiple maps per project       | Schema exists | Free |
| Interactive pan/zoom            | Planned       | Free |
| Map layers                      | Planned       | Free |
| Drawing tools (borders, routes) | Nice-to-have  | Pro  |

### 10. Media & Files

| Feature                                  | Status  | Tier |
| ---------------------------------------- | ------- | ---- |
| Image uploads (entities, maps, articles) | Planned | Free |
| Storage via R2 (S3-compatible)           | Planned | Free |
| Image galleries per entity               | Planned | Free |
| File attachments (PDFs, reference docs)  | Planned | Pro  |

### 11. Search

| Feature                             | Status        | Tier |
| ----------------------------------- | ------------- | ---- |
| Full-text search across all content | Planned       | Free |
| Filters by type, tag, date range    | Planned       | Free |
| Section-scoped search               | Planned       | Free |
| Postgres tsvector (schema exists)   | Schema exists | Free |

### 12. AI Features

| Feature                               | Status  | Tier |
| ------------------------------------- | ------- | ---- |
| MCP server (external AI access)       | Built   | Free |
| MCP authentication (API keys)         | Planned | Free |
| MCP review queue (staging area)       | Planned | Free |
| In-app AI chat (query your world)     | Planned | Pro  |
| AI writing assistance in scene editor | Planned | Pro  |
| Style-aware generation                | Planned | Pro  |
| Consistency checking                  | Planned | Pro  |
| AI-generated summaries                | Planned | Pro  |

All AI features that consume tokens are **Pro only**. The MCP server remains free (users bring their own AI and tokens).

#### MCP Authentication

Users generate project-scoped API keys from project settings in the web UI. Each key has a name, configurable permission level, and expiration date.

| Feature                                     | Status  | Tier |
| ------------------------------------------- | ------- | ---- |
| API key generation UI (project settings)    | Planned | Free |
| Key permissions: read-only / read-write     | Planned | Free |
| Key expiration + revocation                 | Planned | Free |
| Last-used tracking                          | Planned | Free |
| Multiple keys per project                   | Planned | Free |

**Flow:**
1. User opens project settings, generates an API key with a label (e.g. "Claude Desktop")
2. Key is displayed once, user copies it
3. User configures their MCP client (Claude Desktop, Cursor, etc.) with the key as `MCP_API_TOKEN`
4. The MCP server authenticates via Bearer token against the Loreum API
5. All requests are scoped to the project the key belongs to

**Database model: `ApiKey`**
- `id`, `projectId`, `userId` (who created it)
- `name` (user label: "Claude Desktop", "Cursor", etc.)
- `keyHash` (bcrypt hash, the plaintext is shown once on creation)
- `permissions` (enum: `READ_ONLY`, `READ_WRITE`)
- `lastUsedAt`, `expiresAt`, `revokedAt`
- `createdAt`

#### MCP Tool Surface

The MCP server exposes tools for AI clients to read and write world data. All write operations go through the review queue (see section 16).

**Read Tools**

| Tool                 | Description                                              | Status  |
| -------------------- | -------------------------------------------------------- | ------- |
| `search_project`     | Full-text search across entities, lore, scenes, timeline | Built   |
| `get_entity`         | Single entity with optional relationships/lore/scenes    | Built   |
| `get_entity_hub`     | Full aggregated lore page for an entity                  | Built   |
| `list_entities`      | List and filter entities by type, tag, or search query   | Built   |
| `get_storyboard`     | Narrative structure: plotlines, works, chapters, scenes   | Built   |
| `get_entity_types`   | Entity types and their field schemas                     | Built   |
| `get_style_guide`    | Base style guide + scene overrides + character voices    | Planned |
| `get_timeline`       | Timeline events and eras for a project                   | Planned |
| `get_lore_article`   | Single lore article with linked entities                 | Planned |
| `list_lore_articles` | List and filter lore articles by category/tag            | Planned |
| `get_relationships`  | Relationships for a specific entity                      | Planned |

**Write Tools**

All write tools produce `PendingChange` records in the review queue rather than modifying data directly. The user reviews and accepts changes from the web UI.

| Tool                    | Description                                           | Status  |
| ----------------------- | ----------------------------------------------------- | ------- |
| `create_entity`         | Create a new entity (character, location, org, item)  | Built   |
| `update_entity`         | Partial update to an existing entity                  | Built   |
| `create_relationship`   | Create a relationship between two entities            | Built   |
| `create_lore_article`   | Create a lore article linked to entities              | Built   |
| `update_lore_article`   | Update an existing lore article                       | Planned |
| `delete_entity`         | Delete an entity                                      | Planned |
| `delete_relationship`   | Delete a relationship                                 | Planned |
| `delete_lore_article`   | Delete a lore article                                 | Planned |
| `create_timeline_event` | Create a timeline event linked to entities            | Planned |
| `update_timeline_event` | Update an existing timeline event                     | Planned |
| `delete_timeline_event` | Delete a timeline event                               | Planned |
| `create_scene`          | Create a scene within a chapter                       | Planned |
| `update_scene`          | Update scene content, style notes, characters         | Planned |
| `create_plot_point`     | Create a plot point on a plotline                     | Planned |
| `update_plot_point`     | Update a plot point                                   | Planned |
| `set_style_guide`       | Create or update the project style guide              | Planned |

**Resources**

| Resource            | URI pattern                               | Status |
| ------------------- | ----------------------------------------- | ------ |
| `project_overview`  | `loreum://project/{slug}/overview`        | Built  |

#### Style-Aware Generation

When the AI writes or assists, it automatically composes three layers of style context: the project's **base StyleGuide** (voice, tone, POV, pacing, etc.) → **scene-level overrides** (e.g. "dream sequence: present tense, fragmented") → **character voice notes** for characters present in the scene. This means the AI maintains the author's voice across sessions without massive context dumps or re-explanation.

#### In-App AI Chat

"Who are Luke Skywalker's allies?" - queries the knowledge graph and returns a natural language answer with links to entities.

#### Writing Assistance

In the scene editor: "continue this scene", "describe this location based on its entity data", "write dialogue for this character based on their personality". All output follows the project's style guide and scene overrides.

#### Consistency Checking

Analyzes the project for contradictions: "Obi-Wan is marked as being on Tatooine during Chapter 3, but the timeline places him on Mustafar at that date."

### 13. Notifications

| Feature                                           | Status        | Tier |
| ------------------------------------------------- | ------------- | ---- |
| In-app notifications                              | Schema exists | Free |
| Collaboration triggers (edits, comments, invites) | Planned       | Pro  |
| Notification preferences per type                 | Planned       | Free |
| Email notifications                               | Planned       | Pro  |

Triggers: entity created/edited/deleted by a collaborator, comment added, project invitation, mention in a comment.

### 14. Export & Import

| Feature                               | Status       | Tier |
| ------------------------------------- | ------------ | ---- |
| Export project as JSON (backup)       | Planned      | Free |
| Export as markdown files              | Planned      | Free |
| Export as formatted PDF (world bible) | Planned      | Pro  |
| Import from JSON (restore)            | Planned      | Free |
| Import from other tools               | Nice-to-have | Pro  |

### 15. Writing Environment

| Feature                                        | Status  | Tier |
| ---------------------------------------------- | ------- | ---- |
| Rich text editor (Tiptap + ProseMirror)        | Planned | Free |
| Wiki-style linking (`[[` search popup)         | Planned | Free |
| Inline images (drag into editor, stored on R2) | Planned | Free |
| Split-pane view (editor + reference panel)     | Planned | Free |
| Real-time collaborative editing (Yjs)          | Planned | Pro  |
| AI writing assistance in editor                | Planned | Pro  |

#### Tiptap Editor

All rich text content (entity descriptions, lore articles, scene prose, backstory, notes) uses Tiptap backed by ProseMirror. Content stored as JSON document tree, serializable to HTML/markdown on demand.

Custom node types:

- **Entity mention** - `[[Darth Vader]]` resolves to a styled link with hover preview
- **Article link** - `[[The Secession]]` links to lore articles
- **Inline image** - uploaded to R2, embedded in the document

#### Split-Pane Writing

The writing view supports a resizable split pane:

- Left: editor (scene, lore article, entity description)
- Right: reference panel (any entity detail, relationship graph, timeline, another article)

Components are built as embeddable panels (not page-level), enabling this tabbed/split layout.

#### Collaborative Editing

Real-time collaboration via Yjs (CRDT):

- Tiptap → y-prosemirror → Yjs → NestJS WebSocket gateway → other clients
- Presence indicators (cursors, who's editing)
- Conflict-free merging, no lock-out
- Document state persisted to Postgres

### 16. MCP Review Queue (Staging Area)

| Feature                                        | Status  | Tier |
| ---------------------------------------------- | ------- | ---- |
| PendingChange model + API                      | Planned | Free |
| Review queue page (list of pending changes)    | Planned | Free |
| Diff view for updates (before/after)           | Planned | Free |
| Preview for creates (full proposed record)     | Planned | Free |
| Deletion confirmation with record summary      | Planned | Free |
| Per-change actions: accept / edit / reject     | Planned | Free |
| Batch accept / batch reject                    | Planned | Free |
| Sidebar badge (pending change count)           | Planned | Free |
| Change grouping by session (batch context)     | Planned | Free |
| Collaborator suggestion mode (same mechanism)  | Planned | Pro  |

#### How It Works

Every MCP write operation (create, update, delete) produces a `PendingChange` record instead of modifying live data. The author reviews these changes from a dedicated staging area in the web UI before they touch the canonical world state.

**Write flow:**
1. AI calls a write tool (e.g. `create_entity`, `update_entity`, `delete_entity`)
2. The API validates the payload, then creates a `PendingChange` record instead of applying it
3. The MCP tool returns a confirmation that the change was staged (not applied)
4. The user sees a badge on the "Review" nav item showing the pending count
5. The user opens the review queue and inspects each change
6. On **accept**: the change is applied to the live database
7. On **reject**: the pending change is discarded
8. On **edit**: the user modifies the proposed data in a form, then accepts the edited version

**Database model: `PendingChange`**

```
PendingChange
  id            String    @id
  projectId     String    (FK -> Project)
  apiKeyId      String?   (FK -> ApiKey, which key created this)
  batchId       String    (groups related changes from one AI session)
  operation     Enum      CREATE | UPDATE | DELETE
  targetModel   String    "Entity" | "Relationship" | "LoreArticle" | "TimelineEvent" | "Scene" | "PlotPoint" | "StyleGuide"
  targetId      String?   (existing record ID, null for CREATE)
  proposedData  Json      (full record for CREATE, partial fields for UPDATE, empty for DELETE)
  previousData  Json?     (snapshot of current record before change, for diff display)
  status        Enum      PENDING | ACCEPTED | REJECTED
  reviewedAt    DateTime?
  createdAt     DateTime
```

The `batchId` groups changes from a single AI session. If the AI creates a character, adds two relationships, and writes a lore article in one conversation, those four changes share a `batchId` so the user can review them as a coherent set.

The `previousData` field stores a snapshot of the record at the time the change was proposed. For updates, this enables a side-by-side diff. For deletes, it shows what will be removed.

#### Review Queue UX

The review queue is a dedicated page accessible from the project sidebar. It functions like a pull request diff view.

**List view:**
- Changes grouped by batch, with a timestamp and source label (API key name)
- Each change shows: operation badge (green CREATE, yellow UPDATE, red DELETE), target type, target name
- Batch header with "Accept All" / "Reject All" buttons
- Individual accept/reject buttons per change

**Detail view (per change):**

- **CREATE**: Full preview of the proposed record, rendered the same way it would appear on its detail page. Accept creates the record.
- **UPDATE**: Side-by-side diff showing current values on the left and proposed values on the right. Changed fields are highlighted. The user can edit the proposed values before accepting. Accept applies the partial update.
- **DELETE**: Summary card of the record that would be removed, with a list of what else references it (relationships, scenes, plot points). Accept deletes the record.

**Batch view:**
- Expanding a batch shows all changes in sequence with a summary: "Claude Desktop created 2 entities, updated 1, added 3 relationships"
- "Accept All" applies every pending change in the batch in dependency order (creates before relationship links, etc.)
- Users who trust their AI workflow can batch-accept regularly; users who want control review each change

#### Collaborator Suggestions (Pro)

The same `PendingChange` mechanism powers collaborator suggestion mode. When a team member with "suggest" permissions edits an entity, their changes produce pending records that the project owner reviews. The review queue shows MCP changes and collaborator suggestions in the same interface, distinguished by source.

### 17. Admin & Observability

| Feature                                  | Status  | Tier |
| ---------------------------------------- | ------- | ---- |
| Health check endpoint (/health)          | Planned | -    |
| Structured logging                       | Planned | -    |
| Request tracing (correlation IDs)        | Planned | -    |
| Admin dashboard (users, projects, stats) | Planned | -    |
| Subscription/billing management          | Planned | -    |

### 18. Testing

| Feature                             | Status  | Tier |
| ----------------------------------- | ------- | ---- |
| Unit tests (services, domain logic) | Planned | -    |
| Integration tests (API endpoints)   | Planned | -    |
| End-to-end tests                    | Planned | -    |

### 19. Keyboard Shortcuts & Platform Parity

| Feature                               | Status       | Tier |
| ------------------------------------- | ------------ | ---- |
| Standard shortcuts (Cmd/Ctrl+S, etc.) | Planned      | Free |
| Mac and Windows hotkey support        | Planned      | Free |
| Shortcut cheat sheet (Cmd/Ctrl+/)     | Planned      | Free |
| Customizable shortcuts                | Nice-to-have | Free |

The UX should feel native to both Mac and Windows users. All keyboard shortcuts detect the platform and use `Cmd` on Mac, `Ctrl` on Windows. Common patterns:

- `Cmd/Ctrl+S` - save current edit
- `Cmd/Ctrl+K` - quick search / command palette
- `Cmd/Ctrl+B/I/U` - bold/italic/underline in editor
- `Cmd/Ctrl+Enter` - submit form / confirm dialog
- `Esc` - cancel / close dialog
- `Cmd/Ctrl+/` - show keyboard shortcut reference

### 20. Internationalization (i18n)

| Feature                                 | Status  | Tier |
| --------------------------------------- | ------- | ---- |
| All UI strings via translation function | Planned | Free |
| Date/number locale formatting           | Planned | Free |
| RTL layout support                      | Planned | Free |

User-generated content (world data) stays in whatever language the author writes. The platform UI is translatable.

### 21. API & Integrations

| Feature                                        | Status       | Tier |
| ---------------------------------------------- | ------------ | ---- |
| REST API                                       | Built        | Free |
| MCP server                                     | Built        | Free |
| Swagger/OpenAPI docs                           | Built        | Free |
| Project-scoped API keys (for MCP auth)         | Planned      | Free |
| API key management UI (generate, revoke, list) | Planned      | Free |
| Webhooks                                       | Nice-to-have | Pro  |

---

## Business Model

### Free Tier

- One project
- All core worldbuilding features (entities, graph, timeline, lore, storyboard, maps)
- MCP server access (bring your own AI)
- Public wiki
- Search
- Export as JSON/markdown
- Basic R2 storage (entity images, map uploads, ~500MB)

### Pro Tier (Subscription via Stripe)

- Unlimited projects
- AI features (in-app chat, writing assistance, consistency checking)
- Collaboration (teams, roles, real-time editing)
- Expanded R2 storage + file attachments
- Activity feed / audit log
- Entity versioning / history
- PDF export
- Email notifications
- Priority support

Stripe handles payments, including PayPal and Shop Pay as payment methods through Stripe Checkout.

### Hosting

Loreum is hosted at `loreum.app`. The codebase is open source, but self-hosting is not officially supported or encouraged. Pro features require the hosted platform (AI tokens, cloud storage, collaboration infrastructure).

---

## Tech Stack

| Layer       | Technology                    | Rationale                                                    |
| ----------- | ----------------------------- | ------------------------------------------------------------ |
| Frontend    | Next.js 16 + React 19         | App router, RSC, Turbopack                                   |
| UI          | shadcn/ui + Tailwind          | Composable, themeable, accessible                            |
| State       | React hooks (no global store) | Sufficient for current complexity                            |
| API         | NestJS                        | Modular, TypeScript-native, guards/pipes/filters             |
| ORM         | Prisma 7                      | Type-safe queries, migration system                          |
| Database    | PostgreSQL                    | Relational data, full-text search (tsvector), JSON fields    |
| Queue       | BullMQ + Redis                | Background jobs, event processing                            |
| Auth        | OAuth2 + JWT + DB sessions    | Rolling refresh, httpOnly cookies for web, bearer for MCP    |
| Storage     | Cloudflare R2                 | S3-compatible, no egress fees                                |
| CDN         | Cloudflare                    | Tunnel layer, caching                                        |
| Payments    | Stripe                        | Subscriptions, PayPal/Shop Pay via Checkout                  |
| Email       | Resend                        | Transactional email (notifications, invites, receipts)       |
| AI          | MCP protocol + Claude API     | External tool use + built-in assistant                       |
| Graph       | React Flow (@xyflow/react)    | Interactive node-edge visualization                          |
| Rich Text   | Tiptap (ProseMirror)          | WYSIWYG, JSON doc storage, wiki-linking, collaboration-ready |
| Collab Sync | Yjs (CRDT)                    | Real-time conflict-free editing via WebSocket                |
| WebSocket   | NestJS Gateway                | Real-time events, Yjs document relay, presence               |
| i18n        | TBD (next-intl or similar)    | UI translation, locale-aware formatting                      |
| Testing     | Jest + Supertest              | Unit, integration, e2e                                       |
| Monorepo    | Turborepo + pnpm              | Shared types, parallel builds                                |
