import { OAuthError } from "./oauth.errors";

const FORBIDDEN_SCHEMES = new Set([
  "javascript:",
  "data:",
  "file:",
  "vbscript:",
]);
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isLoopback(url: URL): boolean {
  return url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname);
}

/**
 * Exact-match redirect URI comparison (no wildcards), with the RFC 8252 §7.3
 * loopback exception: the port of http://localhost / http://127.0.0.1 /
 * http://[::1] redirects is ignored because native clients (Claude Code,
 * Cursor) bind an ephemeral port per session.
 */
export function redirectUriMatches(
  registered: string,
  requested: string,
): boolean {
  if (registered === requested) return true;
  let a: URL;
  let b: URL;
  try {
    a = new URL(registered);
    b = new URL(requested);
  } catch {
    return false;
  }
  if (!isLoopback(a) || !isLoopback(b)) return false;
  return (
    a.hostname === b.hostname &&
    a.pathname === b.pathname &&
    a.search === b.search &&
    !b.hash
  );
}

/** Validate one redirect URI for registration (RFC 7591 §2, MCP security guidance). */
export function assertValidRedirectUri(raw: string): void {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new OAuthError(
      "invalid_redirect_uri",
      `Malformed redirect_uri: ${raw}`,
    );
  }
  if (url.hash) {
    throw new OAuthError(
      "invalid_redirect_uri",
      "redirect_uri must not contain a fragment",
    );
  }
  if (FORBIDDEN_SCHEMES.has(url.protocol)) {
    throw new OAuthError(
      "invalid_redirect_uri",
      `Scheme not allowed: ${url.protocol}`,
    );
  }
  if (url.protocol === "http:" && !isLoopback(url)) {
    throw new OAuthError(
      "invalid_redirect_uri",
      "http redirect URIs are only allowed for loopback addresses; use https",
    );
  }
}
