"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { Work as WorkBase } from "@loreum/types";
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

type Work = WorkBase & { _count: { chapters: number } };

interface CreateWorkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  onCreated: (work: Work) => void;
}

export function CreateWorkDialog({
  open,
  onOpenChange,
  projectSlug,
  onCreated,
}: CreateWorkDialogProps) {
  const [title, setTitle] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [order, setOrder] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setError(null);

    const orderNum = parseInt(order, 10) || 1;

    try {
      const work = await api<Work>(
        `/projects/${projectSlug}/storyboard/works`,
        {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            synopsis: synopsis.trim() || undefined,
            chronologicalOrder: orderNum,
            releaseOrder: orderNum,
          }),
        },
      );
      setTitle("");
      setSynopsis("");
      setOrder("1");
      onCreated(work);
    } catch {
      setError("Failed to create work");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New work</DialogTitle>
            <DialogDescription>
              Add a work to your story (book, game, screenplay, etc.)
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="work-title">Title</Label>
              <Input
                id="work-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The Fellowship of the Ring"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-order">Order</Label>
              <Input
                id="work-order"
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                min="1"
                className="w-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-synopsis">Synopsis</Label>
              <Textarea
                id="work-synopsis"
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="What is this work about..."
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
