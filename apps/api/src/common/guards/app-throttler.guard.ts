import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import * as crypto from "crypto";
import { Request } from "express";
import { extractBearerToken } from "../utils/bearer";

/**
 * Global rate limiter. Bearer-authenticated traffic (MCP clients, API keys)
 * is bucketed per credential instead of per IP: hosted assistants such as
 * claude.ai fan many users out of a small egress range, so per-IP limits would
 * throttle unrelated users together. Browser traffic keeps the IP bucket.
 */
@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  /** Integration tests fire hundreds of requests per second from one IP. */
  protected async shouldSkip(): Promise<boolean> {
    return process.env.THROTTLE_DISABLED === "true";
  }

  protected async getTracker(req: Request): Promise<string> {
    const token = extractBearerToken(req.headers.authorization);
    if (token) {
      return (
        "bearer:" +
        crypto.createHash("sha256").update(token).digest("hex").slice(0, 32)
      );
    }
    return req.ip ?? "unknown";
  }
}
