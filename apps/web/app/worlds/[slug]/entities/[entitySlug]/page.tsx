"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@loreum/ui/card";
import { Markdown } from "@/components/markdown";

interface WikiEntity {
  id: string;
  type: string;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  backstory: string | null;
  notes: string | null;
  imageUrl: string | null;
  character?: {
    status: string | null;
    species: string | null;
    age: string | null;
    role: string | null;
  } | null;
  location?: { region: string | null; condition: string | null } | null;
  organization?: {
    ideology: string | null;
    territory: string | null;
    status: string | null;
  } | null;
  sourceRelationships: {
    id: string;
    label: string;
    targetEntity: { name: string; slug: string; type: string };
  }[];
  targetRelationships: {
    id: string;
    label: string;
    sourceEntity: { name: string; slug: string; type: string };
  }[];
  timelineEventEntities: {
    timelineEvent: { id: string; name: string; date: string };
  }[];
  loreArticleEntities: {
    loreArticle: { id: string; title: string; slug: string };
  }[];
  entityTags: { tag: { id: string; name: string; color: string | null } }[];
}

export default function WikiEntityPage() {
  const params = useParams<{ slug: string; entitySlug: string }>();
  const [entity, setEntity] = useState<WikiEntity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<WikiEntity>(`/worlds/${params.slug}/entities/${params.entitySlug}`)
      .then(setEntity)
      .catch(() => setEntity(null))
      .finally(() => setLoading(false));
  }, [params.slug, params.entitySlug]);

  if (loading) return <p className="text-muted-foreground">Loading...</p>;
  if (!entity)
    return <p className="text-muted-foreground">Entity not found.</p>;

  const details: { label: string; value: string | null | undefined }[] = [];
  if (entity.character) {
    if (entity.character.species)
      details.push({ label: "Species", value: entity.character.species });
    if (entity.character.status)
      details.push({ label: "Status", value: entity.character.status });
    if (entity.character.age)
      details.push({ label: "Age", value: entity.character.age });
    if (entity.character.role)
      details.push({ label: "Role", value: entity.character.role });
  }
  if (entity.location) {
    if (entity.location.region)
      details.push({ label: "Region", value: entity.location.region });
    if (entity.location.condition)
      details.push({ label: "Condition", value: entity.location.condition });
  }
  if (entity.organization) {
    if (entity.organization.territory)
      details.push({
        label: "Territory",
        value: entity.organization.territory,
      });
    if (entity.organization.status)
      details.push({ label: "Status", value: entity.organization.status });
  }

  const relationships = [
    ...entity.sourceRelationships.map((r) => ({
      id: r.id,
      label: r.label,
      entity: r.targetEntity,
    })),
    ...entity.targetRelationships.map((r) => ({
      id: r.id,
      label: r.label,
      entity: r.sourceEntity,
    })),
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-xs uppercase text-muted-foreground">{entity.type}</p>
        <h2 className="text-2xl font-bold">{entity.name}</h2>
        {entity.entityTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {entity.entityTags.map(({ tag }) => (
              <span
                key={tag.id}
                className="rounded-full bg-muted px-2 py-0.5 text-xs"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {entity.summary && (
        <p className="text-muted-foreground">{entity.summary}</p>
      )}

      {details.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {details.map((d) => (
                <div key={d.label}>
                  <dt className="text-muted-foreground">{d.label}</dt>
                  <dd className="font-medium">{d.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      {entity.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <Markdown>{entity.description}</Markdown>
          </CardContent>
        </Card>
      )}

      {entity.backstory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Backstory</CardTitle>
          </CardHeader>
          <CardContent>
            <Markdown>{entity.backstory}</Markdown>
          </CardContent>
        </Card>
      )}

      {entity.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Markdown>{entity.notes}</Markdown>
          </CardContent>
        </Card>
      )}

      {relationships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Relationships</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {relationships.map((r) => (
                <Link
                  key={r.id}
                  href={`/worlds/${params.slug}/entities/${r.entity.slug}`}
                  className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-muted"
                >
                  <span className="text-muted-foreground">{r.label}</span>
                  <span className="font-medium">{r.entity.name}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {entity.timelineEventEntities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {entity.timelineEventEntities.map(({ timelineEvent }) => (
                <div
                  key={timelineEvent.id}
                  className="flex justify-between rounded-md p-2 hover:bg-muted"
                >
                  <span>{timelineEvent.name}</span>
                  <span className="text-muted-foreground">
                    {timelineEvent.date}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {entity.loreArticleEntities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lore Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {entity.loreArticleEntities.map(({ loreArticle }) => (
                <Link
                  key={loreArticle.id}
                  href={`/worlds/${params.slug}/lore/${loreArticle.slug}`}
                  className="block rounded-md p-2 text-sm hover:bg-muted"
                >
                  {loreArticle.title}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
