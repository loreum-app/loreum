# Entity-Relationship Diagram

Complete data model for the Loreum platform. Models are grouped into six domains. Each model lists its fields, relationships, indexes, and design rationale.

**Status key:** Built = in current Prisma schema | Planned = defined in product spec, not yet in schema.

> Excalidraw diagrams go below each section header once created.

---

## 1. Overview

Six model groups and their cross-group connections:

| Group                | Models                                                                                                                                | Purpose                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Auth & Users**     | User, Account, Session, UserProfile, UserPreferences, Subscription*, ApiKey*                                                          | Identity, authentication, billing              |
| **World & Entities** | Project, Entity, Character, Location, Organization, OrgMember, Item, EntitySchema, Relationship, Tag, EntityTag                       | The core world objects and how they connect    |
| **Content**          | LoreArticle, LoreArticleEntity, LoreArticleTag, StyleGuide, TimelineEvent, TimelineEventEntity, Era, Timeline*, CalendarSystem*, Map, MediaFile\* | Wiki articles, style guide, temporal structure, maps, media |
| **Storyboard**       | Plotline, PlotPoint, Work, Chapter, Scene, SceneEntity                                                                                | Narrative planning and story structure         |
| **Collaboration**    | ProjectMember*, EntityVersion*, Comment*, PendingSuggestion*, ActivityEvent\*                                                         | Teams, history, review, audit                  |
| **Platform**         | Notification                                                                                                                          | System events and alerts                       |

_\* = Planned model (not yet in schema)_

### Cross-Group Foreign Keys

| From            | To                           | Via                                                   |
| --------------- | ---------------------------- | ----------------------------------------------------- |
| Project         | User                         | `ownerId`                                             |
| Entity          | Project                      | `projectId`                                           |
| TimelineEvent   | Entity                       | `TimelineEventEntity` join                            |
| LoreArticle     | Entity                       | `LoreArticleEntity` join                              |
| Scene           | Entity                       | `SceneEntity` join (includes `isPov` flag, `role`) |
| PlotPoint       | Entity                       | `entityId`, `locationId`                              |
| PlotPoint       | Scene                        | `sceneId`                                             |
| PlotPoint       | TimelineEvent                | `timelineEventId`                                     |
| Scene           | TimelineEvent                | `timelineEventId`                                     |
| Scene           | Plotline                     | `plotlineId`                                          |
| Location        | Map                          | `mapId`                                               |
| StyleGuide      | Project                      | `projectId` (unique - one per project)                |
| Tag             | Entity / LoreArticle         | `EntityTag`, `LoreArticleTag` joins                   |
| ProjectMember\* | User + Project               | `userId`, `projectId`                                 |
| EntityVersion\* | Entity + User                | `entityId`, `changedById`                             |
| Comment\*       | Entity/LoreArticle + User    | polymorphic `targetId` + `authorId`                   |
| MediaFile\*     | Project + Entity/LoreArticle | `projectId` + optional `entityId`                     |

<!-- EXCALIDRAW: ERD Overview diagram here -->

---

## 2. Auth & Users

### User `users` - Built

The person using Loreum. One user owns many projects.

| Field          | Type          | Notes                              |
| -------------- | ------------- | ---------------------------------- |
| `id`           | String (cuid) | PK                                 |
| `email`        | String        | Unique                             |
| `name`         | String?       | Display name                       |
| `username`     | String        | Unique, used in URLs               |
| `avatarUrl`    | String?       | Profile image                      |
| `roles`        | Role[]        | `[USER]` default, supports `ADMIN` |
| `lastActiveAt` | DateTime?     | Tracks engagement                  |
| `createdAt`    | DateTime      |                                    |
| `updatedAt`    | DateTime      |                                    |

**Relations:** Account[], Session[], UserProfile?, UserPreferences?, Project[]
**Indexes:** `email`, `lastActiveAt`

---

### Account `accounts` - Built

OAuth provider link. One user can have multiple providers (Google, Discord, GitHub, LinkedIn).

| Field               | Type          | Notes                    |
| ------------------- | ------------- | ------------------------ |
| `id`                | String (cuid) | PK                       |
| `userId`            | String        | FK -> User               |
| `provider`          | String        | e.g. "google", "discord" |
| `providerAccountId` | String        | Provider's user ID       |
| `createdAt`         | DateTime      |                          |
| `updatedAt`         | DateTime      |                          |

**Unique:** `[provider, providerAccountId]`
**Indexes:** `userId`

---

### Session `sessions` - Built

JWT session with rotating refresh tokens. Token family enables refresh token reuse detection.

| Field          | Type           | Notes                                        |
| -------------- | -------------- | -------------------------------------------- |
| `id`           | String (cuid)  | PK                                           |
| `userId`       | String         | FK -> User                                   |
| `tokenFamily`  | String (uuid)  | Groups refresh chain                         |
| `lastTokenIat` | Int?           | Last issued-at (replay detection)            |
| `ipAddress`    | String?        | Client IP                                    |
| `userAgent`    | String? (Text) | Browser/device                               |
| `lastActiveAt` | DateTime       | Rolling activity                             |
| `expiresAt`    | DateTime       | Hard expiration                              |
| `isValid`      | Boolean        | `true` default, set `false` on logout/revoke |
| `createdAt`    | DateTime       |                                              |

**Indexes:** `userId`, `tokenFamily`, `expiresAt`

**Design rationale:** Token family approach detects refresh token theft. If a stolen token is replayed, the family is invalidated, forcing re-auth on all devices in that session.

