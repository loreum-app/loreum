"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
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

export interface EditableEntityType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

interface EditEntityTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  entityType: EditableEntityType | null;
  /** Open straight on the delete confirmation instead of the edit form. */
  startWithDelete?: boolean;
  onUpdated: (previousSlug: string, entityType: EditableEntityType) => void;
  onDeleted: (slug: string) => void;
}

const DEFAULT_COLOR = "#3b82f6";

export function EditEntityTypeDialog({
  open,
  onOpenChange,
  projectSlug,
  entityType,
  startWithDelete = false,
  onUpdated,
  onDeleted,
}: EditEntityTypeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && entityType && (
          <EntityTypeForm
            key={entityType.id}
            projectSlug={projectSlug}
            entityType={entityType}
            startWithDelete={startWithDelete}
            onUpdated={onUpdated}
            onDeleted={onDeleted}
            close={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface EntityTypeFormProps {
  projectSlug: string;
  entityType: EditableEntityType;
  startWithDelete: boolean;
  onUpdated: (previousSlug: string, entityType: EditableEntityType) => void;
  onDeleted: (slug: string) => void;
  close: () => void;
}

// Mounted fresh on every open, so initial state comes straight from props.
function EntityTypeForm({
  projectSlug,
  entityType,
  startWithDelete,
  onUpdated,
  onDeleted,
  close,
}: EntityTypeFormProps) {
  const [name, setName] = useState(entityType.name);
  const [description, setDescription] = useState(entityType.description ?? "");
  const [icon, setIcon] = useState(entityType.icon ?? "");
  const [color, setColor] = useState(entityType.color ?? DEFAULT_COLOR);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(startWithDelete);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const updated = await api<EditableEntityType>(
        `/projects/${projectSlug}/entity-types/${entityType.slug}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            icon: icon.trim(),
            color,
          }),
        },
      );
      onUpdated(entityType.slug, updated);
      close();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to update entity type",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await api<void>(
        `/projects/${projectSlug}/entity-types/${entityType.slug}`,
        { method: "DELETE" },
      );
      onDeleted(entityType.slug);
      close();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete entity type",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmingDelete) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Delete {entityType.name}?</DialogTitle>
          <DialogDescription>
            Entities of this type are kept, but they will no longer belong to a
            custom type. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmingDelete(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={submitting}
          >
            {submitting ? "Deleting..." : "Delete type"}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Edit entity type</DialogTitle>
        <DialogDescription>
          Rename the type or change how it is described in your world.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="eet-name">Name</Label>
          <Input
            id="eet-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eet-description">Description</Label>
          <Textarea
            id="eet-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`${name || entityType.name} in your world`}
            maxLength={500}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <Label htmlFor="eet-icon">Icon name</Label>
            <Input
              id="eet-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="box"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eet-color">Color</Label>
            <Input
              id="eet-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-16 cursor-pointer p-1"
            />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <DialogFooter className="mt-4 sm:justify-between">
        <Button
          type="button"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmingDelete(true)}
          disabled={submitting}
        >
          Delete type
        </Button>
        <Button type="submit" disabled={submitting || !name.trim()}>
          {submitting ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
