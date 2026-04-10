# User Journeys

Detailed user flows through Loreum. These inform the data model, API surface, and UX design. Each journey includes decision points that need resolution before implementation.

---

## 1. New User Onboarding

```
1.  User lands on loreum.app homepage
2.  Sees hero section: value prop, screenshot/demo, "Get Started" CTA
3.  Clicks "Get Started" → sign in page
4.  Chooses OAuth provider (Google, Discord, GitHub, LinkedIn)
5.  OAuth flow → authorized → redirected back
6.  First-time user detected (no projects) → onboarding flow:
    a. Welcome screen: "Let's build your first world"
    b. Enter project name and optional description
    c. Choose starting template:
       - Blank (empty project)
       - Fantasy (pre-configured entity types: Races, Magic Systems, Kingdoms)
       - Sci-Fi (pre-configured: Species, Tech, Factions)
       - Historical (pre-configured: Nations, Battles, Figures)
       - Skip templates
    d. Project created
7.  → Project dashboard (empty state)
8.  Dashboard shows guided prompts:
    - "Add your first character" → create character dialog
    - "Create a location" → create location dialog
    - "Start your timeline" → timeline page
    - "Write some lore" → create lore article
9.  User clicks "Add your first character"
10. Create dialog: name, summary, type-specific fields (status, species, etc.)
11. Character created → navigated to character detail page
12. Sidebar now shows the character under Entities > Characters
13. Back on dashboard: prompt updates to "Add a relationship" or "Create a location"
14. User continues building, guided prompts fade as content accumulates
```

**Decision points:**

- Do templates pre-populate entities, or just configure entity type schemas (custom fields, icons)?
- What's on the project dashboard beyond prompts? Recent activity? Stats? A world overview?
- At what point do guided prompts stop showing? After N entities? After each prompt type is completed once?
- Should onboarding offer a quick tour / tooltip walkthrough of the sidebar sections?

---

## 2. Returning Author — Building a World

```
1.  User opens loreum.app → already authenticated → project list
2.  Sees their projects with last-edited timestamps
3.  Clicks a project → project dashboard
4.  Dashboard shows:
    - Recent activity (last 5 edits across all sections)
    - Quick stats (entity count, article count, word count)
    - Quick-add buttons for each entity type
5.  Navigates via sidebar to Entities > Characters
6.  Sees character list with cards showing name, role, summary
7.  Clicks a character → character detail page
8.  Clicks "Edit" → inline editing activates
9.  Edits description using rich text editor (Tiptap):
    - Types prose, uses formatting (bold, headers, lists)
    - Types [[The Rebellion]] → popup search → links to an organization
    - Drags in an image → uploaded to R2 → embedded in description
10. Edits type-specific fields (species, status, role)
11. Clicks "Save" (or Cmd+S)
12. Scrolls down to Relationships section → sees existing connections
13. Clicks "Add Relationship" → dialog with entity picker, label, description
14. Navigates to Knowledge Graph via sidebar
15. Sees the character connected to other entities visually
16. Drags nodes to rearrange, clicks "Save Layout"
17. Uses graph filter to show only Characters and Organizations
18. Clicks a node → navigated to that entity's detail page
```

**Decision points:**

- Does the `[[entity]]` link in a rich text field auto-add the entity to the relevant join table (e.g., add to LoreArticleEntity when mentioned in a lore article)?
- Graph layout — saved per user or per project? If collaborating, does everyone see the same layout?
- Should the character list page have sort/filter controls (by status, role, tag, alphabetical)?

---

## 3. Reader/Viewer — Public Wiki

