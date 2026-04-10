"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./user-menu";
import {
  BookOpen,
  ChevronDown,
  Users,
  Network,
  Clock,
  ScrollText,
  Map,
  Layers,
  Globe,
  Bot,
  FileText,
  Gamepad2,
  PenTool,
  Sparkles,
  ArrowUpRight,
  Rocket,
  History,
  Menu,
  X,
} from "lucide-react";

interface NavItem {
  icon: typeof BookOpen;
  title: string;
  description: string;
  href: string;
}

const productItems: NavItem[] = [
  {
    icon: Globe,
    title: "Features",
    description: "Everything Loreum can do",
    href: "/about",
  },
  {
    icon: Sparkles,
    title: "Templates",
    description: "Pre-built world structures to start from",
    href: "/templates",
  },
  {
    icon: ArrowUpRight,
    title: "Compare",
    description: "See how Loreum stacks up",
    href: "/compare",
  },
];

const productFeatures: NavItem[] = [
  {
    icon: Bot,
    title: "AI / MCP",
    description: "Read and write world data from any AI",
    href: "/about#mcp",
  },
  {
    icon: PenTool,
    title: "Style Guide",
    description: "Voice, tone, POV, character voices",
    href: "/about#style-guide",
  },
  {
    icon: Users,
    title: "Entities",
    description: "Characters, locations, orgs, custom types",
    href: "/about#entities",
  },
  {
    icon: Network,
    title: "Knowledge Graph",
    description: "Visual relationship editor",
    href: "/about#knowledge-graph",
  },
  {
    icon: Clock,
    title: "Timeline & Gantt",
    description: "Events, eras, custom calendars",
    href: "/about#timeline",
  },
  {
    icon: ScrollText,
    title: "Review Queue",
    description: "Staged AI changes with diff view",
    href: "/about#review-queue",
  },
];

const resourceItems: NavItem[] = [
  {
    icon: FileText,
    title: "Documentation",
    description: "Guides and feature walkthroughs",
    href: "/docs",
  },
  {
    icon: Bot,
    title: "MCP Setup",
    description: "Connect AI assistants to your world",
    href: "/docs/mcp",
  },
  {
    icon: ScrollText,
    title: "Blog",
    description: "Guides, tutorials, and updates",
    href: "/blog",
  },
  {
    icon: ArrowUpRight,
    title: "Migrate",
    description: "Move from other tools to Loreum",
    href: "/migrate",
  },
];

const updateItems: NavItem[] = [
  {
    icon: Rocket,
    title: "Roadmap",
    description: "What's planned and what's shipped",
    href: "/roadmap",
  },
  {
    icon: History,
    title: "What's New",
    description: "Release notes and changelog",
    href: "/whats-new",
  },
];

function NavDropdown({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => setOpen(!open)}
      >
        {label}
        <ChevronDown
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2">
          <div
            className="rounded-xl border bg-popover shadow-lg"
            onClick={() => setOpen(false)}
          >
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function NavItemLink({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.href}
      className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted"
    >
      <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">{item.title}</p>
        <p className="text-xs text-muted-foreground">{item.description}</p>
      </div>
    </Link>
  );
}

function NavItemList({ items }: { items: NavItem[] }) {
  return (
    <>
      {items.map((item) => (
        <NavItemLink key={item.title} item={item} />
      ))}
    </>
  );
}

export function AppBar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isProjectPage =
    pathname.startsWith("/projects/") && pathname !== "/projects";

  if (isProjectPage) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex h-12 items-center justify-between px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <BookOpen className="h-4 w-4" />
            Loreum
          </Link>
          <UserMenu />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-5 w-5" />
          Loreum
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {/* Product dropdown — features + use cases */}
          <NavDropdown label="Product">
            <div className="flex w-[600px]">
              <div className="w-[240px] border-r p-3">
                <NavItemList items={productItems} />
              </div>
              <div className="flex-1 p-3">
                <p className="mb-2 px-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Features
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {productFeatures.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="flex items-center gap-2 rounded-lg p-2 text-xs transition-colors hover:bg-muted"
                    >
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {item.title}
                    </Link>
                  ))}
                </div>
                <div className="mt-3 border-t pt-3">
                  <p className="mb-2 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    Built for
                  </p>
                  <div className="flex gap-3 px-2">
                    <Link
                      href="/about"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <PenTool className="h-3 w-3" />
                      Writers
                    </Link>
                    <Link
                      href="/about"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Gamepad2 className="h-3 w-3" />
                      Game Designers
                    </Link>
                    <Link
                      href="/blog/organize-dnd-campaign"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <BookOpen className="h-3 w-3" />
                      Game Masters
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </NavDropdown>

          {/* Pricing — standalone link */}
          <Link
            href="/pricing"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>

          {/* Worlds — standalone link */}
          <Link
            href="/worlds"
            className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Worlds
          </Link>

          {/* Resources dropdown */}
          <NavDropdown label="Resources">
            <div className="w-[300px] p-3">
              <NavItemList items={resourceItems} />
            </div>
          </NavDropdown>

          {/* Updates dropdown */}
          <NavDropdown label="Updates">
            <div className="w-[280px] p-3">
              <NavItemList items={updateItems} />
            </div>
          </NavDropdown>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <UserMenu />
          </div>
          <button
            className="rounded-md p-2 text-muted-foreground hover:text-foreground md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-background px-4 py-4 md:hidden">
          <nav className="space-y-1">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Product
            </p>
            {productItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {item.title}
              </Link>
            ))}

            <div className="my-2 border-t" />

            <Link
              href="/pricing"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              <Layers className="h-4 w-4 text-muted-foreground" />
              Pricing
            </Link>

            <Link
              href="/worlds"
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium hover:bg-muted"
              onClick={() => setMobileOpen(false)}
            >
              <Globe className="h-4 w-4 text-muted-foreground" />
              Explore Worlds
            </Link>

            <div className="my-2 border-t" />

            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Resources
            </p>
            {resourceItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {item.title}
              </Link>
            ))}

            <div className="my-2 border-t" />

            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Updates
            </p>
            {updateItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted"
                onClick={() => setMobileOpen(false)}
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {item.title}
              </Link>
            ))}

            <div className="my-2 border-t" />

            <div className="px-2 py-2">
              <UserMenu />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
