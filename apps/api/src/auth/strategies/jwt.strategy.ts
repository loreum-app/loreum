import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { Request } from "express";
import { AppConfig } from "../../config/app.config";
import { AuthService } from "../services/auth.service";
import { CookieService } from "../services/cookie.service";
import { JwtPayload, AuthUser } from "../types/jwt.types";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private appConfig: AppConfig,
    private authService: AuthService,
    private cookieService: CookieService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Cookie auth only — Bearer is handled by ApiKeyAuthGuard
        (request: Request) => request?.cookies?.["auth_token"] ?? null,
      ]),
      ignoreExpiration: true, // We handle expiration via session validation
      secretOrKey: appConfig.jwt.secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<AuthUser> {
    const res = req.res!;

    const { user, newToken } = await this.authService.validateAndRefreshToken(
      payload,
      req.ip,
      req.headers["user-agent"],
    );

    // Token rotation — only set cookies for cookie-based auth
    if (newToken && req.cookies?.["auth_token"]) {
      this.cookieService.setCookie(res, newToken);
      this.cookieService.setCsrfCookie(res, user.sessionId);
    }

    return user;
  }
}
