"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@loreum/ui/card";
import { Markdown } from "@/components/markdown";

interface WikiLoreArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string | null;
  entities: {
    entity: { id: string; name: string; slug: string; type: string };
  }[];
}

export default function WikiLoreArticlePage() {
  const params = useParams<{ slug: string; loreSlug: string }>();
  const [article, setArticle] = useState<WikiLoreArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<WikiLoreArticle>(`/worlds/${params.slug}/lore/${params.loreSlug}`)
      .then(setArticle)
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [params.slug, params.loreSlug]);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!article)
    return <p className="text-muted-foreground">Article not found.</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        {article.category && (
          <p className="text-xs uppercase text-muted-foreground">
            {article.category}
          </p>
        )}
        <h2 className="text-2xl font-bold">{article.title}</h2>
      </div>

      <div className="prose prose-invert max-w-none">
        <Markdown>{article.content}</Markdown>
      </div>

      {article.entities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Related Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {article.entities.map(({ entity }) => (
                <Link
                  key={entity.id}
                  href={`/worlds/${params.slug}/entities/${entity.slug}`}
                  className="rounded-md border px-2.5 py-1 text-sm transition-colors hover:bg-muted"
                >
                  {entity.name}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
