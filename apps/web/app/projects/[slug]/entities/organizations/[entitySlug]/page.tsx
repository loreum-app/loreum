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
import {
  EntityTags,
  RelationshipsSection,
  TimelineSection,
  LoreSection,
  RichTextSection,
  mergeRelationships,
} from "../../_components/entity-sections";
import { Users, Pencil, Save, X, Trash2 } from "lucide-react";

interface OrgMember {
  character: { entity: { id: string; name: string; slug: string } };
  role: string | null;
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
  organization: {
    ideology: string | null;
    territory: string | null;
    status: string | null;
    parentOrgId: string | null;
    parentOrg: { entity: { name: string; slug: string } } | null;
    members: OrgMember[];
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

const STATUS_OPTIONS = ["active", "dissolved", "underground", "emerging"];
const TYPE_ROUTE: Record<string, string> = {
  CHARACTER: "entities/characters",
  LOCATION: "entities/locations",
  ORGANIZATION: "entities/organizations",
  ITEM: "entities/items",
};

export default function OrganizationDetailPage() {
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
  const [editStatus, setEditStatus] = useState("");
  const [editTerritory, setEditTerritory] = useState("");
  const [editIdeology, setEditIdeology] = useState("");

  useEffect(() => {
    api<EntityHub>(`/projects/${params.slug}/entities/${params.entitySlug}`)
      .then((data) => {
        if (data.type !== "ORGANIZATION") {
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
    setEditStatus(entity.organization?.status ?? "");
    setEditTerritory(entity.organization?.territory ?? "");
    setEditIdeology(entity.organization?.ideology ?? "");
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
            organization: {
              status: editStatus || null,
              territory: editTerritory.trim() || null,
              ideology: editIdeology.trim() || null,
            },
          }),
        },
      );
      setEntity(updated);
      setEditing(false);
      if (updated.slug !== params.entitySlug)
        router.replace(
          `/projects/${params.slug}/entities/organizations/${updated.slug}`,
        );
    } catch {
      setError("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entity || !confirm("Delete this organization?")) return;
    try {
      await api(`/projects/${params.slug}/entities/${entity.slug}`, {
        method: "DELETE",
      });
      router.push(`/projects/${params.slug}/entities/organizations`);
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
        <p className="text-muted-foreground">Organization not found</p>
      </div>
    );

  const allRelationships = mergeRelationships(
    entity.sourceRelationships,
    entity.targetRelationships,
  );
  const members = entity.organization?.members ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Organization</span>
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
              <CardTitle className="text-base">Organization Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(v) => v && setEditStatus(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Territory</Label>
                  <Input
                    value={editTerritory}
                    onChange={(e) => setEditTerritory(e.target.value)}
                    placeholder="Territory description"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Ideology</Label>
                  <Textarea
                    value={editIdeology}
                    onChange={(e) => setEditIdeology(e.target.value)}
                    rows={3}
                    placeholder="Core ideology or mission..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          entity.organization && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Organization Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {entity.organization.status && (
                    <div>
                      <dt className="text-muted-foreground">Status</dt>
                      <dd className="font-medium capitalize">
                        {entity.organization.status}
                      </dd>
                    </div>
                  )}
                  {entity.organization.territory && (
                    <div>
                      <dt className="text-muted-foreground">Territory</dt>
                      <dd className="font-medium">
                        {entity.organization.territory}
                      </dd>
                    </div>
                  )}
                  {entity.organization.parentOrg && (
                    <div>
                      <dt className="text-muted-foreground">
                        Parent Organization
                      </dt>
                      <dd className="font-medium">
                        <Link
                          href={`/projects/${params.slug}/entities/organizations/${entity.organization.parentOrg.entity.slug}`}
                          className="hover:underline"
                        >
                          {entity.organization.parentOrg.entity.name}
                        </Link>
                      </dd>
                    </div>
                  )}
                </dl>
                {entity.organization.ideology && (
                  <div className="mt-3 text-sm">
                    <dt className="text-muted-foreground mb-1">Ideology</dt>
                    <dd>
                      <span className="whitespace-pre-wrap">
                        {entity.organization.ideology}
                      </span>
                    </dd>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        )}

        {members.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {members.map((m) => (
                  <Link
                    key={m.character.entity.id}
                    href={`/projects/${params.slug}/entities/characters/${m.character.entity.slug}`}
                    className="flex items-center justify-between rounded-md p-2 text-sm hover:bg-muted"
                  >
                    <span className="font-medium">
                      {m.character.entity.name}
                    </span>
                    {m.role && (
                      <span className="text-xs text-muted-foreground">
                        {m.role}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
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
          placeholder="Organization history..."
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
