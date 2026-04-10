"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Plotline } from "@loreum/types";
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

interface CreatePlotlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  onCreated: (plotline: Plotline) => void;
}

export function CreatePlotlineDialog({
  open,
  onOpenChange,
  projectSlug,
  onCreated,
}: CreatePlotlineDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const plotline = await api<Plotline>(
        `/projects/${projectSlug}/storyboard/plotlines`,
        {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || undefined,
          }),
        },
      );
      setName("");
      setDescription("");
      onCreated(plotline);
    } catch {
      setError("Failed to create plotline");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New plotline</DialogTitle>
            <DialogDescription>
              Define a narrative thread in your story
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plotline-name">Name</Label>
              <Input
                id="plotline-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="The Quest for the Ring"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plotline-desc">Description</Label>
              <Textarea
                id="plotline-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this plotline about..."
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
