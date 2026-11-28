import { z } from "zod";
import { EntitiesService } from "../../entities/entities.service";
import { EntityFieldSchemasService } from "../../entity-field-schemas/entity-field-schemas.service";
import { CreateEntityDto } from "../../entities/dto/create-entity.dto";
import { UpdateEntityDto } from "../../entities/dto/update-entity.dto";
import { McpAuthContext } from "../../oauth/oauth.types";
import { auditContextFromMcp } from "../../audit/audit.types";
import { ToolRegistrar, slugArg, textResult } from "../tool-utils";

const ENTITY_TYPES = ["CHARACTER", "LOCATION", "ORGANIZATION", "ITEM"] as const;

const customFieldsSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .describe(
    "Values for project-defined custom fields (get_entity_field_schema to see the schema)",
  );

const characterFields = z
  .object({
    status: z.string().optional().describe("e.g. alive, deceased, unknown"),
    species: z.string().optional(),
    age: z.string().optional(),
    role: z
      .string()
      .optional()
      .describe("e.g. protagonist, antagonist, supporting, minor"),
    customFields: customFieldsSchema,
  })
  .optional()
  .describe("Character-only fields (type CHARACTER)");

const locationFields = z
  .object({
    region: z.string().optional(),
    condition: z
      .string()
      .optional()
      .describe("e.g. ruins, functional, fortified, contested"),
    customFields: customFieldsSchema,
  })
  .optional()
  .describe("Location-only fields (type LOCATION)");

const organizationFields = z
  .object({
    ideology: z.string().optional(),
    territory: z.string().optional(),
    status: z
      .string()
      .optional()
      .describe("e.g. active, dissolved, underground, emerging"),
    parentOrgId: z
      .string()
      .optional()
      .describe("Entity id of the parent organization"),
    customFields: customFieldsSchema,
  })
  .optional()
  .describe("Organization-only fields (type ORGANIZATION)");

const itemFields = z
  .object({
    itemTypeId: z
      .string()
      .optional()
      .describe("Custom item type id from get_entity_types"),
    fields: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Values for the item type's field schema"),
  })
  .optional()
  .describe("Item-only fields (type ITEM)");

const contentFields = {
  summary: z
    .string()
    .max(2000)
    .optional()
    .describe("One or two sentence summary"),
  description: z
    .string()
    .optional()
    .describe("Full description (markdown allowed)"),
  backstory: z.string().optional().describe("History before the story begins"),
  secrets: z
    .string()
    .optional()
    .describe("Hidden truths; never shown on public wikis"),
  notes: z.string().optional().describe("Author notes"),
  imageUrl: z.string().url().optional(),
  tags: z
    .array(z.string().min(1).max(50))
    .max(50)
    .optional()
    .describe("Tag names; created if missing"),
  character: characterFields,
  location: locationFields,
  organization: organizationFields,
  item: itemFields,
};

/** Flatten join tables so the model sees tags as names, not nested rows. */
function shapeEntity<T extends { entityTags?: { tag: { name: string } }[] }>(
  e: T,
) {
  const { entityTags, ...rest } = e;
  return { ...rest, tags: entityTags?.map((t) => t.tag.name) ?? [] };
}

const CONFIGURABLE_ENTITY_TYPES = [
  "CHARACTER",
  "LOCATION",
  "ORGANIZATION",
] as const;

