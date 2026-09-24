# Change History & Revert

Design for recording every change to a world and reverting any of them. Replaces the MCP review queue (the `PendingChange` staging area), which is dropped.

**Status:** Planned (v0.2)
**Created:** 2026-09-24

---

## Decision

Writes apply immediately, from people and AI alike. Every write is recorded in an append-only log, and any change can be reverted: a single event, or the whole world back to a point in time ("yesterday at 3pm").

**Why not a review queue.** Staging every AI write for approval makes each agent session wait on a person. A request like "build this faction with twelve characters" produces a dozen pending diffs before anything appears in the world. Mistakes are rare and cheap to undo, so we optimise for undo rather than approval. There is no optional review mode either, because it would be the same slow path behind a setting.

`PendingChange` was modelled but never used: no service, controller, or UI reads it. The implementation removes the model, its `ChangeStatus` enum, and its relations on `Project` and `ApiKey`, and keeps `ChangeOperation` for change records.

This work also covers two items previously planned for v0.5: **entity versioning** (history on each record) and the **activity feed** (who changed what, when). Both are views over the same log.

## Requirements

- **Every write is logged**, through REST or MCP. If only AI writes were logged, reverting to 3pm would undo the AI's changes and keep the person's later edits, leaving a state that never existed.
- **One event per write transaction.** An MCP call that creates an entity and tags it is one event. A delete that cascades is one event.
- **Each event records** its actor (a person, or an MCP connection or API key acting for one), its source (`REST` or `MCP`), and a timestamp.
- **Revert one event**, or **revert to a point in time**: undo every event after time T, newest first.
- **Reverts are events too.** They are appended to the log and never remove entries, so a revert can itself be reverted.
- **Point-in-time reverts show a preview** grouped by entity ("restores 3 deleted characters, undoes 41 edits, removes 12 created items") and need confirmation. Nothing is lost, since the revert can be undone, but a large revert is disruptive, so the preview comes first.
- **Retention: keep an event if it is under 30 days old OR among the project's newest 500 events, whichever keeps more.** An idle world keeps its recent history however long it sits untouched.
- **The UI shows how far back a revert can go**: "History available back to Aug 12, 3:04pm".

## Data model

One event per transaction, and one record per row the transaction touched.

```prisma
enum ChangeSource { REST MCP }
enum ChangeKind   { WRITE REVERT_EVENT REVERT_TO_TIME }
enum ChangeOperation { CREATE UPDATE DELETE } // existing enum, kept

model ChangeEvent {
  id              String       @id @default(cuid())
  projectId       String
  kind            ChangeKind   @default(WRITE)
  source          ChangeSource
  userId          String?      // the person, directly or via their MCP connection
  mcpConnectionId String?      // set when an OAuth-connected app made the change
  apiKeyId        String?      // set when an API key made the change
  summary         String       // "Created character Mace Windu", computed at write time
  revertsEventId  String?      // REVERT_EVENT: the event undone
  revertsToTime   DateTime?    // REVERT_TO_TIME: the target time
  createdAt       DateTime     @default(now())

  project Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  records ChangeRecord[]

  @@index([projectId, createdAt])
  @@map("change_events")
}

model ChangeRecord {
  id          String       @id @default(cuid())
  eventId     String
  seq         Int          // order within the event; undo applies in reverse
  targetModel String       // "Entity", "EntityTag", "Relationship", ...
  targetId    String       // primary key of the row, or a composite key rendered as a string
  operation   ChangeOperation
  before      Json?        // full row before; null for CREATE
  after       Json?        // full row after; null for DELETE

  event ChangeEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@index([targetModel, targetId])
  @@map("change_records")
}
```

Actor columns are plain ids, not foreign keys. A revoked key or a removed connection must not erase or rewrite history. The UI resolves each id to a name while it still exists, and shows "Revoked key" otherwise.

**Full snapshots, not diffs.** `before` and `after` hold the complete row. Each event can be undone on its own, so pruning old events never breaks the ones kept. The cost is storage, which retention bounds.

### Logged models

Everything a user can create or edit inside a world: `Entity` and its extensions (`Character`, `Location`, `Organization`, `Item`), `OrgMember`, `ItemType`, `Relationship`, `Era`, `TimelineEvent`, `TimelineEventEntity`, `LoreArticle`, `LoreArticleEntity`, `Tag`, `EntityTag`, `LoreArticleTag`, `Plotline`, `PlotPoint`, `Work`, `Chapter`, `Scene`, `SceneCharacter`, `Map`, and the editable `Project` fields (name, description, visibility).

**Not logged:** credentials (`ApiKey`, OAuth tables), billing, and account data. Deleting a project is not revertable, and its history goes with it.

