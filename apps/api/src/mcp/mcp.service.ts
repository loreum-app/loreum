import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Request, Response } from "express";
import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";
import type { McpHttpHandler } from "@modelcontextprotocol/server";
import { toNodeHandler } from "@modelcontextprotocol/node";
import type { NodeMcpRequestHandler } from "@modelcontextprotocol/node";
import { ProjectsService } from "../projects/projects.service";
import { EntitiesService } from "../entities/entities.service";
import { EntityTypesService } from "../entity-types/entity-types.service";
import { StoryboardService } from "../storyboard/storyboard.service";
import { RelationshipsService } from "../relationships/relationships.service";
import { LoreService } from "../lore/lore.service";
import { TimelineService } from "../timeline/timeline.service";
import { ErasService } from "../timeline/eras.service";
import { TagsService } from "../tags/tags.service";
import { SearchService } from "../search/search.service";
import { AppConfig } from "../config/app.config";
import { McpAuthContext } from "../oauth/oauth.types";
import { mcpContextFromAuthInfo } from "./mcp-auth.guard";
import { ToolRegistrar } from "./tool-utils";
import { registerProjectTools } from "./tools/project.tools";
import { registerEntityTools } from "./tools/entity.tools";
import { registerRelationshipTools } from "./tools/relationship.tools";
import { registerLoreTools } from "./tools/lore.tools";
import { registerTimelineTools } from "./tools/timeline.tools";
import { registerStoryboardTools } from "./tools/storyboard.tools";
import { registerChatGptTools } from "./tools/chatgpt.tools";

export const MCP_SERVER_NAME = "loreum";
export const MCP_SERVER_VERSION = "0.2.0";

/**
 * Builds the per-request MCP server for the project the caller's credential is
 * bound to. The handler is stateless (no sessions), so it works unchanged
 * behind load balancers and PM2 clusters, and serves both the 2026-07-28
 * protocol and 2025-era clients (claude.ai, Claude Code, Cursor…) through the
 * SDK's legacy fallback.
 *
 * Tools call the domain services directly with `ctx.projectId` closed over from
 * the credential — the project is never taken from tool input.
 */
@Injectable()
export class McpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(McpService.name);
  private handler!: McpHttpHandler;
  private nodeHandler!: NodeMcpRequestHandler;

  constructor(
    private projectsService: ProjectsService,
    private entitiesService: EntitiesService,
    private entityTypesService: EntityTypesService,
    private storyboardService: StoryboardService,
    private relationshipsService: RelationshipsService,
    private loreService: LoreService,
    private timelineService: TimelineService,
    private erasService: ErasService,
    private tagsService: TagsService,
    private searchService: SearchService,
    private config: AppConfig,
  ) {}

  onModuleInit() {
    this.handler = createMcpHandler(
      ({ authInfo }) => {
        const ctx = mcpContextFromAuthInfo(authInfo);
        if (!ctx) {
          // The guard always runs first; reaching here is a wiring bug.
          throw new Error(
            "MCP request reached the handler without an auth context",
          );
        }
        return this.createServer(ctx);
      },
      {
        onerror: (err) => this.logger.warn(`MCP handler: ${err.message}`),
      },
    );
    this.nodeHandler = toNodeHandler(this.handler, {
      onerror: (err) =>
        this.logger.error(`MCP transport: ${err.message}`, err.stack),
    });
  }

  async onModuleDestroy() {
    await this.handler?.close();
  }

  /** Serve one HTTP exchange. The body was already parsed by Nest. */
  handle(req: Request, res: Response, parsedBody: unknown): Promise<void> {
    return this.nodeHandler(req, res, parsedBody);
  }

  /** A fresh server exposing exactly the tools this credential may use. */
  createServer(ctx: McpAuthContext): McpServer {
    const server = new McpServer(
      { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION, title: "Loreum" },
      {
        instructions: [
          `You are connected to the Loreum world "${ctx.projectSlug}" with ${
            ctx.permissions === "READ_WRITE" ? "read and write" : "read-only"
          } access.`,
          "Start with get_project for an overview, then search_project or the list_* tools to find things by slug/id before reading or editing them.",
          "Entities (characters, locations, organizations, items) are addressed by slug; timeline events, scenes, chapters, plot points, and relationships by id.",
          "Timeline date fields differ by calendar mode; get_project → timeline.dateGuide says exactly which fields to fill and in what format.",
          ctx.permissions === "READ_WRITE"
            ? "Before creating something, search for it to avoid duplicates. Delete tools are irreversible: confirm with the user first."
            : "This connection cannot modify the world; ask the user for a read-write connection if changes are needed.",
        ].join(" "),
      },
    );

    const reg = new ToolRegistrar(server, ctx, this.logger);

    // Registration order is the tools/list order; keep it stable so clients
    // can cache the list and LLM prompt caches hit.
    registerProjectTools(reg, ctx, {
      projects: this.projectsService,
      search: this.searchService,
      entityTypes: this.entityTypesService,
      tags: this.tagsService,
    });
    // ChatGPT's connector contract (`search` / `fetch`) sits right after the
    // orientation tools so every client sees the same stable order.
    registerChatGptTools(reg, ctx, {
      search: this.searchService,
      entities: this.entitiesService,
      lore: this.loreService,
      timeline: this.timelineService,
      storyboard: this.storyboardService,
      webUrl: this.config.webUrl,
    });
    registerEntityTools(reg, ctx, this.entitiesService);
    registerRelationshipTools(reg, ctx, this.relationshipsService);
    registerLoreTools(reg, ctx, this.loreService);
    registerTimelineTools(reg, ctx, {
      timeline: this.timelineService,
      eras: this.erasService,
    });
    registerStoryboardTools(reg, ctx, this.storyboardService);

    server.registerResource(
      "project_overview",
      "loreum://project/overview",
      {
        title: "Project overview",
        description:
          "Name, description, timeline settings, and content counts of the connected world",
        mimeType: "application/json",
      },
      async (uri) => {
        const summary = await this.projectsService.getSummary(ctx.projectId);
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      },
    );

    return server;
  }
}
