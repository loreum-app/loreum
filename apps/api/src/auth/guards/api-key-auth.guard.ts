import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { ApiKeysService } from "../../api-keys/api-keys.service";
import { AuthUser } from "../types/jwt.types";
import { extractBearerToken } from "../../common/utils/bearer";

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Combined auth guard: cookie → JWT (Passport), Bearer → API key (SHA-256).
 *
 * API keys are scoped to a single project: the route's project slug must
 * match the key's project, and READ_ONLY keys may only use read methods.
 * (The MCP endpoint uses its own McpAuthGuard, which also accepts OAuth tokens.)
 */
@Injectable()
export class ApiKeyAuthGuard extends AuthGuard("jwt") implements CanActivate {
  constructor(private apiKeysService: ApiKeysService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.cookies?.["auth_token"]) {
      return super.canActivate(context) as Promise<boolean>;
    }

    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      throw new UnauthorizedException("No valid authentication provided");
    }

    const apiKey = await this.apiKeysService.validate(token);

    const params = request.params as Record<string, string | undefined>;
    const routeProjectSlug = params?.projectSlug ?? params?.slug;

    if (!routeProjectSlug) {
      throw new ForbiddenException("API keys are scoped to a single project");
    }
    if (routeProjectSlug !== apiKey.project.slug) {
      throw new ForbiddenException(
        "API key does not grant access to this project",
      );
    }
    if (
      apiKey.permissions === "READ_ONLY" &&
      !READ_METHODS.has(request.method)
    ) {
      throw new ForbiddenException("This API key is read-only");
    }

    const user: AuthUser = {
      id: apiKey.project.ownerId,
      email: "",
      roles: ["USER"],
      sessionId: "",
      apiKey: {
        id: apiKey.id,
        projectId: apiKey.project.id,
        projectSlug: apiKey.project.slug,
        permissions: apiKey.permissions,
      },
    };

    request.user = user;
    return true;
  }
}
