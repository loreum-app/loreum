"use client";

import Link from "next/link";
import { Button } from "@loreum/ui/button";

export default function WorldbuildingTipsPost() {
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
          <span>Guide</span>
          <span>&middot;</span>
          <span>April 2, 2026</span>
        </div>
        <h1>Worldbuilding Tips for Novel Writers: From Chaos to Structure</h1>

        <p className="lead text-muted-foreground">
          You have a world in your head. Maybe a folder full of documents, a
          spreadsheet of characters, sticky notes on your wall. Here&apos;s how
          to turn that chaos into a structured, searchable world bible.
        </p>

        {/* Placeholder for hero image */}
        <div className="my-8 rounded-lg border-2 border-dashed border-muted-foreground/20 p-16 text-center text-muted-foreground">
          <p className="text-sm">Hero image placeholder</p>
          <p className="text-xs">
            Before/after: scattered notes vs structured world
          </p>
        </div>

        <h2>The problem with documents</h2>
        <p>
          Most writers start worldbuilding in Google Docs, Notion, or plain text
          files. This works until it doesn&apos;t. Around 20 characters and 10
          locations, you start losing track. &quot;Wait, did I say this
          character was in this city during Chapter 3?&quot; You can&apos;t
          search for relationships. You can&apos;t see the timeline. You
          definitely can&apos;t share a clean version with beta readers.
        </p>

        <h2>Think in entities, not pages</h2>
        <p>
          The mental shift: every character, location, faction, and concept in
          your world is an <strong>entity</strong> with structured data, not a
          page with freeform text. An entity has a name, a type, a summary, a
          description, a backstory, secrets, and notes. It has tags and
          relationships to other entities.
        </p>
        <p>
          This structure means you can filter, search, and cross-reference.
          &quot;Show me all characters in the resistance faction.&quot;
          &quot;What events happened in the Northern Kingdom?&quot;
        </p>

        <h2>Relationships are the hidden structure</h2>
        <p>
          The most valuable thing you can do for your world is make
          relationships explicit. Not &quot;mentioned in Chapter 7,&quot; but
          &quot;Mentor to,&quot; &quot;Rival of,&quot; &quot;Member of,&quot;
          &quot;Located in.&quot; These connections become visible in the
          knowledge graph and help you spot gaps.
        </p>
        <p>
          If a major character has no relationships, that&apos;s a red flag.
          They&apos;re not connected to your world. If a location has no events,
          it might be set dressing rather than a real place.
        </p>

        {/* Placeholder */}
        <div className="my-8 rounded-lg border-2 border-dashed border-muted-foreground/20 p-16 text-center text-muted-foreground">
          <p className="text-sm">Screenshot placeholder</p>
          <p className="text-xs">
            Knowledge graph showing character and faction web
          </p>
        </div>

        <h2>Timeline catches contradictions</h2>
        <p>
          &quot;This character was 15 during the war, and the war ended 20 years
          ago, so she&apos;s 35 now. Wait, I said she was 28 in Chapter 1.&quot;
          A timeline makes these contradictions visible before your editor
          catches them.
        </p>

        <h2>Secrets are for you, not the reader</h2>
        <p>
          Every entity has a secrets field. This is where you put the twists,
          the unrevealed backstory, the things only the author knows. When you
          share your world as a public wiki for beta readers, fans, or
          collaborators. The secrets stay hidden.
        </p>

        <h2>The storyboard bridges world and narrative</h2>
        <p>
          Worldbuilding and story planning are usually separate tools. In
          Loreum, the storyboard links directly to your world: scenes reference
          characters, locations, and timeline events. You can see which entities
          appear in which chapters, which plotline each scene serves, and where
          your narrative threads cross.
        </p>

        <h2>Start small, grow organically</h2>
        <p>
          You don&apos;t need to enter everything at once. Start with the
          characters and locations that appear in your first chapter. Add
          relationships as you write. The world bible grows alongside the
          manuscript.
        </p>

        <div className="mt-10 flex gap-3">
          <Link href="/auth/signup">
            <Button>Start building your world</Button>
          </Link>
          <Link href="/worlds/star-wars">
            <Button variant="outline">See an example world</Button>
          </Link>
        </div>
      </article>
    </div>
  );
}
