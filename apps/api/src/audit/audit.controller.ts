import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiCookieAuth } from "@nestjs/swagger";
import { ApiKeyAuthGuard } from "../auth/guards/api-key-auth.guard";
import { User } from "../auth/decorators/user.decorator";
import { AuthUser } from "../auth/types/jwt.types";
import { ProjectsService } from "../projects/projects.service";
import { AuditLedgerService } from "./audit-ledger.service";
import { auditContextFromUser } from "./audit.types";

@ApiTags("History")
@Controller("projects/:projectSlug/history")
@UseGuards(ApiKeyAuthGuard)
@ApiCookieAuth("auth_token")
export class AuditController {
  constructor(
    private auditLedger: AuditLedgerService,
    private projectsService: ProjectsService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List ledger entries for a project" })
  async findAll(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Query("targetModel") targetModel?: string,
    @Query("targetId") targetId?: string,
    @Query("limit") limitStr?: string,
    @Query("offset") offsetStr?: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    const limit = Math.min(
      Math.max(parseInt(limitStr ?? "50", 10) || 50, 1),
      200,
    );
    const offset = Math.max(parseInt(offsetStr ?? "0", 10) || 0, 0);
    return this.auditLedger.findByProject(project.id, {
      targetModel,
      targetId,
      limit,
      offset,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a single ledger entry" })
  async findOne(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("id") id: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.auditLedger.findById(project.id, id);
  }

  @Post(":id/undo")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Undo a ledger entry" })
  async undo(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("id") id: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.auditLedger.undo(project.id, id, auditContextFromUser(user));
  }
}
