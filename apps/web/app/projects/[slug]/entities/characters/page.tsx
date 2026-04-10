"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import { CreateEntityDialog } from "@/components/dialogs/create-entity-dialog";
import { Plus, Users } from "lucide-react";
import type { Entity } from "@loreum/types";

export default function CharactersPage() {
  const params = useParams<{ slug: string }>();
  const [characters, setCharacters] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    api<Entity[]>(`/projects/${params.slug}/entities?type=CHARACTER`)
      .then(setCharacters)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  const handleCreated = (entity: Entity) => {
    setCharacters((prev) =>
      [...prev, entity].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1>Characters</h1>
          <p className="text-sm text-muted-foreground">
            The people, AIs, and beings in your world
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New character
        </Button>
      </div>

      {characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Users className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">No characters yet</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Create your first character to start populating your world
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New character
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((entity) => (
            <Link
              key={entity.id}
              href={`/projects/${params.slug}/entities/characters/${entity.slug}`}
            >
              <Card className="transition-colors hover:border-foreground/20">
                <CardHeader>
                  <CardTitle className="text-base">{entity.name}</CardTitle>
                  <CardDescription>
                    {[entity.character?.role, entity.character?.species]
                      .filter(Boolean)
                      .join(" · ") || null}
                    {entity.summary && ` — ${entity.summary}`}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateEntityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectSlug={params.slug}
        defaultType="CHARACTER"
        onCreated={handleCreated}
      />
    </div>
  );
}
