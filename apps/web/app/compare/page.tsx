"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@loreum/ui/button";
import { Check, X, Minus } from "lucide-react";

interface ComparisonRow {
  feature: string;
  loreum: string;
  worldAnvil: string;
  campfire: string;
  notion: string;
}

const competitors = [
  { key: "worldAnvil", name: "World Anvil" },
  { key: "campfire", name: "Campfire" },
  { key: "notion", name: "Notion" },
] as const;

type CompetitorKey = (typeof competitors)[number]["key"];

const comparison: ComparisonRow[] = [
  {
    feature: "Free tier",
    loreum: "All core features",
    worldAnvil: "Limited (ads, watermarks)",
    campfire: "No (one-time $45+)",
    notion: "Limited",
  },
  {
    feature: "Open source",
    loreum: "yes",
    worldAnvil: "no",
    campfire: "no",
    notion: "no",
  },
  {
    feature: "Self-hostable",
    loreum: "yes",
    worldAnvil: "no",
    campfire: "no",
    notion: "no",
  },
  {
    feature: "Characters & entities",
    loreum: "yes",
    worldAnvil: "yes",
    campfire: "yes",
    notion: "Manual databases",
  },
  {
    feature: "Custom entity types",
    loreum: "yes",
    worldAnvil: "yes",
    campfire: "partial",
    notion: "Manual databases",
  },
  {
    feature: "Knowledge graph",
    loreum: "Interactive (React Flow)",
    worldAnvil: "Basic connections",
    campfire: "Basic",
    notion: "no",
  },
  {
    feature: "Timeline",
    loreum: "Interactive Gantt chart",
    worldAnvil: "yes",
    campfire: "Timeline view",
    notion: "Date field only",
  },
  {
    feature: "Custom calendars",
    loreum: "yes",
    worldAnvil: "yes",
    campfire: "no",
    notion: "no",
  },
  {
    feature: "Lore wiki",
    loreum: "yes",
    worldAnvil: "yes",
    campfire: "yes",
    notion: "Pages",
  },
  {
    feature: "Storyboard / plot planning",
    loreum: "Plotlines, works, chapters, scenes",
    worldAnvil: "Manuscripts (paid)",
    campfire: "Stories + chapters",
    notion: "no",
  },
  {
    feature: "Public wiki",
    loreum: "Free",
    worldAnvil: "Paid",
    campfire: "no",
    notion: "Notion pages (branded)",
  },
  {
    feature: "AI integration",
    loreum: "MCP server (read + write, any AI)",
    worldAnvil: "no",
    campfire: "no",
    notion: "Built-in (limited)",
  },
  {
    feature: "AI review queue",
    loreum: "Staged changes with diff view",
    worldAnvil: "no",
    campfire: "no",
    notion: "no",
  },
  {
    feature: "Style guide for AI",
    loreum: "Voice, tone, POV, character voices",
    worldAnvil: "no",
    campfire: "no",
    notion: "no",
  },
  {
    feature: "Maps",
    loreum: "planned",
    worldAnvil: "yes",
    campfire: "yes",
    notion: "no",
  },
  {
    feature: "Secrets (GM-only)",
    loreum: "Built-in per entity",
    worldAnvil: "Paid feature",
    campfire: "no",
    notion: "Manual permissions",
  },
  {
    feature: "Collaboration",
    loreum: "planned",
    worldAnvil: "no",
    campfire: "Paid add-on",
    notion: "yes",
  },
  {
    feature: "Real-time co-editing",
    loreum: "planned",
    worldAnvil: "no",
    campfire: "no",
    notion: "yes",
  },
  {
    feature: "API access",
    loreum: "REST + MCP",
    worldAnvil: "no",
    campfire: "no",
    notion: "yes",
  },
  {
    feature: "Offline desktop",
    loreum: "planned",
    worldAnvil: "no",
    campfire: "yes",
    notion: "yes",
  },
  {
    feature: "Export",
    loreum: "JSON, Markdown",
    worldAnvil: "Limited",
    campfire: "Limited",
    notion: "CSV, Markdown",
  },
  {
    feature: "Price (full features)",
    loreum: "$0 free / $9 pro",
    worldAnvil: "$50/year+",
    campfire: "$45 one-time",
    notion: "$10/mo",
  },
];

