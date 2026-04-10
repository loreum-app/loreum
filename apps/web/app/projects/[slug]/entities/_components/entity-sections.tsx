"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@loreum/ui/card";
import { Textarea } from "@loreum/ui/textarea";
import { Markdown } from "@/components/markdown";
import {
  ArrowRight,
  ArrowLeftRight,
  Clock,
  ScrollText,
  Network,
} from "lucide-react";

const TYPE_ROUTE: Record<string, string> = {
  CHARACTER: "entities/characters",
  LOCATION: "entities/locations",
  ORGANIZATION: "entities/organizations",
  ITEM: "entities/items",
};

// ── Shared types for entity hub data ──

interface RelEntity {
  id: string;
  name: string;
  slug: string;
  type: string;
}

interface Relationship {
  id: string;
  label: string;
  description: string | null;
  bidirectional: boolean;
  otherEntity: RelEntity;
}

interface TimelineEventLink {
  timelineEvent: {
    id: string;
    name: string;
    date: string;
    significance: string;
  };
}

interface LoreArticleLink {
  loreArticle: {
    id: string;
    title: string;
    slug: string;
    category: string | null;
  };
}

interface TagLink {
  tag: { id: string; name: string; color: string | null };
}

// ── Helper to merge source/target relationships ──

export function mergeRelationships(
  source: {
    id: string;
    label: string;
    description: string | null;
    bidirectional: boolean;
    targetEntity: RelEntity;
  }[],
  target: {
    id: string;
    label: string;
    description: string | null;
    bidirectional: boolean;
    sourceEntity: RelEntity;
  }[],
): Relationship[] {
  const sourceRels = (source ?? []).map((r) => ({
    id: r.id,
    label: r.label,
    description: r.description,
    bidirectional: r.bidirectional,
    otherEntity: r.targetEntity,
  }));
  const sourceIds = new Set(sourceRels.map((r) => r.id));
  const targetRels = (target ?? [])
    .filter((r) => !sourceIds.has(r.id))
    .map((r) => ({
      id: r.id,
      label: r.label,
      description: r.description,
      bidirectional: r.bidirectional,
      otherEntity: r.sourceEntity,
    }));
  return [...sourceRels, ...targetRels];
}

// ── Tags ──

export function EntityTags({ tags }: { tags: TagLink[] }) {
  if (!tags.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {tags.map((et) => (
        <span
          key={et.tag.id}
          className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs"
        >
          {et.tag.color && (
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: et.tag.color }}
            />
          )}
          {et.tag.name}
        </span>
      ))}
    </div>
  );
}

// ── Relationships ──

export function RelationshipsSection({
  relationships,
  projectSlug,
}: {
  relationships: Relationship[];
  projectSlug: string;
}) {
  if (!relationships.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Network className="h-4 w-4" />
          Relationships ({relationships.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {relationships.map((rel) => (
            <div key={rel.id} className="rounded-md border p-3 text-sm">
              <Link
                href={`/projects/${projectSlug}/${TYPE_ROUTE[rel.otherEntity.type] ?? "entities"}/${rel.otherEntity.slug}`}
                className="flex items-center gap-2 hover:underline"
              >
                <span className="font-medium">{rel.otherEntity.name}</span>
                {rel.bidirectional ? (
                  <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="text-muted-foreground">{rel.label}</span>
              </Link>
              {rel.description && (
                <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                  {rel.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Timeline Events ──

export function TimelineSection({
  events,
  projectSlug,
}: {
  events: TimelineEventLink[];
  projectSlug: string;
}) {
  if (!events.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4" />
          Timeline ({events.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {events.map((link) => (
            <Link
              key={link.timelineEvent.id}
              href={`/projects/${projectSlug}/timeline`}
              className="flex items-center justify-between rounded-md p-2 text-sm hover:bg-muted"
            >
              <span className="font-medium">{link.timelineEvent.name}</span>
              <span className="text-xs text-muted-foreground">
                {link.timelineEvent.date}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Lore Articles ──

export function LoreSection({
  articles,
  projectSlug,
}: {
  articles: LoreArticleLink[];
  projectSlug: string;
}) {
  if (!articles.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScrollText className="h-4 w-4" />
          Lore ({articles.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {articles.map((link) => (
            <Link
              key={link.loreArticle.id}
              href={`/projects/${projectSlug}/lore/${link.loreArticle.slug}`}
              className="flex items-center justify-between rounded-md p-2 text-sm hover:bg-muted"
            >
              <span className="font-medium">{link.loreArticle.title}</span>
              {link.loreArticle.category && (
                <span className="text-xs text-muted-foreground">
                  {link.loreArticle.category}
                </span>
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Rich text section (summary, description, backstory, secrets, notes) ──

export function RichTextSection({
  title,
  value,
  editing,
  editValue,
  onEditChange,
  rows = 6,
  placeholder,
  isSummary,
}: {
  title: string;
  value: string | null;
  editing: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  isSummary?: boolean;
}) {
  if (editing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            rows={rows}
            placeholder={placeholder}
          />
        </CardContent>
      </Card>
    );
  }

  if (!value) return null;

  if (isSummary) {
    return (
      <Card>
        <CardContent>
          <Markdown className="text-muted-foreground">{value}</Markdown>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Markdown>{value}</Markdown>
      </CardContent>
    </Card>
  );
}