---

### UserProfile `user_profiles` - Built

Public-facing profile info. 1:1 with User.

| Field       | Type           | Notes          |
| ----------- | -------------- | -------------- |
| `userId`    | String         | PK, FK -> User |
| `bio`       | String? (Text) |                |
| `location`  | String?        |                |
| `website`   | String?        |                |
| `twitter`   | String?        |                |
| `isPublic`  | Boolean        | `true` default |
| `createdAt` | DateTime       |                |
| `updatedAt` | DateTime       |                |

---

### UserPreferences `user_preferences` - Built

Per-user settings. 1:1 with User.

| Field                | Type     | Notes                          |
| -------------------- | -------- | ------------------------------ |
| `userId`             | String   | PK, FK -> User                 |
| `emailNotifications` | Json     | `{}` default, per-type toggles |
| `inAppNotifications` | Json     | `{}` default                   |
| `editorTheme`        | String   | `"system"` default             |
| `createdAt`          | DateTime |                                |
| `updatedAt`          | DateTime |                                |

---

### Subscription - Planned

Stripe subscription state. 1:1 with User.

| Field                  | Type          | Notes                                        |
| ---------------------- | ------------- | -------------------------------------------- |
| `id`                   | String (cuid) | PK                                           |
| `userId`               | String        | FK -> User, unique                           |
| `stripeCustomerId`     | String        | Stripe customer ref                          |
| `stripeSubscriptionId` | String?       | Active subscription ref                      |
| `tier`                 | String        | `"free"` or `"pro"`                          |
| `status`               | String        | `"active"`, `"canceled"`, `"past_due"`, etc. |
| `currentPeriodEnd`     | DateTime?     | When current billing period expires          |
| `cancelAtPeriodEnd`    | Boolean       | If user chose to cancel at renewal           |
| `createdAt`            | DateTime      |                                              |
| `updatedAt`            | DateTime      |                                              |

**Design rationale:** Stripe is the source of truth for billing state. This table caches the status locally so the API can gate features without calling Stripe on every request. Webhooks keep it in sync.

---

### ApiKey - Planned

Project-scoped API tokens for third-party access.

| Field         | Type          | Notes                                       |
| ------------- | ------------- | ------------------------------------------- |
| `id`          | String (cuid) | PK                                          |
| `userId`      | String        | FK -> User (who created it)                 |
| `projectId`   | String        | FK -> Project                               |
| `name`        | String        | Human label ("Claude Desktop", "My Script") |
| `keyHash`     | String        | Hashed key (never store plaintext)          |
| `keyPrefix`   | String        | First 8 chars for identification in UI      |
| `permissions` | String[]      | `["read"]`, `["read", "write"]`, etc.       |
| `lastUsedAt`  | DateTime?     |                                             |
| `expiresAt`   | DateTime?     | Optional expiry                             |
| `createdAt`   | DateTime      |                                             |

**Design rationale:** Keys are shown once on creation, stored as a hash. The prefix lets users identify which key is which without exposing the secret.

<!-- EXCALIDRAW: Auth & Users detail diagram here -->

---

## 3. World & Entities

### Project `projects` - Built

A worldbuilding project. The top-level container for all world data.

| Field                 | Type            | Notes                                           |
| --------------------- | --------------- | ----------------------------------------------- |
| `id`                  | String (cuid)   | PK                                              |
| `name`                | String          |                                                 |
| `slug`                | String          | Unique, used in URLs                            |
| `description`         | String? (Text)  |                                                 |
| `visibility`          | Visibility enum | `PRIVATE`, `PUBLIC`, `UNLISTED`                 |
| `ownerId`             | String          | FK -> User                                      |
| `graphLayout`         | Json?           | Saved node positions for knowledge graph        |
| `timelineMode`        | String          | `"standard"` (calendar) or `"custom"` (numeric) |
| `timelineStart`       | Float?          | Viewport/range start                            |
| `timelineEnd`         | Float?          | Viewport/range end                              |
| `timelineLabelPrefix` | String?         | e.g. "" for standard, "Year " for custom        |
| `timelineLabelSuffix` | String?         | e.g. " BBY", " AR"                              |
| `createdAt`           | DateTime        |                                                 |
| `updatedAt`           | DateTime        |                                                 |

**Relations:** Entity[], EntitySchema[], Relationship[], TimelineEvent[], LoreArticle[], Tag[], Era[], Map[], Plotline[], Work[]
**Indexes:** `ownerId`

**Design rationale:** Timeline config lives on Project (not a separate table) because each project has exactly one timeline configuration. The `graphLayout` Json field stores `{entitySlug: {x, y}}` positions - lightweight and doesn't justify a separate table.

---

### Entity `entities` - Built

Base model for all world objects. Uses single-table inheritance with a `type` discriminator and 1:1 extension tables for type-specific fields.

| Field          | Type            | Notes                                           |
| -------------- | --------------- | ----------------------------------------------- |
| `id`           | String (cuid)   | PK                                              |
| `projectId`    | String          | FK -> Project                                   |
| `type`         | EntityType enum | `CHARACTER`, `LOCATION`, `ORGANIZATION`, `ITEM` |
| `name`         | String          |                                                 |
| `slug`         | String          | Unique within project                           |
| `summary`      | String? (Text)  | Short description                               |
| `description`  | String? (Text)  | Full description (will become rich text)        |
| `backstory`    | String? (Text)  | History/origin                                  |
| `secrets`      | String? (Text)  | Never shown in public wiki                      |
| `notes`        | String? (Text)  | Author's private notes                          |
| `imageUrl`     | String?         | Entity portrait/image                           |
| `attributes`   | Json            | `{}` default. Custom attributes, validated against EntitySchema.attributeSchema |
| `searchVector` | tsvector?       | Postgres full-text search                       |
| `createdAt`    | DateTime        |                                                 |
| `updatedAt`    | DateTime        |                                                 |