export function registerEntityTools(
  reg: ToolRegistrar,
  ctx: McpAuthContext,
  entities: EntitiesService,
  entityFieldSchemas?: EntityFieldSchemasService,
) {
  reg.tool(
    "list_entities",
    {
      title: "List entities",
      description:
        "List characters, locations, organizations, and items in the world with their summaries and type-specific fields. Filter by type or a name fragment. For full detail on one entity use get_entity.",
      access: "read",
      input: z.object({
        type: z.enum(ENTITY_TYPES).optional().describe("Only this entity type"),
        q: z
          .string()
          .max(200)
          .optional()
          .describe("Name contains this text (case-insensitive)"),
      }),
    },
    async ({ type, q }) => {
      const rows = await entities.findAllByProject(ctx.projectId, { type, q });
      return rows.map(shapeEntity);
    },
  );

  reg.tool(
    "get_entity",
    {
      title: "Get entity",
      description:
        "Everything about one entity: all text fields (including secrets and notes), relationships in both directions, timeline events it appears in, linked lore articles, tags, and organization membership.",
      access: "read",
      input: z.object({ entitySlug: slugArg("entity") }),
    },
    async ({ entitySlug }) => {
      const e = await entities.findBySlugWithHub(ctx.projectId, entitySlug);
      const {
        sourceRelationships,
        targetRelationships,
        timelineEventEntities,
        loreArticleEntities,
        entityTags,
        ...rest
      } = e;
      return {
        ...rest,
        tags: entityTags.map((t) => t.tag.name),
        relationships: [
          ...sourceRelationships.map((r) => ({
            id: r.id,
            direction: "outgoing",
            label: r.label,
            description: r.description,
            bidirectional: r.bidirectional,
            other: r.targetEntity,
          })),
          ...targetRelationships.map((r) => ({
            id: r.id,
            direction: "incoming",
            label: r.label,
            description: r.description,
            bidirectional: r.bidirectional,
            other: r.sourceEntity,
          })),
        ],
        timelineEvents: timelineEventEntities.map((t) => ({
          ...t.timelineEvent,
          role: t.role,
        })),
        loreArticles: loreArticleEntities.map((l) => l.loreArticle),
      };
    },
  );

  reg.tool(
    "create_entity",
    {
      title: "Create entity",
      description:
        "Create a character, location, organization, or item. Returns the new entity including its slug. Check with search_project first to avoid duplicates.",
      access: "write",
      input: z.object({
        type: z.enum(ENTITY_TYPES),
        name: z.string().min(1).max(100),
        ...contentFields,
      }),
    },
    async (input) => {
      const created = await entities.create(
        ctx.projectId,
        input as CreateEntityDto,
        auditContextFromMcp(ctx),
      );
      return shapeEntity(created);
    },
  );

  reg.tool(
    "update_entity",
    {
      title: "Update entity",
      description:
        "Partially update an entity. Only the fields you pass change; renaming may change the slug (the response includes the current slug). Tags replace the existing tag set when provided.",
      access: "write",
      idempotent: true,
      input: z.object({
        entitySlug: slugArg("entity"),
        name: z.string().min(1).max(100).optional(),
        ...contentFields,
      }),
    },
    async ({ entitySlug, ...updates }) => {
      const updated = await entities.update(
        ctx.projectId,
        entitySlug,
        updates as UpdateEntityDto,
        auditContextFromMcp(ctx),
      );
      const { entityTags, ...rest } = updated;
      return { ...rest, tags: entityTags.map((t) => t.tag.name) };
    },
  );

  reg.tool(
    "delete_entity",
    {
      title: "Delete entity",
      description:
        "Permanently delete an entity and its relationships, tag links, and timeline/lore links. Irreversible; confirm with the user before calling.",
      access: "write",
      destructive: true,
      idempotent: true,
      input: z.object({ entitySlug: slugArg("entity") }),
    },
    async ({ entitySlug }) => {
      await entities.delete(
        ctx.projectId,
        entitySlug,
        auditContextFromMcp(ctx),
      );
      return textResult(`Deleted entity "${entitySlug}".`);
    },
  );

  // ── Entity field schema tools ──

  if (entityFieldSchemas) {
    reg.tool(
      "get_entity_field_schema",
      {
        title: "Get entity field schema",
        description:
          "Get the custom field schema defined for a built-in entity type (CHARACTER, LOCATION, or ORGANIZATION). Returns an array of field definitions that describe what custom fields exist for entities of this type in the current project.",
        access: "read",
        input: z.object({
          entityType: z
            .enum(CONFIGURABLE_ENTITY_TYPES)
            .describe("The built-in entity type"),
        }),
      },
      async ({ entityType }) => {
        return entityFieldSchemas.getSchema(ctx.projectId, entityType);
      },
    );

    reg.tool(
      "update_entity_field_schema",
      {
        title: "Update entity field schema",
        description:
          "Create or replace the custom field schema for a built-in entity type (CHARACTER, LOCATION, or ORGANIZATION). Each field definition has: key, label, type (text/textarea/number/boolean/select/multi_select/date/url/entity_ref), and optional options (for select/multi_select), required, description.",
        access: "write",
        idempotent: true,
        input: z.object({
          entityType: z
            .enum(CONFIGURABLE_ENTITY_TYPES)
            .describe("The built-in entity type"),
          fieldSchema: z
            .array(
              z.object({
                key: z.string().min(1).describe("Unique field identifier"),
                label: z.string().min(1).describe("Display label"),
                type: z
                  .enum([
                    "text",
                    "textarea",
                    "number",
                    "boolean",
                    "select",
                    "multi_select",
                    "date",
                    "url",
                    "entity_ref",
                  ])
                  .describe("Field type"),
                options: z
                  .array(z.string())
                  .optional()
                  .describe("Options for select/multi_select fields"),
                required: z.boolean().optional(),
                description: z.string().optional(),
              }),
            )
            .describe("The complete field schema (replaces existing)"),
        }),
      },
      async ({ entityType, fieldSchema }) => {
        await entityFieldSchemas.upsertSchema(
          ctx.projectId,
          entityType,
          fieldSchema,
        );
        return textResult(
          `Updated custom field schema for ${entityType} with ${fieldSchema.length} field(s).`,
        );
      },
    );
  }
}
