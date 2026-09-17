"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { BillingSummary, Project } from "@loreum/types";
import { Button } from "@loreum/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@loreum/ui/card";
import { CreateProjectDialog } from "@/components/dialogs/create-project-dialog";
import { Plus, FolderOpen, Info } from "lucide-react";

export default function ProjectsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [billing, setBilling] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/signin");
      return;
    }

    Promise.all([
      api<Project[]>("/projects").catch(() => [] as Project[]),
      // The notice is informational; if the summary fails, show nothing.
      api<BillingSummary>("/billing/me").catch(() => null),
    ])
      .then(([projectList, summary]) => {
        setProjects(projectList);
        setBilling(summary);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  // Number of projects the Free plan will allow once billing is enabled, or
  // null when there is nothing to warn about.
  const pendingFreeLimit =
    billing !== null &&
    !billing.billingEnabled &&
    billing.plan === "FREE" &&
    projects.length > 0
      ? billing.planLimits.maxProjects
      : null;

  const handleCreated = (project: Project) => {
    setProjects((prev) => [project, ...prev]);
    setDialogOpen(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1>Projects</h1>
          <p className="text-sm text-muted-foreground">
            Your worldbuilding projects
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New project
        </Button>
      </div>

      {pendingFreeLimit !== null && (
        <div
          role="status"
          className="mb-6 flex gap-3 rounded-lg border bg-muted/40 p-4 text-sm"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">Early access:</span>{" "}
            you can currently create multiple private projects on the Free plan.
            That is temporary. When paid plans launch, Free will include{" "}
            {pendingFreeLimit === 1
              ? "1 project"
              : `${pendingFreeLimit} projects`}
            , so keep that in mind while you build your worlds.
          </p>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <FolderOpen className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">No projects yet</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Create your first project to get started
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.slug}`}>
              <Card className="transition-colors hover:border-foreground/20">
                <CardHeader>
                  <CardTitle className="text-base">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={handleCreated}
      />
    </div>
  );
}
