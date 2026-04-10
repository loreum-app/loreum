"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import { BookOpen } from "lucide-react";

interface WikiPlotline {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { plotPoints: number };
}

interface WikiWork {
  id: string;
  title: string;
  slug: string;
  status: string;
  _count: { chapters: number };
}

interface StoryboardData {
  plotlines: WikiPlotline[];
  works: WikiWork[];
}

export default function WikiStoryboardPage() {
  const params = useParams<{ slug: string }>();
  const [data, setData] = useState<StoryboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<StoryboardData>(`/worlds/${params.slug}/storyboard`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!data)
    return <p className="text-muted-foreground">No storyboard data.</p>;

  return (
    <div className="space-y-8">
      {data.plotlines.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Plotlines</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.plotlines.map((p) => (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  {p.description && (
                    <CardDescription className="line-clamp-2">
                      {p.description}
                    </CardDescription>
                  )}
                  <CardDescription>
                    {p._count.plotPoints}{" "}
                    {p._count.plotPoints === 1 ? "plot point" : "plot points"}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      )}

      {data.works.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Works</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.works.map((w) => (
              <Card key={w.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{w.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {w.status} · {w._count.chapters}{" "}
                    {w._count.chapters === 1 ? "chapter" : "chapters"}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
