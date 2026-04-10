"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Users,
  MapPin,
  Building2,
  Network,
  Clock,
  ScrollText,
  Map,
} from "lucide-react";

interface WikiProject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

const navItems = [
  { icon: Users, label: "Characters", href: "entities?type=CHARACTER" },
  { icon: MapPin, label: "Locations", href: "entities?type=LOCATION" },
  {
    icon: Building2,
    label: "Organizations",
    href: "entities?type=ORGANIZATION",
  },
  { icon: Network, label: "Relationships", href: "relationships" },
  { icon: Clock, label: "Timeline", href: "timeline" },
  { icon: ScrollText, label: "Lore", href: "lore" },
  { icon: Map, label: "Storyboard", href: "storyboard" },
];

export default function WikiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ slug: string }>();
  const [project, setProject] = useState<WikiProject | null>(null);

  useEffect(() => {
    api<WikiProject>(`/worlds/${params.slug}`)
      .then(setProject)
      .catch(() => setProject(null));
  }, [params.slug]);

  if (project === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <Link href={`/worlds/${params.slug}`}>
            <h1 className="text-2xl font-bold">{project.name}</h1>
          </Link>
          {project.description && (
            <p className="mt-1 text-muted-foreground">{project.description}</p>
          )}
        </div>
        <nav className="mx-auto max-w-6xl px-4">
          <div className="flex gap-1 overflow-x-auto pb-px">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={`/worlds/${params.slug}/${item.href}`}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-t-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer className="border-t py-6 text-center">
        <Link
          href="/"
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Powered by <span className="font-medium">Loreum</span>, the free
          worldbuilding platform
        </Link>
      </footer>
    </div>
  );
}