```
1.  Visitor arrives at loreum.app/worlds/star-wars (public project URL)
2.  Sees a public landing page for the world:
    - Project name, description, author credit
    - Hero image (if set)
    - Navigation: Characters, Locations, Organizations, custom types, Lore, Timeline, Graph
3.  Clicks "Characters" → public character list
    - Cards with name, image, summary
    - No edit buttons, no secrets, no notes
    - Only entities marked as public are shown
4.  Clicks a character → public character detail page
    - Description, backstory (if public), type-specific fields
    - Relationships section (linked to other public entities)
    - Timeline appearances
    - Connected lore articles
    - NO secrets field, NO notes field, NO edit controls
5.  Navigates to Lore → public article list organized by category/hierarchy
6.  Clicks an article → rendered in a clean reading layout
    - Entity mentions are clickable links to public entity pages
    - Table of contents for hierarchical articles
    - Category breadcrumb navigation
7.  Navigates to Timeline → read-only Gantt view
    - Can zoom and scroll but not drag/edit
    - Events link to connected public entities
8.  Navigates to Knowledge Graph → read-only interactive view
    - Can pan, zoom, click nodes to navigate
    - Cannot edit connections or drag to rearrange
9.  Navigates to Maps → interactive pan/zoom on map images
    - Location pins are clickable → navigate to public location page
10. Visitor clicks "Create your own world" CTA → sign up flow
```

**Decision points:**

- Does the public wiki have its own distinct visual theme/layout, or reuse the app layout without edit controls?
- Is there a public API for the wiki (JSON endpoints for programmatic access)?
- Should public pages be statically generated / cached for performance?
- Does the author get analytics on public wiki visits (page views, popular entities)?
- Can visitors leave comments or reactions on public pages, or is it purely read-only?
- How does SEO work? Each public entity/article should have its own meta tags, Open Graph images.

---

## 4. Collaborator — Team Editing

```
1.  Project owner goes to Project Settings > Team
2.  Clicks "Invite Member" → enters email address
3.  Selects role: Editor, Viewer, or Commenter
4.  Invitation sent via email (Resend) with a link
5.  Invitee clicks link → signs in (or signs up) → added to project
6.  Invitee sees the project in their project list with a "Shared" badge

    --- As Editor ---
7.  Editor opens the project → full sidebar, can navigate all sections
8.  Opens a character → can click Edit, make changes, save
9.  Sees real-time presence indicators: "Alice is viewing this page"
10. Both Alice and Bob open the same lore article
11. Both start editing → Yjs/Tiptap handles real-time merge
    - Colored cursors show each person's position
    - Changes appear instantly for both users
12. Editor navigates to Activity Feed → sees recent changes by all members:
    - "Alice edited Darth Vader — 5 minutes ago"
    - "Bob created lore article 'The Force' — 1 hour ago"
    - Each entry links to the changed item

    --- As Viewer ---
13. Viewer opens the project → can navigate and read everything (including secrets)
14. Cannot edit, no edit buttons shown
15. Can leave comments on entities and articles (if Commenter role or above)

    --- As Commenter ---
16. Commenter can do everything a Viewer can, plus:
17. Opens an entity → comment section at the bottom
18. Writes a comment → notification sent to owner and editors
19. Comments are threaded (reply to a specific comment)

    --- Owner manages ---
20. Owner can change member roles or remove members
21. Owner can transfer ownership to another member
22. Activity log shows all membership changes
```

**Decision points:**

- Can editors delete entities/articles, or only the owner?
- Is there a "suggest changes" mode for editors (creates pending changes instead of direct edits)?
- Do viewers see the secrets field? Or is that owner-only even within the team?
- Are comments visible in the public wiki, or private to the team?
- Real-time collaboration — does it apply to all text fields, or only the Tiptap editor (lore articles, scene prose)?
- How are conflicts handled for non-Tiptap fields (like character status dropdown)? Last-write-wins?

---

## 5. Pro Subscriber — AI Features

