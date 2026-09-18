"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Relationship as FullRelationship } from "@loreum/types";
import { EditRelationshipDialog } from "@/components/edit-relationship-dialog";
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

/**
 * Owns the edit dialog so every entity page gets relationship editing without
 * repeating the wiring. Tells the parent to refetch on change: the entity's
 * relationships live in the parent's fetched state.
 */
export function RelationshipsSection({
  relationships,
  projectSlug,
  onChanged,
}: {
  relationships: Relationship[];
  projectSlug: string;
  /** Called after an edit or delete so the page can refetch the entity. */
  onChanged?: () => void;
}) {
  const [editing, setEditing] = useState<FullRelationship | null>(null);

  // The entity payload carries a flattened relationship (just the other end),
  // while the dialog needs the full record, so fetch it on demand.
  const open = async (rel: Relationship) => {
    try {
      setEditing(
        await api<FullRelationship>(
          `/projects/${projectSlug}/relationships/${rel.id}`,
        ),
      );
    } catch {
      setEditing(null);
    }
  };

  return (
    <>
      <RelationshipList
        relationships={relationships}
        projectSlug={projectSlug}
        onEdit={open}
      />
      <EditRelationshipDialog
        open={editing !== null}
        onOpenChange={(isOpen) => !isOpen && setEditing(null)}
        projectSlug={projectSlug}
        relationship={editing}
        onUpdated={() => {
          setEditing(null);
          onChanged?.();
        }}
        onDeleted={() => {
          setEditing(null);
          onChanged?.();
        }}
      />
    </>
  );
}

function RelationshipList({
  relationships,
  projectSlug,
  onEdit,
}: {
  relationships: Relationship[];
  projectSlug: string;
  onEdit: (relationship: Relationship) => void;
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
              {/*
               * Two separate targets: the name goes to the other entity, the
               * label opens this relationship. They used to share one link, so
               * clicking the label navigated away instead of editing.
               */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/projects/${projectSlug}/${TYPE_ROUTE[rel.otherEntity.type] ?? "entities"}/${rel.otherEntity.slug}`}
                  className="font-medium hover:underline"
                >
                  {rel.otherEntity.name}
                </Link>
                {rel.bidirectional ? (
                  <ArrowLeftRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                ) : (
                  <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                )}
                <button
                  type="button"
                  onClick={() => onEdit(rel)}
                  className="text-muted-foreground hover:text-foreground hover:underline"
                >
                  {rel.label}
                </button>
              </div>
              {rel.description && (
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
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
