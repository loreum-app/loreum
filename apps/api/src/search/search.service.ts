import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export const SEARCH_KINDS = ["entity", "lore", "timeline", "scene"] as const;
export type SearchKind = (typeof SEARCH_KINDS)[number];

export interface SearchResult {
  kind: SearchKind;
  id: string;
  /** Present for entities, lore articles (scenes and events are id-addressed). */
  slug?: string;
  name: string;
  /** Sub-classification: entity type, lore category, event significance, work title. */
  detail?: string | null;
  excerpt: string | null;
}

export interface SearchOptions {
  q: string;
  types?: readonly SearchKind[];
  limit?: number;
}

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

/** Short window of text around the first case-insensitive match. */
export function excerpt(
  text: string | null | undefined,
  q: string,
  radius = 120,
): string | null {
  if (!text) return null;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1)
    return text.length > radius * 2 ? text.slice(0, radius * 2) + "…" : text;
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + q.length + radius);
  return (
    (start > 0 ? "…" : "") +
    text.slice(start, end) +
    (end < text.length ? "…" : "")
  );
}

/**
 * Cross-content search within one project. Uses case-insensitive substring
 * matching via Prisma; OpenSearch-backed full-text search can replace the
 * internals later without changing the result shape.
 */
@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(
    projectId: string,
    opts: SearchOptions,
  ): Promise<{ results: SearchResult[]; total: number }> {
    const q = opts.q.trim();
    const limit = Math.min(Math.max(opts.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
    if (!q) return { results: [], total: 0 };

    const wants = (k: SearchKind) =>
      !opts.types?.length || opts.types.includes(k);
    const contains = { contains: q, mode: "insensitive" as const };

    const [entities, lore, events, scenes] = await Promise.all([
      wants("entity")
        ? this.prisma.entity.findMany({
            where: {
              projectId,
              OR: [
                { name: contains },
                { summary: contains },
                { description: contains },
                { backstory: contains },
              ],
            },
            select: {
              id: true,
              name: true,
              slug: true,
              type: true,
              summary: true,
              description: true,
              backstory: true,
            },
            orderBy: { name: "asc" },
            take: limit,
          })
        : [],
      wants("lore")
        ? this.prisma.loreArticle.findMany({
            where: {
              projectId,
              OR: [{ title: contains }, { content: contains }],
            },
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
              content: true,
            },
            orderBy: { title: "asc" },
            take: limit,
          })
        : [],
      wants("timeline")
        ? this.prisma.timelineEvent.findMany({
            where: {
              projectId,
              OR: [{ name: contains }, { description: contains }],
            },
            select: {
              id: true,
              name: true,
              date: true,
              significance: true,
              description: true,
            },
            orderBy: { sortOrder: "asc" },
            take: limit,
          })
        : [],
      wants("scene")
        ? this.prisma.scene.findMany({
            where: {
              chapter: { work: { projectId } },
              OR: [
                { title: contains },
                { description: contains },
                { content: contains },
              ],
            },
            select: {
              id: true,
              title: true,
              description: true,
              content: true,
              sequenceNumber: true,
              chapter: {
                select: {
                  id: true,
                  title: true,
                  work: { select: { title: true, slug: true } },
                },
              },
            },
            orderBy: { sequenceNumber: "asc" },
            take: limit,
          })
        : [],
    ]);

    const results: SearchResult[] = [
      ...entities.map((e) => ({
        kind: "entity" as const,
        id: e.id,
        slug: e.slug,
        name: e.name,
        detail: e.type,
        excerpt: excerpt(e.summary ?? e.description ?? e.backstory, q),
      })),
      ...lore.map((a) => ({
        kind: "lore" as const,
        id: a.id,
        slug: a.slug,
        name: a.title,
        detail: a.category,
        excerpt: excerpt(a.content, q),
      })),
      ...events.map((ev) => ({
        kind: "timeline" as const,
        id: ev.id,
        name: ev.name,
        detail: `${ev.date} · ${ev.significance}`,
        excerpt: excerpt(ev.description, q),
      })),
      ...scenes.map((s) => ({
        kind: "scene" as const,
        id: s.id,
        name: s.title ?? `Scene ${s.sequenceNumber}`,
        detail: `${s.chapter.work.title} › ${s.chapter.title}`,
        excerpt: excerpt(s.content ?? s.description, q),
      })),
    ];

    // Name/title hits first, then everything else, stable within groups.
    const lower = q.toLowerCase();
    results.sort((a, b) => {
      const an = a.name.toLowerCase().includes(lower) ? 0 : 1;
      const bn = b.name.toLowerCase().includes(lower) ? 0 : 1;
      return an - bn;
    });

    return { results: results.slice(0, limit), total: results.length };
  }
}
