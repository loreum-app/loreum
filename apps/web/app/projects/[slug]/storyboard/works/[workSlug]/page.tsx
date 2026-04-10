"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import { Input } from "@loreum/ui/input";
import { Textarea } from "@loreum/ui/textarea";
import { Label } from "@loreum/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@loreum/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loreum/ui/select";
import { Combobox } from "@loreum/ui/combobox";
import {
  Pencil,
  Save,
  X,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface SceneCharacter {
  entityId: string;
  role: string | null;
  isPov: boolean;
  entity: { id: string; name: string; slug: string };
}

interface Scene {
  id: string;
  title: string | null;
  sequenceNumber: number;
  description: string | null;
  plotline: { id: string; name: string; slug: string } | null;
  characters: SceneCharacter[];
  location: { id: string; name: string; slug: string } | null;
}

interface Chapter {
  id: string;
  title: string;
  sequenceNumber: number;
  notes: string | null;
  _count: { scenes: number };
}

interface Work {
  id: string;
  title: string;
  slug: string;
  synopsis: string | null;
  status: string;
  chronologicalOrder: number;
  releaseOrder: number;
  chapters: Chapter[];
}

interface EntityOption {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface PlotlineOption {
  id: string;
  name: string;
  slug: string;
}

const STATUSES = [
  { value: "concept", label: "Concept" },
  { value: "outlining", label: "Outlining" },
  { value: "drafting", label: "Drafting" },
  { value: "revision", label: "Revision" },
  { value: "complete", label: "Complete" },
];

export default function WorkDetailPage() {
  const params = useParams<{ slug: string; workSlug: string }>();
  const router = useRouter();
  const [work, setWork] = useState<Work | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editSynopsis, setEditSynopsis] = useState("");
  const [editStatus, setEditStatus] = useState("concept");

  const [addingChapter, setAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");

  // Chapter editing
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editChapterTitle, setEditChapterTitle] = useState("");
  const [editChapterNotes, setEditChapterNotes] = useState("");

  const [expandedChapters, setExpandedChapters] = useState<
    Record<string, Scene[]>
  >({});
  const [loadingScenes, setLoadingScenes] = useState<Record<string, boolean>>(
    {},
  );

  // Scene creation
  const [addingSceneFor, setAddingSceneFor] = useState<string | null>(null);
  const [newSceneTitle, setNewSceneTitle] = useState("");
  const [newSceneDescription, setNewSceneDescription] = useState("");
  const [newScenePlotlineSlug, setNewScenePlotlineSlug] = useState("");
  const [newScenePovSlug, setNewScenePovSlug] = useState("");
  const [newSceneLocationSlug, setNewSceneLocationSlug] = useState("");

  // Scene editing
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editSceneTitle, setEditSceneTitle] = useState("");
  const [editSceneDescription, setEditSceneDescription] = useState("");
  const [editScenePlotlineSlug, setEditScenePlotlineSlug] = useState("");
  const [editScenePovSlug, setEditScenePovSlug] = useState("");
  const [editSceneLocationSlug, setEditSceneLocationSlug] = useState("");

  // Reference data
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [plotlines, setPlotlines] = useState<PlotlineOption[]>([]);

  useEffect(() => {
    api<Work>(`/projects/${params.slug}/storyboard/works/${params.workSlug}`)
      .then(setWork)
      .catch(() => setWork(null))
      .finally(() => setLoading(false));

    api<EntityOption[]>(`/projects/${params.slug}/entities`)
      .then(setEntities)
      .catch(() => {});
    api<PlotlineOption[]>(`/projects/${params.slug}/storyboard/plotlines`)
      .then(setPlotlines)
      .catch(() => {});
  }, [params.slug, params.workSlug]);

  const characters = entities.filter((e) => e.type === "CHARACTER");
  const locations = entities.filter((e) => e.type === "LOCATION");

  const startEditing = () => {
    if (!work) return;
    setEditTitle(work.title);
    setEditSynopsis(work.synopsis ?? "");
    setEditStatus(work.status);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!work) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api<Work>(
        `/projects/${params.slug}/storyboard/works/${work.slug}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: editTitle.trim(),
            synopsis: editSynopsis.trim() || null,
            status: editStatus,
          }),
        },
      );
      setWork(updated);
      setEditing(false);
      if (updated.slug !== params.workSlug) {
        router.replace(
          `/projects/${params.slug}/storyboard/works/${updated.slug}`,
        );
      }
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!work || !confirm("Delete this work and all its chapters?")) return;
    try {
      await api(`/projects/${params.slug}/storyboard/works/${work.slug}`, {
        method: "DELETE",
      });
      router.push(`/projects/${params.slug}/storyboard`);
    } catch {
      setError("Failed to delete");
    }
  };

  const handleAddChapter = async () => {
    if (!work || !newChapterTitle.trim()) return;
    try {
      const chapter = await api<Chapter>(
        `/projects/${params.slug}/storyboard/works/${work.slug}/chapters`,
        {
          method: "POST",
          body: JSON.stringify({
            title: newChapterTitle.trim(),
            sequenceNumber: (work.chapters?.length ?? 0) + 1,
          }),
        },
      );
      setWork((prev) =>
        prev
          ? {
              ...prev,
              chapters: [...(prev.chapters ?? []), chapter].sort(
                (a, b) => a.sequenceNumber - b.sequenceNumber,
              ),
            }
          : prev,
      );
      setNewChapterTitle("");
      setAddingChapter(false);
    } catch {
      setError("Failed to add chapter");
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("Delete this chapter and all its scenes?")) return;
    try {
      await api(`/projects/${params.slug}/storyboard/chapters/${chapterId}`, {
        method: "DELETE",
      });
      setWork((prev) =>
        prev
          ? {
              ...prev,
              chapters: prev.chapters.filter((c) => c.id !== chapterId),
            }
          : prev,
      );
      setExpandedChapters((prev) => {
        const next = { ...prev };
        delete next[chapterId];
        return next;
      });
    } catch {
      setError("Failed to delete chapter");
    }
  };

  const startEditingChapter = (chapter: Chapter) => {
    setEditingChapterId(chapter.id);
    setEditChapterTitle(chapter.title);
    setEditChapterNotes(chapter.notes ?? "");
  };

  const handleSaveChapter = async (chapterId: string) => {
    try {
      const updated = await api<Chapter>(
        `/projects/${params.slug}/storyboard/chapters/${chapterId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: editChapterTitle.trim(),
            notes: editChapterNotes.trim() || null,
          }),
        },
      );
      setWork((prev) =>
        prev
          ? {
              ...prev,
              chapters: prev.chapters.map((c) =>
                c.id === chapterId ? updated : c,
              ),
            }
          : prev,
      );
      setEditingChapterId(null);
    } catch {
      setError("Failed to save chapter");
    }
  };

  const startEditingScene = (scene: Scene) => {
    setEditingSceneId(scene.id);
    setEditSceneTitle(scene.title ?? "");
    setEditSceneDescription(scene.description ?? "");
    setEditScenePlotlineSlug(scene.plotline?.slug ?? "");
    setEditScenePovSlug(scene.characters?.find((c) => c.isPov)?.entity.slug ?? "");
    setEditSceneLocationSlug(scene.location?.slug ?? "");
  };

  const handleSaveScene = async (chapterId: string, sceneId: string) => {
    try {
      const updated = await api<Scene>(
        `/projects/${params.slug}/storyboard/scenes/${sceneId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: editSceneTitle.trim() || null,
            description: editSceneDescription.trim() || null,
            plotlineSlug: editScenePlotlineSlug || null,
            povCharacterSlug: editScenePovSlug || null,
            locationSlug: editSceneLocationSlug || null,
          }),
        },
      );
      setExpandedChapters((prev) => ({
        ...prev,
        [chapterId]: (prev[chapterId] ?? []).map((s) =>
          s.id === sceneId ? updated : s,
        ),
      }));
      setEditingSceneId(null);
    } catch {
      setError("Failed to save scene");
    }
  };

  const toggleChapter = async (chapterId: string) => {
    if (expandedChapters[chapterId]) {
      setExpandedChapters((prev) => {
        const next = { ...prev };
        delete next[chapterId];
        return next;
      });
      return;
    }
    setLoadingScenes((prev) => ({ ...prev, [chapterId]: true }));
    try {
      const scenes = await api<Scene[]>(
        `/projects/${params.slug}/storyboard/scenes?chapterId=${chapterId}`,
      );
      setExpandedChapters((prev) => ({ ...prev, [chapterId]: scenes }));
    } catch {
      setExpandedChapters((prev) => ({ ...prev, [chapterId]: [] }));
    } finally {
      setLoadingScenes((prev) => ({ ...prev, [chapterId]: false }));
    }
  };

  const resetSceneForm = () => {
    setAddingSceneFor(null);
    setNewSceneTitle("");
    setNewSceneDescription("");
    setNewScenePlotlineSlug("");
    setNewScenePovSlug("");
    setNewSceneLocationSlug("");
  };

  const handleAddScene = async (chapterId: string) => {
    const scenes = expandedChapters[chapterId] ?? [];
    try {
      const scene = await api<Scene>(
        `/projects/${params.slug}/storyboard/scenes`,
        {
          method: "POST",
          body: JSON.stringify({
            chapterId,
            title: newSceneTitle.trim() || undefined,
            description: newSceneDescription.trim() || undefined,
            plotlineSlug: newScenePlotlineSlug || undefined,
            povCharacterSlug: newScenePovSlug || undefined,
            locationSlug: newSceneLocationSlug || undefined,
            sequenceNumber: scenes.length + 1,
          }),
        },
      );
      setExpandedChapters((prev) => ({
        ...prev,
        [chapterId]: [...(prev[chapterId] ?? []), scene],
      }));
      resetSceneForm();
    } catch {
      setError("Failed to add scene");
    }
  };

  const handleDeleteScene = async (chapterId: string, sceneId: string) => {
    if (!confirm("Delete this scene?")) return;
    try {
      await api(`/projects/${params.slug}/storyboard/scenes/${sceneId}`, {
        method: "DELETE",
      });
      setExpandedChapters((prev) => ({
        ...prev,
        [chapterId]: (prev[chapterId] ?? []).filter((s) => s.id !== sceneId),
      }));
    } catch {
      setError("Failed to delete scene");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  if (!work)
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Work not found</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          {editing ? (
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>
              <div className="w-48 space-y-1">
                <Label>Status</Label>
                <Select
                  value={editStatus}
                  onValueChange={(v) => v && setEditStatus(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div>
              <h1>{work.title}</h1>
              <p className="text-sm text-muted-foreground">
                {STATUSES.find((s) => s.value === work.status)?.label ??
                  work.status}
              </p>
            </div>
          )}
          <div className="ml-4 flex gap-2">
            {editing ? (
              <>
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  <X className="mr-1 h-4 w-4" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="mr-1 h-4 w-4" />{" "}
                  {saving ? "Saving..." : "Save"}
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={startEditing}>
                  <Pencil className="mr-1 h-4 w-4" /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDelete}>
                  <Trash2 className="mr-1 h-4 w-4" /> Delete
                </Button>
              </>
            )}
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="space-y-6">
        {editing ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Synopsis</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editSynopsis}
                onChange={(e) => setEditSynopsis(e.target.value)}
                rows={4}
                placeholder="A summary of the work..."
              />
            </CardContent>
          </Card>
        ) : (
          work.synopsis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Synopsis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{work.synopsis}</p>
              </CardContent>
            </Card>
          )
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Chapters ({work.chapters?.length ?? 0})
              </CardTitle>
              {!addingChapter && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddingChapter(true)}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add chapter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {addingChapter && (
              <div className="mb-4 flex items-center gap-2">
                <Input
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Chapter title"
                  onKeyDown={(e) => e.key === "Enter" && handleAddChapter()}
                />
                <Button size="sm" onClick={handleAddChapter}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAddingChapter(false);
                    setNewChapterTitle("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {(!work.chapters || work.chapters.length === 0) &&
            !addingChapter ? (
              <p className="text-sm text-muted-foreground">No chapters yet.</p>
            ) : (
              <div className="space-y-2">
                {(work.chapters ?? []).map((chapter) => (
                  <div key={chapter.id} className="rounded-lg border">
                    {editingChapterId === chapter.id ? (
                      <div
                        className="space-y-2 p-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="space-y-1">
                          <Label className="text-xs">Title</Label>
                          <Input
                            value={editChapterTitle}
                            onChange={(e) =>
                              setEditChapterTitle(e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Notes</Label>
                          <Textarea
                            value={editChapterNotes}
                            onChange={(e) =>
                              setEditChapterNotes(e.target.value)
                            }
                            rows={2}
                            placeholder="Chapter notes..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveChapter(chapter.id)}
                          >
                            <Save className="mr-1 h-3 w-3" /> Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingChapterId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="flex cursor-pointer items-center gap-2 p-3 hover:bg-muted/50"
                        onClick={() => toggleChapter(chapter.id)}
                      >
                        {expandedChapters[chapter.id] ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {chapter.sequenceNumber}.
                        </span>
                        <span className="flex-1 text-sm">{chapter.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {chapter._count?.scenes ?? 0} scenes
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingChapter(chapter);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChapter(chapter.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {expandedChapters[chapter.id] && (
                      <div className="border-t px-3 py-3">
                        {chapter.notes && (
                          <p className="mb-2 text-xs text-muted-foreground">
                            <span className="font-medium">Notes:</span>{" "}
                            {chapter.notes}
                          </p>
                        )}

                        {loadingScenes[chapter.id] ? (
                          <p className="text-xs text-muted-foreground">
                            Loading scenes...
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {(expandedChapters[chapter.id] ?? []).map(
                              (scene) =>
                                editingSceneId === scene.id ? (
                                  <div
                                    key={scene.id}
                                    className="space-y-2 rounded border border-dashed p-3 text-xs"
                                  >
                                    <div className="space-y-1">
                                      <Label className="text-xs">Title</Label>
                                      <Input
                                        value={editSceneTitle}
                                        onChange={(e) =>
                                          setEditSceneTitle(e.target.value)
                                        }
                                        placeholder="Scene title"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">
                                        Description
                                      </Label>
                                      <Textarea
                                        value={editSceneDescription}
                                        onChange={(e) =>
                                          setEditSceneDescription(
                                            e.target.value,
                                          )
                                        }
                                        rows={2}
                                        placeholder="What happens..."
                                      />
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-xs">
                                          Plotline
                                        </Label>
                                        <Combobox
                                          options={plotlines.map((p) => ({
                                            value: p.slug,
                                            label: p.name,
                                          }))}
                                          value={editScenePlotlineSlug}
                                          onValueChange={
                                            setEditScenePlotlineSlug
                                          }
                                          placeholder="None"
                                          searchPlaceholder="Search plotlines..."
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">
                                          POV Character
                                        </Label>
                                        <Combobox
                                          options={entities
                                            .filter(
                                              (e) => e.type === "CHARACTER",
                                            )
                                            .map((e) => ({
                                              value: e.slug,
                                              label: e.name,
                                            }))}
                                          value={editScenePovSlug}
                                          onValueChange={setEditScenePovSlug}
                                          placeholder="None"
                                          searchPlaceholder="Search characters..."
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs">
                                          Location
                                        </Label>
                                        <Combobox
                                          options={entities
                                            .filter(
                                              (e) => e.type === "LOCATION",
                                            )
                                            .map((e) => ({
                                              value: e.slug,
                                              label: e.name,
                                            }))}
                                          value={editSceneLocationSlug}
                                          onValueChange={
                                            setEditSceneLocationSlug
                                          }
                                          placeholder="None"
                                          searchPlaceholder="Search locations..."
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleSaveScene(chapter.id, scene.id)
                                        }
                                      >
                                        <Save className="mr-1 h-3 w-3" /> Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingSceneId(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    key={scene.id}
                                    className="flex items-start justify-between rounded bg-muted/50 p-2 text-xs"
                                  >
                                    <div className="space-y-0.5">
                                      <p className="font-medium">
                                        {scene.title ??
                                          `Scene ${scene.sequenceNumber}`}
                                      </p>
                                      {scene.description && (
                                        <p className="text-muted-foreground line-clamp-2">
                                          {scene.description}
                                        </p>
                                      )}
                                      <div className="flex flex-wrap gap-2 text-muted-foreground">
                                        {scene.plotline && (
                                          <Link
                                            href={`/projects/${params.slug}/storyboard/plotlines/${scene.plotline.slug}`}
                                            className="hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            {scene.plotline.name}
                                          </Link>
                                        )}
                                        {scene.characters?.filter((c) => c.isPov).map((c) => (
                                          <Link
                                            key={c.entityId}
                                            href={`/projects/${params.slug}/entities/characters/${c.entity.slug}`}
                                            className="hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            POV: {c.entity.name}
                                          </Link>
                                        ))}
                                        {scene.location && (
                                          <Link
                                            href={`/projects/${params.slug}/entities/locations/${scene.location.slug}`}
                                            className="hover:underline"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            @ {scene.location.name}
                                          </Link>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                                        onClick={() => startEditingScene(scene)}
                                      >
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                                        onClick={() =>
                                          handleDeleteScene(
                                            chapter.id,
                                            scene.id,
                                          )
                                        }
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ),
                            )}

                            {addingSceneFor === chapter.id ? (
                              <div className="mt-2 space-y-3 rounded-md border border-dashed p-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">Title</Label>
                                  <Input
                                    value={newSceneTitle}
                                    onChange={(e) =>
                                      setNewSceneTitle(e.target.value)
                                    }
                                    placeholder="Scene title (optional)"
                                    autoFocus
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Description</Label>
                                  <Textarea
                                    value={newSceneDescription}
                                    onChange={(e) =>
                                      setNewSceneDescription(e.target.value)
                                    }
                                    placeholder="What happens in this scene..."
                                    rows={2}
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Plotline</Label>
                                    <Combobox
                                      options={plotlines.map((p) => ({
                                        value: p.slug,
                                        label: p.name,
                                      }))}
                                      value={newScenePlotlineSlug}
                                      onValueChange={setNewScenePlotlineSlug}
                                      placeholder="None"
                                      searchPlaceholder="Search plotlines..."
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">
                                      POV Character
                                    </Label>
                                    <Combobox
                                      options={characters.map((e) => ({
                                        value: e.slug,
                                        label: e.name,
                                        sublabel: e.type,
                                      }))}
                                      value={newScenePovSlug}
                                      onValueChange={setNewScenePovSlug}
                                      placeholder="None"
                                      searchPlaceholder="Search characters..."
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Location</Label>
                                    <Combobox
                                      options={locations.map((e) => ({
                                        value: e.slug,
                                        label: e.name,
                                        sublabel: e.type,
                                      }))}
                                      value={newSceneLocationSlug}
                                      onValueChange={setNewSceneLocationSlug}
                                      placeholder="None"
                                      searchPlaceholder="Search locations..."
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleAddScene(chapter.id)}
                                  >
                                    Add
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={resetSceneForm}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs text-muted-foreground"
                                onClick={() => setAddingSceneFor(chapter.id)}
                              >
                                <Plus className="mr-1 h-3 w-3" /> Add scene
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