**Relations:** Character?, Location?, Organization?, Item?, sourceRelationships[], targetRelationships[], TimelineEventEntity[], LoreArticleEntity[], EntityTag[], SceneEntity[], PlotPoint[] (as entity), PlotPoint[] (as location)
**Unique:** `[projectId, slug]`
**Indexes:** `[projectId, type]`

**Design rationale:** Single base table enables polymorphic queries ("give me all entities matching X") while extension tables keep type-specific fields normalized. The `attributes` JSON column stores custom attribute values (stats, custom fields) validated against the entity's `EntitySchema.attributeSchema` at the app level. Hoisted here from the extension tables so all entity types share one storage mechanism. The `secrets` field is a first-class concept because public wikis need a reliable way to hide spoilers.

---

### Character `characters` - Built

Extension fields for CHARACTER entities. 1:1 with Entity.

| Field      | Type    | Notes                                                     |
| ---------- | ------- | --------------------------------------------------------- |
| `entityId` | String  | PK, FK -> Entity                                          |
| `status`     | String? | alive, deceased, unknown, dormant, distributed            |
| `species`    | String? | human, synth, ai, hybrid (or custom)                      |
| `age`        | String? | String to support "~200 years", "ageless", etc.           |
| `role`       | String? | protagonist, antagonist, deuteragonist, supporting, minor |
| `voiceNotes` | String? (Text) | Speech patterns, verbal tics, vocabulary, dialect. Used by AI to write consistent dialogue for this character |

**Relations:** OrgMember[]

---

### Location `locations` - Built

Extension fields for LOCATION entities. 1:1 with Entity. Optionally pinned on a Map.

| Field       | Type    | Notes                                                                  |
| ----------- | ------- | ---------------------------------------------------------------------- |
| `entityId`  | String  | PK, FK -> Entity                                                       |
| `mapId`     | String? | FK -> Map (nullable, SetNull on delete)                                |
| `x`         | Float?  | Map X coordinate                                                       |
| `y`         | Float?  | Map Y coordinate                                                       |
| `region`    | String? |                                                                        |
| `condition` | String? | ruins, partially_restored, functional, fortified, overgrown, contested |

---

### Organization `organizations` - Built

Extension fields for ORGANIZATION entities. Supports hierarchy (parent/child orgs) and membership roster.

| Field         | Type           | Notes                                                    |
| ------------- | -------------- | -------------------------------------------------------- |
| `entityId`    | String         | PK, FK -> Entity                                         |
| `parentOrgId` | String?        | FK -> Organization (self-referential, SetNull on delete) |
| `ideology`    | String? (Text) |                                                          |
| `territory`   | String?        |                                                          |
| `status`      | String?        | active, dissolved, underground, emerging                 |

**Relations:** parentOrg?, childOrgs[], members (OrgMember[])

---

### OrgMember `org_members` - Built

Join table: which Characters belong to which Organizations, and in what role.

| Field            | Type    | Notes                              |
| ---------------- | ------- | ---------------------------------- |
| `characterId`    | String  | PK (composite), FK -> Character    |
| `organizationId` | String  | PK (composite), FK -> Organization |
| `role`           | String? | e.g. "Commander", "Spy", "Founder" |

---

### Item `items` - Built

Extension for ITEM entities. Links to an EntitySchema that defines its subtype (Weapons, Vehicles, etc.).

| Field            | Type    | Notes                                            |
| ---------------- | ------- | ------------------------------------------------ |
| `entityId`       | String  | PK, FK -> Entity                                 |
| `entitySchemaId` | String? | FK -> EntitySchema (nullable, SetNull on delete) |

**Design rationale:** Items have subtypes (Weapons, Vehicles, Spells) each with different attribute schemas. The `entitySchemaId` links to the specific subtype's schema. Attribute values are stored on `Entity.attributes`, not here - hoisted to avoid duplication across extension tables.

---

### EntitySchema `entity_schemas` - Built

Defines the attribute schema, display icon, and color for an entity type within a project. For CHARACTER/LOCATION/ORGANIZATION, there's at most one row per project (optional - no row means no custom attributes). For ITEM, there can be many rows (one per subtype: Weapons, Vehicles, Spells, etc.).

| Field             | Type            | Notes                                                 |
| ----------------- | --------------- | ----------------------------------------------------- |
| `id`              | String (cuid)   | PK                                                    |
| `projectId`       | String          | FK -> Project                                         |
| `entityType`      | EntityType enum | Which entity type this schema applies to              |
| `name`            | String          | e.g. "Weapons", "Character Stats", "Location Details" |
| `slug`            | String          |                                                       |
| `icon`            | String?         | Emoji or icon identifier                              |
| `color`           | String?         | Hex color for UI (enables custom colors for all types) |
| `attributeSchema` | Json            | `[]` default. Array of `{key, label, type, options?}` |
| `createdAt`       | DateTime        |                                                       |
| `updatedAt`       | DateTime        |                                                       |

