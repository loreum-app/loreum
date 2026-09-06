import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";
import { z } from "zod";
import { OAuthClient } from "../../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AppConfig } from "../config/app.config";
import { OAuthError } from "./oauth.errors";
import { generateSecret, hashSecret, safeEqual } from "./tokens";
import { CimdService, isCimdClientId } from "./cimd.service";
import { assertValidRedirectUri, redirectUriMatches } from "./redirect-uris";

const AUTH_METHODS = [
  "none",
  "client_secret_post",
  "client_secret_basic",
] as const;
const SUPPORTED_GRANTS = ["authorization_code", "refresh_token"];

/** RFC 7591 §2 client metadata (the subset MCP clients send). */
export const ClientMetadataSchema = z.object({
  redirect_uris: z.array(z.string().min(1).max(2048)).min(1).max(20),
  token_endpoint_auth_method: z.enum(AUTH_METHODS).optional(),
  grant_types: z.array(z.string()).optional(),
  response_types: z.array(z.string()).optional(),
  client_name: z.string().max(200).optional(),
  client_uri: z.string().url().max(2048).optional(),
  logo_uri: z.string().url().max(2048).optional().or(z.literal("")),
  scope: z.string().max(500).optional(),
  contacts: z.array(z.string().max(320)).max(10).optional(),
  software_id: z.string().max(200).optional(),
  software_version: z.string().max(100).optional(),
  application_type: z.enum(["web", "native"]).optional(),
});
export type ClientMetadata = z.infer<typeof ClientMetadataSchema>;

/** RFC 7591 §3.2.1 client information response. */
export interface ClientInformation {
  client_id: string;
  client_secret?: string;
  client_id_issued_at: number;
  client_secret_expires_at?: number;
  redirect_uris: string[];
  token_endpoint_auth_method: string;
  grant_types: string[];
  response_types: string[];
  client_name?: string;
  client_uri?: string;
  logo_uri?: string;
  scope?: string;
  contacts?: string[];
  software_id?: string;
  software_version?: string;
}

@Injectable()
export class OAuthClientsService {
  constructor(
    private prisma: PrismaService,
    private config: AppConfig,
    private cimd: CimdService,
  ) {}

  /** RFC 7591 dynamic client registration. */
  async register(input: unknown): Promise<ClientInformation> {
    const parsed = ClientMetadataSchema.safeParse(input);
    if (!parsed.success) {
      throw new OAuthError(
        "invalid_client_metadata",
        parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      );
    }
    const meta = parsed.data;
    for (const uri of meta.redirect_uris) assertValidRedirectUri(uri);

    const grantTypes = meta.grant_types?.length
      ? meta.grant_types
      : ["authorization_code", "refresh_token"];
    const unsupported = grantTypes.filter((g) => !SUPPORTED_GRANTS.includes(g));
    if (unsupported.length) {
      throw new OAuthError(
        "invalid_client_metadata",
        `Unsupported grant_types: ${unsupported.join(", ")}`,
      );
    }
    const responseTypes = meta.response_types?.length
      ? meta.response_types
      : ["code"];
    if (responseTypes.some((r) => r !== "code")) {
      throw new OAuthError(
        "invalid_client_metadata",
        "Only response_type=code is supported",
      );
    }

    // RFC 7591 default is client_secret_basic; MCP clients are usually public.
    const authMethod = meta.token_endpoint_auth_method ?? "client_secret_basic";
    const secret = authMethod === "none" ? undefined : generateSecret("lrms_");
    const ttl = this.config.oauth.clientSecretTtlSeconds;
    const secretExpiresAt =
      secret && ttl > 0 ? new Date(Date.now() + ttl * 1000) : null;

    const client = await this.prisma.oAuthClient.create({
      data: {
        clientId: crypto.randomUUID(),
        secretHash: secret ? hashSecret(secret) : null,
        secretExpiresAt,
        name: meta.client_name,
        uri: meta.client_uri,
        logoUri: meta.logo_uri || null,
        redirectUris: meta.redirect_uris,
        grantTypes,
        responseTypes,
        tokenEndpointAuthMethod: authMethod,
        scope: meta.scope,
        contacts: meta.contacts ?? [],
        softwareId: meta.software_id,
        softwareVersion: meta.software_version,
        registration: "dynamic",
      },
    });

    return this.toInformation(client, secret);
  }

