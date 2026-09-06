import { z } from "zod";
import { RelationshipsService } from "../../relationships/relationships.service";
import { CreateRelationshipDto } from "../../relationships/dto/create-relationship.dto";
import { UpdateRelationshipDto } from "../../relationships/dto/update-relationship.dto";
import { McpAuthContext } from "../../oauth/oauth.types";
import { ToolRegistrar, idArg, slugArg, textResult } from "../tool-utils";

export function registerRelationshipTools(
  reg: ToolRegistrar,
  ctx: McpAuthContext,
  relationships: RelationshipsService,
) {
  reg.tool(
    "list_relationships",
    {
      title: "List relationships",
      description:
        "Relationships between entities (the knowledge graph edges), optionally only those touching one entity. Each has a label like 'Mentor', 'Enemy of', 'Located in', an optional description, and a bidirectional flag.",
      access: "read",
      input: z.object({
        entitySlug: slugArg("entity")
          .optional()
          .describe("Only relationships involving this entity"),
      }),
    },
    async ({ entitySlug }) =>
      relationships.findAllByProject(ctx.projectId, { entity: entitySlug }),
  );

  reg.tool(
    "create_relationship",
    {
      title: "Create relationship",
      description:
        "Connect two existing entities with a labelled relationship (source → target). Set bidirectional=true for symmetric relations such as siblings or allies.",
      access: "write",
      input: z.object({
        sourceEntitySlug: slugArg("source entity"),
        targetEntitySlug: slugArg("target entity"),
        label: z
          .string()
          .min(1)
          .max(100)
          .describe("Short label, e.g. 'Mentor', 'Rules', 'Member of'"),
        description: z.string().optional(),
        bidirectional: z.boolean().optional(),
        metadata: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Free-form structured data"),
      }),
    },
    async (input) =>
      relationships.create(ctx.projectId, input as CreateRelationshipDto),
  );

  reg.tool(
    "update_relationship",
    {
      title: "Update relationship",
      description:
        "Change the label, description, direction flag, or metadata of an existing relationship.",
      access: "write",
      idempotent: true,
      input: z.object({
        relationshipId: idArg("relationship"),
        label: z.string().min(1).max(100).optional(),
        description: z.string().nullable().optional(),
        bidirectional: z.boolean().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    },
    async ({ relationshipId, ...updates }) =>
      relationships.update(
        ctx.projectId,
        relationshipId,
        updates as UpdateRelationshipDto,
      ),
  );

  reg.tool(
    "delete_relationship",
    {
      title: "Delete relationship",
      description:
        "Remove a relationship. The entities themselves are untouched.",
      access: "write",
      destructive: true,
      idempotent: true,
      input: z.object({ relationshipId: idArg("relationship") }),
    },
    async ({ relationshipId }) => {
      await relationships.delete(ctx.projectId, relationshipId);
      return textResult(`Deleted relationship ${relationshipId}.`);
    },
  );
}
