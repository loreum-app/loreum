"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Work as WorkBase } from "@loreum/types";
import { Button } from "@loreum/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import { Plus, BookOpen } from "lucide-react";
import { CreateWorkDialog } from "@/components/dialogs/create-work-dialog";

type Work = WorkBase & { _count: { chapters: number } };

export default function WorksPage() {
  const params = useParams<{ slug: string }>();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    api<Work[]>(`/projects/${params.slug}/storyboard/works`)
      .then(setWorks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  const handleCreated = (work: Work) => {
    setWorks((prev) =>
      [...prev, work].sort((a, b) => a.releaseOrder - b.releaseOrder),
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
          <h1>Works</h1>
          <p className="text-sm text-muted-foreground">
            Books, screenplays, and other narrative works
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New work
        </Button>
      </div>

      {works.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <BookOpen className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">No works yet</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Create works to organize your chapters and scenes
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New work
          </Button>
        </div>
      ) : (
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
                    <CardTitle className="text-base">{work.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {work.status} · {work._count.chapters}{" "}
                    {work._count.chapters === 1 ? "chapter" : "chapters"}
                  </CardDescription>
                  {work.synopsis && (
                    <CardDescription className="line-clamp-2">
                      {work.synopsis}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateWorkDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectSlug={params.slug}
        onCreated={handleCreated}
      />
    </div>
  );
}
