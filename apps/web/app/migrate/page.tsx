"use client";

import Link from "next/link";
import { Button } from "@loreum/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import { ArrowRight, FileText, Bot, Globe, FolderOpen } from "lucide-react";

const guides = [
  {
    icon: Globe,
    title: "From World Anvil",
    description:
      "Export your World Anvil articles and import them into Loreum. Covers characters, locations, organizations, and lore articles.",
    status: "coming-soon",
  },
  {
    icon: FolderOpen,
    title: "From Campfire",
    description:
      "Migrate your Campfire projects: characters, locations, species, and story structure.",
    status: "coming-soon",
  },
  {
    icon: FileText,
    title: "From Notion",
    description:
      "Export your Notion databases as CSV/JSON and import them as Loreum entities with relationships preserved.",
    status: "coming-soon",
  },
  {
    icon: Bot,
    title: "From ChatGPT / AI Conversations",
    description:
      "Have worldbuilding scattered across AI chats? Use our MCP server to extract and structure it, or paste conversations and let Loreum organize them.",
    status: "coming-soon",
  },
  {
    icon: FileText,
    title: "From Google Docs / Text Files",
    description:
      "Upload your existing documents, PDFs, or markdown files. Loreum will help you break them into structured entities.",
    status: "coming-soon",
  },
];

export default function MigratePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-10">
        <h1 className="mb-4 text-3xl font-bold">Migrate to Loreum</h1>
        <p className="text-muted-foreground">
          Already have worldbuilding content elsewhere? We&apos;ll help you
          bring it over. No data left behind.
        </p>
      </div>

      <div className="space-y-4">
        {guides.map((guide) => (
          <Card key={guide.title} className="relative">
            {guide.status === "coming-soon" && (
              <div className="absolute right-4 top-4 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Coming soon
              </div>
            )}
            <CardHeader>
              <div className="flex items-start gap-4">
                <guide.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">{guide.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {guide.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-xl border bg-muted/30 p-8">
        <h2 className="mb-2 text-lg font-semibold">
          Can&apos;t find your tool?
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Loreum&apos;s MCP server makes it possible to import from any source.
          If you have data in JSON, CSV, or markdown, you can script an import
          via the MCP tools. We&apos;re also happy to help. Reach out on
          Discord.
        </p>
        <div className="flex gap-3">
          <Link href="/docs/mcp">
            <Button variant="outline" size="sm">
              MCP docs <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
          <a
            href="https://discord.gg/A2s5gZ8rcz"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              Ask on Discord
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
