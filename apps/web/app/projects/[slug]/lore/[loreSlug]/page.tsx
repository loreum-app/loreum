"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { LoreArticle } from "@loreum/types";
import { Button } from "@loreum/ui/button";
import { Input } from "@loreum/ui/input";
import { Textarea } from "@loreum/ui/textarea";
import { Label } from "@loreum/ui/label";
import { Card, CardContent } from "@loreum/ui/card";
import { Markdown } from "@/components/markdown";
import { Pencil, Trash2, Save, X } from "lucide-react";

export default function LoreArticlePage() {
  const params = useParams<{ slug: string; loreSlug: string }>();
  const router = useRouter();
  const [article, setArticle] = useState<LoreArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<LoreArticle>(`/projects/${params.slug}/lore/${params.loreSlug}`)
      .then((a) => {
        setArticle(a);
        setTitle(a.title);
        setContent(a.content);
        setCategory(a.category ?? "");
      })
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [params.slug, params.loreSlug]);

  const handleSave = async () => {
    if (!article) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api<LoreArticle>(
        `/projects/${params.slug}/lore/${article.slug}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
            category: category.trim() || null,
          }),
        },
      );
      setArticle(updated);
      setEditing(false);
      // If slug changed, navigate to new URL
      if (updated.slug !== params.loreSlug) {
        router.replace(`/projects/${params.slug}/lore/${updated.slug}`);
      }
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!article || !confirm("Delete this lore article?")) return;
    try {
      await api(`/projects/${params.slug}/lore/${article.slug}`, {
        method: "DELETE",
      });
      router.push(`/projects/${params.slug}/lore`);
    } catch {
      setError("Failed to delete");
    }
  };

  const handleCancel = () => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
      setCategory(article.category ?? "");
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Article not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {editing ? (
            <div className="flex-1 space-y-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl"
              />
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">
                  Category:
                </Label>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. artifacts, history..."
                  className="w-48"
                />
              </div>
            </div>
          ) : (
            <div>
              <h1>{article.title}</h1>
              {article.category && (
                <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {article.category}
                </span>
              )}
            </div>
          )}
          <div className="flex gap-2 ml-4">
            {editing ? (
              <>
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  <X className="mr-1 h-4 w-4" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="mr-1 h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {/* Content */}
      {editing ? (
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[400px] font-mono text-sm"
        />
      ) : (
        <Card>
          <CardContent>
            <Markdown>{article.content}</Markdown>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {article.loreArticleTags && article.loreArticleTags.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm text-muted-foreground">Tags</h2>
          <div className="flex flex-wrap gap-1.5">
            {article.loreArticleTags.map((link) => (
              <span
                key={link.tag.id}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs"
              >
                {link.tag.color && (
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: link.tag.color }}
                  />
                )}
                {link.tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Connected Entities */}
      {article.entities && article.entities.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm text-muted-foreground">
            Connected Entities
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {article.entities.map((link) =>
              link.entity ? (
                <span
                  key={link.entity.id}
                  className="rounded bg-muted px-2 py-0.5 text-xs"
                >
                  {link.entity.name}
                </span>
              ) : null,
            )}
          </div>
        </div>
      )}
    </div>
  );
}
