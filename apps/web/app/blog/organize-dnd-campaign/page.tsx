"use client";

import Link from "next/link";
import { Button } from "@loreum/ui/button";

export default function OrganizeDndCampaignPost() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to blog
        </Link>
      </div>

      <article className="prose prose-invert max-w-none">
        <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Tutorial</span>
          <span>&middot;</span>
          <span>April 2, 2026</span>
        </div>
        <h1>How to Organize a D&amp;D Campaign with Loreum</h1>

        <p className="lead text-muted-foreground">
          Running a tabletop campaign means juggling NPCs, locations, factions,
          plot threads, and session notes. Here&apos;s how to use Loreum to keep
          it all organized without drowning in spreadsheets.
        </p>

        {/* Placeholder for hero image */}
        <div className="my-8 rounded-lg border-2 border-dashed border-muted-foreground/20 p-16 text-center text-muted-foreground">
          <p className="text-sm">Hero image placeholder</p>
          <p className="text-xs">Screenshot of a D&amp;D campaign in Loreum</p>
        </div>

        <h2>1. Set up your project</h2>
        <p>
          Create a new project in Loreum and name it after your campaign. This
          becomes the container for everything: your NPCs, locations, factions,
          lore, and session plans.
        </p>

        <h2>2. Create your factions as Organizations</h2>
        <p>
          The first thing to establish is who the power players are. Create each
          faction as an Organization entity. The Thieves&apos; Guild, the
          Kingdom of Eldoria, the Cult of the Void. Give each one an ideology,
          territory, and status. These become the backbone of your political
          landscape.
        </p>

        <h2>3. Build your NPC roster as Characters</h2>
        <p>
          Every NPC gets a Character entity. Fill in the basics like name, role,
          and species, but the real value is in the backstory and secrets
          fields. The secrets field is hidden from the public wiki, so if your
          players ever look at the public version of your world, they won&apos;t
          see spoilers.
        </p>

        <h2>4. Map relationships</h2>
        <p>
          This is where Loreum shines for campaign management. Create
          relationships between NPCs and factions: &quot;Captain Vex is a double
          agent for the Thieves&apos; Guild,&quot; &quot;The Blacksmith secretly
          reports to the Cult.&quot; The knowledge graph shows you the web of
          connections at a glance, perfect for session prep.
        </p>

        {/* Placeholder for graph screenshot */}
        <div className="my-8 rounded-lg border-2 border-dashed border-muted-foreground/20 p-16 text-center text-muted-foreground">
          <p className="text-sm">Screenshot placeholder</p>
          <p className="text-xs">
            Knowledge graph showing NPC and faction relationships
          </p>
        </div>

        <h2>5. Use the timeline for world history</h2>
        <p>
          Create eras (The Age of Dragons, The Great War, Modern Day) and drop
          events into them. When a player asks &quot;what happened 200 years
          ago?&quot; you have the answer. The Gantt chart view makes it easy to
          see overlapping events and cause-and-effect chains.
        </p>

        <h2>6. Plan sessions with the Storyboard</h2>
        <p>
          Create a plotline for each major quest arc. Add plot points for key
          beats: the hook, the investigation, the betrayal, the boss fight. Each
          plot point can link to entities and timeline events, so you always
          know who&apos;s involved and when things happen.
        </p>

        <h2>7. Write lore as wiki articles</h2>
        <p>
          For deep lore that doesn&apos;t fit in an entity, like the history of
          magic, how resurrection works in your world, or the political system,
          create Lore articles. Tag them by category and link them to relevant
          entities.
        </p>

        <h2>8. Share with your players</h2>
        <p>
          Set your project to Public and share the wiki URL with your players.
          They can browse NPCs, read lore, and check the timeline, but they
          won&apos;t see any entity&apos;s secrets field. Perfect for player
          handouts without spoilers.
        </p>

        <div className="mt-10 flex gap-3">
          <Link href="/auth/signup">
            <Button>Start your campaign</Button>
          </Link>
          <Link href="/worlds/star-wars">
            <Button variant="outline">See the demo world</Button>
          </Link>
        </div>
      </article>
    </div>
  );
}
