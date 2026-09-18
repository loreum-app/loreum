"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useProject } from "@/lib/project-context";
import type { Project, ProjectVisibility } from "@loreum/types";
import {
  VISIBILITY_OPTIONS,
  VisibilitySelect,
} from "@/components/visibility-select";
import Link from "next/link";
import { Globe } from "lucide-react";
import { Button } from "@loreum/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@loreum/ui/dialog";
import { Input } from "@loreum/ui/input";
import { Label } from "@loreum/ui/label";
import { Textarea } from "@loreum/ui/textarea";

export function ProjectDetailsPanel() {
  const router = useRouter();
  const { project, setProject } = useProject();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [visibility, setVisibility] = useState<ProjectVisibility>(
    project.visibility,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const dirty =
    name.trim() !== project.name ||
    description.trim() !== (project.description ?? "") ||
    visibility !== project.visibility;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving || !dirty) return;

    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await api<Project>(`/projects/${project.slug}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          visibility,
        }),
      });
      setProject(updated);
      setSaved(true);
      if (updated.slug !== project.slug) {
        router.replace(`/projects/${updated.slug}/settings`);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to update project",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleting || confirmName !== project.name) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api<void>(`/projects/${project.slug}`, { method: "DELETE" });
      router.replace("/projects");
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : "Failed to delete project",
      );
      setDeleting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Project</h2>
        <p className="text-sm text-muted-foreground">
          The name, description, and visibility of your world. Renaming changes
          the project URL.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="project-name">Name</Label>
          <Input
            id="project-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-description">Description</Label>
          <Textarea
            id="project-description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setSaved(false);
            }}
            placeholder="What is this world about?"
            maxLength={2000}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-visibility">Visibility</Label>
          <VisibilitySelect
            id="project-visibility"
            value={visibility}
            onChange={(next) => {
              setVisibility(next);
              setSaved(false);
            }}
            className="w-48"
          />
          <p className="text-xs text-muted-foreground">
            {
              VISIBILITY_OPTIONS.find((o) => o.value === visibility)
                ?.description
            }
            .
            {project.visibility !== "PRIVATE" && (
              <>
                {" "}
                <Link
                  href={`/worlds/${project.slug}`}
                  className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
                >
                  <Globe className="h-3 w-3" />
                  View public wiki
                </Link>
              </>
            )}
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving || !dirty || !name.trim()}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
          {saved && !dirty && (
            <span className="text-sm text-muted-foreground">Saved</span>
          )}
        </div>
      </form>

      <div className="rounded-lg border border-destructive/40 p-4">
        <h3 className="font-medium">Delete project</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently removes this world and everything in it: entities, lore,
          timeline, storyboard, and API keys.
        </p>
        <Button
          type="button"
          variant="destructive"
          className="mt-3"
          onClick={() => {
            setConfirmName("");
            setDeleteError(null);
            setDeleteOpen(true);
          }}
        >
          Delete project
        </Button>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {project.name}?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Type the project name to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <Label htmlFor="confirm-project-name">Project name</Label>
            <Input
              id="confirm-project-name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={project.name}
              autoFocus
            />
            {deleteError && (
              <p className="text-sm text-destructive">{deleteError}</p>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting || confirmName !== project.name}
            >
              {deleting ? "Deleting..." : "Delete project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
