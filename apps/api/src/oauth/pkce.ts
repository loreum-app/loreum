import * as crypto from "crypto";
import { safeEqual } from "./tokens";

/** RFC 7636 §4.6: BASE64URL(SHA256(code_verifier)) == code_challenge. */
export function verifyPkceS256(
  codeVerifier: string,
  codeChallenge: string,
): boolean {
  // RFC 7636 §4.1: verifier is 43-128 chars of [A-Za-z0-9-._~]
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(codeVerifier)) return false;
  const digest = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return safeEqual(digest, codeChallenge);
}
