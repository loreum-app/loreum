import { Injectable, Logger } from "@nestjs/common";
import { ApiKeyPermission, OAuthClient } from "../../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfig } from "../config/app.config";
import { ProjectsService } from "../projects/projects.service";
import { EntitlementsService } from "../billing/entitlements.service";
import { OAuthClientsService } from "./oauth-clients.service";
import { ConnectionsService } from "./connections.service";
import { OAuthError } from "./oauth.errors";
import { verifyPkceS256 } from "./pkce";
import {
  AUTH_CODE_PREFIX,
  REFRESH_TOKEN_PREFIX,
  generateSecret,
  hashSecret,
} from "./tokens";
import {
  AuthorizeRequestInput,
  MCP_SCOPES,
  McpScope,
  TokenResponse,
  permissionForScopes,
  scopesForPermission,
} from "./oauth.types";

export interface ValidatedAuthorizeRequest {
  client: OAuthClient;
  redirectUri: string;
  state?: string;
  codeChallenge: string;
  scopes: McpScope[];
  /** The MCP resource URL the client asked for (RFC 8707), if any. */
  resource?: string;
  /** Project slug parsed from `resource`, if any. */
  projectSlug?: string;
}

export interface ConsentDecision {
  decision: "allow" | "deny";
  projectSlug?: string;
  permissions?: ApiKeyPermission;
}

