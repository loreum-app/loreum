"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { Relationship } from "@loreum/types";
import { Button } from "@loreum/ui/button";
import { Input } from "@loreum/ui/input";
import { Label } from "@loreum/ui/label";
import { Textarea } from "@loreum/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@loreum/ui/sheet";
import { Trash2 } from "lucide-react";

interface EditRelationshipSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  relationship: Relationship | null;
  onUpdated: (relationship: Relationship) => void;
  onDeleted: (id: string) => void;
}

export function EditRelationshipSheet({
  open,
  onOpenChange,
  projectSlug,
  relationship,
  onUpdated,
  onDeleted,
}: EditRelationshipSheetProps) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (relationship) {
      setLabel(relationship.label);
      setDescription(relationship.description ?? "");
    }
  }, [relationship]);

  if (!relationship) return null;

  const handleSave = async () => {
    setSaving(true);
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
      onOpenChange(false);
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this relationship?")) return;
    setDeleting(true);
    try {
      await api(`/projects/${projectSlug}/relationships/${relationship.id}`, {
        method: "DELETE",
      });
      onDeleted(relationship.id);
      onOpenChange(false);
    } catch {
      setError("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit Relationship</SheetTitle>
          <SheetDescription>
            {relationship.sourceEntity.name} → {relationship.targetEntity.name}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4 px-4">
          <div className="space-y-2">
            <Label htmlFor="edit-rel-label">Label</Label>
            <Input
              id="edit-rel-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-rel-desc">Description</Label>
            <Textarea
              id="edit-rel-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter className="mt-6 flex justify-between px-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
