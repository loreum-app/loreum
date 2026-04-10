"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Relationship } from "@loreum/types";
import { ArrowRight, ArrowLeftRight } from "lucide-react";

export default function WikiRelationshipsPage() {
  const params = useParams<{ slug: string }>();
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Relationship[]>(`/worlds/${params.slug}/relationships`)
      .then(setRelationships)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-3xl">
      <h2 className="mb-6 text-xl font-semibold">Relationships</h2>
      {relationships.length === 0 ? (
        <p className="text-muted-foreground">No relationships.</p>
      ) : (
        <div className="space-y-2">
          {relationships.map((rel) => (
            <div
              key={rel.id}
              className="flex items-center gap-3 rounded-lg border p-3 text-sm"
            >
              <Link
                href={`/worlds/${params.slug}/entities/${rel.sourceEntity.slug}`}
                className="font-medium hover:underline"
              >
                {rel.sourceEntity.name}
              </Link>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {rel.bidirectional ? (
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
                <span className="text-xs">{rel.label}</span>
              </div>
              <Link
                href={`/worlds/${params.slug}/entities/${rel.targetEntity.slug}`}
                className="font-medium hover:underline"
              >
                {rel.targetEntity.name}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
