import { Controller, Get, Put, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiCookieAuth } from "@nestjs/swagger";
import { ApiKeyAuthGuard } from "../auth/guards/api-key-auth.guard";
import { User } from "../auth/decorators/user.decorator";
import { AuthUser } from "../auth/types/jwt.types";
import { ProjectsService } from "../projects/projects.service";
import { StyleGuideService } from "./style-guide.service";
import { auditContextFromUser } from "../audit/audit.types";
import { UpdateStyleGuideDto } from "./dto/update-style-guide.dto";

@ApiTags("Style Guide")
@Controller("projects/:projectSlug/style-guide")
@UseGuards(ApiKeyAuthGuard)
@ApiCookieAuth("auth_token")
export class StyleGuideController {
  constructor(
    private styleGuideService: StyleGuideService,
    private projectsService: ProjectsService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get the project style guide" })
  async findOne(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    const guide = await this.styleGuideService.findByProject(project.id);
    return guide ?? {};
  }

  @Put()
  @ApiOperation({ summary: "Create or update the project style guide" })
  async upsert(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Body() dto: UpdateStyleGuideDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.styleGuideService.upsert(
      project.id,
      dto,
      auditContextFromUser(user),
    );
  }
}
