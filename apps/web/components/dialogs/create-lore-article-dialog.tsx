"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import type { LoreArticleSummary as LoreArticle } from "@loreum/types";
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

interface CreateLoreArticleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  onCreated: (article: LoreArticle) => void;
}

export function CreateLoreArticleDialog({
  open,
  onOpenChange,
  projectSlug,
  onCreated,
}: CreateLoreArticleDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const article = await api<LoreArticle>(`/projects/${projectSlug}/lore`, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category: category.trim() || undefined,
        }),
      });
      setTitle("");
      setContent("");
      setCategory("");
      onCreated(article);
    } catch {
      setError("Failed to create article");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New lore article</DialogTitle>
            <DialogDescription>
              Document a piece of your world&apos;s lore
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lore-title">Title</Label>
              <Input
                id="lore-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="The One Ring"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lore-category">Category</Label>
              <Input
                id="lore-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="artifacts, history, magic..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lore-content">Content</Label>
              <Textarea
                id="lore-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write about this piece of lore..."
                rows={6}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
            >
              {submitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
