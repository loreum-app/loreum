"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import { Input } from "@loreum/ui/input";
import { Label } from "@loreum/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@loreum/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loreum/ui/select";
import {
  EntityTags,
  RelationshipsSection,
  TimelineSection,
  LoreSection,
  RichTextSection,
  mergeRelationships,
} from "../../_components/entity-sections";
import { Pencil, Save, X, Trash2 } from "lucide-react";

interface EntityHub {
  id: string;
  name: string;
  slug: string;
  type: string;
  summary: string | null;
  description: string | null;
  backstory: string | null;
  secrets: string | null;
  notes: string | null;
  imageUrl: string | null;
  location: {
    region: string | null;
    condition: string | null;
    mapId: string | null;
  } | null;
  sourceRelationships: {
    id: string;
    label: string;
    description: string | null;
    bidirectional: boolean;
    targetEntity: { id: string; name: string; slug: string; type: string };
  }[];
  targetRelationships: {
    id: string;
    label: string;
    description: string | null;
    bidirectional: boolean;
    sourceEntity: { id: string; name: string; slug: string; type: string };
  }[];
  timelineEventEntities: {
    timelineEvent: {
      id: string;
      name: string;
      date: string;
      significance: string;
    };
  }[];
  loreArticleEntities: {
    loreArticle: {
      id: string;
      title: string;
      slug: string;
      category: string | null;
    };
  }[];
  entityTags: { tag: { id: string; name: string; color: string | null } }[];
}

const CONDITION_OPTIONS = [
  "ruins",
  "partially_restored",
  "functional",
  "fortified",
  "overgrown",
  "contested",
];
const TYPE_ROUTE: Record<string, string> = {
  CHARACTER: "entities/characters",
  LOCATION: "entities/locations",
  ORGANIZATION: "entities/organizations",
  ITEM: "entities/items",
};

export default function LocationDetailPage() {
  const params = useParams<{ slug: string; entitySlug: string }>();
  const router = useRouter();
  const [entity, setEntity] = useState<EntityHub | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBackstory, setEditBackstory] = useState("");
  const [editSecrets, setEditSecrets] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editRegion, setEditRegion] = useState("");
  const [editCondition, setEditCondition] = useState("");

  useEffect(() => {
    api<EntityHub>(`/projects/${params.slug}/entities/${params.entitySlug}`)
      .then((data) => {
        if (data.type !== "LOCATION") {
          router.replace(
            `/projects/${params.slug}/${TYPE_ROUTE[data.type] ?? "entities"}/${data.slug}`,
          );
          return;
        }
        setEntity(data);
      })
      .catch(() => setEntity(null))
      .finally(() => setLoading(false));
  }, [params.slug, params.entitySlug, router]);

  const startEditing = () => {
    if (!entity) return;
    setEditName(entity.name);
    setEditSummary(entity.summary ?? "");
    setEditDescription(entity.description ?? "");
    setEditBackstory(entity.backstory ?? "");
    setEditSecrets(entity.secrets ?? "");
    setEditNotes(entity.notes ?? "");
    setEditRegion(entity.location?.region ?? "");
    setEditCondition(entity.location?.condition ?? "");
    setEditing(true);
  };

  const handleSave = async () => {
    if (!entity) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api<EntityHub>(
        `/projects/${params.slug}/entities/${entity.slug}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: editName.trim(),
            summary: editSummary.trim() || null,
            description: editDescription.trim() || null,
            backstory: editBackstory.trim() || null,
            secrets: editSecrets.trim() || null,
            notes: editNotes.trim() || null,
            location: {
              region: editRegion.trim() || null,
              condition: editCondition || null,
            },
          }),
        },
      );
      setEntity(updated);
      setEditing(false);
      if (updated.slug !== params.entitySlug)
        router.replace(
          `/projects/${params.slug}/entities/locations/${updated.slug}`,
        );
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entity || !confirm("Delete this location?")) return;
    try {
      await api(`/projects/${params.slug}/entities/${entity.slug}`, {
        method: "DELETE",
      });
      router.push(`/projects/${params.slug}/entities/locations`);
    } catch {
      setError("Failed to delete");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  if (!entity)
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Location not found</p>
      </div>
    );

  const allRelationships = mergeRelationships(
    entity.sourceRelationships,
    entity.targetRelationships,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Location</span>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setError(null);
                  }}
                >
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
                <Button size="sm" variant="outline" onClick={startEditing}>
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
        {editing ? (
          <Input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="text-3xl"
          />
        ) : (
          <h1>{entity.name}</h1>
        )}
        <EntityTags tags={entity.entityTags} />
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      <div className="space-y-6">
        <RichTextSection
          title="Summary"
          value={entity.summary}
          editing={editing}
          editValue={editSummary}
          onEditChange={setEditSummary}
          rows={3}
          placeholder="A brief summary..."
          isSummary
        />

        {editing ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Region</Label>
                  <Input
                    value={editRegion}
                    onChange={(e) => setEditRegion(e.target.value)}
                    placeholder="e.g. Pacific Northwest"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Condition</Label>
                  <Select
                    value={editCondition}
                    onValueChange={(v) => v && setEditCondition(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          entity.location &&
          (entity.location.region || entity.location.condition) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Location Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {entity.location.region && (
                    <div>
                      <dt className="text-muted-foreground">Region</dt>
                      <dd className="font-medium">{entity.location.region}</dd>
                    </div>
                  )}
                  {entity.location.condition && (
                    <div>
                      <dt className="text-muted-foreground">Condition</dt>
                      <dd className="font-medium capitalize">
                        {entity.location.condition.replace(/_/g, " ")}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
          )
        )}

        <RichTextSection
          title="Description"
          value={entity.description}
          editing={editing}
          editValue={editDescription}
          onEditChange={setEditDescription}
          placeholder="Detailed description..."
        />
        <RichTextSection
          title="Backstory"
          value={entity.backstory}
          editing={editing}
          editValue={editBackstory}
          onEditChange={setEditBackstory}
          placeholder="Location history..."
        />
        <RelationshipsSection
          relationships={allRelationships}
          projectSlug={params.slug}
        />
        <TimelineSection
          events={entity.timelineEventEntities}
          projectSlug={params.slug}
        />
        <LoreSection
          articles={entity.loreArticleEntities}
          projectSlug={params.slug}
        />
        <RichTextSection
          title="Secrets"
          value={entity.secrets}
          editing={editing}
          editValue={editSecrets}
          onEditChange={setEditSecrets}
          rows={4}
          placeholder="Hidden information..."
        />
        <RichTextSection
          title="Notes"
          value={entity.notes}
          editing={editing}
          editValue={editNotes}
          onEditChange={setEditNotes}
          rows={4}
          placeholder="Personal notes..."
        />
      </div>
    </div>
  );
}