**Unique:** `[projectId, slug]`
**Relations:** Item[] (for ITEM type schemas)

**attributeSchema example:**

```json
[
  {
    "key": "str",
    "label": "Strength",
    "type": "number"
  },
  {
    "key": "class",
    "label": "Class",
    "type": "select",
    "options": ["Fighter", "Mage", "Rogue", "Cleric"]
  },
  { "key": "alignment", "label": "Alignment", "type": "text" }
]
```

**Design rationale:** Generalizes the former `ItemType` to cover all entity types. For built-in types (CHARACTER, LOCATION, ORGANIZATION), it enables custom attributes and custom display colors per project. For ITEM, it continues to define subtypes as before. The schema is validated at the application level - `Entity.attributes` values must match the corresponding EntitySchema's `attributeSchema`.

---

### Relationship `relationships` - Built

A labeled, directed (or bidirectional) connection between two entities. The edges in the knowledge graph.

| Field            | Type           | Notes                                           |
| ---------------- | -------------- | ----------------------------------------------- |
| `id`             | String (cuid)  | PK                                              |
| `projectId`      | String         | FK -> Project                                   |
| `sourceEntityId` | String         | FK -> Entity                                    |
| `targetEntityId` | String         | FK -> Entity                                    |
| `label`          | String         | e.g. "Father", "Ally", "Located in"             |
| `description`    | String? (Text) |                                                 |
| `metadata`       | Json?          | Arbitrary extra data                            |
| `bidirectional`  | Boolean        | `false` default. If true, renders without arrow |
| `createdAt`      | DateTime       |                                                 |

**Indexes:** `[projectId, sourceEntityId]`, `[projectId, targetEntityId]`

**Design rationale:** Relationships are their own model (not embedded in entities) so they can carry metadata, support bidirectional display, and be independently queried for graph rendering.

---

### Tag `tags` - Built

Reusable labels within a project. Applied to entities and lore articles via join tables.

| Field       | Type          | Notes         |
| ----------- | ------------- | ------------- |
| `id`        | String (cuid) | PK            |
| `projectId` | String        | FK -> Project |
| `name`      | String        |               |
| `color`     | String?       | Hex color     |

**Unique:** `[projectId, name]`

---

### EntityTag `entity_tags` - Built

Join table: Tag <-> Entity (many-to-many).

| Field      | Type   | Notes                        |
| ---------- | ------ | ---------------------------- |
| `entityId` | String | PK (composite), FK -> Entity |
| `tagId`    | String | PK (composite), FK -> Tag    |

<!-- EXCALIDRAW: World & Entities detail diagram here -->

---

## 4. Content

### LoreArticle `lore_articles` - Built

Wiki-style article. Linked to entities and tagged independently.

| Field               | Type          | Notes                                                              |
| ------------------- | ------------- | ------------------------------------------------------------------ |
| `id`                | String (cuid) | PK                                                                 |
| `projectId`         | String        | FK -> Project                                                      |
| `title`             | String        |                                                                    |
| `slug`              | String        |                                                                    |
| `content`           | String (Text) | Markdown now, rich text (TipTap JSON) later                        |
| `category`          | String?       | Grouping label                                                     |
| `parentArticleId`\* | String?       | _Planned._ FK -> LoreArticle (self-ref, for article hierarchy/TOC) |
| `searchVector`      | tsvector?     | Postgres full-text search                                          |
| `createdAt`         | DateTime      |                                                                    |
| `updatedAt`         | DateTime      |                                                                    |

**Unique:** `[projectId, slug]`
**Indexes:** `[projectId, category]`

**Planned - Article hierarchy:** `parentArticleId` enables tree structure with auto-generated table of contents. Example: "The Secession" > "Causes" > "The War" > "Battle of Calgary".

---

### LoreArticleEntity `lore_article_entities` - Built

Join table: LoreArticle <-> Entity (many-to-many). Tracks which entities are mentioned/relevant to an article.

| Field           | Type   | Notes                             |
| --------------- | ------ | --------------------------------- |
| `loreArticleId` | String | PK (composite), FK -> LoreArticle |
| `entityId`      | String | PK (composite), FK -> Entity      |

---

### LoreArticleTag `lore_article_tags` - Built

Join table: LoreArticle <-> Tag (many-to-many).

| Field           | Type   | Notes                             |
| --------------- | ------ | --------------------------------- |
| `loreArticleId` | String | PK (composite), FK -> LoreArticle |
| `tagId`         | String | PK (composite), FK -> Tag         |

---

### StyleGuide `style_guides` - Planned

Project-level writing style guide. One per project. Defines the canonical voice, tone, POV conventions, and prose rules that the AI follows when generating content. Individual scenes can override specific aspects via `Scene.styleNotes`.

| Field        | Type           | Notes                                                            |
| ------------ | -------------- | ---------------------------------------------------------------- |
| `id`         | String (cuid)  | PK                                                               |
| `projectId`  | String         | FK -> Project, unique (one style guide per project)              |
| `overview`   | String? (Text) | High-level style description                                     |
| `voice`      | String? (Text) | Narrative voice (sparse, ornate, lyrical, clinical, etc.)        |
| `tone`       | String? (Text) | Emotional register and mood                                      |
| `pov`        | String? (Text) | POV conventions and rotation rules                               |
| `tense`      | String? (Text) | Past/present tense conventions                                   |
| `pacing`     | String? (Text) | Pacing guidelines                                                |
| `dialogue`   | String? (Text) | Dialogue style conventions                                       |
| `vocabulary` | String? (Text) | Word choice, dialect, register                                   |
| `proseRules` | String? (Text) | Do's and don'ts                                                  |
| `examples`   | String? (Text) | Example passages that capture the desired style                  |
| `notes`      | String? (Text) | Anything that doesn't fit above                                  |
| `createdAt`  | DateTime       |                                                                  |
| `updatedAt`  | DateTime       |                                                                  |

