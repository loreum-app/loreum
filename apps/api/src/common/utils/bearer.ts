/**
 * Extract a bearer token from an Authorization header. RFC 9110 §11.1: the
 * auth scheme is case-insensitive, and some clients send `bearer …`.
 * Returns null when the header is absent or not a bearer credential.
 */
export function extractBearerToken(
  header: string | string[] | undefined,
): string | null {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return null;
  const match = /^\s*bearer\s+(.+?)\s*$/i.exec(value);
  return match?.[1] ?? null;
}
