import { HttpException, Logger } from "@nestjs/common";
import type { McpServer, ToolAnnotations } from "@modelcontextprotocol/server";
import { z } from "zod";
import { McpAuthContext } from "../oauth/oauth.types";

export interface ToolResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

/**
 * Brand for results a handler has already shaped. Domain objects such as lore
 * articles and scenes have their own `content` field, so duck-typing on the
 * MCP result shape would misfire; the brand is unambiguous.
 */
const TOOL_RESULT = Symbol("loreum.toolResult");
type BrandedToolResult = ToolResult & { [TOOL_RESULT]: true };

function brand(result: ToolResult): BrandedToolResult {
  return Object.assign(result, { [TOOL_RESULT]: true as const });
}

export function isToolResult(value: unknown): value is ToolResult {
  return typeof value === "object" && value !== null && TOOL_RESULT in value;
}

/** Keys that are noise for a language model and get stripped from every response. */
const NOISE_KEYS = new Set([
  "projectId",
  "searchVector",
  "createdAt",
  "updatedAt",
]);

/**
 * Recursively drop internal/noisy fields so tool output is compact and
 * high-signal. Ids are kept because several write tools take them as input.
 */
export function slim<T>(value: T): T {
  if (Array.isArray(value)) return value.map(slim) as unknown as T;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (NOISE_KEYS.has(k)) continue;
      if (v === null || v === undefined) continue;
      out[k] = slim(v);
    }
    return out as T;
  }
  return value;
}

export function jsonResult(data: unknown): ToolResult {
  return brand({
    content: [{ type: "text", text: JSON.stringify(slim(data), null, 2) }],
  });
}

export function textResult(text: string): ToolResult {
  return brand({ content: [{ type: "text", text }] });
}

/**
 * Map a thrown error to a clean tool error. Domain errors (Nest HttpException:
 * not found, forbidden, validation) surface their message so the model can
 * self-correct; anything else is logged and replaced with a generic message so
 * internals never leak to the client.
 */
export function toToolError(err: unknown, logger: Logger): ToolResult {
  let message = "Something went wrong while processing this request.";
  if (err instanceof HttpException) {
    const response = err.getResponse();
    const raw =
      typeof response === "string"
        ? response
        : ((response as { message?: string | string[] })?.message ??
          err.message);
    message = Array.isArray(raw) ? raw.join("; ") : raw;
  } else {
    logger.error(
      "Unhandled MCP tool error",
      err instanceof Error ? err.stack : String(err),
    );
  }
  return brand({
    content: [{ type: "text", text: JSON.stringify({ error: message }) }],
    isError: true,
  });
}

export interface ToolOptions<S extends z.ZodObject<z.ZodRawShape>> {
  title: string;
  description: string;
  /** Write tools are only registered for READ_WRITE credentials. */
  access: "read" | "write";
  /** Marks tools that delete or overwrite data (shown to users by clients). */
  destructive?: boolean;
  idempotent?: boolean;
  input: S;
}

/**
 * Registers tools on a per-request McpServer with the cross-cutting behaviour
 * every Loreum tool needs: permission filtering (read-only credentials never
 * even see write tools), annotations for directory review, structured logging,
 * and error shaping.
 */
export class ToolRegistrar {
  constructor(
    private readonly server: McpServer,
    private readonly ctx: McpAuthContext,
    private readonly logger: Logger,
  ) {}

  get canWrite(): boolean {
    return this.ctx.permissions === "READ_WRITE";
  }

  tool<S extends z.ZodObject<z.ZodRawShape>>(
    name: string,
    opts: ToolOptions<S>,
    run: (args: z.infer<S>) => Promise<unknown>,
  ): void {
    if (opts.access === "write" && !this.canWrite) return;

    const annotations: ToolAnnotations = {
      title: opts.title,
      readOnlyHint: opts.access === "read",
      destructiveHint:
        opts.access === "write" ? Boolean(opts.destructive) : false,
      idempotentHint: opts.access === "read" ? true : Boolean(opts.idempotent),
      openWorldHint: false,
    };

    this.server.registerTool(
      name,
      {
        title: opts.title,
        description: opts.description,
        inputSchema: opts.input,
        annotations,
      },
      (async (args: z.infer<S>) => {
        const started = Date.now();
        const who = `${this.ctx.kind}:${this.ctx.credentialId}`;
        try {
          const data = await run(args);
          this.logger.log(
            `tool=${name} project=${this.ctx.projectSlug} cred=${who} ok ${Date.now() - started}ms`,
          );
          return isToolResult(data) ? data : jsonResult(data);
        } catch (err) {
          this.logger.warn(
            `tool=${name} project=${this.ctx.projectSlug} cred=${who} error ${Date.now() - started}ms`,
          );
          return toToolError(err, this.logger);
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK generic bridging
      }) as any,
    );
  }
}

// ---------------------------------------------------------------------------
// Shared zod fragments
// ---------------------------------------------------------------------------

export const slugArg = (what: string) =>
  z
    .string()
    .min(1)
    .max(200)
    .describe(`URL slug of the ${what} (as returned by list/search tools)`);

export const idArg = (what: string) =>
  z.string().min(1).max(64).describe(`Id of the ${what}`);

export const limitArg = (def: number, max = 200) =>
  z
    .number()
    .int()
    .min(1)
    .max(max)
    .optional()
    .describe(`Max results to return (default ${def}, max ${max})`);
