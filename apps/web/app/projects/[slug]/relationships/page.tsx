"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Relationship } from "@loreum/types";
import { Button } from "@loreum/ui/button";
import { Card, CardHeader, CardDescription } from "@loreum/ui/card";
import { CreateRelationshipDialog } from "@/components/dialogs/create-relationship-dialog";
import { EditRelationshipSheet } from "@/components/edit-relationship-sheet";
import { RelationshipGraph } from "@/components/relationship-graph";
import {
  Plus,
  Network,
  ArrowRight,
  ArrowLeftRight,
  List,
  GitGraph,
} from "lucide-react";

export default function RelationshipsPage() {
  const params = useParams<{ slug: string }>();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRel, setEditingRel] = useState<Relationship | null>(null);
  const [view, setView] = useState<"graph" | "list">("graph");
  const [connectSource, setConnectSource] = useState<string | undefined>();
  const [connectTarget, setConnectTarget] = useState<string | undefined>();

  useEffect(() => {
    api<Relationship[]>(`/projects/${params.slug}/relationships`)
      .then(setRelationships)
      .catch(() => setRelationships([]))
      .finally(() => setLoading(false));
  }, [params.slug]);

  const handleCreated = (rel: Relationship) => {
    setRelationships((prev) => [rel, ...prev]);
    setDialogOpen(false);
  };

  const handleUpdated = (updated: Relationship) => {
    setRelationships((prev) =>
      prev.map((r) => (r.id === updated.id ? updated : r)),
    );
  };

  const handleDeleted = (id: string) => {
    setRelationships((prev) => prev.filter((r) => r.id !== id));
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
          <h1>Relationships</h1>
          <p className="text-sm text-muted-foreground">
            Connections between entities
          </p>
        </div>
        <div className="flex gap-2">
          {relationships.length > 0 && (
            <div className="flex rounded-md border">
              <Button
                size="sm"
                variant={view === "graph" ? "default" : "ghost"}
                className="rounded-r-none"
                onClick={() => setView("graph")}
              >
                <GitGraph className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={view === "list" ? "default" : "ghost"}
                className="rounded-l-none"
                onClick={() => setView("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New relationship
          </Button>
        </div>
      </div>

      {relationships.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Network className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">No relationships yet</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Connect entities to define how they relate to each other
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New relationship
          </Button>
        </div>
      ) : (
        <>
          <div className={view === "graph" ? "" : "hidden"}>
            <RelationshipGraph
              relationships={relationships}
              projectSlug={params.slug}
              onRelationshipClick={(rel) => setEditingRel(rel)}
              onConnect={(src, tgt) => {
                setConnectSource(src);
                setConnectTarget(tgt);
                setDialogOpen(true);
              }}
            />
          </div>
          <div className={view === "list" ? "space-y-3" : "hidden"}>
            {relationships.map((rel) => (
              <Card
                key={rel.id}
                className="cursor-pointer transition-colors hover:border-foreground/20"
                onClick={() => setEditingRel(rel)}
              >
                <CardHeader className="py-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{rel.sourceEntity.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({rel.sourceEntity.type})
                    </span>
                    {rel.bidirectional ? (
                      <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium">{rel.targetEntity.name}</span>
                    <span className="text-muted-foreground text-xs">
                      ({rel.targetEntity.type})
                    </span>
                  </div>
                  <CardDescription>{rel.label}</CardDescription>
                  {rel.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {rel.description}
                    </p>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        </>
      )}

      <CreateRelationshipDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setConnectSource(undefined);
            setConnectTarget(undefined);
          }
        }}
        projectSlug={params.slug}
        onCreated={handleCreated}
        initialSourceSlug={connectSource}
        initialTargetSlug={connectTarget}
      />

      <EditRelationshipSheet
        open={!!editingRel}
        onOpenChange={(open) => !open && setEditingRel(null)}
        projectSlug={params.slug}
        relationship={editingRel}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
