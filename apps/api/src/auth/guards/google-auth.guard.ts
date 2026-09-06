import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request, Response } from "express";
import { AppConfig } from "../../config/app.config";

export const RETURN_TO_COOKIE = "return_to";

/** Only same-site relative paths may be used as a post-login destination. */
export function isSafeReturnTo(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 1 &&
    value.length <= 2048 &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\") &&
    !/[\r\n]/.test(value)
  );
}

/**
 * Starts the Google OAuth login. Remembers an optional `?return_to=/path` in a
 * short-lived cookie so the callback can send the user back to where they came
 * from (e.g. the MCP consent screen) instead of the home page.
 */
@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {
  constructor(private config: AppConfig) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const returnTo = req.query["return_to"];
    if (isSafeReturnTo(returnTo)) {
      res.cookie(RETURN_TO_COOKIE, returnTo, {
        ...this.config.cookies,
        maxAge: 10 * 60 * 1000,
      });
    }
    return (await super.canActivate(context)) as boolean;
  }
}
