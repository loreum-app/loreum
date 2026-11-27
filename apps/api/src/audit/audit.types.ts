import type { McpAuthContext } from "../oauth/oauth.types";

export type AuditContext =
  | { type: "user"; id: string; label?: string }
  | { type: "api_key"; id: string; label?: string }
  | { type: "oauth_connection"; id: string; label?: string };

export function auditContextFromUser(user: {
  id: string;
  username?: string;
}): AuditContext {
  return { type: "user", id: user.id, label: user.username };
}

export function auditContextFromMcp(ctx: McpAuthContext): AuditContext {
  return {
    type: ctx.kind === "api_key" ? "api_key" : "oauth_connection",
    id: ctx.credentialId,
    label: ctx.clientName ?? undefined,
  };
}
