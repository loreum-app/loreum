"use client";

import Link from "next/link";
import { Button } from "@loreum/ui/button";
import {
  Users,
  Network,
  Clock,
  ScrollText,
  Map,
  Layers,
  Globe,
  Bot,
  Database,
  GitBranch,
  Shield,
  TestTube,
  Workflow,
  PenTool,
  GitPullRequest,
  Key,
} from "lucide-react";

const features = [
  {
    id: "entities",
    icon: Users,
    title: "Entity System",
    description:
      "Characters, locations, organizations, and fully custom types. Each entity has structured fields, a backstory, secrets (hidden from public view), notes, tags, and relationships to other entities. Characters have species and role, Locations have region and condition, and Organizations have hierarchy and ideology. Custom types define their own field schemas through polymorphic extension tables.",
  },
  {
    id: "knowledge-graph",
    icon: Network,
    title: "Knowledge Graph",
    description:
      "Relationships are first-class objects, not just links in text. Create labeled, directional connections between any entities, including alliances, rivalries, family ties, and faction membership. The graph is rendered with React Flow so you can drag nodes, zoom in, and save layouts. See your entire world's web of connections at a glance.",
  },
  {
    id: "timeline",
    icon: Clock,
    title: "Timeline & Gantt",
    description:
      "Events and eras on an interactive Gantt chart. Drag to move or resize events. Color-coded eras provide historical context. Support for standard ISO dates and custom numeric calendars for fantasy worlds. Link entities to events to track who was involved and when.",
  },
  {
    id: "lore",
    icon: ScrollText,
    title: "Lore Wiki",
    description:
      "Markdown articles organized by category with tags and entity mentions. Think of it as your world bible, searchable, structured, and cross-referenced. Articles link to entities, so you can navigate from a lore article about a war to the characters who fought in it.",
  },
  {
    id: "storyboard",
    icon: Map,
    title: "Storyboard",
    description:
      "Plotlines with thematic statements and plot points. Works with chronological and release ordering. Chapters and scenes linked to plotlines, POV characters, locations, and timeline events. The narrative structure sits alongside the world data, cross-referenced at every level.",
  },
  {
    id: "custom-types",
    icon: Layers,
    title: "Custom Entity Types",
    description:
      "Define Weapons, Spells, Vehicles, Species, or any concept your world needs. Each custom type gets its own name, icon, color, and field schema, which is a JSON-defined set of fields (text, select, number) that appear on every entity of that type. No code required.",
  },
  {
    id: "public-wiki",
    icon: Globe,
    title: "Public Wiki",
    description:
      "Set any project to Public or Unlisted. Readers get a clean, read-only view of your world, including entities, relationships, timeline, lore, and storyboard. The secrets field is never exposed. Share your world with players, readers, or fans while keeping GM notes and plot twists private.",
  },
  {
    id: "style-guide",
    icon: PenTool,
    title: "Style Guide",
    description:
      "A structured writing guide covering voice, tone, POV, tense, pacing, and dialogue rules. Scenes can carry style overrides for dream sequences, flashbacks, and tonal shifts. Each character has voice notes for consistent dialogue. When the AI assists with writing, it layers the base guide, scene overrides, and character voices to maintain your prose style across sessions.",
  },
  {
    id: "mcp",
    icon: Bot,
    title: "AI Integration (MCP)",
    description:
      "A Model Context Protocol server lets AI assistants like Claude read and write your world data. Search entities, read relationships, browse the timeline, pull the style guide, create characters, add lore articles, and link timeline events. The AI works with your structured world instead of guessing. Free on all tiers. Bring your own AI, bring your own tokens.",
  },
  {
    id: "review-queue",
    icon: GitPullRequest,
    title: "Review Queue",
    description:
      "Every AI write operation lands in a staging area instead of modifying your canon directly. You see a diff-style view of each proposed creation, update, or deletion. Accept, edit, or reject each change individually, or batch-accept a full AI session. Changes are grouped by session so you can review them in context. The same mechanism powers collaborator suggestion mode for teams.",
  },
  {
    id: "api-keys",
    icon: Key,
    title: "API Key Authentication",
    description:
      "Generate project-scoped API keys from project settings to connect your MCP client. Each key has a name, permission level (read-only or read-write), and optional expiration. Revoke keys any time. The MCP server authenticates with the key as a Bearer token, and all requests are scoped to the project.",
  },
];

