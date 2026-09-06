import { NotFoundException } from "@nestjs/common";
import { z } from "zod";
import { SearchService, SearchResult } from "../../search/search.service";
import { EntitiesService } from "../../entities/entities.service";
import { LoreService } from "../../lore/lore.service";
import { TimelineService } from "../../timeline/timeline.service";
import { StoryboardService } from "../../storyboard/storyboard.service";
import { McpAuthContext } from "../../oauth/oauth.types";
import { ToolRegistrar, structuredResult } from "../tool-utils";

/**
 * ChatGPT connector contract. ChatGPT's regular connectors and deep research
 * only use two tools, named exactly `search` and `fetch`, and require their
 * results as `structuredContent` mirrored in text:
 *   search → { results: [{ id, title, url }] }
 *   fetch  → { id, title, text, url, metadata }
 * Ids are opaque to the client; ours are `<kind>:<slug-or-id>`. `url` is what
 * ChatGPT cites, so public/unlisted worlds link to the wiki and private ones
 * to the app.
 */

type Kind = "entity" | "lore" | "timeline" | "scene";
const KINDS: Kind[] = ["entity", "lore", "timeline", "scene"];

const TYPE_SLUGS: Record<string, string> = {
  CHARACTER: "characters",
  LOCATION: "locations",
  ORGANIZATION: "organizations",
};

function parseDocId(id: string): { kind: Kind; key: string } {
  const idx = id.indexOf(":");
  const kind = idx === -1 ? "" : id.slice(0, idx);
  const key = idx === -1 ? "" : id.slice(idx + 1);
  if (!KINDS.includes(kind as Kind) || !key) {
    throw new NotFoundException(
      `Unknown document id "${id}". Use an id returned by search (e.g. entity:gandalf, lore:the-istari, timeline:<id>, scene:<id>).`,
    );
  }
  return { kind: kind as Kind, key };
}

function section(title: string, body: string | null | undefined): string {
  return body && body.trim() ? `\n## ${title}\n\n${body.trim()}\n` : "";
}

