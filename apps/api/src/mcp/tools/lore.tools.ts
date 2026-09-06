import { z } from "zod";
import { LoreService } from "../../lore/lore.service";
import { CreateLoreArticleDto } from "../../lore/dto/create-lore-article.dto";
import { UpdateLoreArticleDto } from "../../lore/dto/update-lore-article.dto";
import { McpAuthContext } from "../../oauth/oauth.types";
import { ToolRegistrar, slugArg, textResult } from "../tool-utils";

function shapeArticle<
  T extends {
    entities?: {
      entity: { id: string; name: string; slug: string; type: string };
    }[];
    loreArticleTags?: { tag: { name: string } }[];
  },
>(a: T) {
  const { entities, loreArticleTags, ...rest } = a;
  return {
    ...rest,
    entities: entities?.map((e) => e.entity) ?? [],
    tags: loreArticleTags?.map((t) => t.tag.name) ?? [],
  };
}

export function registerLoreTools(
  reg: ToolRegistrar,
  ctx: McpAuthContext,
  lore: LoreService,
) {
  reg.tool(
    "list_lore_articles",
    {
      title: "List lore articles",
      description:
        "Lore articles are the world's encyclopedia: history, cultures, magic systems, religions, technology. Returns titles, slugs, and categories (not the body). Filter by category, title text, or linked entity.",
      access: "read",
      input: z.object({
        q: z.string().max(200).optional().describe("Title contains this text"),
        category: z.string().max(100).optional(),
        entitySlug: slugArg("entity")
          .optional()
          .describe("Only articles linked to this entity"),
      }),
    },
    async ({ q, category, entitySlug }) =>
      lore.findAllByProject(ctx.projectId, { q, category, entity: entitySlug }),
  );

  reg.tool(
    "get_lore_article",
    {
      title: "Get lore article",
      description:
        "Full markdown content of one lore article plus its linked entities and tags.",
      access: "read",
      input: z.object({ articleSlug: slugArg("lore article") }),
    },
    async ({ articleSlug }) =>
      shapeArticle(await lore.findBySlug(ctx.projectId, articleSlug)),
  );

  reg.tool(
    "create_lore_article",
    {
      title: "Create lore article",
      description:
        "Write a new lore article (markdown). Link it to the entities it discusses via entitySlugs so it appears on their pages.",
      access: "write",
      input: z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1).describe("Article body in markdown"),
        category: z
          .string()
          .max(100)
          .optional()
          .describe("e.g. history, religion, magic, technology"),
        entitySlugs: z
          .array(z.string())
          .max(100)
          .optional()
          .describe("Slugs of entities this article is about"),
        tags: z.array(z.string().min(1).max(50)).max(50).optional(),
      }),
    },
    async (input) =>
      shapeArticle(
        await lore.create(ctx.projectId, input as CreateLoreArticleDto),
      ),
  );

  reg.tool(
    "update_lore_article",
    {
      title: "Update lore article",
      description:
        "Partially update a lore article. Passing content replaces the whole body, so read it first with get_lore_article and send the complete new text. entitySlugs/tags replace the existing sets when provided.",
      access: "write",
      idempotent: true,
      input: z.object({
        articleSlug: slugArg("lore article"),
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).optional(),
        category: z.string().max(100).optional(),
        entitySlugs: z.array(z.string()).max(100).optional(),
        tags: z.array(z.string().min(1).max(50)).max(50).optional(),
      }),
    },
    async ({ articleSlug, ...updates }) =>
      shapeArticle(
        await lore.update(
          ctx.projectId,
          articleSlug,
          updates as UpdateLoreArticleDto,
        ),
      ),
  );

  reg.tool(
    "delete_lore_article",
    {
      title: "Delete lore article",
      description:
        "Permanently delete a lore article. Irreversible; confirm with the user first.",
      access: "write",
      destructive: true,
      idempotent: true,
      input: z.object({ articleSlug: slugArg("lore article") }),
    },
    async ({ articleSlug }) => {
      await lore.delete(ctx.projectId, articleSlug);
      return textResult(`Deleted lore article "${articleSlug}".`);
    },
  );
}
