"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Plotline as PlotlineBase } from "@loreum/types";
import { Button } from "@loreum/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import { Plus, Map } from "lucide-react";
import { CreatePlotlineDialog } from "@/components/dialogs/create-plotline-dialog";

type Plotline = PlotlineBase & { _count?: { plotPoints: number } };

export default function PlotlinesPage() {
  const params = useParams<{ slug: string }>();
  const [plotlines, setPlotlines] = useState<Plotline[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    api<Plotline[]>(`/projects/${params.slug}/storyboard/plotlines`)
      .then(setPlotlines)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  const handleCreated = (plotline: Plotline) => {
    setPlotlines((prev) => [...prev, plotline]);
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
          <h1>Plotlines</h1>
          <p className="text-sm text-muted-foreground">
            Narrative arcs and their plot points
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New plotline
        </Button>
      </div>

      {plotlines.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Map className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">No plotlines yet</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Create plotlines to plan your narrative arcs
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New plotline
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plotlines.map((plotline) => (
            <Link
              key={plotline.id}
              href={`/projects/${params.slug}/storyboard/plotlines/${plotline.slug}`}
            >
              <Card className="transition-colors hover:border-foreground/20">
                <CardHeader>
                  <CardTitle className="text-base">{plotline.name}</CardTitle>
                  {plotline.description && (
                    <CardDescription className="line-clamp-2">
                      {plotline.description}
                    </CardDescription>
                  )}
                  {plotline._count && plotline._count.plotPoints > 0 && (
                    <CardDescription>
                      {plotline._count.plotPoints}{" "}
                      {plotline._count.plotPoints === 1
                        ? "plot point"
                        : "plot points"}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreatePlotlineDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectSlug={params.slug}
        onCreated={handleCreated}
      />
    </div>
  );
}
