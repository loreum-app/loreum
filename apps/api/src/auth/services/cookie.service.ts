import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as crypto from 'crypto';
import { AppConfig } from '../../config/app.config';

@Injectable()
export class CookieService {
  constructor(private config: AppConfig) {}

  setCookie(res: Response, token: string): void {
    res.cookie('auth_token', token, this.config.cookies);
  }

  clearCookie(res: Response): void {
    res.cookie('auth_token', '', { ...this.config.cookies, maxAge: 0 });
    res.cookie('csrf_token', '', {
      ...this.config.cookies,
      httpOnly: false,
      maxAge: 0,
    });
  }

  generateCsrfToken(sessionId: string): string {
    const secret = this.config.jwt.secret;
    const timestamp = Date.now().toString();
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(`${sessionId}:${timestamp}`)
      .digest('hex');
    return `${sessionId}:${timestamp}:${hmac}`;
  }

  validateCsrfToken(token: string, sessionId: string): boolean {
    const parts = token.split(':');
    if (parts.length !== 3) return false;

    const tokenSession = parts[0]!;
    const timestamp = parts[1]!;
    const signature = parts[2]!;
    if (tokenSession !== sessionId) return false;

    // Token valid for 24 hours
    const age = Date.now() - parseInt(timestamp, 10);
    if (age > 24 * 60 * 60 * 1000) return false;

    const expected = crypto
      .createHmac('sha256', this.config.jwt.secret)
      .update(`${tokenSession}:${timestamp}`)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  }

  setCsrfCookie(res: Response, sessionId: string): string {
    const token = this.generateCsrfToken(sessionId);
    res.cookie('csrf_token', token, {
      ...this.config.cookies,
      httpOnly: false, // Frontend needs to read this
    });
    return token;
  }
}
