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
