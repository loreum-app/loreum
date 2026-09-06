import { z } from "zod";
import { StoryboardService } from "../../storyboard/storyboard.service";
import { CreatePlotlineDto } from "../../storyboard/dto/create-plotline.dto";
import { CreatePlotPointDto } from "../../storyboard/dto/create-plot-point.dto";
import { UpdatePlotPointDto } from "../../storyboard/dto/update-plot-point.dto";
import { CreateWorkDto } from "../../storyboard/dto/create-work.dto";
import { CreateChapterDto } from "../../storyboard/dto/create-chapter.dto";
import { CreateSceneDto } from "../../storyboard/dto/create-scene.dto";
import { UpdateSceneDto } from "../../storyboard/dto/update-scene.dto";
import { McpAuthContext } from "../../oauth/oauth.types";
import { ToolRegistrar, idArg, slugArg } from "../tool-utils";

const WORK_STATUS = [
  "concept",
  "outlining",
  "drafting",
  "revision",
  "complete",
] as const;

export function registerStoryboardTools(
  reg: ToolRegistrar,
  ctx: McpAuthContext,
  storyboard: StoryboardService,
) {
  // ── Read ──

  reg.tool(
    "get_storyboard",
    {
      title: "Get storyboard overview",
      description:
        "The narrative structure of the world: plotlines (thematic arcs with plot points) and works (books/scripts/campaigns) with their chapters and scene counts. Drill in with get_plotline, get_work, and list_scenes.",
      access: "read",
      input: z.object({}),
    },
    async () => storyboard.getOverview(ctx.projectId),
  );

  reg.tool(
    "get_plotline",
    {
      title: "Get plotline",
      description:
        "One plotline with its ordered plot points (beats), each linked to scenes, timeline events, and entities where set.",
      access: "read",
      input: z.object({ plotlineSlug: slugArg("plotline") }),
    },
    async ({ plotlineSlug }) =>
      storyboard.findPlotlineBySlug(ctx.projectId, plotlineSlug),
  );

  reg.tool(
    "get_work",
    {
      title: "Get work",
      description:
        "One work (book, script, campaign) with synopsis, status, and ordered chapters. Use list_scenes with a chapter id to read the scenes.",
      access: "read",
      input: z.object({ workSlug: slugArg("work") }),
    },
    async ({ workSlug }) => storyboard.findWorkBySlug(ctx.projectId, workSlug),
  );

  reg.tool(
    "list_scenes",
    {
      title: "List scenes in a chapter",
      description:
        "Ordered scenes of a chapter including their narrative content, POV/characters, location, and plotline. This is where the actual prose lives.",
      access: "read",
      input: z.object({ chapterId: idArg("chapter (from get_work)") }),
    },
    async ({ chapterId }) =>
      storyboard.findScenesByChapter(ctx.projectId, chapterId),
  );

  // ── Write ──

  reg.tool(
    "create_plotline",
    {
      title: "Create plotline",
      description:
        "Create a plotline (story arc). Nest it under another with parentPlotlineSlug for subplots.",
      access: "write",
      input: z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        thematicStatement: z
          .string()
          .optional()
          .describe("What the arc is really about"),
        parentPlotlineSlug: z.string().optional(),
      }),
    },
    async (input) =>
      storyboard.createPlotline(ctx.projectId, input as CreatePlotlineDto),
  );

  reg.tool(
    "create_plot_point",
    {
      title: "Create plot point",
      description:
        "Add a beat to a plotline at a sequence position. Optionally link a scene, timeline event, or focal entity.",
      access: "write",
      input: z.object({
        plotlineSlug: slugArg("plotline"),
        title: z.string().min(1).max(200),
        sequenceNumber: z
          .number()
          .int()
          .min(0)
          .describe("Position within the plotline (1, 2, 3…)"),
        description: z.string().optional(),
        label: z
          .string()
          .max(100)
          .optional()
          .describe("Structural label, e.g. 'inciting incident', 'midpoint'"),
        sceneId: z.string().optional(),
        timelineEventId: z.string().optional(),
        entitySlug: z.string().optional().describe("Focal entity of this beat"),
      }),
    },
    async ({ plotlineSlug, ...dto }) =>
      storyboard.createPlotPoint(
        ctx.projectId,
        plotlineSlug,
        dto as CreatePlotPointDto,
      ),
  );

  reg.tool(
    "update_plot_point",
    {
      title: "Update plot point",
      description:
        "Partially update a plot point. Pass null for sceneId/timelineEventId/entitySlug to unlink.",
      access: "write",
      idempotent: true,
      input: z.object({
        plotPointId: idArg("plot point"),
        title: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        label: z.string().max(100).optional(),
        sequenceNumber: z.number().int().min(0).optional(),
        sceneId: z.string().nullable().optional(),
        timelineEventId: z.string().nullable().optional(),
        entitySlug: z.string().nullable().optional(),
      }),
    },
    async ({ plotPointId, ...dto }) =>
      storyboard.updatePlotPoint(
        ctx.projectId,
        plotPointId,
        dto as UpdatePlotPointDto,
      ),
  );

  reg.tool(
    "create_work",
    {
      title: "Create work",
      description:
        "Create a work: a book, screenplay, campaign, or other container for chapters and scenes.",
      access: "write",
      input: z.object({
        title: z.string().min(1).max(200),
        synopsis: z.string().optional(),
        status: z.enum(WORK_STATUS).optional(),
        chronologicalOrder: z
          .number()
          .int()
          .optional()
          .describe(
            "Order in the world's timeline (default: after existing works)",
          ),
        releaseOrder: z
          .number()
          .int()
          .optional()
          .describe("Publication order (default: after existing works)"),
      }),
    },
    async (input) => {
      const works = await storyboard.findAllWorks(ctx.projectId);
      const next = works.length + 1;
      return storyboard.createWork(ctx.projectId, {
        ...input,
        chronologicalOrder: input.chronologicalOrder ?? next,
        releaseOrder: input.releaseOrder ?? next,
      } as CreateWorkDto);
    },
  );

  reg.tool(
    "create_chapter",
    {
      title: "Create chapter",
      description:
        "Add a chapter to a work. sequenceNumber defaults to the end.",
      access: "write",
      input: z.object({
        workSlug: slugArg("work"),
        title: z.string().min(1).max(200),
        sequenceNumber: z.number().int().min(0).optional(),
        notes: z.string().optional(),
      }),
    },
    async ({ workSlug, ...dto }) => {
      const work = await storyboard.findWorkBySlug(ctx.projectId, workSlug);
      const sequenceNumber =
        dto.sequenceNumber ?? (work.chapters.at(-1)?.sequenceNumber ?? 0) + 1;
      return storyboard.createChapter(ctx.projectId, workSlug, {
        ...dto,
        sequenceNumber,
      } as CreateChapterDto);
    },
  );

  reg.tool(
    "create_scene",
    {
      title: "Create scene",
      description:
        "Add a scene to a chapter with optional narrative content, POV character, location, plotline, and timeline event. sequenceNumber defaults to the end of the chapter.",
      access: "write",
      input: z.object({
        chapterId: idArg("chapter (from get_work)"),
        title: z.string().max(200).optional(),
        sequenceNumber: z.number().int().min(0).optional(),
        description: z
          .string()
          .optional()
          .describe("Short summary of what happens"),
        content: z.string().optional().describe("The scene's prose (markdown)"),
        plotlineSlug: z.string().optional(),
        povCharacterSlug: z
          .string()
          .optional()
          .describe("Slug of the point-of-view character"),
        locationSlug: z.string().optional(),
        timelineEventId: z.string().optional(),
      }),
    },
    async (input) => {
      const scenes = await storyboard.findScenesByChapter(
        ctx.projectId,
        input.chapterId,
      );
      const sequenceNumber =
        input.sequenceNumber ?? (scenes.at(-1)?.sequenceNumber ?? 0) + 1;
      return storyboard.createScene(ctx.projectId, {
        ...input,
        sequenceNumber,
      } as CreateSceneDto);
    },
  );

  reg.tool(
    "update_scene",
    {
      title: "Update scene",
      description:
        "Partially update a scene. Passing content replaces the whole prose, so read it first with list_scenes and send the complete new text. Pass null to unlink plotline/POV/location/event.",
      access: "write",
      idempotent: true,
      input: z.object({
        sceneId: idArg("scene"),
        title: z.string().max(200).nullable().optional(),
        sequenceNumber: z.number().int().min(0).optional(),
        description: z.string().nullable().optional(),
        content: z.string().nullable().optional(),
        plotlineSlug: z.string().nullable().optional(),
        povCharacterSlug: z.string().nullable().optional(),
        locationSlug: z.string().nullable().optional(),
        timelineEventId: z.string().nullable().optional(),
      }),
    },
    async ({ sceneId, ...dto }) =>
      storyboard.updateScene(ctx.projectId, sceneId, dto as UpdateSceneDto),
  );
}
