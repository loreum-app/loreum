"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { LoreArticleSummary } from "@loreum/types";
import { Button } from "@loreum/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import { CreateLoreArticleDialog } from "@/components/dialogs/create-lore-article-dialog";
import { Plus, ScrollText } from "lucide-react";

export default function LorePage() {
  const params = useParams<{ slug: string }>();
  const [articles, setArticles] = useState<LoreArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    api<LoreArticleSummary[]>(`/projects/${params.slug}/lore`)
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [params.slug]);

  const handleCreated = (article: LoreArticleSummary) => {
    setArticles((prev) =>
      [...prev, article].sort((a, b) => a.title.localeCompare(b.title)),
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
          <h1>Lore</h1>
          <p className="text-sm text-muted-foreground">
            Articles and world details
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New article
        </Button>
      </div>

      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <ScrollText className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">No lore articles yet</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Write articles to document your world&apos;s lore
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New article
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/projects/${params.slug}/lore/${article.slug}`}
            >
              <Card className="transition-colors hover:border-foreground/20">
                <CardHeader>
                  <CardTitle className="text-base">{article.title}</CardTitle>
                  {article.category && (
                    <CardDescription>{article.category}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateLoreArticleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectSlug={params.slug}
        onCreated={handleCreated}
      />
    </div>
  );
}
