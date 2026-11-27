# Audit Ledger Design

An append-only, per-project change ledger that records every mutation to project
data regardless of source (MCP tools, REST API, web UI). Undo writes a
compensating entry that reverses the original operation; the original row is
never deleted or mutated (except to mark it as undone). A retention cap per
project, gated by billing plan, keeps storage bounded.

## Context

Loreum's MCP write tools and web UI mutate project data (entities, relationships,
lore articles, timeline events, storyboard structures, entity types, project
settings, eras, tags). Today there is no record of what changed, when, or who
made the change. The existing `PendingChange` model was designed for a review
queue (approve/reject before applying) that was never wired in. This design
replaces it with an audit ledger that records changes after they happen.

## Data Model

### Remove

- `PendingChange` model and its `pending_changes` table
- `ChangeOperation` enum
- `ChangeStatus` enum
- `ApiKey.pendingChanges` relation
- `Project.pendingChanges` relation

### Add

```prisma
enum LedgerOperation {
  CREATE
  UPDATE
  DELETE
  UNDO
}

model LedgerEntry {
  id        String   @id @default(cuid())
  projectId String
  createdAt DateTime @default(now())

  // What changed
  operation   LedgerOperation
  targetModel String            // "Entity", "Relationship", "LoreArticle", etc.
  targetId    String            // The record's primary key
  beforeData  Json?             // Full snapshot before (null for CREATE)
  afterData   Json?             // Full snapshot after (null for DELETE)

  // Undo linkage
  undoneByEntryId String?       // Set when this entry is reversed by an UNDO entry
  undoOfEntryId   String?       // On UNDO entries: points to the original

  undoneByEntry LedgerEntry? @relation("UndoLink", fields: [undoneByEntryId], references: [id])
  undoTargets   LedgerEntry[] @relation("UndoLink")

  // Who made the change
  actorType  String            // "user", "api_key", "oauth_connection"
  actorId    String            // User.id, ApiKey.id, or McpConnection.id
  actorLabel String?           // Human-readable: username, key name, app name

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId, createdAt])
  @@index([projectId, targetModel, targetId])
  @@index([undoneByEntryId])
  @@map("ledger_entries")
}
```

### Invariants

1. Rows are never updated or deleted by application code except:
   - Setting `undoneByEntryId` when an undo targets this entry.
   - The retention pruner deleting the oldest entries beyond the cap.
2. An entry with a non-null `undoneByEntryId` cannot be undone again.
3. An `UNDO` entry cannot itself be undone (no undo-of-undo).
4. `beforeData` is null only for `CREATE`. `afterData` is null only for `DELETE`.
   For `UNDO`, both contain the state transition of the compensating operation.

### Retention

Retention is count-based per project, gated by plan:

| Plan | Max entries per project |
| ---- | ----------------------- |
| FREE | 500                     |
| PRO  | 5,000                   |
| TEAM | 50,000                  |

The pruner runs after each write (piggy-backed, not scheduled). After appending
a new entry, it counts entries for the project and deletes the oldest beyond the
cap. This is a single `DELETE ... WHERE id IN (SELECT id ... ORDER BY createdAt
LIMIT excess)` — no background job needed at current scale.

The limits table lives in `EntitlementsService` alongside `PLAN_LIMITS` and
`PLAN_FEATURES`, following the same pattern.

## Snapshots

Both `beforeData` and `afterData` store the complete domain record as a JSON
object at the moment of the change. The snapshot includes the base record and
its extension data (e.g., an Entity snapshot includes the Character/Location/
Organization/Item extension and tag names), but excludes internal fields
(`projectId`, `searchVector`, `createdAt`, `updatedAt`).

Each domain service is responsible for producing its own snapshot shape, since
each service already knows how to load a complete record with the right includes.

### Snapshot shapes by model

- **Entity**: base fields + extension (character/location/organization/item with
  itemType) + tag names. Same shape as `findBySlug` with `listInclude`.
- **Relationship**: all fields including source/target entity slugs.
- **LoreArticle**: all fields + connected entity slugs + tag names.
- **TimelineEvent**: all fields + connected entity slugs + era slug.
- **Era**: all fields.
- **Plotline**: all fields + parent plotline slug.
- **PlotPoint**: all fields + linked scene/timeline event/entity slugs.
- **Work**: all fields.
- **Chapter**: all fields.
- **Scene**: all fields + character slugs + location/plotline/event references.
- **ItemType**: all fields including fieldSchema.
- **Project** (settings only): name, description, visibility, timeline settings.
- **Tag**: name, color. (Tags are auto-created; explicit tag operations are rare
  but tracked when they come through tag management.)

## Service Layer

### AuditLedgerService

A new `@Injectable()` service in `apps/api/src/audit/audit-ledger.service.ts`.

