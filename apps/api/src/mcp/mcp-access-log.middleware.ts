import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

/**
 * One log line per MCP HTTP exchange, written when the response finishes.
 * Runs before guards, so rejected and throttled requests are recorded too.
 * Remote MCP clients (claude.ai, Claude Code…) show users nothing more than
 * "couldn't connect"; this is what makes their failures diagnosable.
 */
@Injectable()
export class McpAccessLogMiddleware implements NestMiddleware {
  private readonly logger = new Logger("MCP");

  use(req: Request, res: Response, next: NextFunction) {
    const started = Date.now();
    const auth = req.headers.authorization;
    const cred = !auth
      ? "none"
      : auth.startsWith("Bearer lrma_")
        ? "oauth"
        : auth.startsWith("Bearer lrm_")
          ? "api-key"
          : "other";
    const body = req.body as
      { method?: string; id?: unknown; params?: { name?: string } } | undefined;
    const rpc =
      body && typeof body === "object" && typeof body.method === "string"
        ? `${body.method}${body.params?.name ? `(${body.params.name})` : ""}`
        : "-";

    res.on("finish", () => {
      const h = (name: string) => req.headers[name] ?? "-";
      this.logger.log(
        `${req.method} ${req.originalUrl} rpc=${rpc} cred=${cred} -> ${res.statusCode} ${Date.now() - started}ms ` +
          `proto=${h("mcp-protocol-version")} mcp-method=${h("mcp-method")} accept="${h("accept")}" ` +
          `ct=${h("content-type")} ua="${h("user-agent")}" ip=${req.ip}`,
      );
    });
    next();
  }
}
