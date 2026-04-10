"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Entity } from "@loreum/types";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";

const TYPE_LABELS: Record<string, string> = {
  CHARACTER: "Characters",
  LOCATION: "Locations",
  ORGANIZATION: "Organizations",
  ITEM: "Items",
};

export default function WikiEntitiesPage() {
  const params = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = type ? `?type=${type}` : "";
    api<Entity[]>(`/worlds/${params.slug}/entities${q}`)
      .then(setEntities)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug, type]);

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">
        {type ? (TYPE_LABELS[type] ?? "Entities") : "All Entities"}
      </h2>
      {entities.length === 0 ? (
        <p className="text-muted-foreground">No entities found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entities.map((entity) => (
            <Link
              key={entity.id}
              href={`/worlds/${params.slug}/entities/${entity.slug}`}
            >
              <Card className="transition-colors hover:border-foreground/20">
                <CardHeader>
                  <CardTitle className="text-base">{entity.name}</CardTitle>
                  {entity.summary && (
                    <CardDescription className="line-clamp-2">
                      {entity.summary}
                    </CardDescription>
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
