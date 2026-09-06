import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Request, Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { User } from "../auth/decorators/user.decorator";
import { AuthUser } from "../auth/types/jwt.types";
import { OAuthService } from "./oauth.service";
import { OAuthClientsService } from "./oauth-clients.service";
import { OAuthError } from "./oauth.errors";
import { AuthorizeRequestInput } from "./oauth.types";
import { ConsentDto } from "./dto/consent.dto";

type Params = Record<string, string | undefined>;

const AUTHORIZE_KEYS = [
  "response_type",
  "client_id",
  "redirect_uri",
  "code_challenge",
  "code_challenge_method",
  "scope",
  "state",
  "resource",
] as const;

function pickAuthorizeInput(src: Params): AuthorizeRequestInput {
  const out: AuthorizeRequestInput = {};
  for (const k of AUTHORIZE_KEYS) {
    const v = src[k];
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

/** RFC 6749 §2.3.1: client credentials via HTTP Basic or the request body. */
function extractClientCredentials(
  req: Request,
  body: Params,
): { clientId?: string; clientSecret?: string } {
  const header = req.headers.authorization;
  if (header?.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const idx = decoded.indexOf(":");
    if (idx === -1)
      throw new OAuthError("invalid_client", "Malformed Basic credentials", {
        status: 401,
      });
    return {
      clientId: decodeURIComponent(decoded.slice(0, idx)),
      clientSecret: decodeURIComponent(decoded.slice(idx + 1)),
    };
  }
  return { clientId: body.client_id, clientSecret: body.client_secret };
}

function sendOAuthError(res: Response, err: unknown) {
  if (err instanceof OAuthError) {
    if (err.status === 401) {
      res.setHeader("WWW-Authenticate", 'Basic realm="loreum-oauth"');
    }
    res.status(err.status).json(err.toResponseBody());
    return;
  }
  throw err;
}

/**
 * OAuth 2.1 authorization server endpoints for MCP clients. Advertised via
 * /.well-known/oauth-authorization-server (see WellKnownController).
 *
 *   GET  /v1/oauth/authorize  → validates, then redirects to the web consent page
 *   POST /v1/oauth/token      → authorization_code / refresh_token grants
 *   POST /v1/oauth/register   → RFC 7591 dynamic client registration
 *   POST /v1/oauth/revoke     → RFC 7009 token revocation
 *   GET/POST /v1/oauth/consent → used by the web consent page (cookie session)
 */
@ApiExcludeController()
@Controller("oauth")
export class OAuthController {
  constructor(
    private oauth: OAuthService,
    private clients: OAuthClientsService,
  ) {}

  @Get("authorize")
  @Header("Cache-Control", "no-store")
  async authorize(@Query() query: Params, @Res() res: Response) {
    const input = pickAuthorizeInput(query);
    try {
      await this.oauth.validateAuthorizeRequest(input);
    } catch (err) {
      if (err instanceof OAuthError && err.redirectUri) {
        res.redirect(302, err.toRedirectUrl());
        return;
      }
      return sendOAuthError(res, err);
    }
    res.redirect(302, this.oauth.consentPageUrl(input));
  }

  @Post("token")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  @Header("Pragma", "no-cache")
  async token(@Req() req: Request, @Body() body: Params, @Res() res: Response) {
    try {
      const { clientId, clientSecret } = extractClientCredentials(
        req,
        body ?? {},
      );
      const client = await this.clients.authenticate(clientId, clientSecret);
      switch (body?.grant_type) {
        case "authorization_code":
          res.json(await this.oauth.exchangeAuthorizationCode(client, body));
          return;
        case "refresh_token":
          res.json(await this.oauth.refresh(client, body));
          return;
        case undefined:
          throw new OAuthError("invalid_request", "grant_type is required");
        default:
          throw new OAuthError(
            "unsupported_grant_type",
            `Unsupported grant_type: ${body.grant_type}`,
          );
      }
    } catch (err) {
      return sendOAuthError(res, err);
    }
  }

  @Post("register")
  @HttpCode(201)
  @Header("Cache-Control", "no-store")
  async register(@Body() body: unknown, @Res() res: Response) {
    try {
      res.status(201).json(await this.clients.register(body));
    } catch (err) {
      return sendOAuthError(res, err);
    }
  }

  @Post("revoke")
  @HttpCode(200)
  @Header("Cache-Control", "no-store")
  async revoke(
    @Req() req: Request,
    @Body() body: Params,
    @Res() res: Response,
  ) {
    try {
      const { clientId, clientSecret } = extractClientCredentials(
        req,
        body ?? {},
      );
      const client = await this.clients.authenticate(clientId, clientSecret);
      await this.oauth.revoke(client, body?.token);
      res.status(200).json({});
    } catch (err) {
      return sendOAuthError(res, err);
    }
  }

  // ---------------------------------------------------------------------------
  // Consent page support (browser session, same-origin web app)
  // ---------------------------------------------------------------------------

  @Get("consent")
  @UseGuards(JwtAuthGuard)
  @Header("Cache-Control", "no-store")
  async consentContext(
    @User() user: AuthUser,
    @Query() query: Params,
    @Res() res: Response,
  ) {
    try {
      res.json(
        await this.oauth.consentContext(user.id, pickAuthorizeInput(query)),
      );
    } catch (err) {
      return sendOAuthError(res, err);
    }
  }

  @Post("consent")
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Header("Cache-Control", "no-store")
  async consentDecision(
    @User() user: AuthUser,
    @Body() dto: ConsentDto,
    @Res() res: Response,
  ) {
    try {
      const input = pickAuthorizeInput(dto as unknown as Params);
      res.json(
        await this.oauth.decideConsent(user.id, input, {
          decision: dto.decision,
          projectSlug: dto.projectSlug,
          permissions: dto.permissions,
        }),
      );
    } catch (err) {
      return sendOAuthError(res, err);
    }
  }
}
