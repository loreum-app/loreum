export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3021/v1";

/** API origin without the /v1 prefix (OAuth discovery documents live at the root). */
export const API_ORIGIN = API_URL.replace(/\/v1\/?$/, "");

/**
 * Per-project Streamable HTTP MCP endpoint. This is the URL users paste into
 * claude.ai, Claude Code, Cursor, etc. It doubles as the OAuth resource
 * identifier, so tokens for one world never work against another.
 */
export function mcpUrlForProject(projectSlug: string): string {
  return `${API_URL}/mcp/${projectSlug}`;
}

function getCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrf_token="));
  return match?.split("=").slice(1).join("=");
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const csrfToken = getCsrfToken();

  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken && { "x-csrf-token": csrfToken }),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let body: unknown = text;
    let message = text || `API error ${res.status}`;
    try {
      body = JSON.parse(text);
      const b = body as {
        message?: string | string[];
        error_description?: string;
      };
      const m = b.error_description ?? b.message;
      if (m) message = Array.isArray(m) ? m.join("; ") : m;
    } catch {
      /* not JSON */
    }
    throw new ApiError(res.status, body, message);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}