## Write path

A `ChangeLogService` records changes inside the same Prisma transaction as the write. Every domain service uses it, so REST controllers and MCP tools share one path:

1. Open a transaction.
2. Read the affected rows (`before`).
3. Apply the write.
4. Read the rows back (`after`).
5. Insert the event and its records.
6. Commit.

If logging fails the write fails. A write that cannot be undone must not succeed silently.

Logging happens in application code rather than database triggers. A trigger cannot see the actor, the source, or which rows belong to one logical change.

The actor comes from the request context: the session user for REST, and the credential (`McpConnection` or `ApiKey`) and its owner for MCP, which `McpAuthGuard` already resolves into `McpAuthContext` (`credentialId`, `ownerId`).

### Cascading deletes

Deleting an entity also removes its relationships, timeline links, lore mentions, scene appearances, tags, and org memberships through `onDelete: Cascade`. Postgres removes those rows without the application seeing them, so the service must read the whole subtree **before** the delete and record each row as a `DELETE` record in the same event. A test per cascading model should prove that delete-then-revert restores the subtree exactly.

## Revert

### One event

Apply the event's records in reverse `seq`:

- A `CREATE` is undone by deleting the row.
- An `UPDATE` is undone by writing `before` back.
- A `DELETE` is undone by re-inserting `before` **with the original id**, so ids held elsewhere keep working.

All of this runs in one transaction and is logged as a `REVERT_EVENT` whose records are the inverse operations.

**Conflicts.** A later event may have touched the same row. For each record, compare the row's current state with the record's `after`:

- **Unchanged since:** revert it.
- **Changed since:** revert only the fields that still equal `after`, and report the rest as skipped. The preview lists skipped fields before anything runs.
- **Row since deleted:** skip it and report it.
- **Undoing a delete where the name is now taken** (entity names are unique per type): refuse that record and say which entity holds the name. Don't auto-rename, because that invents data.

### Point in time

Undo every `WRITE` and `REVERT_*` event after T, newest first, as one `REVERT_TO_TIME` event. Because every write is logged, each field can simply take its value as of T, so no field-level conflicts arise. The name conflicts above cannot arise either, since the whole world returns to a state that existed.

**Preview.** Compute the net effect per row (created after T → removed, deleted after T → restored, otherwise → fields changed) and summarise it by entity. Nothing is written until the person confirms.

T must be no earlier than the oldest retained event. The API rejects anything earlier with the earliest valid time.

## Retention

A nightly repeatable job on the existing maintenance queue (`apps/api/src/queue`) deletes, per project, events that are both older than 30 days and outside the newest 500. Records go with their events by cascade. Both limits live in config so they can differ by plan later.

## API and MCP

- `GET /projects/:slug/history?before=&limit=&entity=&source=`: paginated events, filterable to one record or to AI-only changes.
- `GET /projects/:slug/history/earliest`: the oldest revertable time.
- `POST /projects/:slug/history/:eventId/revert/preview` and `.../revert`
- `POST /projects/:slug/history/revert-to/preview` and `.../revert-to` (body `{ at }`)

Only project owners can read history or revert. Snapshots include `secrets` and author notes, so history never appears on the public wiki and is never returned to a read-only credential.

MCP write tools are unchanged: they keep applying directly. A read-only `list_changes` tool can come later. Revert stays in the web UI, with a person confirming.

## UI

- **History page** in the project sidebar: events newest first, each showing its summary, actor, and time, with "Revert" on each. A banner shows the earliest revertable time and "Revert world to…" with a date-time picker.
- **History tab** on entity, lore, and scene pages: the same list filtered to that record, with before/after for updates.
- **Preview dialog** for both kinds of revert, listing restored, removed, and changed items, plus any skipped fields.

## Tier

Free, taking over the review queue's place as the safety net for AI writes, which are free. Open question: pricing still lists "Entity versioning" as Pro and "Activity feed & audit log" as Team. Those are now views over this log, so either they become free with it, or the paid tiers get something more, such as longer retention.

## Out of scope

- Collaborator suggestion mode for Team plans. It previously reused `PendingChange` and now needs its own design under Collaboration (v0.5).
- Real-time co-editing history. Yjs keeps its own document history, and saved results still pass through this log.

## Verification

- Delete, then revert, for each cascading model restores every row with the same ids.
- A point-in-time revert across creates, updates, and deletes reproduces the world as it was at T, checked by comparing the logged models against a snapshot taken at T.
- Reverting a revert restores the post-change state.
- A single-event revert skips a field edited later and reports it.
- Retention keeps the newest 500 events in an idle project, and prunes events older than 30 days only once more than 500 exist.
- A failure while logging rolls back the write.
