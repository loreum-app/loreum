import { ApiKeyPermission } from "../../generated/prisma/client";

/** OAuth scopes understood by the MCP resource. */
export const MCP_SCOPES = ["read", "write"] as const;
export type McpScope = (typeof MCP_SCOPES)[number];

export function scopesForPermission(p: ApiKeyPermission): McpScope[] {
  return p === "READ_WRITE" ? ["read", "write"] : ["read"];
}

export function permissionForScopes(
  scopes: readonly string[],
): ApiKeyPermission {
  return scopes.includes("write") ? "READ_WRITE" : "READ_ONLY";
}

/**
 * What the MCP guard resolves a bearer credential to. Every tool handler is
 * scoped to `projectId`; the project is never taken from request input.
 */
export interface McpAuthContext {
  kind: "api_key" | "oauth";
  /** ApiKey.id or McpConnection.id */
  credentialId: string;
  /** Public OAuth client_id, or "api-key" for keys. */
  clientId: string;
  clientName: string | null;
  projectId: string;
  projectSlug: string;
  ownerId: string;
  permissions: ApiKeyPermission;
  scopes: McpScope[];
  /** RFC 8707 audience the credential was issued for (OAuth only). */
  resource: string | null;
  /** Access token expiry, seconds since epoch (OAuth only). */
  expiresAt?: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

/** Raw query/body of an authorization request before validation. */
export interface AuthorizeRequestInput {
  response_type?: string;
  client_id?: string;
  redirect_uri?: string;
  code_challenge?: string;
  code_challenge_method?: string;
  scope?: string;
  state?: string;
  resource?: string;
}