**Unique:** `projectId`

**Design rationale:** Structured fields rather than freeform so the MCP/AI can query specific aspects (e.g. "what are the dialogue rules?") without parsing a document. All fields are nullable - writers fill in what matters to them. Character-specific voice lives on `Character.voiceNotes`, and scene-specific overrides live on `Scene.styleNotes`. The AI composes these three layers: base guide → scene overrides → character voice.

---

### Era `eras` - Built

A named time period within a project's timeline. Renders as a colored background band on the Gantt chart.

| Field         | Type           | Notes                                    |
| ------------- | -------------- | ---------------------------------------- |
| `id`          | String (cuid)  | PK                                       |
| `projectId`   | String         | FK -> Project                            |
| `name`        | String         | e.g. "Galactic Civil War"                |
| `slug`        | String         |                                          |
| `description` | String? (Text) |                                          |
| `color`       | String?        | Background color on Gantt                |
| `startDate`   | Float          | Numeric boundary (maps to grid position) |
| `endDate`     | Float          | Numeric boundary                         |
| `sortOrder`   | Int            | `0` default                              |
| `createdAt`   | DateTime       |                                          |
| `updatedAt`   | DateTime       |                                          |

**Unique:** `[projectId, slug]`
**Indexes:** `[projectId, sortOrder]`

---

### TimelineEvent `timeline_events` - Built

A point or span on the timeline. Can be linked to entities with roles.

| Field          | Type           | Notes                                                  |
| -------------- | -------------- | ------------------------------------------------------ |
| `id`           | String (cuid)  | PK                                                     |
| `projectId`    | String         | FK -> Project                                          |
| `name`         | String         |                                                        |
| `description`  | String? (Text) |                                                        |
| `date`         | String         | Human-readable label ("19 BBY", "March 1945")          |
| `dateValue`    | Float?         | Numeric value for positioning on Gantt                 |
| `endDate`      | String?        | End label (for duration events)                        |
| `endDateValue` | Float?         | End numeric value                                      |
| `sortOrder`    | Int            |                                                        |
| `periodStart`  | String?        |                                                        |
| `periodEnd`    | String?        |                                                        |
| `significance` | String         | `"moderate"` default. minor, moderate, major, critical |
| `eraId`        | String?        | FK -> Era (nullable, SetNull on delete)                |
| `createdAt`    | DateTime       |                                                        |

**Indexes:** `[projectId, sortOrder]`, `[projectId, dateValue]`
**Relations:** Era?, TimelineEventEntity[], Scene[], PlotPoint[]

**Design rationale:** `date`/`endDate` are human-readable strings; `dateValue`/`endDateValue` are numeric floats for Gantt positioning. This dual representation supports both display ("19 BBY") and computation (grid column placement).

---

### TimelineEventEntity `timeline_event_entities` - Built

Join table: TimelineEvent <-> Entity with a narrative role.

| Field             | Type    | Notes                                                |
| ----------------- | ------- | ---------------------------------------------------- |
| `timelineEventId` | String  | PK (composite), FK -> TimelineEvent                  |
| `entityId`        | String  | PK (composite), FK -> Entity                         |
| `role`            | String? | hero, instigator, victim, witness, participant, etc. |

---

### Timeline - Planned

Support for multiple timelines per project (parallel dimensions, alternate histories).

| Field              | Type          | Notes                                   |
| ------------------ | ------------- | --------------------------------------- |
| `id`               | String (cuid) | PK                                      |
| `projectId`        | String        | FK -> Project                           |
| `name`             | String        | e.g. "Main Timeline", "Mirror Universe" |
| `slug`             | String        |                                         |
| `calendarSystemId` | String?       | FK -> CalendarSystem                    |
| `mode`             | String        | `"standard"` or `"custom"`              |
| `start`            | Float?        | Range start                             |
| `end`              | Float?        | Range end                               |
| `labelPrefix`      | String?       |                                         |
| `labelSuffix`      | String?       |                                         |
| `sortOrder`        | Int           |                                         |
| `createdAt`        | DateTime      |                                         |
| `updatedAt`        | DateTime      |                                         |

**Design rationale:** Currently timeline config lives directly on Project (single timeline). This model extracts it so a project can have many timelines. TimelineEvent and Era would gain a `timelineId` FK. Migration path: create a "Main Timeline" row for each existing project and move the config fields over.

---

### CalendarSystem - Planned

Custom calendar definition for fantasy/sci-fi worlds.

| Field           | Type          | Notes                                              |
| --------------- | ------------- | -------------------------------------------------- |
| `id`            | String (cuid) | PK                                                 |
| `projectId`     | String        | FK -> Project                                      |
| `name`          | String        | e.g. "Reckoning of the Shire", "Imperial Standard" |
| `months`        | Json          | Array of `{name, days}`                            |
| `daysPerWeek`   | Int           |                                                    |
| `yearZeroLabel` | String?       | What year zero is called                           |
| `createdAt`     | DateTime      |                                                    |

