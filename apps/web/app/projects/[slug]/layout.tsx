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
    <TooltipProvider>
      <SidebarProvider>
        <ProjectSidebar projectSlug={project.slug} projectName={project.name} />
        <SidebarInset>
          <header className="flex h-10 items-center gap-2 border-b px-4 md:h-12">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-1 h-4" />
            <ProjectBreadcrumbs
              projectName={project.name}
              projectSlug={project.slug}
            />
          </header>
          <div className="pb-16 md:pb-0">{children}</div>
        </SidebarInset>
        <BottomNav projectSlug={project.slug} />
      </SidebarProvider>
    </TooltipProvider>
  );
}
