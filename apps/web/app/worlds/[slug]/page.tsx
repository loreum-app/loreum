"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import {
  Users,
  MapPin,
  Building2,
  Network,
  Clock,
  ScrollText,
} from "lucide-react";

interface WikiStats {
  entities: { type: string; _count: number }[];
  relationships: number;
  timelineEvents: number;
  loreArticles: number;
}

export default function WikiHomePage() {
  const params = useParams<{ slug: string }>();
  const [entities, setEntities] = useState<
    { id: string; type: string; name: string; slug: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ id: string; type: string; name: string; slug: string }[]>(
      `/worlds/${params.slug}/entities`,
    )
      .then(setEntities)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  const characters = entities.filter((e) => e.type === "CHARACTER");
  const locations = entities.filter((e) => e.type === "LOCATION");
  const organizations = entities.filter((e) => e.type === "ORGANIZATION");

  const sections = [
    {
      icon: Users,
      label: "Characters",
      count: characters.length,
      href: "entities?type=CHARACTER",
    },
    {
      icon: MapPin,
      label: "Locations",
      count: locations.length,
      href: "entities?type=LOCATION",
    },
    {
      icon: Building2,
      label: "Organizations",
      count: organizations.length,
      href: "entities?type=ORGANIZATION",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.href} href={`/worlds/${params.slug}/${s.href}`}>
            <Card className="transition-colors hover:border-foreground/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">{s.label}</CardTitle>
                </div>
                <CardDescription>
                  {s.count}{" "}
                  {s.count === 1
                    ? s.label.toLowerCase().slice(0, -1)
                    : s.label.toLowerCase()}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {characters.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Characters</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {characters.slice(0, 9).map((e) => (
              <Link
                key={e.id}
                href={`/worlds/${params.slug}/entities/${e.slug}`}
                className="rounded-md border p-3 text-sm transition-colors hover:border-foreground/20"
              >
                {e.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