/**
 * Loreum's OAuth 2.1 authorization server for MCP clients.
 *
 * Flow: client → GET /v1/oauth/authorize (validated here, then redirected to
 * the web consent page) → user approves → POST /v1/oauth/consent issues a
 * PKCE-bound single-use code → client → POST /v1/oauth/token exchanges it for
 * an opaque access token + rotating refresh token, both bound to one project
 * (the RFC 8707 resource).
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private prisma: PrismaService,
    private config: AppConfig,
    private clients: OAuthClientsService,
    private connections: ConnectionsService,
    private projectsService: ProjectsService,
    private entitlements: EntitlementsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Authorization request validation
  // ---------------------------------------------------------------------------

  /**
   * Validate an authorization request. Client/redirect problems throw a direct
   * error (never redirect to an unverified URI); everything else throws an
   * error carrying the redirect URI so the caller can report it to the client.
   */
  async validateAuthorizeRequest(
    input: AuthorizeRequestInput,
  ): Promise<ValidatedAuthorizeRequest> {
    const client = await this.clients.requireByClientId(input.client_id);
    const redirectUri = this.clients.resolveRedirectUri(
      client,
      input.redirect_uri,
    );
    const state = input.state;
    const fail = (
      code:
        | "invalid_request"
        | "unsupported_response_type"
        | "invalid_scope"
        | "invalid_target",
      message: string,
    ) => new OAuthError(code, message, { redirectUri, state });

    if (input.response_type !== "code") {
      throw fail("unsupported_response_type", "response_type must be 'code'");
    }
    if (!input.code_challenge) {
      throw fail("invalid_request", "code_challenge is required (PKCE)");
    }
    if (input.code_challenge_method !== "S256") {
      throw fail("invalid_request", "code_challenge_method must be S256");
    }

    const requested = (input.scope ?? "").split(/\s+/).filter(Boolean);
    const unknown = requested.filter(
      (s) => !(MCP_SCOPES as readonly string[]).includes(s),
    );
    if (unknown.length) {
      throw fail("invalid_scope", `Unknown scope(s): ${unknown.join(", ")}`);
    }
    // No scope requested means "everything the user is willing to grant".
    const scopes = (
      requested.length ? requested : [...MCP_SCOPES]
    ) as McpScope[];

    let resource: string | undefined;
    let projectSlug: string | undefined;
    if (input.resource) {
      const slug = this.projectSlugFromResource(input.resource);
      if (!slug) {
        throw fail(
          "invalid_target",
          `resource must be a project MCP URL like ${this.config.mcp.resourceUrl("<project>")}`,
        );
      }
      resource = this.config.mcp.resourceUrl(slug);
      projectSlug = slug;
    }

    return {
      client,
      redirectUri,
      state,
      codeChallenge: input.code_challenge,
      scopes,
      resource,
      projectSlug,
    };
  }

  /** Parse `${publicUrl}/v1/mcp/<slug>` (trailing slash tolerated) into a slug. */
  projectSlugFromResource(resource: string): string | null {
    let url: URL;
    try {
      url = new URL(resource);
    } catch {
      return null;
    }
    if (url.hash || url.search) return null;
    const prefix = `${this.config.publicUrl}/v1/mcp/`;
    const normalized = `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
    if (!normalized.startsWith(prefix)) return null;
    const slug = normalized.slice(prefix.length);
    return /^[\w-]+$/.test(slug) ? slug : null;
  }

  /** Where the authorization endpoint sends the browser: the web consent page. */
  consentPageUrl(input: AuthorizeRequestInput): string {
    const url = new URL("/authorize", `${this.config.webUrl}/`);
    for (const [k, v] of Object.entries(input)) {
      if (typeof v === "string" && v.length) url.searchParams.set(k, v);
    }
    return url.href;
  }

  // ---------------------------------------------------------------------------
  // Consent
  // ---------------------------------------------------------------------------

  /** Everything the consent page needs to render. */
  async consentContext(userId: string, input: AuthorizeRequestInput) {
    const v = await this.validateAuthorizeRequest(input);
    const projects = await this.projectsService.findAllByUser(userId);
    const target = v.projectSlug
      ? (projects.find((p) => p.slug === v.projectSlug) ?? null)
      : null;
    const redirect = new URL(v.redirectUri);
    return {
      client: {
        clientId: v.client.clientId,
        name: v.client.name ?? "Unnamed MCP client",
        uri: v.client.uri,
        logoUri: v.client.logoUri,
        redirectHost: redirect.host || redirect.protocol,
        isLoopbackRedirect: /^(localhost|127\.0\.0\.1|\[::1\])$/.test(
          redirect.hostname,
        ),
      },
      requestedScopes: v.scopes,
      /** Fixed when the client asked for a specific project's MCP URL. */
      project: target ? { slug: target.slug, name: target.name } : null,
      /** True when `resource` named a project this user does not own. */
      projectUnavailable: Boolean(v.projectSlug && !target),
      projects: projects.map((p) => ({ slug: p.slug, name: p.name })),
    };
  }

  /**
   * Record the user's decision. Returns the URL the browser must be sent to.
   * Everything is re-validated here: the consent page's hidden fields are
   * untrusted input.
   */
  async decideConsent(
    userId: string,
    input: AuthorizeRequestInput,
    decision: ConsentDecision,
  ): Promise<{ redirect: string }> {
    const v = await this.validateAuthorizeRequest(input);

    if (decision.decision !== "allow") {
      return {
        redirect: new OAuthError(
          "access_denied",
          "The user denied the request",
          {
            redirectUri: v.redirectUri,
            state: v.state,
          },
        ).toRedirectUrl(),
      };
    }

    const projectSlug = v.projectSlug ?? decision.projectSlug;
    if (!projectSlug) {
      throw new OAuthError("invalid_request", "A project must be selected");
    }
    if (decision.projectSlug && decision.projectSlug !== projectSlug) {
      throw new OAuthError(
        "invalid_target",
        "The selected project does not match the requested resource",
      );
    }
    // Throws 403/404 if the user does not own it — the consent page must not
    // be able to grant a project the signed-in user cannot access.
    const project = await this.projectsService.findBySlug(projectSlug, userId);
    await this.entitlements.assertFeature(userId, "mcp");

    // Never grant more than the client requested; the user may grant less.
    const maxPermission = permissionForScopes(v.scopes);
    let permissions: ApiKeyPermission = decision.permissions ?? maxPermission;
    if (permissions === "READ_WRITE" && maxPermission === "READ_ONLY") {
      permissions = "READ_ONLY";
    }

    const code = generateSecret(AUTH_CODE_PREFIX);
    await this.prisma.oAuthAuthorizationCode.create({
      data: {
        codeHash: hashSecret(code),
        clientId: v.client.id,
        userId,
        projectId: project.id,
        permissions,
        redirectUri: v.redirectUri,
        codeChallenge: v.codeChallenge,
        codeChallengeMethod: "S256",
        resource: this.config.mcp.resourceUrl(project.slug),
        scope: scopesForPermission(permissions).join(" "),
        expiresAt: new Date(
          Date.now() + this.config.oauth.authorizationCodeTtlSeconds * 1000,
        ),
      },
    });

    const url = new URL(v.redirectUri);
    url.searchParams.set("code", code);
    if (v.state) url.searchParams.set("state", v.state);
    // RFC 9207: lets the client detect mix-up attacks.
    url.searchParams.set("iss", this.config.mcp.issuer);
    return { redirect: url.href };
  }

  // ---------------------------------------------------------------------------
  // Token endpoint
  // ---------------------------------------------------------------------------

  async exchangeAuthorizationCode(
    client: OAuthClient,
    params: {
      code?: string;
      code_verifier?: string;
      redirect_uri?: string;
      resource?: string;
    },
  ): Promise<TokenResponse> {
    if (!params.code)
      throw new OAuthError("invalid_request", "code is required");
    if (!params.code_verifier) {
      throw new OAuthError("invalid_request", "code_verifier is required");
    }

    // Single-use: exactly one caller can flip consumedAt, even under a race.
    const codeHash = hashSecret(params.code);
    const consumed = await this.prisma.$queryRaw<{ id: string }[]>`
      UPDATE "oauth_authorization_codes"
      SET "consumedAt" = NOW()
      WHERE "codeHash" = ${codeHash}
        AND "consumedAt" IS NULL
        AND "expiresAt" > NOW()
      RETURNING "id"
    `;

    if (!consumed.length) {
      const existing = await this.prisma.oAuthAuthorizationCode.findUnique({
        where: { codeHash },
        select: {
          id: true,
          consumedAt: true,
          connectionId: true,
          clientId: true,
        },
      });
      if (existing?.consumedAt && existing.connectionId) {
        // Replayed code: revoke everything minted from it (OAuth 2.1 §4.1.2).
        this.logger.warn(
          `Authorization code replay detected (client ${client.clientId}); revoking connection ${existing.connectionId}`,
        );
        await this.connections.revoke(existing.connectionId);
      }
      throw new OAuthError(
        "invalid_grant",
        "Authorization code is invalid or expired",
      );
    }

    const record = await this.prisma.oAuthAuthorizationCode.findUniqueOrThrow({
      where: { id: consumed[0]!.id },
    });

    if (record.clientId !== client.id) {
      throw new OAuthError(
        "invalid_grant",
        "Authorization code was issued to another client",
      );
    }
    if (
      params.redirect_uri !== undefined &&
      params.redirect_uri !== record.redirectUri
    ) {
      throw new OAuthError(
        "invalid_grant",
        "redirect_uri does not match the authorization request",
      );
    }
    if (!verifyPkceS256(params.code_verifier, record.codeChallenge)) {
      throw new OAuthError(
        "invalid_grant",
        "code_verifier does not match code_challenge",
      );
    }
    if (params.resource !== undefined && params.resource !== record.resource) {
      throw new OAuthError(
        "invalid_target",
        "resource does not match the authorization request",
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const connection = await this.connections.create(
        {
          clientId: record.clientId,
          userId: record.userId,
          projectId: record.projectId,
          permissions: record.permissions,
          resource: record.resource,
        },
        tx,
      );
      await tx.oAuthAuthorizationCode.update({
        where: { id: record.id },
        data: { connectionId: connection.id },
      });
      const issued = await this.connections.issueTokens(connection.id, tx);
      return {
        access_token: issued.accessToken,
        token_type: "Bearer" as const,
        expires_in: issued.expiresIn,
        refresh_token: issued.refreshToken,
        scope: connection.scopes.join(" "),
      };
    });
  }

  /**
   * Rotating refresh: the presented token is consumed and a new pair issued.
   * Presenting an already-consumed token means it leaked (or the client is
   * broken); either way the whole connection is revoked.
   */
  async refresh(
    client: OAuthClient,
    params: { refresh_token?: string; scope?: string; resource?: string },
  ): Promise<TokenResponse> {
    if (!params.refresh_token?.startsWith(REFRESH_TOKEN_PREFIX)) {
      throw new OAuthError("invalid_grant", "Invalid refresh token");
    }
    const tokenHash = hashSecret(params.refresh_token);
    const token = await this.prisma.oAuthRefreshToken.findUnique({
      where: { tokenHash },
      include: { connection: true },
    });
    if (!token) throw new OAuthError("invalid_grant", "Invalid refresh token");

    const conn = token.connection;
    if (conn.clientId !== client.id) {
      throw new OAuthError(
        "invalid_grant",
        "Refresh token was issued to another client",
      );
    }
    if (conn.revokedAt) {
      throw new OAuthError("invalid_grant", "This connection has been revoked");
    }
    if (token.consumedAt) {
      this.logger.warn(
        `Refresh token reuse detected (client ${client.clientId}); revoking connection ${conn.id}`,
      );
      await this.connections.revoke(conn.id);
      throw new OAuthError(
        "invalid_grant",
        "Refresh token has already been used",
      );
    }
    if (token.expiresAt < new Date()) {
      throw new OAuthError("invalid_grant", "Refresh token has expired");
    }
    if (params.resource !== undefined && params.resource !== conn.resource) {
      throw new OAuthError(
        "invalid_target",
        "resource does not match this connection",
      );
    }
    if (params.scope) {
      const requested = params.scope.split(/\s+/).filter(Boolean);
      if (requested.some((s) => !conn.scopes.includes(s))) {
        throw new OAuthError(
          "invalid_scope",
          "Requested scope exceeds the original grant",
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Guard the rotation itself against a concurrent double-spend.
      const { count } = await tx.oAuthRefreshToken.updateMany({
        where: { id: token.id, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      if (count !== 1) {
        throw new OAuthError(
          "invalid_grant",
          "Refresh token has already been used",
        );
      }
      await this.connections.pruneExpiredAccessTokens(conn.id, tx);
      const issued = await this.connections.issueTokens(conn.id, tx);
      return {
        access_token: issued.accessToken,
        token_type: "Bearer" as const,
        expires_in: issued.expiresIn,
        refresh_token: issued.refreshToken,
        scope: conn.scopes.join(" "),
      };
    });
  }

  /**
   * RFC 7009 revocation. Revoking either token kind revokes the connection.
   * Unknown tokens are a no-op (the spec requires 200 regardless).
   */
  async revoke(client: OAuthClient, token: string | undefined): Promise<void> {
    if (!token) return;
    const tokenHash = hashSecret(token);
    const [access, refresh] = await Promise.all([
      this.prisma.oAuthAccessToken.findUnique({
        where: { tokenHash },
        select: { connection: { select: { id: true, clientId: true } } },
      }),
      this.prisma.oAuthRefreshToken.findUnique({
        where: { tokenHash },
        select: { connection: { select: { id: true, clientId: true } } },
      }),
    ]);
    const conn = access?.connection ?? refresh?.connection;
    if (conn && conn.clientId === client.id) {
      await this.connections.revoke(conn.id);
    }
  }
}