function CellValue({ value }: { value: string }) {
  if (value === "yes")
    return <Check className="mx-auto h-4 w-4 text-green-500" />;
  if (value === "no") return <X className="mx-auto h-4 w-4 text-red-400" />;
  if (value === "partial" || value === "planned")
    return <Minus className="mx-auto h-4 w-4 text-yellow-500" />;
  return <span className="text-xs">{value}</span>;
}

export default function ComparePage() {
  const [selected, setSelected] = useState<CompetitorKey>("worldAnvil");
  const competitor = competitors.find((c) => c.key === selected)!;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <div className="mb-10">
        <h1 className="mb-4 text-3xl font-bold">Compare Loreum</h1>
        <p className="text-muted-foreground">
          See how Loreum stacks up against other worldbuilding and writing
          tools.
        </p>
      </div>

      {/* Competitor selector */}
      <div className="mb-8 flex gap-2">
        {competitors.map((c) => (
          <button
            key={c.key}
            onClick={() => setSelected(c.key)}
            className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
              selected === c.key
                ? "border-foreground/20 bg-muted text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            vs {c.name}
          </button>
        ))}
      </div>

      {/* Key takeaway per competitor */}
      <div className="my-10 space-y-6">
        {selected === "worldAnvil" && (
          <>
            <div>
              <h2 className="mb-2 text-lg font-semibold">Key differences</h2>
              <p className="text-sm text-muted-foreground">
                World Anvil is the most established worldbuilding platform with
                a large community. Core features like manuscripts, secrets, and
                public wiki customization require a paid plan ($50/year+).
                Loreum gives you all core features free, is open source, and
                includes an MCP server with 27 tools so your AI assistant can
                read and write your world data. Proposed changes land in a
                review queue with a diff view. World Anvil has no AI integration
                or API access.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Where World Anvil wins</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Larger community, more mature map tools, established ecosystem
                with years of user content.
              </p>
            </div>
          </>
        )}
        {selected === "campfire" && (
          <>
            <div>
              <h2 className="mb-2 text-lg font-semibold">Key differences</h2>
              <p className="text-sm text-muted-foreground">
                Campfire is a polished desktop + web app with a one-time
                purchase model. It has offline support and mature features.
                It is closed source, has no public wiki, no AI integration,
                and no API access. Loreum is free, open source, web-first, and
                built for AI-assisted worldbuilding with a full MCP server,
                style guide system, and review queue for AI-proposed changes.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Where Campfire wins</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Offline desktop app, one-time pricing (no subscription), more
                polished UI with years of refinement, built-in map editor.
              </p>
            </div>
          </>
        )}
        {selected === "notion" && (
          <>
            <div>
              <h2 className="mb-2 text-lg font-semibold">Key differences</h2>
              <p className="text-sm text-muted-foreground">
                Notion is flexible and powerful, but it is a general-purpose
                tool. There is no visual relationship graph, no interactive
                timeline, no structured storyboard, and no style guide for AI
                writing. You can build a worldbuilding system in Notion with
                databases and templates, but Loreum gives you purpose-built
                structure out of the box, plus an MCP server with 27 tools that
                lets AI understand your entire world in context. AI-proposed
                changes go through a review queue with diff view before touching
                your data.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Where Notion wins</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                General-purpose flexibility, offline desktop app, real-time
                collaboration (already shipping), massive ecosystem of templates
                and integrations.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Comparison table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Feature</th>
              <th className="px-4 py-3 text-center font-medium">Loreum</th>
              <th className="px-4 py-3 text-center font-medium">
                {competitor.name}
              </th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((row) => (
              <tr key={row.feature} className="border-b last:border-0">
                <td className="px-4 py-2.5 text-muted-foreground">
                  {row.feature}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <CellValue value={row.loreum} />
                </td>
                <td className="px-4 py-2.5 text-center">
                  <CellValue value={row[selected]} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Screenshot placeholder */}
      <div className="mt-10 rounded-lg border-2 border-dashed border-muted-foreground/20 p-12 text-center text-muted-foreground">
        <p className="text-sm">Screenshot comparison placeholder</p>
        <p className="text-xs">Side-by-side: Loreum vs {competitor.name}</p>
      </div>

      <div className="mt-10 flex gap-3">
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
