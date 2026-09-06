import * as crypto from "crypto";

/**
 * Opaque credential formats. Prefixes let the MCP guard route a bearer token
 * to the right verifier without a database round trip:
 *
 *   lrm_   project API key (see ApiKeysService)
 *   lrma_  OAuth access token
 *   lrmr_  OAuth refresh token
 *   lrmc_  OAuth authorization code
 *
 * Only SHA-256 hashes are persisted; the raw value is shown/returned once.
 */
export const ACCESS_TOKEN_PREFIX = "lrma_";
export const REFRESH_TOKEN_PREFIX = "lrmr_";
export const AUTH_CODE_PREFIX = "lrmc_";
export const API_KEY_PREFIX = "lrm_";

export function generateSecret(prefix: string, bytes = 32): string {
  return prefix + crypto.randomBytes(bytes).toString("base64url");
}

export function hashSecret(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function isApiKey(token: string): boolean {
  return token.startsWith(API_KEY_PREFIX) && !token.startsWith("lrma_");
}

/** Constant-time string equality for secrets of possibly different length. */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