**Design rationale:** Enables the Gantt chart to render non-Gregorian calendars. Dates within a custom calendar store as `{year, month, day}` and are converted to a linear float for positioning.

---

### Map `maps` - Built

An uploaded map image with a coordinate grid. Locations can be pinned on it.

| Field       | Type          | Notes                                     |
| ----------- | ------------- | ----------------------------------------- |
| `id`        | String (cuid) | PK                                        |
| `projectId` | String        | FK -> Project                             |
| `name`      | String        |                                           |
| `slug`      | String        |                                           |
| `imageUrl`  | String        | R2/S3 URL                                 |
| `width`     | Int           | Image width in pixels                     |
| `height`    | Int           | Image height in pixels                    |
| `gridSize`  | Int           | `50` default. Grid cell size for snapping |
| `createdAt` | DateTime      |                                           |
| `updatedAt` | DateTime      |                                           |

**Unique:** `[projectId, slug]`
**Relations:** Location[]

---

### MediaFile - Planned

Uploaded files (images, PDFs, reference docs). Stored in Cloudflare R2.

| Field           | Type          | Notes                                           |
| --------------- | ------------- | ----------------------------------------------- |
| `id`            | String (cuid) | PK                                              |
| `projectId`     | String        | FK -> Project                                   |
| `entityId`      | String?       | FK -> Entity (optional, for entity galleries)   |
| `loreArticleId` | String?       | FK -> LoreArticle (optional, for inline images) |
| `filename`      | String        | Original filename                               |
| `mimeType`      | String        |                                                 |
| `sizeBytes`     | Int           |                                                 |
| `storageKey`    | String        | R2 object key                                   |
| `url`           | String        | Public or signed URL                            |
| `createdAt`     | DateTime      |                                                 |

**Design rationale:** Generic file model rather than per-entity image columns. Supports galleries (multiple images per entity), inline article images, and future file attachments.

<!-- EXCALIDRAW: Content detail diagram here -->

---

## 5. Storyboard

### Plotline `plotlines` - Built

A narrative arc or thread. Supports hierarchy (main plot, subplot).

| Field               | Type           | Notes                              |
| ------------------- | -------------- | ---------------------------------- |
| `id`                | String (cuid)  | PK                                 |
| `projectId`         | String         | FK -> Project                      |
| `name`              | String         | e.g. "Luke's Journey"              |
| `slug`              | String         |                                    |
| `description`       | String? (Text) |                                    |
| `thematicStatement` | String? (Text) | The theme this plotline explores   |
| `parentPlotlineId`  | String?        | FK -> Plotline (self-ref, SetNull) |
| `sortOrder`         | Int            | `0` default                        |
| `createdAt`         | DateTime       |                                    |
| `updatedAt`         | DateTime       |                                    |

**Unique:** `[projectId, slug]`
**Relations:** parentPlotline?, childPlotlines[], PlotPoint[], Scene[]

---

### PlotPoint `plot_points` - Built

A numbered beat within a plotline. Optionally linked to a scene, timeline event, entity, and location.

| Field             | Type           | Notes                                      |
| ----------------- | -------------- | ------------------------------------------ |
| `id`              | String (cuid)  | PK                                         |
| `plotlineId`      | String         | FK -> Plotline                             |
| `sequenceNumber`  | Int            | Order within plotline                      |
| `title`           | String         | e.g. "The Call to Adventure"               |
| `description`     | String? (Text) |                                            |
| `label`           | String?        | Narrative label (e.g. "Inciting Incident") |
| `sceneId`         | String?        | FK -> Scene (SetNull)                      |
| `timelineEventId` | String?        | FK -> TimelineEvent (SetNull)              |
| `entityId`        | String?        | FK -> Entity (SetNull)                     |
| `locationId`      | String?        | FK -> Entity (SetNull, location entity)    |
| `createdAt`       | DateTime       |                                            |
| `updatedAt`       | DateTime       |                                            |

**Indexes:** `[plotlineId, sequenceNumber]`

---

### Work `works` - Built

A discrete narrative work (novel, film, game chapter). Contains chapters.

| Field                | Type           | Notes                                                            |
| -------------------- | -------------- | ---------------------------------------------------------------- |
| `id`                 | String (cuid)  | PK                                                               |
| `projectId`          | String         | FK -> Project                                                    |
| `title`              | String         | e.g. "A New Hope"                                                |
| `slug`               | String         |                                                                  |
| `chronologicalOrder` | Int            | In-world order                                                   |
| `releaseOrder`       | Int            | Publication/release order                                        |
| `synopsis`           | String? (Text) |                                                                  |
| `status`             | String         | `"concept"` default. concept, outline, draft, revision, complete |
| `createdAt`          | DateTime       |                                                                  |
| `updatedAt`          | DateTime       |                                                                  |

**Unique:** `[projectId, slug]`

---

### Chapter `chapters` - Built

A numbered section within a Work.

| Field            | Type           | Notes             |
| ---------------- | -------------- | ----------------- |
| `id`             | String (cuid)  | PK                |
| `workId`         | String         | FK -> Work        |
| `title`          | String         |                   |
| `sequenceNumber` | Int            | Order within work |
| `notes`          | String? (Text) | Author notes      |
| `createdAt`      | DateTime       |                   |
| `updatedAt`      | DateTime       |                   |

**Indexes:** `[workId, sequenceNumber]`

---

### Scene `scenes` - Built

A granular narrative moment within a chapter. The atomic unit of story.

