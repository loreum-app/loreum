"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";

interface LoreArticleSummary {
  id: string;
  title: string;
  slug: string;
  category: string | null;
}

export default function WikiLorePage() {
  const params = useParams<{ slug: string }>();
  const [articles, setArticles] = useState<LoreArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<LoreArticleSummary[]>(`/worlds/${params.slug}/lore`)
      .then(setArticles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Lore</h2>
      {articles.length === 0 ? (
        <p className="text-muted-foreground">No lore articles.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/worlds/${params.slug}/lore/${article.slug}`}
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
    </div>
  );
}
