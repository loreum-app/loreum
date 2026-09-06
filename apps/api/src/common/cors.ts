import { CorsOptionsDelegate } from "@nestjs/common/interfaces/external/cors-options.interface";
import { Request } from "express";
import { AppConfig } from "../config/app.config";

/** Paths that browser-based MCP/OAuth clients call cross-origin without cookies. */
const OPEN_CORS_PATHS = [
  /^\/\.well-known\//,
  /^\/v1\/mcp(\/|$)/,
  /^\/v1\/oauth\/(authorize|token|register|revoke)$/,
];

/**
 * CORS policy. The web app gets a credentialed, single-origin policy. MCP and
 * OAuth endpoints are bearer/PKCE based (no cookies) and must be reachable from
 * browser-hosted MCP clients (e.g. the MCP Inspector), so they are open to any
 * origin. The consent endpoints are deliberately NOT open: they use the
 * session cookie.
 */
export function corsOptionsDelegate(
  config: AppConfig,
): CorsOptionsDelegate<Request> {
  return (req, callback) => {
    const path = (req.originalUrl ?? req.url ?? "").split("?")[0] ?? "";
    if (OPEN_CORS_PATHS.some((re) => re.test(path))) {
      callback(null, {
        origin: "*",
        credentials: false,
        methods: ["GET", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "Accept",
          "Mcp-Session-Id",
          "Mcp-Protocol-Version",
          "Mcp-Method",
          "Mcp-Name",
          "Last-Event-ID",
        ],
        exposedHeaders: [
          "Mcp-Session-Id",
          "Mcp-Protocol-Version",
          "WWW-Authenticate",
        ],
        maxAge: 600,
      });
      return;
    }
    callback(null, {
      origin: config.api.corsOrigin,
      credentials: true,
      allowedHeaders: ["Content-Type", "x-csrf-token"],
    });
  };
}