```typescript
interface AuditActor {
  type: "user" | "api_key" | "oauth_connection";
  id: string;
  label?: string;
}

interface AppendOptions {
  projectId: string;
  operation: LedgerOperation;
  targetModel: string;
  targetId: string;
  beforeData?: object;
  afterData?: object;
  actor: AuditActor;
}
```

**Methods:**

- `append(opts: AppendOptions): Promise<LedgerEntry>` — Insert a new entry. After
  inserting, run the retention pruner for this project.

- `undo(entryId: string, actor: AuditActor): Promise<LedgerEntry>` — Validate
  the entry can be undone (not already undone, not an UNDO entry itself). Load the
  entry, determine the compensating operation, call the appropriate domain service
  to apply it (passing `audit` context so the compensating write is itself
  recorded), then set `undoneByEntryId` on the original entry. The domain service
  call with `audit` produces the UNDO-typed ledger entry as a side effect.
  Returns the new UNDO entry.

  To avoid a circular dependency (AuditLedgerService → domain services →
  AuditLedgerService), the undo method uses `ModuleRef.get()` to lazily resolve
  the domain service at call time rather than constructor injection.

  Compensating operations:
  - Original CREATE → delete the record (if it still exists and hasn't been
    modified since). If it has been modified, fail with a conflict error.
  - Original DELETE → recreate the record from `beforeData` snapshot.
  - Original UPDATE → restore `beforeData` over the current state. If the record
    has been modified since (current state ≠ `afterData`), fail with a conflict.

- `findByProject(projectId: string, options?: { targetModel?: string; targetId?: string; limit?: number; offset?: number }): Promise<{ entries: LedgerEntry[]; total: number }>` —
  Paginated query, newest first.

- `prune(projectId: string, maxEntries: number): Promise<number>` — Delete oldest
  entries beyond the cap. Returns count deleted.

### Conflict detection for undo

When undoing an UPDATE or CREATE, the service compares the record's current state
against the entry's `afterData`. If they differ, another change happened after
this one, and the undo would silently overwrite it. The service rejects the undo
with a 409 Conflict that names what changed, so the user can decide.

For undoing a DELETE, the target ID must not exist (the record must still be
deleted). If it was recreated, the undo fails with a conflict.

### Actor context

Actor information must flow from the request boundary to the ledger service.
Two sources:

1. **Web UI / REST API**: The authenticated user session. The existing auth
   middleware sets `req.user`. Services receive the actor via a parameter or
   NestJS request-scoped injection.

2. **MCP**: The `McpAuthContext` already carries `kind` ("api_key" or
   "oauth_connection"), `credentialId`, and `credentialLabel`. MCP tool
   handlers pass this to the domain service, which passes it to the ledger.

A new `AuditContext` type standardizes this across both paths:

```typescript
type AuditContext =
  | {
      type: "user";
      id: string; // User.id
      label?: string; // username
    }
  | {
      type: "api_key";
      id: string; // ApiKey.id
      label?: string; // key name
    }
  | {
      type: "oauth_connection";
      id: string; // McpConnection.id
      label?: string; // client app name
    };
```

## Integration with Domain Services

Each domain service gains an optional `audit?: AuditContext` parameter on its
write methods. When provided, the service calls `auditLedger.append(...)` after
the successful write, within the same logical operation.

Example for `EntitiesService.create`:

```typescript
async create(projectId: string, dto: CreateEntityDto, audit?: AuditContext) {
  // ... existing validation and creation logic ...
  const created = await this.prisma.entity.findUniqueOrThrow({
    where: { id: entity.id },
    include: listInclude,
  });

  if (audit) {
    await this.auditLedger.append({
      projectId,
      operation: "CREATE",
      targetModel: "Entity",
      targetId: created.id,
      afterData: this.snapshot(created),
      actor: audit,
    });
  }

  return created;
}
```

For updates, the service already loads the record before modifying it (to check
existence and validate). That pre-loaded state becomes `beforeData`.

For deletes, the service already loads the record before deleting. That becomes
`beforeData`; `afterData` is null.

### Services to instrument

| Service              | Write methods                                                                                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EntitiesService      | create, update, delete                                                                                                                                                                                                    |
| RelationshipsService | create, update, delete                                                                                                                                                                                                    |
| LoreService          | create, update, delete                                                                                                                                                                                                    |
| TimelineService      | create, update, delete                                                                                                                                                                                                    |
| ErasService          | create, update, delete                                                                                                                                                                                                    |
| StoryboardService    | createPlotline, updatePlotline, deletePlotline, createPlotPoint, updatePlotPoint, deletePlotPoint, createWork, updateWork, deleteWork, createChapter, updateChapter, deleteChapter, createScene, updateScene, deleteScene |
| EntityTypesService   | create, update, delete                                                                                                                                                                                                    |
| ProjectsService      | create, update, delete, saveTimelineConfig                                                                                                                                                                                |

