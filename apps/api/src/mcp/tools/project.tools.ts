import { z } from "zod";
import { ProjectsService } from "../../projects/projects.service";
import { SEARCH_KINDS, SearchService } from "../../search/search.service";
import { EntityTypesService } from "../../entity-types/entity-types.service";
import { TagsService } from "../../tags/tags.service";
import { McpAuthContext } from "../../oauth/oauth.types";
import { ToolRegistrar, limitArg } from "../tool-utils";

export function registerProjectTools(
  reg: ToolRegistrar,
  ctx: McpAuthContext,
  deps: {
    projects: ProjectsService;
    search: SearchService;
    entityTypes: EntityTypesService;
    tags: TagsService;
  },
) {
  reg.tool(
    "get_project",
    {
      title: "Get project overview",
      description:
        "Overview of the connected world: name, description, timeline settings, and how much content exists of each kind. Call this first to orient yourself.",
      access: "read",
      input: z.object({}),
    },
    async () => deps.projects.getSummary(ctx.projectId),
  );

  reg.tool(
    "search_project",
    {
      title: "Search the world",
      description:
        "Full-text search across characters/locations/organizations/items (entities), lore articles, timeline events, and story scenes. Returns slugs/ids you can pass to the get_* tools. Prefer this over listing everything when you know what you are looking for.",
      access: "read",
      input: z.object({
        query: z
          .string()
          .min(1)
          .max(200)
          .describe("Text to search for (case-insensitive)"),
        types: z
          .array(z.enum(SEARCH_KINDS))
          .optional()
          .describe(
            "Restrict to content kinds. Default: all of entity, lore, timeline, scene",
          ),
        limit: limitArg(25, 100),
      }),
    },
    async ({ query, types, limit }) =>
      deps.search.search(ctx.projectId, { q: query, types, limit }),
  );

  reg.tool(
    "get_entity_types",
    {
      title: "List custom entity types",
      description:
        "Custom item types defined for this world (beyond the built-in CHARACTER, LOCATION, ORGANIZATION) with their field schemas. Use the returned id as item.itemTypeId when creating ITEM entities.",
      access: "read",
      input: z.object({}),
    },
    async () => deps.entityTypes.findAllByProject(ctx.projectId),
  );

  reg.tool(
    "list_tags",
    {
      title: "List tags",
      description:
        "All tags in the world. Tags can be attached to entities and lore articles by name.",
      access: "read",
      input: z.object({}),
    },
    async () => deps.tags.findAllByProject(ctx.projectId),
  );
}

/**
 * World-settings writes. Registered after the ChatGPT connector tools so that
 * `search`/`fetch` keep their place right behind the orientation tools.
 */
export function registerProjectWriteTools(
  reg: ToolRegistrar,
  ctx: McpAuthContext,
  deps: { projects: ProjectsService; entityTypes: EntityTypesService },
) {
  reg.tool(
    "create_entity_type",
    {
      title: "Create a custom entity type",
      description:
        "Define a new custom item type for this world (e.g. Weapons, Artifacts). Returns the type, whose id is used as item.itemTypeId when creating ITEM entities.",
      access: "write",
      input: z.object({
        name: z.string().min(1).max(50).describe("Display name, e.g. Weapons"),
        description: z
          .string()
          .max(500)
          .optional()
          .describe("What this type covers, shown under its heading"),
        icon: z.string().optional().describe("Lucide icon name, e.g. sword"),
        color: z.string().optional().describe("Hex color, e.g. #3b82f6"),
      }),
    },
    async (input) => deps.entityTypes.create(ctx.projectId, input),
  );

  reg.tool(
    "update_entity_type",
    {
      title: "Update a custom entity type",
      description:
        "Rename a custom entity type or change its description, icon, or color. Renaming changes the type's slug. Only the fields you pass are changed.",
      access: "write",
      input: z.object({
        slug: z.string().describe("Current slug of the type to update"),
        name: z.string().min(1).max(50).optional(),
        description: z
          .string()
          .max(500)
          .optional()
          .describe("Pass an empty string to clear it"),
        icon: z.string().optional(),
        color: z.string().optional(),
      }),
    },
    async ({ slug, ...dto }) =>
      deps.entityTypes.update(ctx.projectId, slug, dto),
  );

  reg.tool(
    "get_entity_type_deletion_impact",
    {
      title: "Check what deleting an entity type would remove",
      description:
        "How many entities a custom type holds, and how many relationships, timeline links, lore mentions, scene appearances, and tags would be destroyed if those entities were deleted with it. Call this before delete_entity_type with entities='delete'.",
      access: "read",
      input: z.object({
        slug: z.string().describe("Slug of the type to inspect"),
      }),
    },
    async ({ slug }) => deps.entityTypes.deletionImpact(ctx.projectId, slug),
  );

  reg.tool(
    "delete_entity_type",
    {
      title: "Delete a custom entity type",
      description:
        "Delete a custom entity type. If it still holds entities you must say what happens to them: entities='move' with moveTo=<slug> reassigns them, entities='delete' deletes them permanently along with their relationships, timeline links, lore mentions, scene appearances, and tags. Without it the call is refused, because an entity with no type cannot be reached in the web app. Irreversible: confirm with the user first, and prefer checking get_entity_type_deletion_impact before deleting entities.",
      access: "write",
      input: z.object({
        slug: z.string().describe("Slug of the type to delete"),
        entities: z
          .enum(["move", "delete"])
          .optional()
          .describe("Required when the type still holds entities"),
        moveTo: z
          .string()
          .optional()
          .describe("Destination type slug, required when entities='move'"),
      }),
    },
    async ({ slug, entities, moveTo }) => {
      await deps.entityTypes.delete(ctx.projectId, slug, {
        entities,
        to: moveTo,
      });
      return { deleted: slug };
    },
  );

  reg.tool(
    "update_project",
    {
      title: "Update world settings",
      description:
        "Change this world's name, description, or visibility. Renaming changes the project slug and therefore its URLs. Visibility PUBLIC publishes the world's wiki to anyone, UNLISTED shares it by direct link, PRIVATE keeps it to the owner — confirm with the user before making a world public.",
      access: "write",
      input: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z
          .string()
          .max(2000)
          .optional()
          .describe("Pass an empty string to clear it"),
        visibility: z.enum(["PRIVATE", "PUBLIC", "UNLISTED"]).optional(),
      }),
    },
    async (input) => deps.projects.update(ctx.projectSlug, ctx.ownerId, input),
  );
}