| Field             | Type           | Notes                                            |
| ----------------- | -------------- | ------------------------------------------------ |
| `id`              | String (cuid)  | PK                                               |
| `chapterId`       | String         | FK -> Chapter                                    |
| `title`           | String?        |                                                  |
| `sequenceNumber`  | Int            | Order within chapter                             |
| `description`     | String? (Text) | What happens                                     |
| `content`         | String? (Text) | Actual prose (will become rich text)             |
| `styleNotes`      | String? (Text) | Scene-level style overrides (e.g. "dream sequence: present tense, fragmented"). Layered on top of the project's StyleGuide |
| `plotlineId`      | String?        | FK -> Plotline (which arc this scene belongs to) |
| `timelineEventId` | String?        | FK -> TimelineEvent (when it happens)            |
| `createdAt`       | DateTime       |                                                  |
| `updatedAt`       | DateTime       |                                                  |

**Indexes:** `[chapterId, sequenceNumber]`
**Relations:** Chapter, Plotline?, TimelineEvent?, SceneEntity[], PlotPoint[]

**Design rationale:** `styleNotes` captures scene-specific deviations from the project's base StyleGuide - dream sequences, flashbacks, epistolary sections, etc. The AI reads the base guide then applies these overrides. `locationId` was removed - locations are now linked via SceneEntity like any other entity type. This unifies all entity-to-scene connections into one join table.

---

### SceneEntity `scene_entities` - Built

Join table: which entities appear in a scene, their role, and (for characters) whether they're the POV. A single table replaces the former `SceneCharacter` join and `Scene.locationId` FK - the frontend groups by `entity.type` for display.

| Field      | Type    | Notes                                                             |
| ---------- | ------- | ----------------------------------------------------------------- |
| `sceneId`  | String  | PK (composite), FK -> Scene                                      |
| `entityId` | String  | PK (composite), FK -> Entity                                     |
| `role`     | String? | e.g. "protagonist", "antagonist", "setting", "faction", "weapon" |
| `isPov`    | Boolean | `false` default. Only meaningful for characters                  |

**Design rationale:** One join table for all entity types in a scene. The frontend filters by `entity.type` to display characters, locations, organizations, and items in their own sections. This avoids separate join tables per type and makes it trivial to add new entity types to scenes. `isPov` is validated at the app level (only characters can be POV).

<!-- EXCALIDRAW: Storyboard detail diagram here -->

---

## 6. Collaboration & Platform

### ProjectMember - Planned

Team membership. Who has access to a project and at what permission level.

| Field        | Type          | Notes                                            |
| ------------ | ------------- | ------------------------------------------------ |
| `id`         | String (cuid) | PK                                               |
| `projectId`  | String        | FK -> Project                                    |
| `userId`     | String        | FK -> User                                       |
| `role`       | String        | `"owner"`, `"editor"`, `"viewer"`, `"commenter"` |
| `invitedAt`  | DateTime      |                                                  |
| `acceptedAt` | DateTime?     | Null if pending                                  |
| `createdAt`  | DateTime      |                                                  |

**Unique:** `[projectId, userId]`

**Design rationale:** Currently Project has a simple `ownerId`. This model enables multi-user collaboration with granular permissions. The owner is just `role: "owner"`. Pending invitations have `acceptedAt: null`.

---

### EntityVersion - Planned

Version history for entities. Stores snapshots of entity state for diffing and rollback.

| Field         | Type          | Notes                             |
| ------------- | ------------- | --------------------------------- |
| `id`          | String (cuid) | PK                                |
| `entityId`    | String        | FK -> Entity                      |
| `changedById` | String        | FK -> User                        |
| `version`     | Int           | Auto-incrementing per entity      |
| `snapshot`    | Json          | Full entity state at this version |
| `diff`        | Json?         | Delta from previous version       |
| `message`     | String?       | Optional change description       |
| `createdAt`   | DateTime      |                                   |

**Indexes:** `[entityId, version]`

**Design rationale:** Stores full snapshots (not just diffs) so any version can be restored without replaying history. The `diff` field is optional and computed for display purposes. This model covers the wiki fork's edit history needs as well.

---

### Comment - Planned

Threaded comments on entities, lore articles, or scenes. Polymorphic target.

| Field             | Type          | Notes                                           |
| ----------------- | ------------- | ----------------------------------------------- |
| `id`              | String (cuid) | PK                                              |
| `projectId`       | String        | FK -> Project                                   |
| `authorId`        | String        | FK -> User                                      |
| `targetType`      | String        | `"entity"`, `"lore_article"`, `"scene"`         |
| `targetId`        | String        | FK to target (not enforced at DB level)         |
| `parentCommentId` | String?       | FK -> Comment (self-ref, for threading)         |
| `content`         | String (Text) |                                                 |
| `resolved`        | Boolean       | `false` default (for annotation-style comments) |
| `createdAt`       | DateTime      |                                                 |
| `updatedAt`       | DateTime      |                                                 |

**Indexes:** `[targetType, targetId]`, `[authorId]`

**Design rationale:** Polymorphic rather than separate comment tables per target type. Keeps the model simple and the comment UI reusable. Thread depth via `parentCommentId`.

---

### PendingSuggestion - Planned

Changes proposed via MCP/AI or by collaborators in "suggest" mode. Queued for review.

