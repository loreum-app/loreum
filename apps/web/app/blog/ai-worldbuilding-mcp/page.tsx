"use client";

import Link from "next/link";
import { Button } from "@loreum/ui/button";

export default function AiWorldbuildingMcpPost() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to blog
        </Link>
      </div>

      <article className="prose prose-invert max-w-none">
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Feature</span>
          <span>&middot;</span>
          <span>April 2, 2026</span>
        </div>
        <h1>Using AI to Read and Write Your World: MCP for Worldbuilders</h1>

        <p className="lead text-muted-foreground">
          Loreum includes an MCP (Model Context Protocol) server that lets AI
          assistants like Claude read your world data and propose changes that
          you review before they go live. Here is what that means and why it
          matters.
        </p>

        {/* Placeholder for hero image/video */}
        <div className="my-8 rounded-lg border-2 border-dashed border-muted-foreground/20 p-16 text-center text-muted-foreground">
          <p className="text-sm">Video/demo placeholder</p>
          <p className="text-xs">
            Screen recording: asking Claude about your world via MCP
          </p>
        </div>

        <h2>What is MCP?</h2>
        <p>
          MCP (Model Context Protocol) is an open standard that lets AI
          assistants connect to external tools and data sources. When you
          connect Loreum&apos;s MCP server to Claude, the AI can search your
          entities, read relationships, browse the timeline, pull your style
          guide, and propose new content, all through structured tools backed by
          your world&apos;s API.
        </p>

        <h2>What can you do with it?</h2>

        <h3>Ask questions about your world</h3>
        <p>
          &quot;Who are Luke Skywalker&apos;s allies?&quot; Claude queries the
          knowledge graph and returns a natural language answer. No more
          scrolling through pages to find a connection.
        </p>

        <h3>Check for consistency</h3>
        <p>
          &quot;Is there anything contradictory about the timeline of the
          Galactic Civil War?&quot; Claude reads your timeline events, cross-
          references entity appearances, and flags potential issues.
        </p>

        <h3>Generate content in your style</h3>
        <p>
          &quot;Write a backstory for this new character that fits with the
          existing faction dynamics.&quot; Claude reads the relevant factions,
          relationships, lore, and your style guide, then generates a backstory
          that is consistent with both your world and your prose style.
        </p>

        <h3>Create and modify world data</h3>
        <p>
          &quot;Create a new location called the Iron Citadel in the Northern
          Wastes.&quot; Claude calls the create tool and the location appears in
          your world, tagged and linked the way you asked. Grant read-only
          access instead if you want the AI to consult your canon without
          editing it.
        </p>

        <h2>You stay in control</h2>
        <p>
          Every app you connect is approved by you, for one world, with the
          access level you choose. Connected apps are listed in the world&apos;s
          settings and can be disconnected in one click, which immediately
          invalidates their access. A review queue, where AI-proposed changes
          wait for your approval with a diff view, is next on the roadmap.
        </p>

        <h2>How to set it up</h2>
        <p>
          Open your world&apos;s settings, copy its MCP URL, and add it as a
          custom connector in Claude (Settings → Connectors → Add custom
          connector). Claude sends you to Loreum to sign in and approve, and
          you&apos;re done. There&apos;s nothing to install and no key to paste.
          Claude Code works the same way:
        </p>

        <pre className="rounded-lg bg-muted p-4 text-sm">
          {`claude mcp add --transport http loreum https://api.loreum.app/v1/mcp/your-world`}
        </pre>

        <h2>Read tools (16)</h2>
        <p>
          Query your world data: search across all content, get individual
          entities with their relationships and lore, browse the storyboard down
          to scene prose, read the timeline and eras, and list lore articles and
          tags. Available to every connection.
        </p>

        <h2>Write tools (20)</h2>
        <p>
          Create, update, and delete entities, relationships, lore articles,
          timeline events and eras, plotlines and plot points, works, chapters,
          and scenes. Only offered to connections you approved with read &amp;
          write access.
        </p>

        <h2>Why this matters</h2>
        <p>
          Most AI writing tools work in isolation. They generate text without
          context. With MCP, the AI has access to your entire world: characters,
          backstories, faction dynamics, timeline, and your writing style. The
          generated content is grounded in your world instead of generic.
        </p>
        <p>
          The review queue means you stay in control. The AI proposes and you
          decide. No surprises in your canon.
        </p>
        <p>
          The MCP server is free and open source. You bring your own AI and
          tokens. No vendor lock-in, no per-query charges from Loreum.
        </p>

        <div className="mt-10 flex gap-3">
          <Link href="/auth/signup">
            <Button>Get started</Button>
          </Link>
          <a
            href="https://github.com/loreum-app/loreum"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">View on GitHub</Button>
          </a>
        </div>
      </article>
    </div>
  );
}
