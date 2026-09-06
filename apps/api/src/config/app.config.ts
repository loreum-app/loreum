import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppConfig {
  constructor(private configService: ConfigService) {}

  get isDevelopment(): boolean {
    return this.configService.get("NODE_ENV") !== "production";
  }

  get isProduction(): boolean {
    return this.configService.get("NODE_ENV") === "production";
  }

  get enableSwagger(): boolean {
    return (
      this.configService.get("ENABLE_SWAGGER") === "true" && this.isDevelopment
    );
  }

  get api() {
    return {
      port: parseInt(this.configService.get("API_PORT") ?? "3021", 10),
      corsOrigin:
        this.configService.get("CORS_ORIGIN") ?? "http://localhost:3020",
    };
  }

  /**
   * Public origin of this API as MCP clients reach it (no trailing slash),
   * e.g. https://api.loreum.app. Used as the OAuth issuer and as the base for
   * every advertised MCP resource URL, so it must match what users paste into
   * their MCP client exactly.
   */
  get publicUrl(): string {
    const raw =
      this.configService.get("PUBLIC_API_URL") ??
      `http://localhost:${this.api.port}`;
    // Tolerate the web app's spelling (…/v1): the API adds the prefix itself.
    return raw.replace(/\/+$/, "").replace(/\/v1$/, "");
  }

  /** Public origin of the web app (consent screen, sign-in). */
  get webUrl(): string {
    const raw = this.configService.get("WEB_URL") ?? this.api.corsOrigin;
    return raw.replace(/\/+$/, "");
  }

  get mcp() {
    const base = this.publicUrl;
    return {
      /** OAuth issuer identifier (RFC 8414). */
      issuer: base,
      /** Canonical per-project MCP resource URL (RFC 8707 audience). */
      resourceUrl: (projectSlug: string) => `${base}/v1/mcp/${projectSlug}`,
      /** RFC 9728 protected resource metadata URL for a project. */
      resourceMetadataUrl: (projectSlug: string) =>
        `${base}/.well-known/oauth-protected-resource/v1/mcp/${projectSlug}`,
      /** Legacy project-less endpoint (API keys only). */
      legacyEndpoint: `${base}/v1/mcp`,
      docsUrl: `${this.webUrl}/docs/mcp`,
    };
  }

  get oauth() {
    const extras = (this.configService.get("OAUTH_ALLOWED_REDIRECT_URIS") ?? "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    return {
      authorizationCodeTtlSeconds: 10 * 60,
      accessTokenTtlSeconds: parseInt(
        this.configService.get("OAUTH_ACCESS_TOKEN_TTL_SECONDS") ?? "3600",
        10,
      ),
      refreshTokenTtlSeconds: parseInt(
        this.configService.get("OAUTH_REFRESH_TOKEN_TTL_SECONDS") ??
          String(90 * 24 * 60 * 60),
        10,
      ),
      /** Dynamically registered client secrets expire after this (0 = never). */
      clientSecretTtlSeconds: 0,
      /**
       * Tests only: let Client ID Metadata Documents be fetched over http from
       * loopback addresses. Never enable in production.
       */
      cimdAllowInsecure:
        this.configService.get("OAUTH_CIMD_ALLOW_INSECURE") === "true",
      /**
       * Redirect URIs accepted for any client even if not in its registration
       * (operator-controlled escape hatch, comma separated).
       */
      extraAllowedRedirectUris: extras as string[],
    };
  }

  /**
   * Billing is dormant: every account has every feature until this flips on.
   * Kept as a switch so plan gating can be enabled without code changes.
   */
  get billing() {
    return {
      enabled: this.configService.get("BILLING_ENABLED") === "true",
    };
  }

  get jwt() {
    return {
      secret: this.configService.getOrThrow<string>("JWT_SECRET"),
      accessTTL: this.configService.get("JWT_ACCESS_TTL") ?? "2h",
      rotationMinutes: parseInt(
        this.configService.get("TOKEN_ROTATION_MINUTES") ?? "100",
        10,
      ),
    };
  }

  get session() {
    return {
      ttlDays: parseInt(this.configService.get("SESSION_TTL_DAYS") ?? "60", 10),
    };
  }

  get cookies(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "lax" | "strict" | "none";
    maxAge: number;
    path: string;
    domain?: string;
  } {
    const domain = this.configService.get("COOKIE_DOMAIN") ?? undefined;

    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: "lax",
      maxAge: this.session.ttlDays * 24 * 60 * 60 * 1000,
      path: "/",
      ...(domain && { domain }),
    };
  }

  get google() {
    return {
      clientId: this.configService.getOrThrow<string>("GOOGLE_CLIENT_ID"),
      clientSecret: this.configService.getOrThrow<string>(
        "GOOGLE_CLIENT_SECRET",
      ),
      callbackUrl: this.configService.getOrThrow<string>("GOOGLE_CALLBACK_URL"),
    };
  }

  get redis() {
    return {
      url: this.configService.get("REDIS_URL") ?? "redis://localhost:6379",
    };
  }

  get database() {
    return {
      url: this.configService.getOrThrow<string>("DATABASE_URL"),
    };
  }
}
