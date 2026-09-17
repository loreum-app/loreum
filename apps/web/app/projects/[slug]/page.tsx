"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Project, ProjectVisibility } from "@loreum/types";
import { VisibilitySelect } from "@/components/visibility-select";
import {
  Users,
  MapPin,
  Building2,
  Network,
  Clock,
  ScrollText,
  Map,
  Globe,
  ExternalLink,
} from "lucide-react";

const sections = [
  {
    icon: Users,
    title: "Characters",
    description: "People, creatures, and other beings",
    href: "entities/characters",
  },
  {
    icon: MapPin,
    title: "Locations",
    description: "Places, regions, and landmarks",
    href: "entities/locations",
  },
  {
    icon: Building2,
    title: "Organizations",
    description: "Factions, groups, and institutions",
    href: "entities/organizations",
  },
  {
    icon: Network,
    title: "Relationships",
    description: "Connections between entities",
    href: "relationships",
  },
  {
    icon: Clock,
    title: "Timeline",
    description: "Events, eras, and history",
    href: "timeline",
  },
  {
    icon: ScrollText,
    title: "Lore",
    description: "Articles and world details",
    href: "lore",
  },
  {
    icon: Map,
    title: "Storyboard",
    description: "Plotlines, works, chapters, scenes",
    href: "storyboard",
  },
];

export default function ProjectPage() {
  const params = useParams<{ slug: string }>();
  const [visibility, setVisibility] = useState<ProjectVisibility>("PRIVATE");

  useEffect(() => {
    api<Project>(`/projects/${params.slug}`)
      .then((p) => setVisibility(p.visibility))
      .catch(() => {});
  }, [params.slug]);

  const handleVisibilityChange = async (value: ProjectVisibility) => {
    setVisibility(value);
    try {
      await api(`/projects/${params.slug}`, {
        method: "PATCH",
        body: JSON.stringify({ visibility: value }),
      });
    } catch {
      // revert on error
      api<Project>(`/projects/${params.slug}`)
        .then((p) => setVisibility(p.visibility))
        .catch(() => {});
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1>Dashboard</h1>
        <div className="flex items-center gap-3">
          {(visibility === "PUBLIC" || visibility === "UNLISTED") && (
            <Link
              href={`/worlds/${params.slug}`}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <Globe className="h-3.5 w-3.5" />
              View public wiki
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
          <VisibilitySelect
            value={visibility}
            onChange={handleVisibilityChange}
            className="w-36"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={`/projects/${params.slug}/${s.href}`}
            className="flex gap-4 rounded-lg border bg-card p-5 transition-colors hover:border-foreground/20"
          >
            <s.icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
            <div>
              <h2 className="text-base">{s.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {s.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
