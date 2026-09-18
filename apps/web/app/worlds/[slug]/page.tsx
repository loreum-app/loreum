"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription } from "@loreum/ui/card";
import { Users, MapPin, Building2, Box, type LucideIcon } from "lucide-react";

interface WikiEntity {
  id: string;
  type: string;
  name: string;
  slug: string;
  item?: { itemType?: { name: string; slug: string } | null } | null;
}

interface Group {
  icon: LucideIcon;
  label: string;
  href: string;
  entities: WikiEntity[];
}

/** Singular form for the count line, good enough for the built-in labels. */
function singular(label: string): string {
  return label.endsWith("s") ? label.slice(0, -1) : label;
}

export default function WikiHomePage() {
  const params = useParams<{ slug: string }>();
  const [entities, setEntities] = useState<WikiEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<WikiEntity[]>(`/worlds/${params.slug}/entities`)
      .then(setEntities)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  const byType = (type: string) => entities.filter((e) => e.type === type);

  const groups: Group[] = [
    {
      icon: Users,
      label: "Characters",
      href: "entities?type=CHARACTER",
      entities: byType("CHARACTER"),
    },
    {
      icon: MapPin,
      label: "Locations",
      href: "entities?type=LOCATION",
      entities: byType("LOCATION"),
    },
    {
      icon: Building2,
      label: "Organizations",
      href: "entities?type=ORGANIZATION",
      entities: byType("ORGANIZATION"),
    },
  ];

  // Items are grouped by their custom type, which means more to a reader than
  // "Items" does. Items with no custom type fall into one plain group.
  const items = byType("ITEM");
  const customTypes = new Map<string, { name: string; slug: string }>();
  for (const item of items) {
    const t = item.item?.itemType;
    if (t && !customTypes.has(t.slug)) customTypes.set(t.slug, t);
  }
  for (const [slug, type] of [...customTypes].sort((a, b) =>
    a[1].name.localeCompare(b[1].name),
  )) {
    groups.push({
      icon: Box,
      label: type.name,
      href: `entities?type=ITEM&itemType=${encodeURIComponent(slug)}`,
      entities: items.filter((e) => e.item?.itemType?.slug === slug),
    });
  }
  const untyped = items.filter((e) => !e.item?.itemType);
  if (untyped.length) {
    groups.push({
      icon: Box,
      label: "Items",
      href: "entities?type=ITEM&itemType=none",
      entities: untyped,
    });
  }

  const present = groups.filter((g) => g.entities.length > 0);

  if (present.length === 0) {
    return <p className="text-muted-foreground">This world is empty.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {present.map((g) => (
          <Link key={g.href} href={`/worlds/${params.slug}/${g.href}`}>
            <Card className="transition-colors hover:border-foreground/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <g.icon className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">{g.label}</CardTitle>
                </div>
                <CardDescription>
                  {g.entities.length}{" "}
                  {g.entities.length === 1
                    ? singular(g.label).toLowerCase()
                    : g.label.toLowerCase()}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {present.map((g) => (
        <section key={g.href}>
          <h2 className="mb-3 text-lg font-semibold">{g.label}</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {g.entities.slice(0, 9).map((e) => (
              <Link
                key={e.id}
                href={`/worlds/${params.slug}/entities/${e.slug}`}
                className="rounded-md border p-3 text-sm transition-colors hover:border-foreground/20"
              >
                {e.name}
              </Link>
            ))}
          </div>
          {g.entities.length > 9 && (
            <Link
              href={`/worlds/${params.slug}/${g.href}`}
              className="mt-2 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              See all {g.entities.length}
            </Link>
          )}
        </section>
      ))}
    </div>
  );
}
