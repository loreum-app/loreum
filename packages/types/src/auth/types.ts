export type Role = 'USER' | 'ADMIN';

export type OAuthProvider = 'google' | 'discord' | 'microsoft' | 'linkedin';

export interface CurrentUser {
  id: string;
  email: string;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  roles: Role[];
}

export interface Session {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: string;
  expiresAt: string;
  createdAt: string;
}
