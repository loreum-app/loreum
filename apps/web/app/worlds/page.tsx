"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import { Input } from "@loreum/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import { Search, Globe, Sparkles } from "lucide-react";

interface PublicProject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function WorldsPage() {
  const [worlds, setWorlds] = useState<PublicProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api<PublicProject[]>("/worlds")
      .then(setWorlds)
      .catch(() => setWorlds([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? worlds.filter(
        (w) =>
          w.name.toLowerCase().includes(search.toLowerCase()) ||
          w.description?.toLowerCase().includes(search.toLowerCase()),
      )
    : worlds;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-10 text-center">
        <h1 className="mb-4 text-3xl font-bold">Explore Worlds</h1>
        <p className="text-muted-foreground">
          Browse public worlds built by the Loreum community. Get inspired or
          dive into the lore.
        </p>
      </div>

      {/* Search */}
      <div className="mx-auto mb-8 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search worlds..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Featured section */}
      <section className="mb-12">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <h2 className="text-sm font-medium">Featured</h2>
        </div>
        <Link href="/worlds/star-wars">
          <Card className="transition-colors hover:border-foreground/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Star Wars</CardTitle>
              </div>
              <CardDescription>
                The original Star Wars trilogy: characters, factions, timeline,
                relationships, and storyboard. A demo of what Loreum can do.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </section>

      {/* All worlds */}
      <section>
        <h2 className="mb-4 text-sm font-medium">
          {search ? `Results for "${search}"` : "All Worlds"}
        </h2>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
            <Globe className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="mb-2 text-lg font-medium">
              {search ? "No worlds found" : "No public worlds yet"}
            </p>
            <p className="mb-6 text-sm text-muted-foreground">
              {search
                ? "Try a different search term."
                : "Be the first to share your world with the community."}
            </p>
            {!search && (
              <Link href="/auth/signup">
                <Button>Create a world</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((world) => (
              <Link key={world.id} href={`/worlds/${world.slug}`}>
                <Card className="transition-colors hover:border-foreground/20">
                  <CardHeader>
                    <CardTitle className="text-base">{world.name}</CardTitle>
                    {world.description && (
                      <CardDescription className="line-clamp-2">
                        {world.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
