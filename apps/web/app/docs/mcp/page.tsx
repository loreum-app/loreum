"use client";

import Link from "next/link";
import { Button } from "@loreum/ui/button";
import { API_ORIGIN, API_URL } from "@/lib/api";

const PUBLIC_API = process.env.NEXT_PUBLIC_API_URL?.includes("localhost")
  ? "https://api.loreum.app/v1"
  : API_URL;
const PUBLIC_ORIGIN = PUBLIC_API.replace(/\/v1\/?$/, "");
const EXAMPLE_URL = `${PUBLIC_API}/mcp/your-world`;

const READ_TOOLS: [string, string][] = [
  [
    "get_project",
    "World overview: name, description, timeline settings, content counts",
  ],
  [
    "search_project",
    "Search entities, lore, timeline events, and scenes in one call",
  ],
  [
    "list_entities",
    "Characters, locations, organizations, items — filter by type or name",
  ],
  [
    "get_entity",
    "One entity with relationships, timeline events, lore, tags, secrets",
  ],
  ["get_entity_types", "Custom item types and their field schemas"],
  ["list_tags", "All tags in the world"],
  [
    "search / fetch",
    "ChatGPT connector contract: search hits with citation URLs, and full documents by id",
  ],
  ["list_relationships", "Graph edges, optionally for one entity"],
  [
    "list_lore_articles",
    "Lore titles by category, title text, or linked entity",
  ],
  ["get_lore_article", "Full markdown of one article"],
  ["get_timeline", "Events in order, filterable by entity or significance"],
  ["get_timeline_event", "One event in full"],
  ["list_eras", "Named historical periods"],
  ["get_storyboard", "Plotlines and works with chapters"],
  ["get_plotline", "A plotline with its plot points"],
  ["get_work", "A work with its chapters"],
  ["list_scenes", "Scenes of a chapter, including prose"],
];

