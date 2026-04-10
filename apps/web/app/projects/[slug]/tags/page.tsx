"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { Tag as TagItem } from "@loreum/types";
import { Button } from "@loreum/ui/button";
import { CreateTagDialog } from "@/components/dialogs/create-tag-dialog";
import { Plus, Tag, X } from "lucide-react";

export default function TagsPage() {
  const params = useParams<{ slug: string }>();
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    api<TagItem[]>(`/projects/${params.slug}/tags`)
      .then(setTags)
      .catch(() => setTags([]))
      .finally(() => setLoading(false));
  }, [params.slug]);

  const handleCreated = (tag: TagItem) => {
    setTags((prev) =>
      [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setDialogOpen(false);
  };

  const handleDelete = async (name: string) => {
    try {
      await api(`/projects/${params.slug}/tags/${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      setTags((prev) => prev.filter((t) => t.name !== name));
    } catch {
      // ignore
    }
  };

  if (loading) {
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
          <h1>Tags</h1>
          <p className="text-sm text-muted-foreground">
            Organize and categorize content
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          New tag
        </Button>
      </div>

      {tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Tag className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-lg font-medium">No tags yet</p>
          <p className="mb-6 text-sm text-muted-foreground">
            Create tags to organize your world&apos;s content
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            New tag
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm"
            >
              {tag.color && (
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
              )}
              <span>{tag.name}</span>
              <button
                onClick={() => handleDelete(tag.name)}
                className="ml-1 rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <CreateTagDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectSlug={params.slug}
        onCreated={handleCreated}
      />
    </div>
  );
}
