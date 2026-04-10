"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Network,
  Clock,
  ScrollText,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  projectSlug: string;
}

const navItems = [
  { icon: BookOpen, label: "Entities", href: "entities" },
  { icon: Network, label: "Graph", href: "relationships" },
  { icon: Clock, label: "Timeline", href: "timeline" },
  { icon: ScrollText, label: "Lore", href: "lore" },
  { icon: Map, label: "Story", href: "storyboard" },
];

export function BottomNav({ projectSlug }: BottomNavProps) {
  const pathname = usePathname();
  const basePath = `/projects/${projectSlug}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex h-14 items-center justify-around">
        {navItems.map((item) => {
          const href = `${basePath}/${item.href}`;
          const isActive =
            pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
