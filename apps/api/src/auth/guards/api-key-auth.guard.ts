import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { ApiKeysService } from "../../api-keys/api-keys.service";
import { AuthUser } from "../types/jwt.types";

/**
 * Combined auth guard: cookie → JWT (Passport), Bearer → API key (SHA-256).
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

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("No valid authentication provided");
    }

    const token = authHeader.slice(7);
    const apiKey = await this.apiKeysService.validate(token);

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
