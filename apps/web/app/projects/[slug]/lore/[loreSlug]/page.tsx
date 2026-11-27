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
import { Combobox } from "@loreum/ui/combobox";
import { HistorySection } from "@/components/history-section";
import { Breadcrumb } from "@/components/breadcrumb";
import Link from "next/link";
import type { LoreArticleRef } from "@loreum/types";
import { Pencil, Trash2, Save, X, Plus } from "lucide-react";

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

  const [editParentSlug, setEditParentSlug] = useState("");
  const [allArticles, setAllArticles] = useState<LoreArticleRef[]>([]);

  const [editingEntities, setEditingEntities] = useState(false);
  const [selectedEntitySlugs, setSelectedEntitySlugs] = useState<string[]>([]);
  const [savingEntities, setSavingEntities] = useState(false);
  const [allEntities, setAllEntities] = useState<
    { id: string; name: string; slug: string; type: string }[]
  >([]);

  useEffect(() => {
    api<LoreArticle>(`/projects/${params.slug}/lore/${params.loreSlug}`)
      .then((a) => {
        setArticle(a);
        setTitle(a.title);
        setContent(a.content);
        setCategory(a.category ?? "");
        setEditParentSlug(a.parentArticle?.slug ?? "");
      })
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [params.slug, params.loreSlug]);

  useEffect(() => {
    api<{ id: string; name: string; slug: string; type: string }[]>(
      `/projects/${params.slug}/entities`,
    )
      .then(setAllEntities)
      .catch(() => {});
  }, [params.slug]);

  useEffect(() => {
    api<LoreArticleRef[]>(`/projects/${params.slug}/lore`)
      .then(setAllArticles)
      .catch(() => {});
  }, [params.slug]);

  const startEditingEntities = () => {
    setSelectedEntitySlugs(
      (article?.entities ?? [])
        .filter((link) => link.entity)
        .map((link) => link.entity!.slug),
    );
    setEditingEntities(true);
  };

  const handleSaveEntities = async () => {
    if (!article) return;
    setSavingEntities(true);
    try {
      const updated = await api<LoreArticle>(
        `/projects/${params.slug}/lore/${article.slug}`,
        {
          method: "PATCH",
          body: JSON.stringify({ entitySlugs: selectedEntitySlugs }),
        },
      );
      setArticle(updated);
      setEditingEntities(false);
    } catch {
      setError("Failed to update entities");
    } finally {
      setSavingEntities(false);
    }
  };

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
            parentArticleSlug: editParentSlug || null,
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
      setEditParentSlug(article.parentArticle?.slug ?? "");
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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumb
        items={[
          { label: "Lore", href: `/projects/${params.slug}/lore` },
          ...(article.parentArticle
            ? [
                {
                  label: article.parentArticle.title,
                  href: `/projects/${params.slug}/lore/${article.parentArticle.slug}`,
                },
              ]
            : []),
          { label: article.title },
        ]}
      />
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
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Parent:</Label>
                <Combobox
                  options={allArticles
                    .filter((a) => a.slug !== params.loreSlug)
                    .map((a) => ({ value: a.slug, label: a.title }))}
                  value={editParentSlug}
                  onValueChange={(slug) => setEditParentSlug(slug ?? "")}
                  placeholder="None (top-level)"
                  searchPlaceholder="Search articles..."
                />
                {editParentSlug && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-1.5"
                    onClick={() => setEditParentSlug("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
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

      {/* Child Articles */}
      {article.childArticles && article.childArticles.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm text-muted-foreground">Sub-articles</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {article.childArticles.map((child) => (
              <Link
                key={child.id}
                href={`/projects/${params.slug}/lore/${child.slug}`}
                className="rounded-lg border px-3 py-2 text-sm hover:border-foreground/20 transition-colors"
              >
                {child.title}
              </Link>
            ))}
          </div>
        </div>
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
      <div className="mt-6">
        <div className="mb-2 flex items-center gap-2">
          <h2 className="text-sm text-muted-foreground">Connected Entities</h2>
          {!editingEntities && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-1.5"
              onClick={startEditingEntities}
            >
              {article.entities && article.entities.length > 0 ? (
                <Pencil className="h-3 w-3" />
              ) : (
                <>
                  <Plus className="mr-1 h-3 w-3" />
                  <span className="text-xs">Add</span>
                </>
              )}
            </Button>
          )}
        </div>
        {editingEntities ? (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {selectedEntitySlugs.map((slug) => {
                const ent = allEntities.find((e) => e.slug === slug);
                return (
                  <span
                    key={slug}
                    className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs"
                  >
                    {ent?.name ?? slug}
                    <button
                      type="button"
                      className="ml-0.5 hover:text-destructive"
                      onClick={() =>
                        setSelectedEntitySlugs((prev) =>
                          prev.filter((s) => s !== slug),
                        )
                      }
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
            <Combobox
              options={allEntities
                .filter((e) => !selectedEntitySlugs.includes(e.slug))
                .map((e) => ({
                  value: e.slug,
                  label: e.name,
                  sublabel: e.type.toLowerCase(),
                }))}
              value=""
              onValueChange={(slug) => {
                if (slug && !selectedEntitySlugs.includes(slug)) {
                  setSelectedEntitySlugs((prev) => [...prev, slug]);
                }
              }}
              placeholder="Add entity..."
              searchPlaceholder="Search entities..."
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveEntities}
                disabled={savingEntities}
              >
                <Save className="mr-1 h-3 w-3" />
                {savingEntities ? "Saving..." : "Save"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingEntities(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : article.entities && article.entities.length > 0 ? (
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
        ) : (
          <p className="text-sm text-muted-foreground">
            No connected entities.
          </p>
        )}
      </div>

      {/* Change History */}
      <div className="mt-6">
        <HistorySection
          projectSlug={params.slug}
          targetModel="LoreArticle"
          targetId={article.id}
        />
      </div>
    </div>
  );
}