  toInformation(client: OAuthClient, secret?: string): ClientInformation {
    return {
      client_id: client.clientId,
      ...(secret !== undefined && {
        client_secret: secret,
        client_secret_expires_at: client.secretExpiresAt
          ? Math.floor(client.secretExpiresAt.getTime() / 1000)
          : 0,
      }),
      client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
      redirect_uris: client.redirectUris,
      token_endpoint_auth_method: client.tokenEndpointAuthMethod,
      grant_types: client.grantTypes,
      response_types: client.responseTypes,
      ...(client.name && { client_name: client.name }),
      ...(client.uri && { client_uri: client.uri }),
      ...(client.logoUri && { logo_uri: client.logoUri }),
      ...(client.scope && { scope: client.scope }),
      ...(client.contacts.length && { contacts: client.contacts }),
      ...(client.softwareId && { software_id: client.softwareId }),
      ...(client.softwareVersion && {
        software_version: client.softwareVersion,
      }),
    };
  }

  async findByClientId(clientId: string): Promise<OAuthClient | null> {
    return this.prisma.oAuthClient.findUnique({ where: { clientId } });
  }

  async requireByClientId(clientId: string | undefined): Promise<OAuthClient> {
    if (!clientId)
      throw new OAuthError("invalid_request", "client_id is required");
    // URL-shaped ids are Client ID Metadata Documents: fetch (or use the
    // cached copy of) the document instead of looking for a registration.
    if (isCimdClientId(clientId)) return this.cimd.resolve(clientId);
    const client = await this.findByClientId(clientId);
    if (!client)
      throw new OAuthError("invalid_client", "Unknown client_id", {
        status: 401,
      });
    return client;
  }

  /**
   * Authenticate a client at the token/revocation endpoint (RFC 6749 §2.3).
   * Confidential clients must present their secret (HTTP Basic or body);
   * public clients (`token_endpoint_auth_method: none`) are identified by
   * client_id alone and rely on PKCE.
   */
  async authenticate(
    clientId: string | undefined,
    clientSecret: string | undefined,
  ): Promise<OAuthClient> {
    const client = await this.requireByClientId(clientId);
    if (client.secretHash) {
      if (!clientSecret) {
        throw new OAuthError(
          "invalid_client",
          "Client authentication required",
          { status: 401 },
        );
      }
      if (!safeEqual(hashSecret(clientSecret), client.secretHash)) {
        throw new OAuthError("invalid_client", "Invalid client credentials", {
          status: 401,
        });
      }
      if (client.secretExpiresAt && client.secretExpiresAt < new Date()) {
        throw new OAuthError("invalid_client", "Client secret has expired", {
          status: 401,
        });
      }
    }
    return client;
  }

  /**
   * Resolve the redirect URI for an authorization request: it must match a
   * registered URI (or an operator-configured extra); when omitted it may only
   * default if the client registered exactly one.
   */
  resolveRedirectUri(
    client: OAuthClient,
    requested: string | undefined,
  ): string {
    const allowed = [
      ...client.redirectUris,
      ...this.config.oauth.extraAllowedRedirectUris,
    ];
    if (requested === undefined) {
      if (client.redirectUris.length === 1) return client.redirectUris[0]!;
      throw new OAuthError(
        "invalid_request",
        "redirect_uri is required when the client has multiple registered redirect URIs",
      );
    }
    if (!allowed.some((r) => redirectUriMatches(r, requested))) {
      throw new OAuthError(
        "invalid_request",
        "redirect_uri is not registered for this client",
      );
    }
    return requested;
  }
}