| Field          | Type          | Notes                                                |
| -------------- | ------------- | ---------------------------------------------------- |
| `id`           | String (cuid) | PK                                                   |
| `projectId`    | String        | FK -> Project                                        |
| `proposedById` | String?       | FK -> User (null if from AI/MCP)                     |
| `source`       | String        | `"mcp"`, `"collaborator"`, `"ai"`                    |
| `action`       | String        | `"create"`, `"update"`, `"delete"`                   |
| `targetType`   | String        | `"entity"`, `"relationship"`, `"lore_article"`, etc. |
| `targetId`     | String?       | Existing record ID (null for creates)                |
| `payload`      | Json          | The proposed data                                    |
| `status`       | String        | `"pending"`, `"accepted"`, `"rejected"`, `"edited"`  |
| `reviewedById` | String?       | FK -> User                                           |
| `reviewedAt`   | DateTime?     |                                                      |
| `createdAt`    | DateTime      |                                                      |

**Design rationale:** When an AI writes via MCP, changes go here instead of directly into the live data. The author reviews and accepts/rejects. Same mechanism for collaborator "suggest changes" mode.

---

### ActivityEvent - Planned

Audit log / activity feed. Records who did what and when.

| Field        | Type          | Notes                                                             |
| ------------ | ------------- | ----------------------------------------------------------------- |
| `id`         | String (cuid) | PK                                                                |
| `projectId`  | String        | FK -> Project                                                     |
| `userId`     | String        | FK -> User                                                        |
| `action`     | String        | `"created"`, `"updated"`, `"deleted"`, `"commented"`, `"invited"` |
| `targetType` | String        | `"entity"`, `"lore_article"`, `"relationship"`, etc.              |
| `targetId`   | String        |                                                                   |
| `targetName` | String?       | Denormalized for display without joins                            |
| `metadata`   | Json?         | Extra context (e.g. which fields changed)                         |
| `createdAt`  | DateTime      |                                                                   |

**Indexes:** `[projectId, createdAt]`, `[userId]`

**Design rationale:** Append-only log. `targetName` is denormalized so the feed is readable even if the target is later deleted.

---

### Notification `notifications` - Built

In-app notification for a user.

| Field       | Type          | Notes                                                                                    |
| ----------- | ------------- | ---------------------------------------------------------------------------------------- |
| `id`        | String (cuid) | PK                                                                                       |
| `userId`    | String        | Not a FK (no relation defined, intentional - notifications survive user-related cascade) |
| `type`      | String        | e.g. "entity_updated", "comment_added", "invitation"                                     |
| `title`     | String        |                                                                                          |
| `message`   | String (Text) |                                                                                          |
| `data`      | Json          | `{}` default. Structured payload (links, entity IDs, etc.)                               |
| `read`      | Boolean       | `false` default                                                                          |
| `createdAt` | DateTime      |                                                                                          |

**Indexes:** `[userId, read]`, `[createdAt]`

<!-- EXCALIDRAW: Collaboration & Platform detail diagram here -->

---

## 7. Migration Path

How the current schema evolves to the full schema.

### Phase 1 - Schema Refinement (Next migration)

- Rename `ItemType` → `EntitySchema`, add `entityType` column, rename `fieldSchema` → `attributeSchema`
- Add `attributes Json` to Entity, migrate data from `Item.fields`
- Remove `Item.fields`, rename `Item.itemTypeId` → `Item.entitySchemaId`
- Remove `Scene.povCharacterId` (already done in schema)
- Replace `SceneCharacter` with `SceneEntity` (references Entity, not just characters), add `isPov` flag
- Remove `Scene.locationId` (locations linked via SceneEntity)

### Phase 2 - Content Enrichment

- Add `parentArticleId` to LoreArticle (article hierarchy)
- Add `MediaFile` model (R2 uploads)
- Migrate content fields from markdown strings to TipTap JSON

### Phase 3 - Multiple Timelines

- Add `Timeline` and `CalendarSystem` models
- Add `timelineId` FK to TimelineEvent and Era
- Create "Main Timeline" for each existing project, migrate config fields from Project to Timeline
- Remove timeline fields from Project

### Phase 4 - Collaboration

- Add `ProjectMember` model
- Migrate `Project.ownerId` to a ProjectMember with `role: "owner"`
- Add `EntityVersion`, `Comment`, `PendingSuggestion`, `ActivityEvent`

### Phase 5 - Billing & API

- Add `Subscription` model (Stripe integration)
- Add `ApiKey` model (project-scoped tokens)
- Add tier checks to API guards

---

## 8. Conventions

| Convention           | Rule                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Primary keys**     | `cuid()` strings everywhere                                                                                                 |
| **Timestamps**       | `createdAt` + `updatedAt` on all models (except join tables and append-only logs)                                           |
| **Slugs**            | Unique within project scope: `@@unique([projectId, slug])`                                                                  |
| **Soft deletes**     | Not used. Hard deletes with `onDelete: Cascade` for owned data, `onDelete: SetNull` for optional references                 |
| **Enums**            | Used sparingly (EntityType, Visibility, Role). Most categorical fields are strings for flexibility                          |
| **JSON fields**      | Used for flexible/user-defined data (fieldSchema, fields, graphLayout, notification data). Not for data that needs querying |
| **Join tables**      | Composite PK `@@id([fkA, fkB])`, no separate `id` column                                                                    |
| **Table names**      | Snake_case via `@@map()` - Prisma models are PascalCase, DB tables are snake_case                                           |
| **Text fields**      | `@db.Text` for any field likely to exceed 255 chars                                                                         |
| **Full-text search** | `tsvector` columns on Entity and LoreArticle, maintained via triggers                                                       |
