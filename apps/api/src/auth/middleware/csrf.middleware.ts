import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { CookieService } from '../services/cookie.service';
import { JwtPayload } from '../types/jwt.types';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private cookieService: CookieService,
  ) {}

  use(req: Request, _res: Response, next: NextFunction) {
    // Skip CSRF for read-only methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Only check CSRF for cookie-based auth (not bearer tokens)
    const hasAuthCookie = !!req.cookies?.['auth_token'];
    if (!hasAuthCookie) {
      return next();
    }

    const rawCsrfToken = req.headers['x-csrf-token'] as string;
    const csrfToken = rawCsrfToken ? decodeURIComponent(rawCsrfToken) : rawCsrfToken;
    const storedToken = req.cookies['csrf_token'];

    if (!csrfToken || !storedToken || csrfToken !== storedToken) {
      throw new ForbiddenException('Invalid CSRF token');
    }

    try {
      const jwt = req.cookies['auth_token'];
      const payload = this.jwtService.decode(jwt) as JwtPayload;

      if (!payload?.sessionId) {
        throw new ForbiddenException('Invalid session');
      }

      if (!this.cookieService.validateCsrfToken(storedToken, payload.sessionId)) {
        throw new ForbiddenException('CSRF token invalid for session');
      }
    } catch (error) {
      if (error instanceof ForbiddenException) throw error;
      throw new ForbiddenException('CSRF validation failed');
    }

    next();
  }
}
