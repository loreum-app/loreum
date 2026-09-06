/**
 * OAuth 2.1 error vocabulary (RFC 6749 §5.2, RFC 7591 §3.2.2, RFC 8707 §2).
 */
export type OAuthErrorCode =
  | "invalid_request"
  | "invalid_client"
  | "invalid_grant"
  | "unauthorized_client"
  | "unsupported_grant_type"
  | "unsupported_response_type"
  | "invalid_scope"
  | "invalid_target"
  | "access_denied"
  | "invalid_redirect_uri"
  | "invalid_client_metadata"
  | "server_error";

export interface OAuthErrorOptions {
  /** HTTP status for direct (non-redirect) responses. Defaults to 400. */
  status?: number;
  /**
   * When set, the authorization endpoint reports the error by redirecting to
   * this URI with `error` / `error_description` / `state` query params instead
   * of answering directly (RFC 6749 §4.1.2.1).
   */
  redirectUri?: string;
  state?: string;
}

export class OAuthError extends Error {
  readonly code: OAuthErrorCode;
  readonly status: number;
  readonly redirectUri?: string;
  readonly state?: string;

  constructor(
    code: OAuthErrorCode,
    message: string,
    opts: OAuthErrorOptions = {},
  ) {
    super(message);
    this.name = "OAuthError";
    this.code = code;
    this.status = opts.status ?? 400;
    this.redirectUri = opts.redirectUri;
    this.state = opts.state;
  }

  toResponseBody() {
    return { error: this.code, error_description: this.message };
  }

  /** Build the error redirect for the authorization endpoint. */
  toRedirectUrl(): string {
    const url = new URL(this.redirectUri!);
    url.searchParams.set("error", this.code);
    url.searchParams.set("error_description", this.message);
    if (this.state) url.searchParams.set("state", this.state);
    return url.href;
  }
}
