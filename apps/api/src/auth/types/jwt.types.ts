import { Role } from '../../../generated/prisma/client';

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
