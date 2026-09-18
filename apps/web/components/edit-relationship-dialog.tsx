"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Relationship } from "@loreum/types";
import { Button } from "@loreum/ui/button";
import { Input } from "@loreum/ui/input";
import { Label } from "@loreum/ui/label";
import { Textarea } from "@loreum/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@loreum/ui/dialog";
import { ArrowLeftRight, ArrowRight, TriangleAlert } from "lucide-react";

interface EditRelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  relationship: Relationship | null;
  onUpdated: (relationship: Relationship) => void;
  onDeleted: (id: string) => void;
}

export function EditRelationshipDialog({
  open,
  onOpenChange,
  projectSlug,
  relationship,
  onUpdated,
  onDeleted,
}: EditRelationshipDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && relationship && (
          <RelationshipForm
            key={relationship.id}
            projectSlug={projectSlug}
            relationship={relationship}
            onUpdated={onUpdated}
            onDeleted={onDeleted}
            close={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface FormProps {
  projectSlug: string;
  relationship: Relationship;
  onUpdated: (relationship: Relationship) => void;
  onDeleted: (id: string) => void;
  close: () => void;
}

// Mounted fresh on each open, so initial state comes straight from props.
function RelationshipForm({
  projectSlug,
  relationship,
  onUpdated,
  onDeleted,
  close,
}: FormProps) {
  const [label, setLabel] = useState(relationship.label);
  const [description, setDescription] = useState(
    relationship.description ?? "",
  );
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const updated = await api<Relationship>(
        `/projects/${projectSlug}/relationships/${relationship.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            label: label.trim(),
            description: description.trim() || null,
          }),
        },
      );
      onUpdated(updated);
      close();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to save the relationship",
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
      await api(`/projects/${projectSlug}/relationships/${relationship.id}`, {
        method: "DELETE",
      });
      onDeleted(relationship.id);
      close();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to delete the relationship",
      );
      setSubmitting(false);
    }
  };

  const pair = (
    <span className="inline-flex items-center gap-1.5">
      {relationship.sourceEntity.name}
      {relationship.bidirectional ? (
        <ArrowLeftRight className="h-3 w-3" />
      ) : (
        <ArrowRight className="h-3 w-3" />
      )}
      {relationship.targetEntity.name}
    </span>
  );

  if (confirmingDelete) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Delete this relationship?</DialogTitle>
          <DialogDescription>{pair}</DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p>
            <span className="font-semibold text-destructive">
              This cannot be undone.
            </span>{" "}
            Both entities stay; only the connection between them is removed.
          </p>
        </div>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
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
            {submitting ? "Deleting..." : "Delete relationship"}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <form onSubmit={handleSave}>
      <DialogHeader>
        <DialogTitle>Edit relationship</DialogTitle>
        <DialogDescription>{pair}</DialogDescription>
      </DialogHeader>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-rel-label">Label</Label>
          <Input
            id="edit-rel-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Mentor, Allied with, At war with..."
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-rel-desc">Description</Label>
          <Textarea
            id="edit-rel-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why this relationship exists, how it works..."
            rows={4}
          />
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
          Delete
        </Button>
        <Button type="submit" disabled={submitting || !label.trim()}>
          {submitting ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
