import { All, Body, Controller, Req, Res, UseGuards } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { McpAuthGuard } from "./mcp-auth.guard";
import { McpService } from "./mcp.service";

/**
 * Streamable HTTP MCP endpoint.
 *
 *   /v1/mcp/:projectSlug  — canonical per-project URL. Accepts project API keys
 *                            and OAuth access tokens (RFC 8707 audience-bound).
 *                            Unauthenticated requests get a 401 whose
 *                            WWW-Authenticate header points at the project's
 *                            protected-resource metadata, which is how claude.ai,
 *                            Claude Code, and Cursor discover the OAuth server.
 *   /v1/mcp               — legacy project-less URL; API keys only (the key
 *                            already pins the project).
 *
 * All HTTP methods are forwarded: the SDK answers POST (JSON-RPC), GET/DELETE
 * (405 in stateless mode for 2025-era clients), and the 2026-07-28 request
 * envelope. Auth failures are decided here, before the SDK sees the request.
 *
 * Rate limits are per credential (see AppThrottlerGuard) and higher than the
 * API default: one agent turn legitimately bursts a handshake, tools/list, and
 * several parallel tool calls within a second.
 */
@ApiExcludeController()
@Controller("mcp")
@Throttle({
  short: { limit: 40, ttl: 1000 },
  medium: { limit: 200, ttl: 10_000 },
  long: { limit: 1_000, ttl: 60_000 },
})
@UseGuards(McpAuthGuard)
export class McpController {
  constructor(private mcpService: McpService) {}

  @All(":projectSlug")
  handleProject(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: unknown,
  ) {
    return this.mcpService.handle(req, res, body);
  }

  @All()
  handleLegacy(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: unknown,
  ) {
    return this.mcpService.handle(req, res, body);
  }
}
