import { z } from "zod";
import { StyleGuideService } from "../../style-guide/style-guide.service";
import { McpAuthContext } from "../../oauth/oauth.types";
import { auditContextFromMcp } from "../../audit/audit.types";
import { ToolRegistrar } from "../tool-utils";

export function registerStyleGuideTools(
  reg: ToolRegistrar,
  ctx: McpAuthContext,
  styleGuide: StyleGuideService,
) {
  reg.tool(
    "get_style_guide",
    {
      title: "Get style guide",
      description:
        "The project's writing style guide: POV, tense, voice, tone, pacing, dialogue rules, prose style, vocabulary preferences, and custom rules. Returns an empty object if no guide has been set.",
      access: "read",
      input: z.object({}),
    },
    async () => {
      const guide = await styleGuide.findByProject(ctx.projectId);
      return guide ?? {};
    },
  );

  reg.tool(
    "update_style_guide",
    {
      title: "Update style guide",
      description:
        "Set or update the project's writing style guide. Only the fields you provide are changed; omitted fields keep their current value. Use this to establish the voice, tone, and conventions for all writing in this world.",
      access: "write",
      idempotent: true,
      input: z.object({
        pov: z
          .enum(["first", "second", "third-limited", "third-omniscient"])
          .optional()
          .describe("Narrative point of view"),
        tense: z
          .enum(["past", "present"])
          .optional()
          .describe("Narrative tense"),
        voice: z
          .string()
          .max(5000)
          .optional()
          .describe("Narrative voice description and examples"),
        tone: z
          .string()
          .max(5000)
          .optional()
          .describe("Overall tone (e.g. dark, whimsical, clinical)"),
        pacing: z
          .string()
          .max(5000)
          .optional()
          .describe("Pacing guidelines for scenes and chapters"),
        dialogueRules: z
          .string()
          .max(5000)
          .optional()
          .describe(
            "Dialogue formatting and style rules (tags, punctuation, dialect)",
          ),
        proseStyle: z
          .string()
          .max(5000)
          .optional()
          .describe(
            "Prose style preferences (sentence length, figurative language, sensory detail)",
          ),
        vocabulary: z
          .string()
          .max(5000)
          .optional()
          .describe(
            "Vocabulary and terminology preferences (banned words, preferred terms, jargon)",
          ),
        customRules: z
          .string()
          .max(5000)
          .optional()
          .describe(
            "Any additional writing rules or conventions not covered above",
          ),
      }),
    },
    async (input) =>
      styleGuide.upsert(ctx.projectId, input, auditContextFromMcp(ctx)),
  );
}
