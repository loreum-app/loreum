"use client";

import { Button } from "@loreum/ui/button";
import { Check, Circle, Clock } from "lucide-react";

interface RoadmapItem {
  title: string;
  description: string;
  status: "done" | "in-progress" | "planned";
}

interface RoadmapPhase {
  name: string;
  description: string;
  items: RoadmapItem[];
}

const phases: RoadmapPhase[] = [
  {
    name: "v0.1: Foundation",
    description: "Core platform, shipped.",
    items: [
      {
        title: "Entity system",
        description:
          "Characters, locations, organizations, custom types with field schemas",
        status: "done",
      },
      {
        title: "Knowledge graph",
        description: "Visual relationship editor with React Flow",
        status: "done",
      },
      {
        title: "Timeline & Gantt",
        description: "Events, eras, drag-to-edit, custom calendars",
        status: "done",
      },
      {
        title: "Lore wiki",
        description: "Articles with categories, tags, entity mentions",
        status: "done",
      },
      {
        title: "Storyboard",
        description: "Plotlines, works, chapters, scenes with cross-references",
        status: "done",
      },
      {
        title: "Public wiki",
        description: "Shareable read-only world pages, secrets hidden",
        status: "done",
      },
      {
        title: "MCP server",
        description: "AI integration: query and write world data from Claude",
        status: "done",
      },
      {
        title: "CI/CD & testing",
        description: "GitHub Actions, Vitest, pre-commit hooks",
        status: "done",
      },
    ],
  },
  {
    name: "v0.2: AI Integration",
    description: "Style guide, MCP authentication, and the review queue.",
    items: [
      {
        title: "Style guide",
        description:
          "Project-level voice, tone, POV, pacing, dialogue rules. Scene overrides and character voice notes.",
        status: "in-progress",
      },
      {
        title: "API key authentication",
        description:
          "Generate project-scoped API keys for MCP. Read-only or read-write permissions, expiration, revocation.",
        status: "planned",
      },
      {
        title: "Review queue (staging area)",
        description:
          "AI-proposed changes land as pending. Diff view for updates, preview for creates, batch accept/reject.",
        status: "planned",
      },
      {
        title: "Expanded MCP tools",
        description:
          "Timeline, lore article, scene, plot point, and style guide tools for both read and write.",
        status: "planned",
      },
    ],
  },
  {
    name: "v0.3: Polish",
    description: "Rich editing, search, export, and media.",
    items: [
      {
        title: "Rich text editor",
        description: "TipTap + ProseMirror for all text fields",
        status: "planned",
      },
      {
        title: "Wiki-style linking",
        description: "[[entity]] mentions with search popup",
        status: "planned",
      },
      {
        title: "Full-text search",
        description: "Search across all content with filters",
        status: "planned",
      },
      {
        title: "Export",
        description: "JSON and markdown export for backup and portability",
        status: "planned",
      },
      {
        title: "Image uploads",
        description: "Entity portraits, map images via Cloudflare R2",
        status: "planned",
      },
      {
        title: "Migration tools",
        description: "Import from World Anvil, Notion, text files",
        status: "planned",
      },
    ],
  },
  {
    name: "v0.4: Pro + Billing",
    description: "Subscription tier, hosted AI, and additional auth providers.",
    items: [
      {
        title: "Stripe integration",
        description: "Checkout, webhooks, subscription management",
        status: "planned",
      },
      {
        title: "Free/Pro tier gating",
        description: "Unlimited projects, AI features, expanded storage",
        status: "planned",
      },
      {
        title: "Hosted AI conversation loop",
        description:
          "In-app AI chat that queries your world data and writes in your style. Loreum handles the API calls.",
        status: "planned",
      },
      {
        title: "Additional OAuth",
        description: "Discord, GitHub login",
        status: "planned",
      },
      {
        title: "Email notifications",
        description: "Via Resend for collaboration triggers, updates",
        status: "planned",
      },
    ],
  },
  {
    name: "v0.5: Collaboration",
    description: "Teams and real-time editing.",
    items: [
      {
        title: "Team invitations",
        description: "Invite editors, viewers, commenters",
        status: "planned",
      },
      {
        title: "Real-time co-editing",
        description: "Yjs CRDT sync via WebSocket",
        status: "planned",
      },
      {
        title: "Activity feed",
        description: "See who changed what, when",
        status: "planned",
      },
      {
        title: "Entity versioning",
        description: "History and rollback for all content",
        status: "planned",
      },
    ],
  },
  {
    name: "v0.6: Game Design",
    description: "Tools for RPG designers and game masters.",
    items: [
      {
        title: "Quest flowchart",
        description: "Branching narrative editor with React Flow node graph",
        status: "planned",
      },
      {
        title: "Dialogue editor",
        description: "Conversation trees with speakers, conditions, branching",
        status: "planned",
      },
      {
        title: "Interactive maps",
        description:
          "Pan/zoom, pin entity locations, multiple layers, drawing tools",
        status: "planned",
      },
      {
        title: "Plot structure templates",
        description:
          "Hero's Journey, Save the Cat, Snowflake Method. Start with a proven structure or create your own",
        status: "planned",
      },
    ],
  },
  {
    name: "v0.7: AI + Advanced",
    description: "AI-powered features for Pro users.",
    items: [
      {
        title: "In-app AI chat",
        description:
          "Query your world, talk to characters, and roleplay, all grounded in your lore",
        status: "planned",
      },
      {
        title: "AI writing assistance",
        description: "In the scene editor, grounded in your world data",
        status: "planned",
      },
      {
        title: "AI image generation",
        description:
          "Character portraits, location art, scene illustrations from lore context",
        status: "planned",
      },
      {
        title: "Consistency checking",
        description: "AI-powered contradiction and timeline conflict detection",
        status: "planned",
      },
      {
        title: "PDF world bible",
        description:
          "Campaign sourcebook with entity cards, chapters, and lore, ready to print",
        status: "planned",
      },
      {
        title: "PDF/image import",
        description:
          "Upload existing notes, campaign PDFs, handwritten scans to bootstrap a project",
        status: "planned",
      },
      {
        title: "Free generators",
        description:
          "Character, name, location, monster generators, no account required (SEO funnel)",
        status: "planned",
      },
    ],
  },
  {
    name: "v0.8: Platform",
    description: "Desktop support, webhooks, and ecosystem.",
    items: [
      {
        title: "Offline desktop app",
        description: "Work without internet, sync when you reconnect",
        status: "planned",
      },
      {
        title: "Webhook events",
        description:
          "Entity created/updated/deleted events pushed to your endpoints",
        status: "planned",
      },
      {
        title: "Cultures & species modules",
        description:
          "Dedicated modules for languages, rituals, value systems, and biological traits",
        status: "planned",
      },
      {
        title: "Discovery & magic systems",
        description:
          "Track technologies, magic schools, spells, and their interactions",
        status: "planned",
      },
      {
        title: "Session notes (TTRPG)",
        description:
          "Per-session notes linked to timeline events, with audio summary import",
        status: "planned",
      },
    ],
  },
];

