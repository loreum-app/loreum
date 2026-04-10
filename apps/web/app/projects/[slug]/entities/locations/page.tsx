"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import { CreateEntityDialog } from "@/components/dialogs/create-entity-dialog";
import { Plus, MapPin } from "lucide-react";
import type { Entity } from "@loreum/types";

export default function LocationsPage() {
  const params = useParams<{ slug: string }>();
  const [locations, setLocations] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    api<Entity[]>(`/projects/${params.slug}/entities?type=LOCATION`)
      .then(setLocations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  const handleCreated = (entity: Entity) => {
    setLocations((prev) =>
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
          <h1>Locations</h1>
          <p className="text-sm text-muted-foreground">
            Places, regions, and landmarks in your world
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New location
        </Button>
      </div>

      {locations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <MapPin className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">No locations yet</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Create your first location to start mapping your world
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New location
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((entity) => (
            <Link
              key={entity.id}
              href={`/projects/${params.slug}/entities/locations/${entity.slug}`}
            >
              <Card className="transition-colors hover:border-foreground/20">
                <CardHeader>
                  <CardTitle className="text-base">{entity.name}</CardTitle>
                  <CardDescription>
                    {[entity.location?.region, entity.location?.condition]
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
        defaultType="LOCATION"
        onCreated={handleCreated}
      />
    </div>
  );
}