```
1.  Free user has been using Loreum, hits a limitation:
    - Tries to create a second project → "Upgrade to Pro for unlimited projects"
    - Sees "AI Assistant" in sidebar → "Pro feature"
2.  Clicks upgrade → Stripe Checkout with plan options
3.  Completes payment → redirected back → Pro badge on profile
4.  Subscription managed via account settings (cancel, change plan, billing history)

    --- AI Chat ---
5.  Opens AI Assistant panel (sidebar or floating)
6.  Types: "Who are Luke's enemies?"
7.  AI queries the knowledge graph → returns:
    "Based on your world data, Luke's enemies include:
     - **Darth Vader** (father, turned to dark side) — [view entity]
     - **Emperor Palpatine** (Sith master) — [view entity]
     - **Jabba the Hutt** (crime lord) — [view entity]
    These are based on relationships marked as hostile or antagonistic."
8.  User asks: "What happens to the Rebellion after the Battle of Endor?"
9.  AI checks timeline events and lore → synthesizes an answer with citations

    --- Writing Assistance ---
10. User opens a scene in the writing editor
11. Highlights a paragraph → right-click → "AI: Continue this scene"
12. AI reads the scene context, POV character data, and current plotline
13. Generates a continuation → appears as a suggestion (different color/style)
14. User can accept, edit, or reject the suggestion
15. User can also: "Describe this location" → AI uses the entity's detail fields
16. Or: "Write dialogue for Han Solo" → AI uses character personality, relationships

    --- Consistency Check ---
17. User clicks "Check Consistency" from project dashboard or toolbar
18. AI analyzes:
    - Timeline conflicts (character in two places at same time)
    - Relationship contradictions
    - Dead characters appearing in later scenes
    - Lore article claims vs entity data mismatches
19. Returns a report with specific issues, each linked to the relevant entities/events
20. User can dismiss false positives or click through to fix
```

**Decision points:**

- How is AI token usage tracked and limited? Per-month quota? Pay-per-use on top of subscription?
- Does the AI chat history persist between sessions?
- For writing suggestions, does the AI have access to ALL project data or just the current context (scene + related entities)?
- Can the AI create entities/relationships directly, or does it always go through the review queue?
- Is consistency checking on-demand only, or can it run automatically (e.g., on save)?

---

## 6. AI Integration — MCP Workflow

```
1.  User has a project in Loreum with existing world data
2.  User opens Claude Desktop (or any MCP-compatible AI client)
3.  Connects the Loreum MCP server:
    - Enters their Loreum API URL and auth token
    - MCP server exposes tools: search, list entities, read entity, create entity, etc.

    --- AI reads the world ---
4.  User asks Claude: "Summarize the major factions in my Star Wars project"
5.  Claude calls MCP tool: search_entities(type=ORGANIZATION)
6.  Claude calls MCP tool: get_entity(slug="the-rebellion") for each result
7.  Claude synthesizes a summary from the returned data

    --- AI writes to the world ---
8.  User says: "Add a new character named Mace Windu, he's a Jedi Master"
9.  Claude calls MCP tool: create_entity(type=CHARACTER, name="Mace Windu", ...)
10. → Change goes to the REVIEW QUEUE (not directly live)
11. User opens Loreum web → sees notification: "1 pending suggestion"
12. Opens review queue → sees:
    "Claude suggested: Create character 'Mace Windu'
     Type: Character
     Summary: Jedi Master and member of the Jedi Council
     Status: alive
     Species: human
     Role: supporting"
13. User can:
    a. Accept → entity created as-is
    b. Edit → modify fields, then accept
    c. Reject → discarded
14. Accepted entity appears in the project immediately

    --- Bulk operations ---
15. User says: "Create all the main characters from the prequel trilogy"
16. Claude creates multiple entities → all go to review queue
17. User reviews them as a batch: accept all, reject some, edit others
```

**Decision points:**

