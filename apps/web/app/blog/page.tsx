"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";

const posts = [
  {
    slug: "organize-dnd-campaign",
    title: "How to Organize a D&D Campaign with Loreum",
    description:
      "A practical guide to tracking NPCs, locations, factions, and session notes using a structured worldbuilding tool.",
    date: "2026-04-02",
    category: "Tutorial",
  },
  {
    slug: "worldbuilding-tips-for-writers",
    title: "Worldbuilding Tips for Novel Writers: From Chaos to Structure",
    description:
      "How to go from scattered notes and half-finished documents to a structured, searchable world bible.",
    date: "2026-04-02",
    category: "Guide",
  },
  {
    slug: "ai-worldbuilding-mcp",
    title: "Using AI to Read and Write Your World: MCP for Worldbuilders",
    description:
      "How Loreum's MCP server lets AI assistants read your world and propose changes through a review queue.",
    date: "2026-04-02",
    category: "Feature",
  },
];

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">Blog</h1>
      <p className="mb-10 text-muted-foreground">
        Guides, tutorials, and updates for worldbuilders.
      </p>

      <div className="grid gap-4">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <Card className="transition-colors hover:border-foreground/20">
              <CardHeader>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{post.category}</span>
                  <span>&middot;</span>
                  <span>{post.date}</span>
                </div>
                <CardTitle className="text-lg">{post.title}</CardTitle>
                <CardDescription>{post.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
