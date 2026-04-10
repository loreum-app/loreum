"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Relationship } from "@loreum/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loreum/ui/select";

interface Entity {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface CreateRelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  onCreated: (relationship: Relationship) => void;
  initialSourceSlug?: string;
  initialTargetSlug?: string;
}

export function CreateRelationshipDialog({
  open,
  onOpenChange,
  projectSlug,
  onCreated,
  initialSourceSlug,
  initialTargetSlug,
}: CreateRelationshipDialogProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [sourceSlug, setSourceSlug] = useState(initialSourceSlug ?? "");
  const [targetSlug, setTargetSlug] = useState(initialTargetSlug ?? "");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      api<Entity[]>(`/projects/${projectSlug}/entities`)
        .then(setEntities)
        .catch(() => setEntities([]));
      if (initialSourceSlug) setSourceSlug(initialSourceSlug);
      if (initialTargetSlug) setTargetSlug(initialTargetSlug);
    }
  }, [open, projectSlug, initialSourceSlug, initialTargetSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceSlug || !targetSlug || !label.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const rel = await api<Relationship>(
        `/projects/${projectSlug}/relationships`,
        {
          method: "POST",
          body: JSON.stringify({
            sourceEntitySlug: sourceSlug,
            targetEntitySlug: targetSlug,
            label: label.trim(),
            description: description.trim() || undefined,
          }),
        },
      );
      setSourceSlug("");
      setTargetSlug("");
      setLabel("");
      setDescription("");
      onCreated(rel);
    } catch {
      setError("Failed to create relationship");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New relationship</DialogTitle>
            <DialogDescription>
              Define a connection between two entities
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Source entity</Label>
              <Select
                value={sourceSlug}
                onValueChange={(v) => v && setSourceSlug(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((e) => (
                    <SelectItem key={e.slug} value={e.slug}>
                      {e.name} ({e.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target entity</Label>
              <Select
                value={targetSlug}
                onValueChange={(v) => v && setTargetSlug(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  {entities.map((e) => (
                    <SelectItem key={e.slug} value={e.slug}>
                      {e.name} ({e.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rel-label">Label</Label>
              <Input
                id="rel-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Mentor, Allied with, At war with..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rel-desc">Description (optional)</Label>
              <Textarea
                id="rel-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why this relationship exists, how it works..."
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="submit"
              disabled={
                submitting || !sourceSlug || !targetSlug || !label.trim()
              }
            >
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
