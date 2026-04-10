"use client";

import Link from "next/link";
import { Button } from "@loreum/ui/button";
import { Check, Minus } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Full worldbuilding platform with AI integration. Bring your own AI.",
    cta: "Get started free",
    href: "/auth/signup",
    highlighted: false,
    features: [
      "1 project",
      "All entity types (characters, locations, orgs, custom)",
      "Knowledge graph with visual editor",
      "Timeline with Gantt chart",
      "Lore wiki with categories and tags",
      "Storyboard (plotlines, works, chapters, scenes)",
      "Style guide (voice, tone, POV, pacing, character voices)",
      "MCP server with read + write tools",
      "API key authentication",
      "Review queue for AI-suggested changes",
      "Public wiki",
      "500 MB file storage",
      "Export as JSON / markdown",
    ],
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "Hosted AI that writes in your style, with no setup required.",
    cta: "Coming soon",
    href: "#",
    highlighted: true,
    features: [
      "Unlimited projects",
      "Everything in Free, plus:",
      "In-app AI chat (query your world, talk to characters)",
      "AI writing assistance in scene editor",
      "AI image generation (portraits, locations, scenes)",
      "AI consistency checking",
      "Style-aware generation (base guide + scene + character voices)",
      "500 AI requests / month",
      "Entity versioning and history",
      "10 GB file storage",
      "PDF export (world bible)",
      "Priority support",
    ],
  },
  {
    name: "Team",
    price: "$12",
    period: "/seat/month",
    description: "Collaborate on shared worlds with real-time editing.",
    cta: "Coming soon",
    href: "#",
    highlighted: false,
    features: [
      "Everything in Pro, plus:",
      "Invite editors, viewers, commenters",
      "Real-time co-editing (Yjs)",
      "Collaborator suggestion mode (same review queue)",
      "Activity feed and audit log",
      "500 AI requests per seat / month",
      "Role-based permissions",
      "Team dashboard",
      "25 GB shared storage",
    ],
  },
];

interface ComparisonRow {
  feature: string;
  free: string | boolean;
  pro: string | boolean;
  team: string | boolean;
}

const comparison: ComparisonRow[] = [
  { feature: "Projects", free: "1", pro: "Unlimited", team: "Unlimited" },
  {
    feature: "Entities, graph, timeline, lore, storyboard",
    free: true,
    pro: true,
    team: true,
  },
  { feature: "Style guide + character voices", free: true, pro: true, team: true },
  { feature: "Public wiki", free: true, pro: true, team: true },
  {
    feature: "MCP server (read + write tools)",
    free: true,
    pro: true,
    team: true,
  },
  { feature: "API key authentication", free: true, pro: true, team: true },
  { feature: "Review queue (AI staging area)", free: true, pro: true, team: true },
  { feature: "In-app AI chat", free: false, pro: true, team: true },
  { feature: "AI writing assistance", free: false, pro: true, team: true },
  { feature: "Style-aware generation", free: false, pro: true, team: true },
  { feature: "AI image generation", free: false, pro: true, team: true },
  {
    feature: "AI requests",
    free: false,
    pro: "500 / month",
    team: "500 / seat / month",
  },
  { feature: "Team collaboration", free: false, pro: false, team: true },
  { feature: "Real-time co-editing", free: false, pro: false, team: true },
  { feature: "Collaborator suggestion mode", free: false, pro: false, team: true },
  { feature: "Activity feed & audit log", free: false, pro: false, team: true },
  { feature: "Entity versioning", free: false, pro: true, team: true },
  { feature: "PDF export", free: false, pro: true, team: true },
  { feature: "File storage", free: "500 MB", pro: "10 GB", team: "25 GB" },
  { feature: "Export (JSON / markdown)", free: true, pro: true, team: true },
  { feature: "Priority support", free: false, pro: true, team: true },
];

function CellValue({ value }: { value: string | boolean }) {
  if (value === true)
    return <Check className="mx-auto h-4 w-4 text-green-500" />;
  if (value === false)
    return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />;
  return <span className="text-xs">{value}</span>;
}

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-3xl font-bold">Pricing</h1>
        <p className="text-muted-foreground">
          Start free. Add AI when you want it. Collaborate when you need it.
        </p>
      </div>

      {/* Tier cards */}
      <div className="mb-16 grid gap-6 sm:grid-cols-3">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-xl border p-6 ${tier.highlighted ? "border-foreground/20 bg-muted/30" : ""}`}
          >
            <h2 className="text-lg font-semibold">{tier.name}</h2>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold">{tier.price}</span>
              <span className="text-sm text-muted-foreground">
                {tier.period}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {tier.description}
            </p>

            <div className="mt-5">
              {tier.href === "#" ? (
                <Button className="w-full" variant="outline" disabled>
                  {tier.cta}
                </Button>
              ) : (
                <Link href={tier.href}>
                  <Button
                    className="w-full"
                    variant={tier.highlighted ? "default" : "outline"}
                  >
                    {tier.cta}
                  </Button>
                </Link>
              )}
            </div>

            <ul className="mt-5 space-y-2">
              {tier.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="mb-12">
        <h2 className="mb-6 text-center text-xl font-semibold">
          Compare plans
        </h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Feature</th>
                <th className="px-4 py-3 text-center font-medium">Free</th>
                <th className="px-4 py-3 text-center font-medium">Pro</th>
                <th className="px-4 py-3 text-center font-medium">Team</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.feature} className="border-b last:border-0">
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {row.feature}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <CellValue value={row.free} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <CellValue value={row.pro} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <CellValue value={row.team} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ-style notes */}
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h3 className="font-medium">What counts as an AI request?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Each in-app AI action (a chat message, a writing suggestion, an
            image generation, a consistency check) counts as one request. MCP
            server usage with your own AI tokens does not count.
          </p>
        </div>
        <div>
          <h3 className="font-medium">Can I use my own AI?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Yes. The MCP server is free on all tiers with full read and write
            access. Connect Claude, Cursor, or any MCP-compatible AI using your
            own API keys. Generate a project-scoped API key from project
            settings to authenticate. The paid AI features are the in-app tools
            where Loreum handles the API calls for you.
          </p>
        </div>
        <div>
          <h3 className="font-medium">What is the review queue?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            When AI writes to your world through the MCP server, changes land in
            a staging area instead of modifying your data directly. You see a
            diff of each proposed change and can accept, edit, or reject it. You
            can also batch-accept an entire AI session if you trust the output.
            This keeps you in control of your canon.
          </p>
        </div>
        <div>
          <h3 className="font-medium">Can I self-host?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Yes. Loreum is open source (AGPL-3.0). You can self-host the full
            platform including all Free tier features. Pro and Team features
            that depend on hosted infrastructure (AI tokens, collaboration
            servers, expanded storage) require the hosted platform.
          </p>
        </div>
        <div>
          <h3 className="font-medium">How does Team pricing work?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            $12 per seat per month. A team of 5 is $60/month. Each seat gets the
            same 500 AI requests as Pro, plus real-time collaboration,
            role-based permissions, and a shared team dashboard. The $3 premium
            over Pro covers the collaboration infrastructure (WebSocket servers,
            CRDT sync, audit logging).
          </p>
        </div>
      </div>
    </div>
  );
}
