"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import {
  BookOpen,
  Rocket,
  Bot,
  Code,
  Globe,
  Users,
  Clock,
  Network,
  ScrollText,
  Map,
  PenTool,
  GitPullRequest,
  Key,
} from "lucide-react";

const gettingStarted = [
  {
    icon: Rocket,
    title: "Quick Start",
    description:
      "Create your first project and add entities in under 5 minutes.",
    href: "/docs/quick-start",
    status: "coming-soon",
  },
  {
    icon: BookOpen,
    title: "Core Concepts",
    description:
      "Entities, relationships, timeline, lore, and storyboard: how they fit together.",
    href: "/docs/concepts",
    status: "coming-soon",
  },
];

const features = [
  {
    icon: Users,
    title: "Entities",
    description: "Characters, locations, organizations, and custom types.",
    href: "/docs/entities",
    status: "coming-soon",
  },
  {
    icon: Network,
    title: "Knowledge Graph",
    description:
      "Visual relationship editor for creating and managing connections.",
    href: "/docs/graph",
    status: "coming-soon",
  },
  {
    icon: Clock,
    title: "Timeline",
    description: "Events, eras, Gantt chart, and custom calendar systems.",
    href: "/docs/timeline",
    status: "coming-soon",
  },
  {
    icon: ScrollText,
    title: "Lore Wiki",
    description: "Articles, categories, tags, and entity mentions.",
    href: "/docs/lore",
    status: "coming-soon",
  },
  {
    icon: Map,
    title: "Storyboard",
    description: "Plotlines, works, chapters, scenes, and plot points.",
    href: "/docs/storyboard",
    status: "coming-soon",
  },
  {
    icon: Globe,
    title: "Public Wiki",
    description:
      "Sharing your world: visibility settings and what readers see.",
    href: "/docs/public-wiki",
    status: "coming-soon",
  },
];

const aiIntegration = [
  {
    icon: Bot,
    title: "MCP Server",
    description: "Connect AI assistants to your world. 11 read tools, 16 write tools.",
    href: "/docs/mcp",
  },
  {
    icon: Key,
    title: "API Keys",
    description: "Generate project-scoped keys with read-only or read-write permissions.",
    href: "/docs/api-keys",
    status: "coming-soon",
  },
  {
    icon: GitPullRequest,
    title: "Review Queue",
    description: "Inspect and approve AI-proposed changes before they touch your canon.",
    href: "/docs/review-queue",
    status: "coming-soon",
  },
  {
    icon: PenTool,
    title: "Style Guide",
    description: "Configure voice, tone, POV, pacing, and character voice notes for AI.",
    href: "/docs/style-guide",
    status: "coming-soon",
  },
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-10">
        <h1 className="mb-4 text-3xl font-bold">Documentation</h1>
        <p className="text-muted-foreground">
          Learn how to use Loreum, integrate with your tools, and get the most
          out of your worldbuilding.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Getting Started</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {gettingStarted.map((item) => (
            <Card key={item.title} className="relative opacity-60">
              <div className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Coming soon
              </div>
              <CardHeader>
                <item.icon className="mb-2 h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Features</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => (
            <Card key={item.title} className="relative opacity-60">
              <div className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Coming soon
              </div>
              <CardHeader>
                <item.icon className="mb-2 h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-sm">{item.title}</CardTitle>
                <CardDescription className="text-xs">
                  {item.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">AI Integration</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {aiIntegration.map((item) => {
            const isComingSoon = "status" in item && item.status === "coming-soon";
            const content = (
              <Card className={`transition-colors ${isComingSoon ? "relative opacity-60" : "hover:border-foreground/20"}`}>
                {isComingSoon && (
                  <div className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Coming soon
                  </div>
                )}
                <CardHeader>
                  <item.icon className="mb-2 h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            );
            if (isComingSoon) return <div key={item.title}>{content}</div>;
            return <Link key={item.title} href={item.href}>{content}</Link>;
          })}
        </div>
      </section>
    </div>
  );
}