- Does the review queue apply to ALL MCP writes, or can the user configure "trusted mode" (direct writes)?
- How does the MCP server authenticate? API key per user? Per project?
- Should MCP reads also be gated (e.g., a collaborator's AI can only read what their role allows)?
- Does the review queue show a diff for updates (not just creates)?
- Can the user undo an accepted suggestion?
- Rate limits on MCP writes to prevent AI from flooding the queue?

---

## 7. Storyboard & Writing Flow

```
    --- Setting up the story structure ---
1.  User navigates to Storyboard via sidebar
2.  Creates a plotline: "The Hero's Journey" with a thematic statement
3.  Adds plot points to the plotline:
    - "Call to Adventure" → links to Luke, Tatooine, timeline event
    - "Meeting the Mentor" → links to Obi-Wan, Luke
    - "The Ordeal" → links to Death Star, multiple characters
4.  Each plot point can link to: multiple characters, a location, organizations, items, a timeline event
5.  Creates a Work: "A New Hope" with synopsis, chronological/release order
6.  Adds chapters to the work, each with a title and notes
7.  Adds scenes to chapters:
    - Title, POV character, location, linked plotline, timeline event
    - Multiple characters present (SceneCharacter)
    - Status: outline

    --- Writing a scene ---
8.  Clicks a scene → opens in split-pane writing view
9.  Left pane: Tiptap rich text editor
    - Scene metadata bar at top (POV, location, status, word count)
    - Writing area below
10. Right pane: reference panel with tab picker
    - Entity detail (character, location, etc.)
    - Relationship graph (filtered to relevant entities)
    - Timeline (showing where this scene falls)
    - Another scene or lore article
    - Plotline overview
11. User writes prose in the editor:
    - Standard formatting (bold, italic, headers, blockquotes)
    - [[Entity Name]] linking with search popup
    - Inline images
    - Scene breaks / section dividers
12. Word count updates live in the metadata bar
13. Auto-saves periodically + manual Cmd+S
14. Changes scene status: outline → draft → final
15. Drag-and-drop scenes to reorder within a chapter
16. Drag chapters to reorder within a work

    --- Connecting the dots ---
17. User views a plotline → sees all plot points in sequence
18. Each plot point shows its linked scene (if any) with status indicator
19. Unlinked plot points are highlighted as "needs a scene"
20. User clicks "Create Scene for this Plot Point" → pre-fills the scene with plot point data
21. Timeline view shows scenes positioned by their linked timeline events
22. Relationship graph can filter to "entities in this chapter" to see the local web of connections

    --- Tracking progress ---
23. Storyboard overview shows:
    - Per-work: total scenes, scenes by status (outline/draft/final), total word count
    - Per-plotline: plot points linked vs unlinked to scenes
    - Overall project: total word count across all works
```

**Decision points:**

- Is the split-pane resizable? Can you collapse it to full-width editor?
- Can you have multiple tabs in the reference pane, or just one at a time?
- Does auto-save create version snapshots, or just overwrite? How often?
- Can scenes belong to multiple chapters (shared scenes between works)?
- Is there a "manuscript mode" that renders all scenes in order as a continuous read?
- How does the word count aggregate? Per scene, per chapter, per work, per project?
- Can plot points link to multiple scenes (same story beat from different POVs)?
- Is there a "writing goal" feature (daily word count target)?

---

## Summary of Data Model Implications

Key requirements surfaced by these journeys that affect the schema:

| Journey | Requirement               | Schema Impact                                                |
| ------- | ------------------------- | ------------------------------------------------------------ |
| 1       | Project templates         | `ProjectTemplate` model or template JSON blobs               |
| 2       | Entity mentions auto-link | Logic to parse `[[links]]` and update join tables            |
| 3       | Per-entity visibility     | `isPublic` field on Entity, LoreArticle                      |
| 3       | SEO for public pages      | Open Graph fields or generation from existing data           |
| 4       | Team membership           | `ProjectMember` model (userId, projectId, role)              |
| 4       | Invitations               | `ProjectInvitation` model                                    |
| 4       | Comments                  | `Comment` model (polymorphic or per-type)                    |
| 4       | Activity log              | `ActivityLog` model                                          |
| 4       | Real-time presence        | WebSocket state (in-memory, not persisted)                   |
| 5       | Subscriptions             | `Subscription` model, Stripe integration                     |
| 5       | AI chat history           | `AiConversation`, `AiMessage` models                         |
| 5       | Consistency report        | Generated on-demand, possibly cached                         |
| 6       | Review queue              | `PendingChange` model (entity type, action, payload, status) |
| 6       | MCP auth                  | API key model or token scoping                               |
| 7       | Scene prose content       | `content` field (Tiptap JSON) — already exists               |
| 7       | Scene status              | `status` enum on Scene                                       |
| 7       | Word count                | `wordCount` field on Scene, computed on save                 |
| 7       | Multi-entity plot points  | `PlotPointEntity` join table replacing single FK             |
| 7       | Version history           | `EntityVersion` / `ArticleVersion` models                    |
