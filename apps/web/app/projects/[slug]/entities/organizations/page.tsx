"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import { CreateEntityDialog } from "@/components/dialogs/create-entity-dialog";
import { Plus, Building2 } from "lucide-react";
import type { Entity } from "@loreum/types";

export default function OrganizationsPage() {
  const params = useParams<{ slug: string }>();
  const [organizations, setOrganizations] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    api<Entity[]>(`/projects/${params.slug}/entities?type=ORGANIZATION`)
      .then(setOrganizations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  const handleCreated = (entity: Entity) => {
    setOrganizations((prev) =>
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
          <h1>Organizations</h1>
          <p className="text-sm text-muted-foreground">
            Factions, groups, and institutions in your world
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New organization
        </Button>
      </div>

      {organizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Building2 className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">No organizations yet</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Create your first organization to start building your world&apos;s
            power structures
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New organization
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((entity) => (
            <Link
              key={entity.id}
              href={`/projects/${params.slug}/entities/organizations/${entity.slug}`}
            >
              <Card className="transition-colors hover:border-foreground/20">
                <CardHeader>
                  <CardTitle className="text-base">{entity.name}</CardTitle>
                  <CardDescription>
                    {[
                      entity.organization?.status,
                      entity.organization?.territory,
                    ]
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
        defaultType="ORGANIZATION"
        onCreated={handleCreated}
      />
    </div>
  );
}
