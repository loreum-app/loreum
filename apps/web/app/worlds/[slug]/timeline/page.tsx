"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@loreum/ui/card";

const significanceColors: Record<string, string> = {
  minor: "bg-slate-400",
  moderate: "bg-blue-500",
  major: "bg-amber-500",
  critical: "bg-red-500",
};

interface WikiTimelineEvent {
  id: string;
  name: string;
  date: string;
  description: string | null;
  significance: string;
  era: { name: string; color: string | null } | null;
  entities: { entity: { id: string; name: string; slug: string } }[];
}

export default function WikiTimelinePage() {
  const params = useParams<{ slug: string }>();
  const [events, setEvents] = useState<WikiTimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<WikiTimelineEvent[]>(`/worlds/${params.slug}/timeline`)
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-3xl">
      <h2 className="mb-6 text-xl font-semibold">Timeline</h2>
      {events.length === 0 ? (
        <p className="text-muted-foreground">No timeline events.</p>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${significanceColors[event.significance] ?? "bg-muted"}`}
                  />
                  <CardTitle className="text-base">{event.name}</CardTitle>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {event.date}
                  </span>
                </div>
                {event.era && (
                  <span className="text-xs text-muted-foreground">
                    {event.era.name}
                  </span>
                )}
              </CardHeader>
              {(event.description || event.entities.length > 0) && (
                <CardContent>
                  {event.description && (
                    <p className="text-sm text-muted-foreground">
                      {event.description}
                    </p>
                  )}
                  {event.entities.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {event.entities.map(({ entity }) => (
                        <Link
                          key={entity.id}
                          href={`/worlds/${params.slug}/entities/${entity.slug}`}
                          className="rounded-md border px-2 py-0.5 text-xs transition-colors hover:bg-muted"
                        >
                          {entity.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