const engineeringPoints = [
  {
    icon: Layers,
    title: "Full-stack, not a wrapper",
    description:
      "NestJS API with Prisma ORM, PostgreSQL, Redis, BullMQ. Next.js frontend with server rendering. Shared TypeScript types across the entire monorepo. Every layer is purpose-built.",
  },
  {
    icon: Database,
    title: "Real data architecture",
    description:
      "22-model relational schema with polymorphic entities, join tables, and proper foreign key constraints. Not a JSON blob in a NoSQL bucket.",
  },
  {
    icon: GitBranch,
    title: "Open source, not open-washed",
    description:
      "AGPL-3.0. Full commit history. CI/CD pipeline. Contributing guide. The code is the product. If it disappeared tomorrow, you could fork it and keep going.",
  },
  {
    icon: TestTube,
    title: "Tested and gated",
    description:
      "Vitest + Supertest integration tests against a real database. GitHub Actions CI runs lint, type-check, test, and build on every PR. Pre-commit hooks enforce formatting.",
  },
  {
    icon: Shield,
    title: "Auth done properly",
    description:
      "OAuth2 with token family rotation, replay detection, CSRF protection, rolling sessions. Not a Firebase wrapper with a login button.",
  },
  {
    icon: Workflow,
    title: "AI-native architecture",
    description:
      "The MCP server exposes 27 tools across reads and writes. Write tools route through a staging area so AI changes never touch live data without review. The same service layer powers both MCP and the planned hosted AI tier.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-12">
        <h1 className="mb-4 text-3xl font-bold">
          The structured creative backend for AI-assisted writing.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Loreum stores your canonical worldstate as structured data that AI can
          query. Build your world in the app, connect any MCP-compatible AI, and
          write with an assistant that actually knows your characters,
          relationships, timeline, and style.
        </p>
      </div>

      {/* Features with anchors */}
      <section className="mb-16 space-y-10">
        {features.map((feature) => (
          <div key={feature.id} id={feature.id} className="scroll-mt-20">
            <div className="flex items-center gap-3 mb-2">
              <feature.icon className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">{feature.title}</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
            {/* Screenshot placeholder */}
            <div className="mt-4 rounded-lg border-2 border-dashed border-muted-foreground/20 p-10 text-center text-muted-foreground">
              <p className="text-xs">Screenshot: {feature.title}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Engineering credibility */}
      <section className="mb-16">
        <h2 className="mb-6 text-xl font-semibold">Built to last</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {engineeringPoints.map((point) => (
            <div key={point.title} className="rounded-lg border p-5">
              <point.icon className="mb-3 h-5 w-5 text-muted-foreground" />
              <h3 className="mb-1 text-sm font-medium">{point.title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stack */}
      <section className="mb-16" id="stack">
        <h2 className="mb-4 text-xl font-semibold">Stack</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <tbody className="text-muted-foreground">
              <tr className="border-b">
                <td className="px-4 py-2.5 font-medium text-foreground">
                  Frontend
                </td>
                <td className="px-4 py-2.5">
                  Next.js 16, React 19, shadcn/ui, Tailwind, React Flow
                </td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2.5 font-medium text-foreground">API</td>
                <td className="px-4 py-2.5">
                  NestJS, Prisma 7, PostgreSQL 18, Redis 7, BullMQ
                </td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2.5 font-medium text-foreground">
                  Auth
                </td>
                <td className="px-4 py-2.5">
                  OAuth2 + JWT with token rotation, CSRF, httpOnly cookies
                </td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2.5 font-medium text-foreground">AI</td>
                <td className="px-4 py-2.5">
                  MCP server (Model Context Protocol), works with Claude and any
                  MCP client
                </td>
              </tr>
              <tr className="border-b">
                <td className="px-4 py-2.5 font-medium text-foreground">
                  Infra
                </td>
                <td className="px-4 py-2.5">
                  Cloudflare (CDN, Tunnel, R2), Turborepo + pnpm monorepo
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-foreground">
                  Testing
                </td>
                <td className="px-4 py-2.5">
                  Vitest, Supertest, GitHub Actions CI, Husky pre-commit hooks
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Who it's for */}
      <section className="mb-16" id="audience">
        <h2 className="mb-4 text-xl font-semibold">Who it&apos;s for</h2>
        <div className="space-y-3 text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Fiction authors</span>{" "}
            building novel series, screenplays, or shared universes who need
            their world bible to be more than a Google Doc.
          </p>
          <p>
            <span className="font-medium text-foreground">Game designers</span>{" "}
            documenting RPG worlds, quest structures, faction dynamics, and
            branching narratives.
          </p>
          <p>
            <span className="font-medium text-foreground">
              TTRPG game masters
            </span>{" "}
            running campaigns who want to track NPCs, plot threads, session
            history, and share a player-facing wiki without spoiling secrets.
          </p>
          <p>
            <span className="font-medium text-foreground">
              Collaborative teams
            </span>{" "}
            working on shared fictional universes who need structure, not chaos.
          </p>
        </div>
      </section>

      {/* Open source */}
      <section className="mb-12" id="open-source">
        <h2 className="mb-4 text-xl font-semibold">Open source</h2>
        <p className="mb-4 text-muted-foreground">
          AGPL-3.0. The entire codebase is public. Contributions are welcome,
          and we have a contributing guide, issue templates, and CI that runs on
          every PR. Your data is yours. If you want to self-host, you can.
        </p>
        <p className="text-muted-foreground">
          We chose AGPL specifically: anyone can use, modify, and deploy Loreum,
          but if you offer it as a hosted service, you contribute back.
          That&apos;s how open source stays open.
        </p>
      </section>

      <div className="flex gap-3">
        <Link href="/auth/signup">
          <Button size="lg">Try Loreum free</Button>
        </Link>
        <a
          href="https://github.com/loreum-app/loreum"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button size="lg" variant="outline">
            View on GitHub
          </Button>
        </a>
      </div>
    </div>
  );
}
