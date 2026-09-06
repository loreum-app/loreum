import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ApiKeyPermission, Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfig } from "../config/app.config";
import {
  ACCESS_TOKEN_PREFIX,
  REFRESH_TOKEN_PREFIX,
  generateSecret,
  hashSecret,
} from "./tokens";
import { McpAuthContext, McpScope, scopesForPermission } from "./oauth.types";

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: Date;
}

type Tx = Prisma.TransactionClient;

/**
 * An McpConnection is a user's grant of one project to one OAuth client.
 * Access tokens and rotating refresh tokens belong to the connection, so
 * revoking it invalidates everything at once, and reuse of a rotated refresh
 * token (theft signal) revokes the whole connection.
 */
@Injectable()
export class ConnectionsService {
  private readonly logger = new Logger(ConnectionsService.name);

  constructor(
    private prisma: PrismaService,
    private config: AppConfig,
  ) {}

  async create(
    input: {
      clientId: string;
      userId: string;
      projectId: string;
      permissions: ApiKeyPermission;
      resource: string;
    },
    tx: Tx = this.prisma,
  ) {
    return tx.mcpConnection.create({
      data: {
        clientId: input.clientId,
        userId: input.userId,
        projectId: input.projectId,
        permissions: input.permissions,
        resource: input.resource,
        scopes: scopesForPermission(input.permissions),
      },
    });
  }

  /** Mint a fresh access + refresh token pair for a connection. */
  async issueTokens(
    connectionId: string,
    tx: Tx = this.prisma,
  ): Promise<IssuedTokens> {
    const { accessTokenTtlSeconds, refreshTokenTtlSeconds } = this.config.oauth;
    const accessToken = generateSecret(ACCESS_TOKEN_PREFIX);
    const refreshToken = generateSecret(REFRESH_TOKEN_PREFIX);
    const expiresAt = new Date(Date.now() + accessTokenTtlSeconds * 1000);

    await tx.oAuthAccessToken.create({
      data: { tokenHash: hashSecret(accessToken), connectionId, expiresAt },
    });
    await tx.oAuthRefreshToken.create({
      data: {
        tokenHash: hashSecret(refreshToken),
        connectionId,
        expiresAt: new Date(Date.now() + refreshTokenTtlSeconds * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenTtlSeconds,
      expiresAt,
    };
  }

  /**
   * Resolve a raw access token to its MCP auth context, or null if unknown,
   * expired, or revoked. Never throws for bad tokens.
   */
  async resolveAccessToken(raw: string): Promise<McpAuthContext | null> {
    if (!raw.startsWith(ACCESS_TOKEN_PREFIX)) return null;

    const token = await this.prisma.oAuthAccessToken.findUnique({
      where: { tokenHash: hashSecret(raw) },
      include: {
        connection: {
          include: {
            client: { select: { clientId: true, name: true } },
            project: { select: { id: true, slug: true, ownerId: true } },
          },
        },
      },
    });
    if (!token) return null;
    if (token.expiresAt < new Date()) return null;
    const conn = token.connection;
    if (conn.revokedAt) return null;

    this.prisma.mcpConnection
      .update({ where: { id: conn.id }, data: { lastUsedAt: new Date() } })
      .catch((err: unknown) =>
        this.logger.warn(`lastUsedAt update failed: ${String(err)}`),
      );

    return {
      kind: "oauth",
      credentialId: conn.id,
      clientId: conn.client.clientId,
      clientName: conn.client.name,
      projectId: conn.project.id,
      projectSlug: conn.project.slug,
      ownerId: conn.project.ownerId,
      permissions: conn.permissions,
      scopes: conn.scopes as McpScope[],
      resource: conn.resource,
      expiresAt: Math.floor(token.expiresAt.getTime() / 1000),
    };
  }

  /** Active connections for a project (the "Connected apps" list). */
  async listByProject(projectId: string) {
    const rows = await this.prisma.mcpConnection.findMany({
      where: { projectId, revokedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: { clientId: true, name: true, uri: true, logoUri: true },
        },
      },
    });
    return rows.map((c) => ({
      id: c.id,
      client: {
        clientId: c.client.clientId,
        name: c.client.name ?? "Unnamed MCP client",
        uri: c.client.uri,
        logoUri: c.client.logoUri,
      },
      permissions: c.permissions,
      scopes: c.scopes,
      lastUsedAt: c.lastUsedAt,
      createdAt: c.createdAt,
    }));
  }

  async revoke(connectionId: string, tx: Tx = this.prisma): Promise<void> {
    await tx.mcpConnection.updateMany({
      where: { id: connectionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Revoke from the project settings UI; 404 if the id isn't in this project. */
  async revokeForProject(
    connectionId: string,
    projectId: string,
  ): Promise<void> {
    const conn = await this.prisma.mcpConnection.findFirst({
      where: { id: connectionId, projectId },
      select: { id: true },
    });
    if (!conn) throw new NotFoundException("Connection not found");
    await this.revoke(conn.id);
  }

  /** Housekeeping: drop expired access tokens for a connection. */
  async pruneExpiredAccessTokens(connectionId: string, tx: Tx = this.prisma) {
    await tx.oAuthAccessToken.deleteMany({
      where: { connectionId, expiresAt: { lt: new Date() } },
    });
  }
}
