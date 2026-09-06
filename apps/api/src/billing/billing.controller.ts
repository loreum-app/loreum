import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { User } from "../auth/decorators/user.decorator";
import { AuthUser } from "../auth/types/jwt.types";
import { EntitlementsService } from "./entitlements.service";

@ApiTags("Billing")
@Controller("billing")
@UseGuards(JwtAuthGuard)
@ApiCookieAuth("auth_token")
export class BillingController {
  constructor(private entitlements: EntitlementsService) {}

  @Get("me")
  @ApiOperation({ summary: "Current user's plan, features, and limits" })
  me(@User() user: AuthUser) {
    return this.entitlements.summary(user.id);
  }
}