function StatusIcon({ status }: { status: RoadmapItem["status"] }) {
  if (status === "done") return <Check className="h-4 w-4 text-green-500" />;
  if (status === "in-progress")
    return <Clock className="h-4 w-4 text-yellow-500" />;
  return <Circle className="h-4 w-4 text-muted-foreground/40" />;
}

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-10">
        <h1 className="mb-4 text-3xl font-bold">Roadmap</h1>
        <p className="text-muted-foreground">
          Where Loreum is going. Built in public, priorities shaped by the
          community.
        </p>
      </div>

      <div className="space-y-12">
        {phases.map((phase) => (
          <section key={phase.name}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{phase.name}</h2>
              <p className="text-sm text-muted-foreground">
                {phase.description}
              </p>
            </div>
            <div className="space-y-2">
              {phase.items.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <StatusIcon status={item.status} />
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-xl border bg-muted/30 p-8 text-center">
        <h2 className="mb-2 text-lg font-semibold">
          Want to influence the roadmap?
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Loreum is open source. Feature requests, bug reports, and PRs are
          welcome.
        </p>
        <div className="flex justify-center gap-3">
          <a
            href="https://github.com/loreum-app/loreum/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">Open an issue</Button>
          </a>
          <a
            href="https://discord.gg/A2s5gZ8rcz"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">Join Discord</Button>
          </a>
        </div>
      </div>
    </div>
  );
}
