"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { Project } from "@loreum/types";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@loreum/ui/sidebar";
import { TooltipProvider } from "@loreum/ui/tooltip";
import { ProjectProvider } from "@/lib/project-context";
import { ProjectSidebar } from "@/components/project-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { ProjectBreadcrumbs } from "@/components/project-breadcrumbs";
import { Separator } from "@loreum/ui/separator";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    api<Project>(`/projects/${params.slug}`)
      .then(setProject)
      .catch(() => router.push("/projects"))
      .finally(() => setLoading(false));
  }, [params.slug, user, authLoading, router]);

  if (authLoading || loading || !project) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <ProjectProvider value={{ project, setProject }}>
      <TooltipProvider>
        <SidebarProvider>
          <ProjectSidebar
            projectSlug={project.slug}
            projectName={project.name}
          />
          {/* Viewport minus the site app bar (h-14), so the shell fits exactly. */}
          <SidebarInset className="h-[calc(100svh-3.5rem)] overflow-hidden">
            {/* Sticky so the sidebar toggle stays reachable while content scrolls. */}
            <header className="sticky top-0 z-20 flex h-10 shrink-0 items-center gap-2 border-b bg-background px-4 md:h-12">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mx-1 h-4" />
              <ProjectBreadcrumbs
                projectName={project.name}
                projectSlug={project.slug}
              />
            </header>
            {/* The workspace owns its own scroll area rather than the page. */}
            <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
              {children}
            </div>
          </SidebarInset>
          <BottomNav projectSlug={project.slug} />
        </SidebarProvider>
      </TooltipProvider>
    </ProjectProvider>
  );
}