**Not instrumented** (noise, not domain data changes):

- `ProjectsService.patchGraphLayout` — UI layout positions, not world content
- Tag auto-creation inside resolveTagNames — implicit side effect, not a user action

### Transaction strategy

The ledger INSERT and the data mutation should succeed or fail together. Where
the domain service already uses `this.prisma.$transaction(...)`, the ledger
append joins the transaction. Where it doesn't (most services today use
sequential Prisma calls), the ledger append runs immediately after the last
Prisma call. The window between the write and the append is small and
acceptable — a process crash in that window means a missing ledger entry, not
inconsistent data. Wrapping every service method in an interactive transaction
would be a larger refactor with diminishing returns at current scale.

## API Endpoints

New controller: `apps/api/src/audit/audit.controller.ts`

Base path: `/projects/:slug/history`

| Method | Path                               | Description                                                                                                       |
| ------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| GET    | `/projects/:slug/history`          | List ledger entries, paginated. Query params: `targetModel`, `targetId`, `limit` (default 50, max 200), `offset`. |
| GET    | `/projects/:slug/history/:id`      | Get a single entry with full before/after data.                                                                   |
| POST   | `/projects/:slug/history/:id/undo` | Undo the entry. Returns the new UNDO entry or 409 on conflict.                                                    |

Authentication: session cookie (web UI) — same as other project endpoints.
Authorization: project owner only (matches existing project auth pattern).

## Web UI

### History page

Route: `/projects/[slug]/history/page.tsx`

A full page at `/projects/:slug/history` linked from the project sidebar footer
(next to Settings). Uses the `History` (lucide) icon.

**Layout:**

- Header with page title "History" and total entry count
- Filter bar: dropdown for target model (All, Entity, Relationship, etc.)
- Scrollable list of entries, newest first, with pagination

**Each entry row shows:**

- Timestamp (relative, e.g., "2 hours ago")
- Operation badge: CREATE (green), UPDATE (blue), DELETE (red), UNDO (amber)
- Target: model name + record name/title (from afterData or beforeData)
- Actor: icon for type (user/key/app) + label
- Undo button (if the entry can be undone — not already undone, not UNDO type)
- "Undone" badge if `undoneByEntryId` is set, linking to the UNDO entry

**Entry detail (expandable or click-through):**

- For UPDATE: side-by-side diff of beforeData vs afterData, highlighting changed
  fields. Use a simple JSON field comparison — not a full text diff engine.
- For CREATE: show afterData as "created with these values"
- For DELETE: show beforeData as "deleted record contained"
- For UNDO: show what was reversed, linking to the original entry

**Undo flow:**

1. User clicks "Undo" on an entry
2. Confirmation dialog: "This will reverse [operation] on [target]. Continue?"
3. POST to `/history/:id/undo`
4. On success: refresh the list (original entry now shows "Undone" badge, new
   UNDO entry appears at top)
5. On 409 conflict: show error dialog explaining what changed since

### Sidebar addition

Add a "History" link to the project sidebar footer group, below Settings:

```tsx
{ icon: History, label: "History", href: "history" }
```

## Module Structure

```
apps/api/src/audit/
  audit.module.ts         — NestJS module, imports PrismaModule + BillingModule
  audit-ledger.service.ts — append, undo, query, prune
  audit.controller.ts     — REST endpoints under /projects/:slug/history
  audit.types.ts          — AuditContext type, snapshot types
```

The module is imported by `AppModule` and by `McpModule` (so the MCP service
can inject it into domain service calls).

## Migration Plan

1. Create migration that:
   - Drops `pending_changes` table
   - Drops `ChangeOperation` and `ChangeStatus` enums
   - Creates `ledger_entries` table with the `LedgerOperation` enum
2. Remove `PendingChange` from the Prisma schema and all references
3. Add `LedgerEntry` model to the schema
4. Update `ApiKey` model to remove `pendingChanges` relation
5. Update `Project` model to replace `pendingChanges` with `ledgerEntries`

Since `PendingChange` was never wired into the write path and no production data
exists in that table, the migration is safe with no data loss.

## Entitlements Integration

Add `maxLedgerEntries` to `PlanLimits`:

```typescript
export interface PlanLimits {
  maxProjects: number | null;
  maxLedgerEntries: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: { maxProjects: 1, maxLedgerEntries: 500 },
  PRO: { maxProjects: null, maxLedgerEntries: 5_000 },
  TEAM: { maxProjects: null, maxLedgerEntries: 50_000 },
};
```

## TODO.md Updates

- Replace the "MCP Review Queue" section with "Audit Ledger" section
- Move the "MCP Write Tools (blocked on Review Queue)" items out of that
  blocking dependency — they are no longer blocked since writes are direct
- Mark audit ledger items as they are completed
