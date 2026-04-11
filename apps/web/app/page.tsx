"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@loreum/ui/button";
import {
  BookOpen,
  Map,
  Clock,
  Network,
  ScrollText,
  Layers,
  Globe,
  Bot,
  Gamepad2,
  PenTool,
  Clapperboard,
  Swords,
  MessageSquareText,
  FileSearch,
  Sparkles,
  FolderInput,
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "AI That Knows Your World",
    description:
      "Connect Claude, Cursor, or any MCP-compatible AI. It reads your characters, relationships, timeline, and lore to generate content that fits your world.",
  },
  {
    icon: PenTool,
    title: "Style Guide",
    description:
      "Define your voice, tone, POV, pacing, and dialogue rules. Scene overrides and character voice notes let the AI maintain your style across sessions.",
  },
  {
    icon: BookOpen,
    title: "Entities & Custom Types",
    description:
      "Characters, factions, locations, organizations, and fully custom types with configurable field schemas, backstories, and secrets.",
  },
  {
    icon: Network,
    title: "Knowledge Graph",
    description:
      "Relationships are first-class objects with labels and descriptions. Visualize your world's social, political, and narrative web.",
  },
  {
    icon: Clock,
    title: "Timeline & Gantt",
    description:
      "Organize events chronologically with eras, drag-to-edit Gantt visualization, and custom calendar support for fantasy worlds.",
  },
  {
    icon: ScrollText,
    title: "Lore Wiki",
    description:
      "Canonical world articles with categories, tags, and entity mentions. Your world bible, structured and searchable.",
  },
  {
    icon: Map,
    title: "Storyboard",
    description:
      "Plotlines, works, chapters, and scenes, all cross-referenced to your world data, timeline, and characters.",
  },
  {
    icon: Globe,
    title: "Review Queue",
    description:
      "AI-suggested changes land in a staging area. Review a diff of every creation, update, and deletion before it touches your canon.",
  },
];

const aiUseCases = [
  {
    icon: FolderInput,
    title: "Organize scattered notes",
    description:
      "Dump in disorganized files, outlines, and brainstorm docs. AI reads them and structures them into entities, relationships, and timeline events.",
  },
  {
    icon: Sparkles,
    title: "Turn ideas into a world",
    description:
      "Give AI a handful of concepts and let it flesh out characters, factions, locations, and the connections between them.",
  },
  {
    icon: PenTool,
    title: "Write scenes and prose",
    description:
      "AI writes in your voice using your style guide, with full awareness of who is in the scene, where they are, and what has happened before.",
  },
  {
    icon: MessageSquareText,
    title: "Generate dialogue",
    description:
      "Each character carries voice notes. AI writes dialogue that sounds like the character, not like a generic chatbot.",
  },
  {
    icon: FileSearch,
    title: "Check consistency",
    description:
      "Ask AI to find contradictions in your timeline, catch characters in two places at once, or flag lore that conflicts with established canon.",
  },
  {
    icon: Bot,
    title: "Reason about your world",
    description:
      "Ask any question. Who would win this war? What happens if this character betrays their faction? AI has the full context to give grounded answers.",
  },
];

const audiences = [
  {
    icon: PenTool,
    title: "Novel & Series Authors",
    description:
      "Plan narrative structure, track character arcs across books, and keep continuity tight in long-running series.",
  },
  {
    icon: Clapperboard,
    title: "Screenwriters & Showrunners",
    description:
      "Movies, TV shows, web series. Structure episodes, track character timelines, and maintain consistency across seasons.",
  },
  {
    icon: Gamepad2,
    title: "Game Narrative Designers",
    description:
      "RPGs, open worlds, MMORPGs. Track quests, factions, branching storylines, and the lore behind them.",
  },
  {
    icon: Swords,
    title: "Tabletop RPG Game Masters",
    description:
      "D&D, Pathfinder, homebrew systems. Organize campaigns, NPCs, session history, and share a player-facing wiki.",
  },
  {
    icon: BookOpen,
    title: "Comic Book Writers",
    description:
      "Track character rosters, story arcs, power sets, and interconnected storylines across issues and volumes.",
  },
  {
    icon: Layers,
    title: "Collaborative World Builders",
    description:
      "Writing groups, shared universes, anthology projects. Multiple creators, one canonical source of truth.",
  },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center gap-6 px-4 py-24 text-center">
        <h1 className="!text-6xl sm:text-5xl">
          Every character, faction, and timeline
          <br />
          <span className="text-muted-foreground">
            in one searchable place.
          </span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Loreum is the database behind your fictional world. Track characters,
          relationships, timelines, organizations, maps, lore, and story
          structure in a purpose-built platform with instant search across
          everything. No scattered files, no lost notes, no contradictions. AI
          plugs into all of it, so whether you write solo or with a team,
          nothing falls through the cracks.
        </p>
        <div className="mt-4 flex gap-3">
          {!user ? (
            <>
              <Link href="/auth/signup">
                <Button size="lg">Get started free</Button>
              </Link>
              <Link href="/about">
                <Button size="lg" variant="outline">
                  Learn more
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/projects">
              <Button size="lg">Go to your projects</Button>
            </Link>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-semibold">
            Everything your world needs, structured and connected
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="rounded-lg border bg-card p-5">
                <f.icon className="mb-3 h-5 w-5 text-muted-foreground" />
                <h3 className="text-sm font-medium">{f.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What AI can do */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-3 text-center text-2xl font-semibold">
            AI that reads your entire world
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center text-sm text-muted-foreground">
            Because your world is structured data instead of scattered files, AI
            can query all of it. Bring your own AI or use the built-in
            assistant. Proposed changes go through a review queue before
            touching your canon.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {aiUseCases.map((uc) => (
              <div key={uc.title} className="flex items-start gap-3">
                <uc.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium">{uc.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {uc.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-semibold">
            Built for anyone telling stories
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {audiences.map((a) => (
              <div key={a.title} className="text-center">
                <a.icon className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <h3 className="font-medium">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {a.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-2xl font-semibold">
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg font-bold">
                1
              </div>
              <h3 className="font-medium">Build your world</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Create entities, relationships, timelines, lore, and a style
                guide in the Loreum web app.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg font-bold">
                2
              </div>
              <h3 className="font-medium">Add AI</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Bring your own AI via MCP or use the built-in assistant. Build
                solo or invite collaborators.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg font-bold">
                3
              </div>
              <h3 className="font-medium">Write with context</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                AI reads your canon to generate grounded content. Proposed
                changes land in a review queue for you to accept.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-semibold">Open source</h2>
          <p className="text-muted-foreground">
            Loreum is open source under the AGPL-3.0 license. The code is
            public, contributions are welcome, and your world data is always
            yours.
          </p>
          <div className="mt-6">
            <a
              href="https://github.com/loreum-app/loreum"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">View on GitHub</Button>
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-semibold">
            Start building your world
          </h2>
          <p className="mb-6 text-muted-foreground">
            Free to use. No credit card required.
          </p>
          <div className="flex justify-center gap-3">
            {!user ? (
              <Link href="/auth/signup">
                <Button size="lg">Get started free</Button>
              </Link>
            ) : (
              <Link href="/projects">
                <Button size="lg">Go to your projects</Button>
              </Link>
            )}
            <a
              href="https://discord.gg/A2s5gZ8rcz"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline">
                Join the Discord
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
