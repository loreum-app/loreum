"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loreum/ui/select";
import { TriangleAlert } from "lucide-react";
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

interface DeletionImpact {
  entities: number;
  relationships: number;
  timelineEventLinks: number;
  loreArticleLinks: number;
  sceneAppearances: number;
  tagLinks: number;
}

interface EditEntityTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  entityType: EditableEntityType | null;
  /** The project's other custom types, offered as destinations for a move. */
  otherTypes: EditableEntityType[];
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
  otherTypes,
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
            otherTypes={otherTypes}
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
  otherTypes: EditableEntityType[];
  startWithDelete: boolean;
  onUpdated: (previousSlug: string, entityType: EditableEntityType) => void;
  onDeleted: (slug: string) => void;
  close: () => void;
}

// Mounted fresh on every open, so initial state comes straight from props.
function EntityTypeForm({
  projectSlug,
  entityType,
  otherTypes,
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

  if (confirmingDelete) {
    return (
      <DeleteEntityTypeConfirm
        projectSlug={projectSlug}
        entityType={entityType}
        otherTypes={otherTypes}
        onCancel={() => setConfirmingDelete(false)}
        onDeleted={() => {
          onDeleted(entityType.slug);
          close();
        }}
      />
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

interface DeleteConfirmProps {
  projectSlug: string;
  entityType: EditableEntityType;
  otherTypes: EditableEntityType[];
  onCancel: () => void;
  onDeleted: () => void;
}

/** Links that a cascade delete destroys, in the order the warning lists them. */
const IMPACT_LABELS: [keyof DeletionImpact, string, string][] = [
  ["relationships", "relationship", "relationships"],
  ["timelineEventLinks", "timeline event link", "timeline event links"],
  ["loreArticleLinks", "lore article mention", "lore article mentions"],
  ["sceneAppearances", "scene appearance", "scene appearances"],
  ["tagLinks", "tag", "tags"],
];

function DeleteEntityTypeConfirm({
  projectSlug,
  entityType,
  otherTypes,
  onCancel,
  onDeleted,
}: DeleteConfirmProps) {
  const [impact, setImpact] = useState<DeletionImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"move" | "delete">(
    otherTypes.length ? "move" : "delete",
  );
  const [destination, setDestination] = useState(otherTypes[0]?.slug ?? "");
  const [confirmName, setConfirmName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<DeletionImpact>(
      `/projects/${projectSlug}/entity-types/${entityType.slug}/deletion-impact`,
    )
      .then((data) => {
        if (!cancelled) setImpact(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Could not check what this would affect",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectSlug, entityType.slug]);

  const handleDelete = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const query =
        !impact || impact.entities === 0
          ? ""
          : mode === "move"
            ? `?entities=move&to=${encodeURIComponent(destination)}`
            : "?entities=delete";
      await api<void>(
        `/projects/${projectSlug}/entity-types/${entityType.slug}${query}`,
        { method: "DELETE" },
      );
      onDeleted();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete entity type",
      );
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Delete {entityType.name}?</DialogTitle>
          <DialogDescription>
            Checking what this would affect...
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </DialogFooter>
      </>
    );
  }

  const entityCount = impact?.entities ?? 0;
  const entityWord = entityCount === 1 ? "entity" : "entities";
  const cascadeLosses = impact
    ? IMPACT_LABELS.filter(([key]) => impact[key] > 0).map(
        ([key, one, many]) =>
          `${impact[key]} ${impact[key] === 1 ? one : many}`,
      )
    : [];
  const cascadeConfirmed = confirmName.trim() === entityType.name;
  const canDelete =
    entityCount === 0 ||
    (mode === "move" ? destination !== "" : cascadeConfirmed);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Delete {entityType.name}?</DialogTitle>
        <DialogDescription>
          {entityCount === 0
            ? "This type has no entities. Deleting it cannot be undone."
            : `This type has ${entityCount} ${entityWord}. Choose what happens to ${entityCount === 1 ? "it" : "them"}.`}
        </DialogDescription>
      </DialogHeader>

      {entityCount > 0 && (
        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer gap-3 rounded-lg border p-3 has-checked:border-foreground/30 has-checked:bg-muted/40">
            <input
              type="radio"
              name="disposition"
              className="mt-0.5"
              checked={mode === "move"}
              disabled={otherTypes.length === 0}
              onChange={() => setMode("move")}
            />
            <div className="space-y-2">
              <p className="font-medium">
                Move {entityCount === 1 ? "it" : "them"} to another type
              </p>
              {otherTypes.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  There is no other custom type to move{" "}
                  {entityCount === 1 ? "it" : "them"} to. Create one first, or
                  delete {entityCount === 1 ? "it" : "them"} below.
                </p>
              ) : (
                <Select
                  value={destination}
                  onValueChange={(v) => {
                    if (v) {
                      setDestination(v);
                      setMode("move");
                    }
                  }}
                  disabled={mode !== "move"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {otherTypes.map((t) => (
                      <SelectItem key={t.slug} value={t.slug}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </label>

          <label className="flex cursor-pointer gap-3 rounded-lg border p-3 has-checked:border-destructive/50 has-checked:bg-destructive/10">
            <input
              type="radio"
              name="disposition"
              className="mt-0.5"
              checked={mode === "delete"}
              onChange={() => setMode("delete")}
            />
            <div className="space-y-2">
              <p className="font-medium">
                Delete {entityCount === 1 ? "it" : "them"} too
              </p>
              {mode === "delete" && (
                <div className="space-y-3">
                  <div className="flex gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-2.5">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <div className="space-y-1 text-xs">
                      <p>
                        <span className="font-semibold text-destructive">
                          This cannot be undone.
                        </span>{" "}
                        {entityCount} {entityWord} will be permanently deleted.
                      </p>
                      {cascadeLosses.length > 0 && (
                        <p>
                          It also removes {cascadeLosses.join(", ")} elsewhere
                          in your world.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="eet-confirm" className="text-xs">
                      Type <span className="font-mono">{entityType.name}</span>{" "}
                      to confirm
                    </Label>
                    <Input
                      id="eet-confirm"
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      placeholder={entityType.name}
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>
          </label>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <DialogFooter className="mt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={submitting || !canDelete}
        >
          {submitting
            ? "Deleting..."
            : entityCount > 0 && mode === "move"
              ? "Move and delete type"
              : entityCount > 0
                ? `Delete type and ${entityCount} ${entityWord}`
                : "Delete type"}
        </Button>
      </DialogFooter>
    </>
  );
}
