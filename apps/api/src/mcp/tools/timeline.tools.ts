import { z } from "zod";
import { TimelineService } from "../../timeline/timeline.service";
import { ErasService } from "../../timeline/eras.service";
import { CreateTimelineEventDto } from "../../timeline/dto/create-timeline-event.dto";
import { UpdateTimelineEventDto } from "../../timeline/dto/update-timeline-event.dto";
import { CreateEraDto } from "../../timeline/dto/create-era.dto";
import { McpAuthContext } from "../../oauth/oauth.types";
import { ToolRegistrar, idArg, slugArg, textResult } from "../tool-utils";

const SIGNIFICANCE = ["minor", "moderate", "major", "critical"] as const;

function shapeEvent<
  T extends {
    entities?: {
      role: string | null;
      entity: { id: string; name: string; slug: string; type: string };
    }[];
  },
>(ev: T) {
  const { entities, ...rest } = ev;
  return {
    ...rest,
    entities: entities?.map((e) => ({ ...e.entity, role: e.role })) ?? [],
  };
}

const eventFields = {
  description: z.string().optional(),
  date: z
    .string()
    .max(100)
    .optional()
    .describe(
      "Display date in the world's own calendar, e.g. 'TA 3019-03-25' or 'Year 412 of the Empire'",
    ),
  dateValue: z
    .number()
    .optional()
    .describe(
      "Numeric position on the timeline for ordering/gantt (see get_project timeline settings)",
    ),
  endDate: z
    .string()
    .max(100)
    .optional()
    .describe("Display end date for events that span time"),
  endDateValue: z.number().optional(),
  sortOrder: z
    .number()
    .int()
    .optional()
    .describe("Manual ordering key; lower comes first"),
  significance: z.enum(SIGNIFICANCE).optional(),
  eraSlug: z
    .string()
    .optional()
    .describe("Slug of the era this event belongs to (see list_eras)"),
  entitySlugs: z
    .array(z.string())
    .max(100)
    .optional()
    .describe("Entities involved in the event"),
};

export function registerTimelineTools(
  reg: ToolRegistrar,
  ctx: McpAuthContext,
  deps: { timeline: TimelineService; eras: ErasService },
) {
  reg.tool(
    "get_timeline",
    {
      title: "Get timeline",
      description:
        "All timeline events in chronological order with their dates, significance, era, and involved entities. Filter to one entity's events or by significance.",
      access: "read",
      input: z.object({
        entitySlug: slugArg("entity")
          .optional()
          .describe("Only events involving this entity"),
        significance: z.enum(SIGNIFICANCE).optional(),
      }),
    },
    async ({ entitySlug, significance }) => {
      const rows = await deps.timeline.findAllByProject(ctx.projectId, {
        entity: entitySlug,
        significance,
      });
      return rows.map(shapeEvent);
    },
  );

  reg.tool(
    "get_timeline_event",
    {
      title: "Get timeline event",
      description:
        "One timeline event in full, including description and involved entities.",
      access: "read",
      input: z.object({ eventId: idArg("timeline event") }),
    },
    async ({ eventId }) =>
      shapeEvent(await deps.timeline.findById(ctx.projectId, eventId)),
  );

  reg.tool(
    "list_eras",
    {
      title: "List eras",
      description:
        "Named periods of the world's history (e.g. 'Age of Kings') with their numeric start/end positions.",
      access: "read",
      input: z.object({}),
    },
    async () => deps.eras.findAllByProject(ctx.projectId),
  );

  reg.tool(
    "create_timeline_event",
    {
      title: "Create timeline event",
      description:
        "Add an event to the world's history. sortOrder defaults to the end of the timeline. Link the entities involved with entitySlugs.",
      access: "write",
      input: z.object({
        ...eventFields,
        name: z.string().min(1).max(200),
        date: z
          .string()
          .min(1)
          .max(100)
          .describe("Display date in the world's own calendar"),
      }),
    },
    async (input) => {
      const existing = await deps.timeline.findAllByProject(ctx.projectId);
      const sortOrder =
        input.sortOrder ?? (existing.at(-1)?.sortOrder ?? 0) + 1;
      return shapeEvent(
        await deps.timeline.create(ctx.projectId, {
          ...input,
          sortOrder,
        } as CreateTimelineEventDto),
      );
    },
  );

  reg.tool(
    "update_timeline_event",
    {
      title: "Update timeline event",
      description:
        "Partially update a timeline event. entitySlugs replaces the involved-entity set when provided.",
      access: "write",
      idempotent: true,
      input: z.object({
        eventId: idArg("timeline event"),
        name: z.string().min(1).max(200).optional(),
        ...eventFields,
      }),
    },
    async ({ eventId, ...updates }) =>
      shapeEvent(
        await deps.timeline.update(
          ctx.projectId,
          eventId,
          updates as UpdateTimelineEventDto,
        ),
      ),
  );

  reg.tool(
    "delete_timeline_event",
    {
      title: "Delete timeline event",
      description:
        "Permanently delete a timeline event. Scenes and plot points linked to it are kept but unlinked.",
      access: "write",
      destructive: true,
      idempotent: true,
      input: z.object({ eventId: idArg("timeline event") }),
    },
    async ({ eventId }) => {
      await deps.timeline.delete(ctx.projectId, eventId);
      return textResult(`Deleted timeline event ${eventId}.`);
    },
  );

  reg.tool(
    "create_era",
    {
      title: "Create era",
      description:
        "Define a named period of history spanning numeric timeline positions startDate..endDate.",
      access: "write",
      input: z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        color: z
          .string()
          .max(20)
          .optional()
          .describe("Hex color for the timeline, e.g. #7c3aed"),
        startDate: z
          .number()
          .describe("Numeric timeline position where the era begins"),
        endDate: z
          .number()
          .describe("Numeric timeline position where the era ends"),
        sortOrder: z.number().int().optional(),
      }),
    },
    async (input) => deps.eras.create(ctx.projectId, input as CreateEraDto),
  );
}
