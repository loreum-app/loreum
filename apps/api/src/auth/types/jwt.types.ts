import { Role, ApiKeyPermission } from "../../../generated/prisma/client";

export interface JwtPayload {
  sub: string; // userId
  email: string;
  roles: Role[];
  sessionId: string;
  tokenFamily: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  roles: Role[];
  sessionId: string;
  /** Present when authenticated via API key instead of JWT session */
  apiKey?: {
    id: string;
    projectId: string;
    projectSlug: string;
    permissions: ApiKeyPermission;
  };
}

export interface OAuthUserData {
  provider: string;
  providerId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}

export interface OAuthResult {
  user: AuthUser;
  token: string;
}
