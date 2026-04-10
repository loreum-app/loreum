"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@loreum/ui/button";
import { Input } from "@loreum/ui/input";
import { Label } from "@loreum/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@loreum/ui/card";
import {
  EntityTags,
  RelationshipsSection,
  TimelineSection,
  LoreSection,
  RichTextSection,
  mergeRelationships,
} from "../../_components/entity-sections";
import { Pencil, Save, X, Trash2 } from "lucide-react";

interface FieldSchema {
  key: string;
  label: string;
  type: string;
  options?: string[];
}

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
  item: {
    itemTypeId: string | null;
    fields: Record<string, unknown>;
    itemType: {
      id: string;
      name: string;
      slug: string;
      fieldSchema: FieldSchema[];
    } | null;
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

const TYPE_ROUTE: Record<string, string> = {
  CHARACTER: "entities/characters",
  LOCATION: "entities/locations",
  ORGANIZATION: "entities/organizations",
};

export default function ItemDetailPage() {
  const params = useParams<{
    slug: string;
    typeSlug: string;
    entitySlug: string;
  }>();
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
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  useEffect(() => {
    api<EntityHub>(`/projects/${params.slug}/entities/${params.entitySlug}`)
      .then((data) => {
        if (data.type !== "ITEM") {
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
    const parsed =
      typeof entity.item?.fields === "string"
        ? JSON.parse(entity.item.fields)
        : (entity.item?.fields ?? {});
    setEditFields(
      Object.fromEntries(
        Object.entries(parsed).map(([k, v]) => [k, String(v ?? "")]),
      ),
    );
    setEditing(true);
  };

  const handleSave = async () => {
    if (!entity) return;
    setSaving(true);
    setError(null);
    try {
      const fieldsPayload: Record<string, string> = {};
      for (const [k, v] of Object.entries(editFields))
        fieldsPayload[k] = v.trim();
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
            item: { fields: fieldsPayload },
          }),
        },
      );
      setEntity(updated);
      setEditing(false);
      if (updated.slug !== params.entitySlug)
        router.replace(
          `/projects/${params.slug}/entities/${params.typeSlug}/${updated.slug}`,
        );
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entity || !confirm("Delete this item?")) return;
    try {
      await api(`/projects/${params.slug}/entities/${entity.slug}`, {
        method: "DELETE",
      });
      router.push(`/projects/${params.slug}/entities/${params.typeSlug}`);
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
        <p className="text-muted-foreground">Item not found</p>
      </div>
    );

  const parsedFields =
    typeof entity.item?.fields === "string"
      ? JSON.parse(entity.item.fields)
      : (entity.item?.fields ?? {});
  const fieldEntries = Object.entries(parsedFields).filter(([, v]) => v);
  const rawSchema = entity.item?.itemType?.fieldSchema;
  const schemaArr: FieldSchema[] = Array.isArray(rawSchema)
    ? rawSchema
    : typeof rawSchema === "string"
      ? JSON.parse(rawSchema)
      : [];
  const allRelationships = mergeRelationships(
    entity.sourceRelationships,
    entity.targetRelationships,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {entity.item?.itemType?.name ?? "Item"}
          </span>
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

        {/* Dynamic Item Fields */}
        {editing
          ? schemaArr.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {schemaArr.map((field) => (
                      <div key={field.key} className="space-y-1">
                        <Label>{field.label || field.key}</Label>
                        <Input
                          value={editFields[field.key] ?? ""}
                          onChange={(e) =>
                            setEditFields((prev) => ({
                              ...prev,
                              [field.key]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          : fieldEntries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {fieldEntries.map(([key, value]) => {
                      const schema = schemaArr.find((f) => f.key === key);
                      return (
                        <div key={key}>
                          <dt className="text-muted-foreground">
                            {schema?.label || key}
                          </dt>
                          <dd className="font-medium">{String(value)}</dd>
                        </div>
                      );
                    })}
                  </dl>
                </CardContent>
              </Card>
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
          placeholder="Item history..."
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
