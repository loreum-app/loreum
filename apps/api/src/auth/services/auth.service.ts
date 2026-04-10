import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfig } from '../../config/app.config';
import {
  JwtPayload,
  AuthUser,
  OAuthUserData,
  OAuthResult,
} from '../types/jwt.types';
import { generateUniqueUsername } from '../../common/utils/slug';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: AppConfig,
  ) {}

  // ---------------------------------------------------------------------------
  // OAuth Login
  // ---------------------------------------------------------------------------

  async handleOAuthLogin(
    userData: OAuthUserData,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<OAuthResult> {
    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (!user) {
      const username = await generateUniqueUsername(
        this.prisma,
        userData.name || userData.email.split('@')[0] || 'user',
      );

      user = await this.prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          username,
          avatarUrl: userData.avatarUrl,
        },
      });

      // Create default extension tables
      await this.prisma.userProfile.create({
        data: { userId: user.id },
      });
      await this.prisma.userPreferences.create({
        data: { userId: user.id },
      });

      this.logger.log(`New user created: ${user.email} (${user.username})`);
    }

    // Upsert OAuth account link
    await this.prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: userData.provider,
          providerAccountId: userData.providerId,
        },
      },
      create: {
        userId: user.id,
        provider: userData.provider,
        providerAccountId: userData.providerId,
      },
      update: {},
    });

    // Create or reuse session
    const session = await this.createSession(user.id, ipAddress, userAgent);

    // Generate JWT
    const token = this.generateJwt({
      sub: user.id,
      email: user.email,
      roles: user.roles,
      sessionId: session.id,
      tokenFamily: session.tokenFamily,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
        sessionId: session.id,
      },
      token,
    };
  }

  // ---------------------------------------------------------------------------
  // Session Management
  // ---------------------------------------------------------------------------

  async createSession(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.config.session.ttlDays);

    // Reuse existing session from same client if possible
    if (ipAddress && userAgent) {
      const existing = await this.prisma.session.findFirst({
        where: {
          userId,
          ipAddress,
          userAgent,
          isValid: true,
          expiresAt: { gt: new Date() },
        },
      });

      if (existing) {
        return this.prisma.session.update({
          where: { id: existing.id },
          data: { lastActiveAt: new Date(), expiresAt },
        });
      }
    }

    return this.prisma.session.create({
      data: {
        userId,
        tokenFamily: crypto.randomUUID(),
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
  }

  async validateAndRefreshToken(
    payload: JwtPayload,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ user: AuthUser; newToken?: string }> {
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sessionId, isValid: true },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (new Date() > session.expiresAt) {
      await this.prisma.session.update({
        where: { id: session.id },
        data: { isValid: false },
      });
      throw new UnauthorizedException('Session expired');
    }

    // Token reuse detection
    if (
      session.lastTokenIat &&
      payload.iat &&
      payload.iat < session.lastTokenIat
    ) {
      if (payload.tokenFamily !== session.tokenFamily) {
        // Different token family = stolen token replay
        await this.prisma.session.update({
          where: { id: session.id },
          data: { isValid: false },
        });
        throw new UnauthorizedException(
          'Session invalidated due to token reuse',
        );
      }
      // Same family = race condition from multiple tabs, allow it
    }

    // Check if token needs rotation
    const tokenAgeMinutes = payload.iat
      ? (Math.floor(Date.now() / 1000) - payload.iat) / 60
      : 0;

    let newToken: string | undefined;
    let newIat: number | undefined;

    if (tokenAgeMinutes > this.config.jwt.rotationMinutes) {
      newToken = this.generateJwt({
        sub: session.user.id,
        email: session.user.email,
        roles: session.user.roles,
        sessionId: session.id,
        tokenFamily: session.tokenFamily,
      });
      const decoded = this.jwtService.decode(newToken) as JwtPayload;
      newIat = decoded.iat;
    }

    // Rolling session expiry + update last active
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + this.config.session.ttlDays);

    await Promise.all([
      this.prisma.session.update({
        where: { id: session.id },
        data: {
          lastActiveAt: new Date(),
          lastTokenIat: newIat ?? payload.iat,
          expiresAt: newExpiry,
          ...(ipAddress && { ipAddress }),
          ...(userAgent && { userAgent }),
        },
      }),
      this.prisma.user.update({
        where: { id: session.userId },
        data: { lastActiveAt: new Date() },
      }),
    ]);

    return {
      user: {
        id: session.user.id,
        email: session.user.email,
        roles: session.user.roles,
        sessionId: session.id,
      },
      newToken,
    };
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatarUrl: true,
        roles: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.name,
      avatarUrl: user.avatarUrl,
      roles: user.roles,
    };
  }

  async getUserSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, isValid: true, expiresAt: { gt: new Date() } },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async invalidateSession(sessionId: string, userId?: string): Promise<void> {
    if (userId) {
      const session = await this.prisma.session.findUnique({
        where: { id: sessionId },
        select: { userId: true },
      });
      if (!session || session.userId !== userId) {
        throw new ForbiddenException('Cannot invalidate this session');
      }
    }
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isValid: false },
    });
  }

  async invalidateAllUserSessions(
    userId: string,
    exceptSessionId?: string,
  ): Promise<number> {
    const result = await this.prisma.session.updateMany({
      where: {
        userId,
        isValid: true,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
      data: { isValid: false },
    });
    return result.count;
  }

  // ---------------------------------------------------------------------------
  // JWT
  // ---------------------------------------------------------------------------

  generateJwt(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return this.jwtService.sign(payload);
  }
}
