"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Plotline as PlotlineBase, Work as WorkBase } from "@loreum/types";
import { Button } from "@loreum/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import { Plus, Map, BookOpen } from "lucide-react";
import { CreatePlotlineDialog } from "@/components/dialogs/create-plotline-dialog";
import { CreateWorkDialog } from "@/components/dialogs/create-work-dialog";

type Plotline = PlotlineBase & { _count?: { plotPoints: number } };
type Work = WorkBase & { _count: { chapters: number } };

export default function StoryboardPage() {
  const params = useParams<{ slug: string }>();
  const [plotlines, setPlotlines] = useState<Plotline[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [plotlineDialogOpen, setPlotlineDialogOpen] = useState(false);
  const [workDialogOpen, setWorkDialogOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      api<Plotline[]>(`/projects/${params.slug}/storyboard/plotlines`),
      api<Work[]>(`/projects/${params.slug}/storyboard/works`),
    ])
      .then(([p, w]) => {
        setPlotlines(p);
        setWorks(w);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  const handlePlotlineCreated = (plotline: Plotline) => {
    setPlotlines((prev) => [...prev, plotline]);
    setPlotlineDialogOpen(false);
  };

  const handleWorkCreated = (work: Work) => {
    setWorks((prev) =>
      [...prev, work].sort((a, b) => a.releaseOrder - b.releaseOrder),
    );
    setWorkDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const isEmpty = plotlines.length === 0 && works.length === 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1>Storyboard</h1>
          <p className="text-sm text-muted-foreground">
            Plotlines, works, chapters, and scenes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPlotlineDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New plotline
          </Button>
          <Button onClick={() => setWorkDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New work
          </Button>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Map className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">No storyboard content yet</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Create plotlines and works to plan your narrative
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPlotlineDialogOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              New plotline
            </Button>
            <Button onClick={() => setWorkDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              New work
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {plotlines.length > 0 && (
            <section>
              <h2 className="mb-4">Plotlines</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plotlines.map((plotline) => (
                  <Link
                    key={plotline.id}
                    href={`/projects/${params.slug}/storyboard/plotlines/${plotline.slug}`}
                  >
                    <Card className="transition-colors hover:border-foreground/20">
                      <CardHeader>
                        <CardTitle className="text-base">
                          {plotline.name}
                        </CardTitle>
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
            </section>
          )}

          {works.length > 0 && (
            <section>
              <h2 className="mb-4">Works</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {works.map((work) => (
                  <Link
                    key={work.id}
                    href={`/projects/${params.slug}/storyboard/works/${work.slug}`}
                  >
                    <Card className="transition-colors hover:border-foreground/20">
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-base">
                            {work.title}
                          </CardTitle>
                        </div>
                        <CardDescription>
                          {work.status} · {work._count.chapters}{" "}
                          {work._count.chapters === 1 ? "chapter" : "chapters"}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <CreatePlotlineDialog
        open={plotlineDialogOpen}
        onOpenChange={setPlotlineDialogOpen}
        projectSlug={params.slug}
        onCreated={handlePlotlineCreated}
      />
      <CreateWorkDialog
        open={workDialogOpen}
        onOpenChange={setWorkDialogOpen}
        projectSlug={params.slug}
        onCreated={handleWorkCreated}
      />
    </div>
  );
}
