"use client";

const releases = [
  {
    version: "0.2.0",
    date: "September 2026",
    title: "AI Integration",
    highlights: [
      "Style guide with voice, tone, POV, pacing, dialogue rules, and character voice notes",
      "Connect Claude (web, desktop, mobile), Claude Code, and Cursor with one URL per world via OAuth 2.1",
      "Connected apps list with one-click disconnect; tokens bound to a single world",
      "API key authentication for scripts and header-only MCP clients",
      "36 MCP tools: full read coverage plus writes for entities, relationships, lore, timeline, eras, plotlines, works, chapters, and scenes",
      "Cross-content search (entities, lore, timeline, scenes) via MCP and REST",
      "Review queue: AI-proposed changes land in a staging area with diff view (next)",
    ],
  },
  {
    version: "0.1.0",
    date: "April 2026",
    title: "Initial Release",
    highlights: [
      "Entity system with characters, locations, organizations, and custom types",
      "Knowledge graph with visual relationship editor",
      "Interactive timeline with Gantt chart and eras",
      "Lore wiki with categories, tags, and entity mentions",
      "Storyboard with plotlines, works, chapters, and scenes",
      "Public wiki with visibility controls",
      "MCP server for AI integration (6 read tools, 4 write tools)",
      "Google OAuth authentication",
      "CI/CD with GitHub Actions",
    ],
  },
];

export default function WhatsNewPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-10">
        <h1 className="mb-4 text-3xl font-bold">What&apos;s New</h1>
        <p className="text-muted-foreground">
          Release notes and updates. See what&apos;s been shipped.
        </p>
      </div>

      <div className="space-y-12">
        {releases.map((release) => (
          <article key={release.version} className="relative">
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                v{release.version}
              </span>
              <span className="text-sm text-muted-foreground">
                {release.date}
              </span>
            </div>
            <h2 className="mb-3 text-xl font-semibold">{release.title}</h2>
            <ul className="space-y-1.5">
              {release.highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                  {item}
                </li>
              ))}
            </ul>

            {/* Placeholder for screenshots */}
            <div className="mt-6 rounded-lg border-2 border-dashed border-muted-foreground/20 p-12 text-center text-muted-foreground">
              <p className="text-sm">Screenshots placeholder</p>
              <p className="text-xs">Feature screenshots for this release</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