export function registerChatGptTools(
  reg: ToolRegistrar,
  ctx: McpAuthContext,
  deps: {
    search: SearchService;
    entities: EntitiesService;
    lore: LoreService;
    timeline: TimelineService;
    storyboard: StoryboardService;
    webUrl: string;
  },
) {
  const isPublic = ctx.projectVisibility !== "PRIVATE";
  const base = deps.webUrl.replace(/\/+$/, "");
  const urls = {
    entity: (slug: string, type: string, itemTypeSlug?: string | null) =>
      isPublic
        ? `${base}/worlds/${ctx.projectSlug}/entities/${slug}`
        : `${base}/projects/${ctx.projectSlug}/entities/${TYPE_SLUGS[type] ?? itemTypeSlug ?? "items"}/${slug}`,
    lore: (slug: string) =>
      `${base}/${isPublic ? "worlds" : "projects"}/${ctx.projectSlug}/lore/${slug}`,
    timeline: () =>
      `${base}/${isPublic ? "worlds" : "projects"}/${ctx.projectSlug}/timeline`,
    scene: (workSlug?: string) =>
      isPublic || !workSlug
        ? `${base}/${isPublic ? "worlds" : "projects"}/${ctx.projectSlug}/storyboard`
        : `${base}/projects/${ctx.projectSlug}/storyboard/works/${workSlug}`,
  };

  const toHit = (r: SearchResult) => ({
    id: `${r.kind}:${r.slug ?? r.id}`,
    title: r.detail ? `${r.name} (${r.detail})` : r.name,
    url:
      r.kind === "entity"
        ? urls.entity(r.slug!, r.detail ?? "")
        : r.kind === "lore"
          ? urls.lore(r.slug!)
          : r.kind === "timeline"
            ? urls.timeline()
            : urls.scene(),
  });

  reg.tool(
    "search",
    {
      title: "Search the world (ChatGPT connector)",
      description:
        "Search entities, lore articles, timeline events, and scenes. Returns ids for fetch. Same index as search_project, in the result shape ChatGPT connectors require.",
      access: "read",
      input: z.object({
        query: z.string().min(1).max(200).describe("Text to search for"),
      }),
    },
    async ({ query }) => {
      const { results } = await deps.search.search(ctx.projectId, {
        q: query,
        limit: 20,
      });
      return structuredResult({ results: results.map(toHit) });
    },
  );

  reg.tool(
    "fetch",
    {
      title: "Fetch a document (ChatGPT connector)",
      description:
        "Retrieve the full content of one search result by id (entity:<slug>, lore:<slug>, timeline:<id>, scene:<id>) as text with a citation URL.",
      access: "read",
      input: z.object({
        id: z.string().min(1).max(300).describe("An id returned by search"),
      }),
    },
    async ({ id }) => {
      const { kind, key } = parseDocId(id);

      if (kind === "entity") {
        const e = await deps.entities.findBySlugWithHub(ctx.projectId, key);
        const relations = [
          ...e.sourceRelationships.map(
            (r) => `- ${r.label} → ${r.targetEntity.name}`,
          ),
          ...e.targetRelationships.map(
            (r) => `- ${r.sourceEntity.name} → ${r.label}`,
          ),
        ].join("\n");
        const text =
          `# ${e.name}\n\nType: ${e.type}` +
          section("Summary", e.summary) +
          section("Description", e.description) +
          section("Backstory", e.backstory) +
          section("Secrets", e.secrets) +
          section("Notes", e.notes) +
          section("Relationships", relations) +
          section(
            "Timeline",
            e.timelineEventEntities
              .map((t) => `- ${t.timelineEvent.date}: ${t.timelineEvent.name}`)
              .join("\n"),
          ) +
          section(
            "Lore",
            e.loreArticleEntities
              .map((l) => `- ${l.loreArticle.title}`)
              .join("\n"),
          );
        return structuredResult({
          id,
          title: e.name,
          text,
          url: urls.entity(e.slug, e.type, e.item?.itemType?.slug),
          metadata: {
            kind,
            type: e.type,
            tags: e.entityTags.map((t) => t.tag.name),
          },
        });
      }

      if (kind === "lore") {
        const a = await deps.lore.findBySlug(ctx.projectId, key);
        return structuredResult({
          id,
          title: a.title,
          text: `# ${a.title}\n\n${a.content}`,
          url: urls.lore(a.slug),
          metadata: {
            kind,
            category: a.category,
            entities: a.entities.map((x) => x.entity.name),
            tags: a.loreArticleTags.map((t) => t.tag.name),
          },
        });
      }

      if (kind === "timeline") {
        const ev = await deps.timeline.findById(ctx.projectId, key);
        const text =
          `# ${ev.name}\n\nDate: ${ev.date}${ev.endDate ? ` – ${ev.endDate}` : ""}\nSignificance: ${ev.significance}` +
          (ev.era ? `\nEra: ${ev.era.name}` : "") +
          section("Description", ev.description) +
          section(
            "Involved",
            ev.entities.map((x) => `- ${x.entity.name}`).join("\n"),
          );
        return structuredResult({
          id,
          title: ev.name,
          text,
          url: urls.timeline(),
          metadata: { kind, date: ev.date, significance: ev.significance },
        });
      }

      const s = await deps.storyboard.findSceneById(ctx.projectId, key);
      const title = s.title ?? `Scene ${s.sequenceNumber}`;
      const text =
        `# ${title}\n\n${s.chapter.work.title} › ${s.chapter.title}` +
        (s.location ? `\nLocation: ${s.location.name}` : "") +
        (s.characters.length
          ? `\nCharacters: ${s.characters.map((c) => `${c.entity.name}${c.isPov ? " (POV)" : ""}`).join(", ")}`
          : "") +
        section("Summary", s.description) +
        section("Content", s.content);
      return structuredResult({
        id,
        title,
        text,
        url: urls.scene(s.chapter.work.slug),
        metadata: {
          kind,
          work: s.chapter.work.title,
          chapter: s.chapter.title,
          plotline: s.plotline?.name ?? null,
        },
      });
    },
  );
}
