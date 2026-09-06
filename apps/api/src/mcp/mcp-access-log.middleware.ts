import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";
import { extractBearerToken } from "../common/utils/bearer";

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
    const token = extractBearerToken(req.headers.authorization);
    const cred = !req.headers.authorization
      ? "none"
      : !token
        ? "non-bearer"
        : token.startsWith("lrma_")
          ? "oauth"
          : token.startsWith("lrm_")
            ? "api-key"
            : "unknown-prefix";
    const body = req.body as
      { method?: string; id?: unknown; params?: { name?: string } } | undefined;
    const rpc =
      body && typeof body === "object" && typeof body.method === "string"
        ? `${body.method}${body.params?.name ? `(${body.params.name})` : ""}`
        : "-";

    let logged = false;
    const log = (outcome: string) => {
      if (logged) return;
      logged = true;
      const h = (name: string) => req.headers[name] ?? "-";
      this.logger.log(
        `${req.method} ${req.originalUrl} rpc=${rpc} cred=${cred} -> ${outcome} ${Date.now() - started}ms ` +
          `proto=${h("mcp-protocol-version")} mcp-method=${h("mcp-method")} accept="${h("accept")}" ` +
          `ct=${h("content-type")} ua="${h("user-agent")}" ip=${req.ip}`,
      );
    };
    res.on("finish", () => log(String(res.statusCode)));
    // Client went away before the response completed (timeout, abort,
    // stalled stream): still record it, with whatever status was set.
    res.on("close", () =>
      log(`${res.statusCode} (connection closed before finish)`),
    );
    next();
  }
}
