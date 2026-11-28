"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  EntityTags,
  RelationshipsSection,
  TimelineSection,
  LoreSection,
  RichTextSection,
  mergeRelationships,
} from "../../_components/entity-sections";
import { CustomFieldsSection } from "../../_components/custom-fields-section";
import { HistorySection } from "@/components/history-section";
import { DetailPageHeader } from "@/components/detail-page-header";
import {
  EntityFieldsCard,
  type FieldConfig,
} from "@/components/entity-fields-card";
import { Breadcrumb } from "@/components/breadcrumb";

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
    customFields?: Record<string, unknown>;
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
const LOCATION_FIELDS: FieldConfig[] = [
  {
    key: "region",
    label: "Region",
    type: "text",
    placeholder: "e.g. Pacific Northwest",
  },
  {
    key: "condition",
    label: "Condition",
    type: "select",
    capitalize: true,
    options: CONDITION_OPTIONS.map((o) => ({
      value: o,
      label: o.replace(/_/g, " "),
    })),
    placeholder: "Select condition",
  },
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
  // Bumped to refetch after a relationship is edited or deleted.
  const [reloadKey, setReloadKey] = useState(0);
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
  const [editCustomFields, setEditCustomFields] = useState<
    Record<string, string>
  >({});

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
  }, [params.slug, params.entitySlug, router, reloadKey]);

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
    const cf = entity.location?.customFields ?? {};
    setEditCustomFields(
      Object.fromEntries(
        Object.entries(cf).map(([k, v]) => [k, String(v ?? "")]),
      ),
    );
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
              customFields: editCustomFields,
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
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumb
        items={[
          {
            label: "Entities",
            href: `/projects/${params.slug}/entities/locations`,
          },
          {
            label: "Locations",
            href: `/projects/${params.slug}/entities/locations`,
          },
          { label: entity.name },
        ]}
      />
      <DetailPageHeader
        name={entity.name}
        editName={editName}
        onEditNameChange={setEditName}
        editing={editing}
        saving={saving}
        onEdit={startEditing}
        onSave={handleSave}
        onCancel={() => {
          setEditing(false);
          setError(null);
        }}
        onDelete={handleDelete}
        error={error}
      >
        <EntityTags tags={entity.entityTags} />
      </DetailPageHeader>

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

        <EntityFieldsCard
          title="Location Details"
          fields={LOCATION_FIELDS}
          values={
            editing
              ? { region: editRegion, condition: editCondition }
              : {
                  region: entity.location?.region,
                  condition: entity.location?.condition,
                }
          }
          editing={editing}
          onChange={(key, value) => {
            if (key === "region") setEditRegion(value);
            if (key === "condition") setEditCondition(value);
          }}
        />

        <CustomFieldsSection
          projectSlug={params.slug}
          entityType="LOCATION"
          customFields={entity.location?.customFields ?? {}}
          editing={editing}
          editCustomFields={editCustomFields}
          onEditCustomFieldsChange={setEditCustomFields}
        />

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
          onChanged={() => setReloadKey((k) => k + 1)}
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

        <HistorySection
          projectSlug={params.slug}
          targetModel="Entity"
          targetId={entity.id}
        />
      </div>
    </div>
  );
}
