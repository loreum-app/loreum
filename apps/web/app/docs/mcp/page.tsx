"use client";

import Link from "next/link";
import { Button } from "@loreum/ui/button";

export default function McpDocsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8">
        <Link
          href="/docs"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to docs
        </Link>
      </div>

      <h1 className="mb-4 text-3xl font-bold">MCP Server</h1>
      <p className="mb-8 text-muted-foreground">
        Connect AI assistants like Claude to your Loreum world data using the
        Model Context Protocol. Read your entire world and write changes that
        land in a review queue for your approval.
      </p>

      <div className="prose prose-invert max-w-none space-y-8">
        <section>
          <h2>What is MCP?</h2>
          <p className="text-muted-foreground">
            MCP (Model Context Protocol) is an open standard that lets AI
            assistants connect to external tools and data sources. Loreum&apos;s
            MCP server exposes your world data as structured tools the AI can
            call. The AI reads your characters, relationships, timeline, lore,
            and style guide. It can also propose changes (new entities,
            relationships, articles) that land in a staging area for your review.
          </p>
        </section>

        <section>
          <h2>Authentication</h2>
          <p className="text-sm text-muted-foreground">
            Generate a project-scoped API key from your project settings page.
            Each key has a name (e.g. &quot;Claude Desktop&quot;), a permission
            level (read-only or read-write), and an optional expiration date.
            The key is displayed once on creation. Copy it and add it to your
            MCP client configuration.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            You can generate multiple keys per project and revoke any key at any
            time from project settings.
          </p>
        </section>

        <section>
          <h2>Setup for Claude Desktop</h2>
          <p className="text-sm text-muted-foreground">
            Add this to your Claude Desktop MCP configuration file:
          </p>
          <pre className="rounded-lg bg-muted p-4 text-sm">
            {`{
  "mcpServers": {
    "loreum": {
      "command": "node",
      "args": ["path/to/loreum/apps/mcp/dist/index.js"],
      "env": {
        "MCP_API_BASE_URL": "https://loreum.app/api/v1",
        "MCP_API_TOKEN": "your-api-key"
      }
    }
  }
}`}
          </pre>
          <p className="mt-2 text-xs text-muted-foreground">
            Replace{" "}
            <code className="rounded bg-muted px-1">your-api-key</code> with
            the key you generated in project settings. For local development,
            use{" "}
            <code className="rounded bg-muted px-1">
              http://localhost:3021/api/v1
            </code>{" "}
            as the base URL.
          </p>
        </section>

        <section>
          <h2>Read Tools</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            These tools let the AI query your world data. Available with both
            read-only and read-write API keys.
          </p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Tool</th>
                  <th className="px-4 py-2 text-left font-medium">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">search_project</td>
                  <td className="px-4 py-2">Full-text search across entities, lore, scenes, and timeline</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">get_entity</td>
                  <td className="px-4 py-2">Single entity with optional relationships, lore, scenes, and timeline</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">get_entity_hub</td>
                  <td className="px-4 py-2">Full aggregated page for an entity with all connected content</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">list_entities</td>
                  <td className="px-4 py-2">List and filter entities by type, tag, or search query</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">get_storyboard</td>
                  <td className="px-4 py-2">Narrative structure: plotlines, works, chapters, scenes</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">get_entity_types</td>
                  <td className="px-4 py-2">Entity types and their field schemas</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">get_style_guide</td>
                  <td className="px-4 py-2">Base style guide, scene overrides, and character voice notes</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">get_timeline</td>
                  <td className="px-4 py-2">Timeline events and eras for a project</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">get_lore_article</td>
                  <td className="px-4 py-2">Single lore article with linked entities</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">list_lore_articles</td>
                  <td className="px-4 py-2">List and filter lore articles by category or tag</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">get_relationships</td>
                  <td className="px-4 py-2">Relationships for a specific entity</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Write Tools</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            These tools let the AI propose changes to your world. All writes
            create pending changes in the review queue instead of modifying live
            data. Requires a read-write API key.
          </p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium">Tool</th>
                  <th className="px-4 py-2 text-left font-medium">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">create_entity</td>
                  <td className="px-4 py-2">Create a character, location, organization, or custom item</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">update_entity</td>
                  <td className="px-4 py-2">Partial update to an existing entity</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">delete_entity</td>
                  <td className="px-4 py-2">Delete an entity</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">create_relationship</td>
                  <td className="px-4 py-2">Create a relationship between two entities</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">delete_relationship</td>
                  <td className="px-4 py-2">Delete a relationship</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">create_lore_article</td>
                  <td className="px-4 py-2">Create a lore article linked to entities</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">update_lore_article</td>
                  <td className="px-4 py-2">Update an existing lore article</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">delete_lore_article</td>
                  <td className="px-4 py-2">Delete a lore article</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">create_timeline_event</td>
                  <td className="px-4 py-2">Create a timeline event linked to entities</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">update_timeline_event</td>
                  <td className="px-4 py-2">Update an existing timeline event</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">delete_timeline_event</td>
                  <td className="px-4 py-2">Delete a timeline event</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">create_scene</td>
                  <td className="px-4 py-2">Create a scene within a chapter</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">update_scene</td>
                  <td className="px-4 py-2">Update scene content, style notes, or characters</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">create_plot_point</td>
                  <td className="px-4 py-2">Create a plot point on a plotline</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-2 font-mono text-xs">update_plot_point</td>
                  <td className="px-4 py-2">Update a plot point</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">set_style_guide</td>
                  <td className="px-4 py-2">Create or update the project style guide</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2>Review Queue</h2>
          <p className="text-sm text-muted-foreground">
            Every write tool creates a pending change instead of modifying your
            world directly. You review these changes from the Review Queue page
            in your project. Each change shows the operation type (create,
            update, or delete), the target, and a diff of what will change.
            Changes from a single AI session are grouped together so you can
            review them in context.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            You can accept, edit, or reject each change individually, or use
            batch accept to apply all changes from a session at once.
          </p>
        </section>

        <section>
          <h2>Example Usage</h2>
          <p className="text-sm text-muted-foreground">
            Once connected, you can ask Claude things like:
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              &quot;Who are the main characters in my Star Wars project?&quot;
            </li>
            <li>&quot;What relationships does Luke Skywalker have?&quot;</li>
            <li>&quot;Create a new location called the Iron Citadel.&quot;</li>
            <li>&quot;Write a lore article about the history of the Jedi Order.&quot;</li>
            <li>&quot;What does my style guide say about dialogue?&quot;</li>
            <li>&quot;Add a timeline event for the Battle of Yavin.&quot;</li>
            <li>&quot;Is there anything contradictory in my timeline?&quot;</li>
          </ul>
        </section>

        <section>
          <h2>Self-Hosting</h2>
          <p className="text-sm text-muted-foreground">
            The MCP server is included in the Loreum repository at{" "}
            <code className="rounded bg-muted px-1">apps/mcp/</code>. Build it
            with{" "}
            <code className="rounded bg-muted px-1">
              pnpm --filter mcp build
            </code>{" "}
            and run with{" "}
            <code className="rounded bg-muted px-1">node dist/index.js</code>.
          </p>
        </section>
      </div>

      <div className="mt-12">
        <a
          href="https://github.com/loreum-app/loreum"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline">View source on GitHub</Button>
        </a>
      </div>
    </div>
  );
}