const WRITE_TOOLS: [string, string][] = [
  [
    "create_entity / update_entity / delete_entity",
    "Characters, locations, organizations, items (with tags)",
  ],
  [
    "create_relationship / update_relationship / delete_relationship",
    "Knowledge graph edges",
  ],
  [
    "create_lore_article / update_lore_article / delete_lore_article",
    "Lore wiki",
  ],
  [
    "create_timeline_event / update_timeline_event / delete_timeline_event",
    "History",
  ],
  ["create_era", "Historical periods"],
  [
    "create_plotline / create_plot_point / update_plot_point",
    "Story arcs and beats",
  ],
  [
    "create_work / create_chapter",
    "Books, scripts, campaigns and their chapters",
  ],
  ["create_scene / update_scene", "Scenes including narrative prose"],
];

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

      <h1 className="mb-4 text-3xl font-bold">Connect AI (MCP)</h1>
      <p className="mb-8 text-muted-foreground">
        Loreum is a remote MCP server. Connect Claude, Cursor, or any Model
        Context Protocol client to a world and the assistant can search and read
        everything in it, and, if you allow it, create and edit entities, lore,
        timeline events, and story content.
      </p>

      <div className="prose prose-invert max-w-none space-y-10">
        <section>
          <h2>How it works</h2>
          <p className="text-sm text-muted-foreground">
            Every world has its own MCP URL, shown under{" "}
            <b>Settings → Connect AI</b> in the app:
          </p>
          <pre className="rounded-lg bg-muted p-4 text-sm">{EXAMPLE_URL}</pre>
          <p className="text-sm text-muted-foreground">
            When an app connects to that URL it is sent to Loreum to sign in.
            You pick the world and whether the app may only read or also write,
            then approve. Nothing to copy or paste. Each approval is a{" "}
            <b>connected app</b> you can disconnect from the world&apos;s
            settings at any moment, which instantly stops every token that app
            holds.
          </p>
          <p className="text-sm text-muted-foreground">
            Under the hood this is standard OAuth 2.1: client ID metadata
            documents (the recommended way for apps to identify themselves) or
            dynamic client registration, PKCE (S256), short-lived access tokens,
            rotating refresh tokens, and tokens bound to exactly one
            world&apos;s URL. A token issued for one world is rejected by every
            other world&apos;s URL, even on the same account.
          </p>
        </section>

        <section id="connect">
          <h2>Connecting</h2>

          <h3 className="mt-6 text-base font-medium">
            Claude (web, desktop, mobile)
          </h3>
          <ol className="text-sm text-muted-foreground">
            <li>
              Open Claude → Settings → Connectors → <b>Add custom connector</b>.
            </li>
            <li>
              Paste your world&apos;s MCP URL. Under OAuth client, keep
              &quot;Use Anthropic&apos;s hosted client metadata&quot; (the
              recommended option; Loreum supports it).
            </li>
            <li>
              Click Connect and approve access on the Loreum page that opens.
            </li>
            <li>
              Enable the connector in a conversation. It also shows up in Claude
              Code.
            </li>
          </ol>

          <h3 className="mt-6 text-base font-medium">Claude Code</h3>
          <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
            {`claude mcp add --transport http loreum ${EXAMPLE_URL}`}
          </pre>
          <p className="text-sm text-muted-foreground">
            Claude Code opens your browser to sign in the first time (or run{" "}
            <code>/mcp</code>). Tokens are refreshed in the background.
          </p>

          <h3 className="mt-6 text-base font-medium">ChatGPT</h3>
          <p className="text-sm text-muted-foreground">
            Settings → Connectors → <b>Create</b>: name it, paste your
            world&apos;s MCP URL, choose OAuth, then approve on the Loreum page
            that opens. ChatGPT&apos;s standard connectors and deep research use
            the <code>search</code> and <code>fetch</code> tools (with citation
            links back to your world); enable <b>Developer mode</b> under
            Connectors → Advanced to use every tool.
          </p>

          <h3 className="mt-6 text-base font-medium">Cursor</h3>
          <p className="text-sm text-muted-foreground">
            Add to <code>.cursor/mcp.json</code>; Cursor handles the sign-in
            flow itself:
          </p>
          <pre className="rounded-lg bg-muted p-4 text-sm">
            {`{
  "mcpServers": {
    "loreum": { "url": "${EXAMPLE_URL}" }
  }
}`}
          </pre>

          <h3 className="mt-6 text-base font-medium">Other clients</h3>
          <p className="text-sm text-muted-foreground">
            Any client that speaks MCP over Streamable HTTP and supports OAuth
            will work the same way (Windsurf, VS Code, the MCP Inspector).
            Clients that only support fixed headers can use an API key instead,
            see below.
          </p>
        </section>

        <section id="api-keys">
          <h2>API keys</h2>
          <p className="text-sm text-muted-foreground">
            For scripts, the REST API, and MCP clients without OAuth support,
            generate a project-scoped key under <b>Settings → API keys</b>. Keys
            are read-only or read-write, optionally expire, and can be revoked
            at any time. The key is shown once. Send it as a bearer token:
          </p>
          <pre className="rounded-lg bg-muted p-4 text-sm">
            {`{
  "mcpServers": {
    "loreum": {
      "url": "${EXAMPLE_URL}",
      "headers": { "Authorization": "Bearer lrm_your_api_key" }
    }
  }
}`}
          </pre>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-4 text-sm">
            {`claude mcp add --transport http loreum ${EXAMPLE_URL} \\
  --header "Authorization: Bearer lrm_your_api_key"`}
          </pre>
          <p className="text-xs text-muted-foreground">
            In Claude&apos;s custom connector dialog, keys go under{" "}
            <b>Request headers</b> as an <code>Authorization</code> header with
            the value <code>Bearer lrm_…</code> (beta feature for organization
            admins). The older project-less URL <code>{PUBLIC_API}/mcp</code>{" "}
            still accepts API keys.
          </p>
        </section>

        <section>
          <h2>Read tools</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Available to every connection. Slugs and ids returned here feed the
            other tools.
          </p>
          <ToolTable rows={READ_TOOLS} />
        </section>

        <section>
          <h2>Write tools</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Only offered to read &amp; write connections; read-only connections
            don&apos;t even see them. Every tool declares whether it is
            destructive so clients can ask before deleting.
          </p>
          <ToolTable rows={WRITE_TOOLS} />
        </section>

        <section>
          <h2>Review queue</h2>
          <p className="text-sm text-muted-foreground">
            Write tools currently change your world directly. A review queue,
            where AI-proposed changes wait in a staging area with a diff for you
            to accept or reject, is on the{" "}
            <Link href="/roadmap" className="underline hover:text-foreground">
              roadmap
            </Link>
            . Until then, grant read-only access if you don&apos;t want the
            assistant editing your canon.
          </p>
        </section>

        <section>
          <h2>Example prompts</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              &quot;Who are the main characters in my world and how are they
              connected?&quot;
            </li>
            <li>
              &quot;Summarize everything that happened in the Third Age.&quot;
            </li>
            <li>
              &quot;Create a location called the Iron Citadel in the Northern
              Wastes, tagged fortress.&quot;
            </li>
            <li>
              &quot;Write a lore article on the founding of the Jedi Order and
              link it to Yoda.&quot;
            </li>
            <li>
              &quot;Draft the opening scene of chapter one from Frodo&apos;s
              point of view.&quot;
            </li>
          </ul>
        </section>

        <section>
          <h2>Self-hosting</h2>
          <p className="text-sm text-muted-foreground">
            The MCP server and its OAuth authorization server are part of the
            Loreum API. Set <code>PUBLIC_API_URL</code> to the exact origin
            users will paste (for example <code>{PUBLIC_ORIGIN}</code>) and{" "}
            <code>WEB_URL</code> to the web app origin. Hosted clients such as
            claude.ai require HTTPS and must be able to reach{" "}
            <code>/.well-known/oauth-authorization-server</code> on the API
            origin. Locally the endpoint is{" "}
            <code>{API_ORIGIN}/v1/mcp/&lt;world&gt;</code>.
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

function ToolTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2 text-left font-medium">Tool</th>
            <th className="px-4 py-2 text-left font-medium">What it does</th>
          </tr>
        </thead>
        <tbody className="text-muted-foreground">
          {rows.map(([name, desc]) => (
            <tr key={name} className="border-b last:border-0">
              <td className="px-4 py-2 font-mono text-xs">{name}</td>
              <td className="px-4 py-2">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
