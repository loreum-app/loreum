"use client";

import Link from "next/link";
import { Button } from "@loreum/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import { Gamepad2, BookOpen, Rocket, Sword, Wand2, Globe } from "lucide-react";

const templates = [
  {
    icon: Sword,
    title: "Fantasy Novel",
    description:
      "Wizard creates Characters (with species, role), Locations (with region), Organizations (with ideology). Custom types for Magic Systems and Artifacts. Hero's Journey plot structure pre-loaded.",
    tags: ["Novel", "Fantasy"],
    status: "coming-soon",
    href: "#",
  },
  {
    icon: Gamepad2,
    title: "RPG Campaign (5e)",
    description:
      "Characters with D&D stat blocks (STR, DEX, CON, INT, WIS, CHA, HP, AC, Level, Class). Factions, quest plotlines, session notes. Secrets field for GM-only information.",
    tags: ["TTRPG", "D&D", "Campaign"],
    status: "coming-soon",
    href: "#",
  },
  {
    icon: Rocket,
    title: "Sci-Fi Universe",
    description:
      "Custom types for Star Systems, Ships, Weapons, Species, and Planets. Timeline with custom calendar system. Technology tiers as entity fields.",
    tags: ["Novel", "Sci-Fi"],
    status: "coming-soon",
    href: "#",
  },
  {
    icon: Wand2,
    title: "Magic System Designer",
    description:
      "Custom types for Spells, Schools, Components, and Costs. Relationship graph maps spell interactions, school hierarchies, and component dependencies.",
    tags: ["Worldbuilding", "System Design"],
    status: "coming-soon",
    href: "#",
  },
  {
    icon: BookOpen,
    title: "Mystery / Thriller",
    description:
      "Custom types for Suspects, Clues, and Evidence. Timeline for alibis and events. Storyboard with non-linear reveal structure. Red herrings tracked as tagged entities.",
    tags: ["Novel", "Mystery"],
    status: "coming-soon",
    href: "#",
  },
  {
    icon: Globe,
    title: "Open World Game",
    description:
      "Regions with sub-locations, NPCs with stat blocks, quest chains as plotlines, item and weapon databases. Built for game design documentation and level planning.",
    tags: ["Game Design", "Open World"],
    status: "coming-soon",
    href: "#",
  },
];

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-3xl font-bold">Templates</h1>
        <p className="max-w-xl mx-auto text-muted-foreground">
          Don&apos;t start from a blank page. Pick a genre, and a guided wizard
          walks you through creating your world, with entity types, field
          schemas, tags, and plot structures pre-configured for your genre.
        </p>
      </div>

      {/* How it works */}
      <div className="mb-12 grid gap-6 sm:grid-cols-4">
        {[
          {
            step: "1",
            title: "Pick a genre",
            description: "Choose a template that fits your world",
          },
          {
            step: "2",
            title: "Name your world",
            description: "Give your project a name and description",
          },
          {
            step: "3",
            title: "Add your first entities",
            description:
              "Guided prompts help you create characters, locations, and factions",
          },
          {
            step: "4",
            title: "Start building",
            description: "Land in a pre-configured project, ready to expand",
          },
        ].map((s) => (
          <div key={s.step} className="text-center">
            <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {s.step}
            </div>
            <h3 className="text-sm font-medium">{s.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {s.description}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <Card
            key={t.title}
            className={`relative ${t.status === "coming-soon" ? "opacity-60" : ""}`}
          >
            {t.status === "coming-soon" && (
              <div className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Coming soon
              </div>
            )}
            <CardHeader>
              <t.icon className="mb-2 h-6 w-6 text-muted-foreground" />
              <CardTitle className="text-base">{t.title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                {t.description}
              </CardDescription>
              <div className="flex flex-wrap gap-1 pt-2">
                {t.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          Don&apos;t see what you need? Start from scratch. Every feature is
          available from a blank project.
        </p>
        <Link href="/auth/signup">
          <Button>Create a blank project</Button>
        </Link>
      </div>

      {/* Placeholder for wizard preview */}
      <div className="mt-16 rounded-lg border-2 border-dashed border-muted-foreground/20 p-16 text-center text-muted-foreground">
        <p className="text-sm">Wizard preview</p>
        <p className="text-xs">
          Interactive demo of the template wizard flow. Pick a genre, see what
          gets pre-configured, watch a world come together step by step
        </p>
      </div>
    </div>
  );
}
