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
import { Pencil, Save, X, Trash2, Plus } from "lucide-react";

interface PlotPoint {
  id: string;
  sequenceNumber: number;
  title: string;
  description: string | null;
  label: string | null;
  scene: { id: string; title: string | null } | null;
  timelineEvent: { id: string; name: string; date: string } | null;
  entity: { id: string; name: string; slug: string; type: string } | null;
}

interface Plotline {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thematicStatement: string | null;
  sortOrder: number;
  parentPlotline: { id: string; name: string; slug: string } | null;
  childPlotlines: { id: string; name: string; slug: string }[];
  plotPoints: PlotPoint[];
}

interface EntityOption {
  id: string;
  name: string;
  slug: string;
}

interface TimelineOption {
  id: string;
  name: string;
  date: string;
}

const PLOT_POINT_TYPES = [
  "hook",
  "inciting incident",
  "first plot point",
  "rising action",
  "midpoint",
  "second plot point",
  "crisis",
  "climax",
  "resolution",
  "denouement",
];

export default function PlotlineDetailPage() {
  const params = useParams<{ slug: string; plotlineSlug: string }>();
  const router = useRouter();
  const [plotline, setPlotline] = useState<Plotline | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editThematic, setEditThematic] = useState("");

  // New plot point form
  const [addingPoint, setAddingPoint] = useState(false);
  const [newPointTitle, setNewPointTitle] = useState("");
  const [newPointDescription, setNewPointDescription] = useState("");
  const [newPointLabel, setNewPointLabel] = useState("");
  const [newPointEntitySlug, setNewPointEntitySlug] = useState("");
  const [newPointTimelineEventId, setNewPointTimelineEventId] = useState("");
  const [creatingPoint, setCreatingPoint] = useState(false);

  // Edit plot point
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [editPointTitle, setEditPointTitle] = useState("");
  const [editPointDescription, setEditPointDescription] = useState("");
  const [editPointLabel, setEditPointLabel] = useState("");
  const [editPointEntitySlug, setEditPointEntitySlug] = useState("");
  const [editPointTimelineEventId, setEditPointTimelineEventId] = useState("");

  // Reference data for dropdowns
  const [entities, setEntities] = useState<EntityOption[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineOption[]>([]);

  useEffect(() => {
    api<Plotline>(
      `/projects/${params.slug}/storyboard/plotlines/${params.plotlineSlug}`,
    )
      .then(setPlotline)
      .catch(() => setPlotline(null))
      .finally(() => setLoading(false));

    // Load reference data for dropdowns
    api<EntityOption[]>(`/projects/${params.slug}/entities`)
      .then(setEntities)
      .catch(() => {});
    api<TimelineOption[]>(`/projects/${params.slug}/timeline`)
      .then(setTimelineEvents)
      .catch(() => {});
  }, [params.slug, params.plotlineSlug]);

  const startEditing = () => {
    if (!plotline) return;
    setEditName(plotline.name);
    setEditDescription(plotline.description ?? "");
    setEditThematic(plotline.thematicStatement ?? "");
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!plotline) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api<Plotline>(
        `/projects/${params.slug}/storyboard/plotlines/${plotline.slug}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: editName.trim(),
            description: editDescription.trim() || null,
            thematicStatement: editThematic.trim() || null,
          }),
        },
      );
      setPlotline(updated);
      setEditing(false);
      if (updated.slug !== params.plotlineSlug) {
        router.replace(
          `/projects/${params.slug}/storyboard/plotlines/${updated.slug}`,
        );
      }
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!plotline || !confirm("Delete this plotline?")) return;
    try {
      await api(
        `/projects/${params.slug}/storyboard/plotlines/${plotline.slug}`,
        { method: "DELETE" },
      );
      router.push(`/projects/${params.slug}/storyboard`);
    } catch {
      setError("Failed to delete");
    }
  };

  const handleAddPoint = async () => {
    if (!plotline || !newPointTitle.trim()) return;
    setCreatingPoint(true);
    try {
      const point = await api<PlotPoint>(
        `/projects/${params.slug}/storyboard/plotlines/${plotline.slug}/points`,
        {
          method: "POST",
          body: JSON.stringify({
            title: newPointTitle.trim(),
            description: newPointDescription.trim() || undefined,
            label: newPointLabel || undefined,
            entitySlug: newPointEntitySlug || undefined,
            timelineEventId: newPointTimelineEventId || undefined,
            sequenceNumber: plotline.plotPoints.length + 1,
          }),
        },
      );
      setPlotline({
        ...plotline,
        plotPoints: [...plotline.plotPoints, point],
      });
      setNewPointTitle("");
      setNewPointDescription("");
      setNewPointLabel("");
      setNewPointEntitySlug("");
      setNewPointTimelineEventId("");
      setAddingPoint(false);
    } catch {
      setError("Failed to add plot point");
    } finally {
      setCreatingPoint(false);
    }
  };

  const startEditingPoint = (point: PlotPoint) => {
    setEditingPointId(point.id);
    setEditPointTitle(point.title);
    setEditPointDescription(point.description ?? "");
    setEditPointLabel(point.label ?? "");
    setEditPointEntitySlug(point.entity?.slug ?? "");
    setEditPointTimelineEventId(point.timelineEvent?.id ?? "");
  };

  const handleSavePoint = async (pointId: string) => {
    if (!plotline) return;
    try {
      const updated = await api<PlotPoint>(
        `/projects/${params.slug}/storyboard/points/${pointId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: editPointTitle.trim(),
            description: editPointDescription.trim() || null,
            label: editPointLabel || null,
            entitySlug: editPointEntitySlug || null,
            timelineEventId: editPointTimelineEventId || null,
          }),
        },
      );
      setPlotline({
        ...plotline,
        plotPoints: plotline.plotPoints.map((p) =>
          p.id === pointId ? updated : p,
        ),
      });
      setEditingPointId(null);
    } catch {
      setError("Failed to save plot point");
    }
  };

  const handleDeletePoint = async (pointId: string) => {
    if (!plotline) return;
    try {
      await api(`/projects/${params.slug}/storyboard/points/${pointId}`, {
        method: "DELETE",
      });
      setPlotline({
        ...plotline,
        plotPoints: plotline.plotPoints.filter((p) => p.id !== pointId),
      });
    } catch {
      setError("Failed to delete plot point");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!plotline) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Plotline not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          {editing ? (
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <h1>{plotline.name}</h1>
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
        {/* Description */}
        {editing ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                placeholder="What is this plotline about?"
              />
            </CardContent>
          </Card>
        ) : (
          plotline.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  {plotline.description}
                </p>
              </CardContent>
            </Card>
          )
        )}

        {/* Thematic Statement */}
        {editing ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thematic Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={editThematic}
                onChange={(e) => setEditThematic(e.target.value)}
                rows={3}
                placeholder="The central theme or message..."
              />
            </CardContent>
          </Card>
        ) : (
          plotline.thematicStatement && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thematic Statement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm italic leading-relaxed text-muted-foreground">
                  {plotline.thematicStatement}
                </p>
              </CardContent>
            </Card>
          )
        )}

        {/* Plot Points */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Plot Points ({plotline.plotPoints.length})
            </CardTitle>
            {!addingPoint && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAddingPoint(true)}
              >
                <Plus className="mr-1 h-4 w-4" /> Add point
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {plotline.plotPoints.length === 0 && !addingPoint && (
              <p className="text-sm text-muted-foreground">
                No plot points yet. Add cards to outline this plotline.
              </p>
            )}
            <div className="space-y-2">
              {plotline.plotPoints.map((point, i) =>
                editingPointId === point.id ? (
                  <div
                    key={point.id}
                    className="space-y-2 rounded-md border border-dashed p-3"
                  >
                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={editPointTitle}
                        onChange={(e) => setEditPointTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={editPointDescription}
                        onChange={(e) =>
                          setEditPointDescription(e.target.value)
                        }
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={editPointLabel}
                          onValueChange={(v) => setEditPointLabel(v ?? "")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type..." />
                          </SelectTrigger>
                          <SelectContent>
                            {PLOT_POINT_TYPES.map((l) => (
                              <SelectItem key={l} value={l}>
                                {l}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Entity</Label>
                        <Combobox
                          options={entities.map((e) => ({
                            value: e.slug,
                            label: e.name,
                          }))}
                          value={editPointEntitySlug}
                          onValueChange={setEditPointEntitySlug}
                          placeholder="Link an entity..."
                          searchPlaceholder="Search entities..."
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Timeline Event</Label>
                      <Combobox
                        options={timelineEvents.map((e) => ({
                          value: e.id,
                          label: e.name,
                          sublabel: e.date,
                        }))}
                        value={editPointTimelineEventId}
                        onValueChange={setEditPointTimelineEventId}
                        placeholder="Link a timeline event..."
                        searchPlaceholder="Search events..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSavePoint(point.id)}
                      >
                        <Save className="mr-1 h-3 w-3" /> Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingPointId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={point.id}
                    className="flex items-start gap-3 rounded-md border p-3"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {point.title}
                        </span>
                        {point.label && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {point.label}
                          </span>
                        )}
                      </div>
                      {point.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {point.description}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {point.entity && (
                          <Link
                            href={`/projects/${params.slug}/entities/${{ CHARACTER: "characters", LOCATION: "locations", ORGANIZATION: "organizations" }[point.entity.type] ?? point.entity.type.toLowerCase()}/${point.entity.slug}`}
                            className="hover:underline"
                          >
                            {point.entity.name}
                          </Link>
                        )}
                        {point.timelineEvent && (
                          <span>
                            {point.timelineEvent.name} (
                            {point.timelineEvent.date})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => startEditingPoint(point)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeletePoint(point.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ),
              )}
            </div>

            {addingPoint && (
              <div className="mt-3 space-y-3 rounded-md border border-dashed p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Title</Label>
                  <Input
                    placeholder="Plot point title"
                    value={newPointTitle}
                    onChange={(e) => setNewPointTitle(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Textarea
                    placeholder="Details..."
                    value={newPointDescription}
                    onChange={(e) => setNewPointDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={newPointLabel}
                      onValueChange={(v) => setNewPointLabel(v ?? "")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PLOT_POINT_TYPES.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Entity</Label>
                    <Combobox
                      options={entities.map((e) => ({
                        value: e.slug,
                        label: e.name,
                      }))}
                      value={newPointEntitySlug}
                      onValueChange={setNewPointEntitySlug}
                      placeholder="Link an entity..."
                      searchPlaceholder="Search entities..."
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Timeline Event</Label>
                  <Combobox
                    options={timelineEvents.map((e) => ({
                      value: e.id,
                      label: e.name,
                      sublabel: e.date,
                    }))}
                    value={newPointTimelineEventId}
                    onValueChange={setNewPointTimelineEventId}
                    placeholder="Link a timeline event..."
                    searchPlaceholder="Search events..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddPoint}
                    disabled={creatingPoint || !newPointTitle.trim()}
                  >
                    {creatingPoint ? "Adding..." : "Add"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setAddingPoint(false);
                      setNewPointTitle("");
                      setNewPointDescription("");
                      setNewPointLabel("");
                      setNewPointEntitySlug("");
                      setNewPointTimelineEventId("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parent Plotline */}
        {plotline.parentPlotline && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parent Plotline</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/projects/${params.slug}/storyboard/plotlines/${plotline.parentPlotline.slug}`}
                className="text-sm hover:underline"
              >
                {plotline.parentPlotline.name}
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Child Plotlines */}
        {plotline.childPlotlines.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Sub-Plotlines ({plotline.childPlotlines.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {plotline.childPlotlines.map((child) => (
                  <Link
                    key={child.id}
                    href={`/projects/${params.slug}/storyboard/plotlines/${child.slug}`}
                    className="block rounded-md p-2 text-sm hover:bg-muted"
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
