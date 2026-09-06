import { Controller, Get, Header, Param } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { AppConfig } from "../config/app.config";
import { MCP_SCOPES } from "./oauth.types";

/**
 * OAuth discovery documents. Served at the origin root (excluded from the
 * /v1 prefix in main.ts) because RFC 8414 / RFC 9728 clients look for them at
 * fixed well-known paths.
 */
@ApiExcludeController()
@Controller(".well-known")
export class WellKnownController {
  constructor(private config: AppConfig) {}

  /** RFC 8414 authorization server metadata. */
  @Get("oauth-authorization-server")
  @Header("Cache-Control", "public, max-age=300")
  authorizationServer() {
    return this.buildAuthorizationServerMetadata();
  }

  /**
   * Some clients probe the path-aware variant first
   * (/.well-known/oauth-authorization-server/v1/mcp/<slug>); answer it too.
   */
  @Get("oauth-authorization-server/*path")
  @Header("Cache-Control", "public, max-age=300")
  authorizationServerPathAware() {
    return this.buildAuthorizationServerMetadata();
  }

  /**
   * RFC 9728 protected resource metadata, one document per project because each
   * project's MCP URL is its own audience. Not served for the project-less
   * legacy endpoint: OAuth tokens are always bound to a project.
   */
  @Get("oauth-protected-resource/v1/mcp/:projectSlug")
  @Header("Cache-Control", "public, max-age=300")
  protectedResource(@Param("projectSlug") projectSlug: string) {
    return {
      resource: this.config.mcp.resourceUrl(projectSlug),
      authorization_servers: [this.config.mcp.issuer],
      scopes_supported: [...MCP_SCOPES],
      bearer_methods_supported: ["header"],
      resource_name: "Loreum",
      resource_documentation: this.config.mcp.docsUrl,
    };
  }

  private buildAuthorizationServerMetadata() {
    const issuer = this.config.mcp.issuer;
    return {
      issuer,
      authorization_endpoint: `${issuer}/v1/oauth/authorize`,
      token_endpoint: `${issuer}/v1/oauth/token`,
      registration_endpoint: `${issuer}/v1/oauth/register`,
      revocation_endpoint: `${issuer}/v1/oauth/revoke`,
      response_types_supported: ["code"],
      response_modes_supported: ["query"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: [
        "none",
        "client_secret_post",
        "client_secret_basic",
      ],
      revocation_endpoint_auth_methods_supported: [
        "none",
        "client_secret_post",
        "client_secret_basic",
      ],
      scopes_supported: [...MCP_SCOPES],
      authorization_response_iss_parameter_supported: true,
      service_documentation: this.config.mcp.docsUrl,
    };
  }
}
