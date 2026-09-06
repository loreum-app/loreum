import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Request, Response } from "express";
import type { AuthInfo } from "@modelcontextprotocol/server";
import { AppConfig } from "../config/app.config";
import { ApiKeysService } from "../api-keys/api-keys.service";
import { ConnectionsService } from "../oauth/connections.service";
import { McpAuthContext, scopesForPermission } from "../oauth/oauth.types";
import { isApiKey } from "../oauth/tokens";

/** Where the guard leaves the resolved context for the MCP handler factory. */
export const MCP_AUTH_EXTRA_KEY = "loreum";

export type McpRequest = Request & { auth?: AuthInfo };

export function mcpContextFromAuthInfo(
  authInfo: AuthInfo | undefined,
): McpAuthContext | null {
  const ctx = authInfo?.extra?.[MCP_AUTH_EXTRA_KEY];
  return (ctx as McpAuthContext | undefined) ?? null;
}

/**
 * Authenticates MCP requests with either a project API key (`lrm_…`) or an
 * OAuth access token (`lrma_…`) and pins the request to exactly one project.
 *
 * Audience binding (RFC 8707): on the per-project route `/v1/mcp/:projectSlug`
 * the credential's project must be the one in the URL, and an OAuth token's
 * recorded `resource` must equal that URL. A token minted for world A is
 * therefore useless against world B even though both live on this server.
 *
 * Every rejection is a 401 with `WWW-Authenticate: Bearer resource_metadata=…`
 * so OAuth-capable clients (claude.ai, Claude Code, Cursor…) can discover the
 * authorization server and start the flow on their own.
 */
@Injectable()
export class McpAuthGuard implements CanActivate {
  private readonly logger = new Logger(McpAuthGuard.name);

  constructor(
    private config: AppConfig,
    private apiKeys: ApiKeysService,
    private connections: ConnectionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<McpRequest>();
    const res = context.switchToHttp().getResponse<Response>();
    const slug = (req.params as Record<string, string | undefined>).projectSlug;

    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return this.deny(res, slug, "invalid_request", "Missing bearer token");
    }
    const token = header.slice(7).trim();
    if (!token)
      return this.deny(res, slug, "invalid_request", "Missing bearer token");

    const ctx = isApiKey(token)
      ? await this.resolveApiKey(token)
      : await this.connections.resolveAccessToken(token);

    if (!ctx) {
      return this.deny(
        res,
        slug,
        "invalid_token",
        "Invalid, expired, or revoked credential",
      );
    }

    if (slug) {
      const expected = this.config.mcp.resourceUrl(slug);
      if (
        ctx.projectSlug !== slug ||
        (ctx.kind === "oauth" && ctx.resource !== expected)
      ) {
        this.logger.warn(
          `Audience mismatch: ${ctx.kind} ${ctx.credentialId} (project ${ctx.projectSlug}) presented to /v1/mcp/${slug}`,
        );
        return this.deny(
          res,
          slug,
          "invalid_token",
          "Credential is not valid for this project",
        );
      }
    } else if (ctx.kind === "oauth") {
      // OAuth tokens are audience-bound; the legacy project-less URL has none.
      return this.deny(
        res,
        undefined,
        "invalid_token",
        `OAuth tokens must be used with the project URL: ${this.config.mcp.resourceUrl(ctx.projectSlug)}`,
      );
    }

    req.auth = {
      token,
      clientId: ctx.clientId,
      scopes: ctx.scopes,
      expiresAt: ctx.expiresAt,
      resource: ctx.resource ? new URL(ctx.resource) : undefined,
      extra: { [MCP_AUTH_EXTRA_KEY]: ctx },
    };
    return true;
  }

  private async resolveApiKey(token: string): Promise<McpAuthContext | null> {
    try {
      const key = await this.apiKeys.validate(token);
      return {
        kind: "api_key",
        credentialId: key.id,
        clientId: "api-key",
        clientName: key.name,
        projectId: key.project.id,
        projectSlug: key.project.slug,
        ownerId: key.project.ownerId,
        permissions: key.permissions,
        scopes: scopesForPermission(key.permissions),
        resource: null,
      };
    } catch {
      return null;
    }
  }

  private deny(
    res: Response,
    slug: string | undefined,
    error: "invalid_request" | "invalid_token",
    description: string,
  ): never {
    this.logger.warn(
      `deny ${slug ? `/v1/mcp/${slug}` : "/v1/mcp"}: ${error} — ${description}`,
    );
    const parts = [
      'Bearer realm="loreum"',
      `error="${error}"`,
      `error_description="${description.replace(/"/g, "'")}"`,
    ];
    if (slug) {
      parts.push(
        `resource_metadata="${this.config.mcp.resourceMetadataUrl(slug)}"`,
      );
    }
    res.setHeader("WWW-Authenticate", parts.join(", "));
    throw new UnauthorizedException(description);
  }
}
