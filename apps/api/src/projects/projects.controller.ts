import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiCookieAuth } from "@nestjs/swagger";
import { ApiKeyAuthGuard } from "../auth/guards/api-key-auth.guard";
import { User } from "../auth/decorators/user.decorator";
import { AuthUser } from "../auth/types/jwt.types";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";

@ApiTags("Projects")
@Controller("projects")
@UseGuards(ApiKeyAuthGuard)
@ApiCookieAuth("auth_token")
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new project" })
  create(@User() user: AuthUser, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List all projects for the current user" })
  findAll(@User() user: AuthUser) {
    return this.projectsService.findAllByUser(user.id);
  }

  @Get(":slug/search")
  @ApiOperation({
    summary: "Search across project content (stub — OpenSearch pending)",
  })
  async search(
    @Param("slug") slug: string,
    @User() user: AuthUser,
    @Query("q") q?: string,
  ) {
    await this.projectsService.findBySlug(slug, user.id);
    return { results: [], query: q ?? "", total: 0 };
  }

  @Get(":slug/graph-layout")
  @ApiOperation({ summary: "Get graph layout for a project" })
  async getGraphLayout(@Param("slug") slug: string, @User() user: AuthUser) {
    const project = await this.projectsService.findBySlug(slug, user.id);
    return project.graphLayout ?? {};
  }

  @Get(":slug/timeline-config")
  @ApiOperation({ summary: "Get timeline config for a project" })
  async getTimelineConfig(@Param("slug") slug: string, @User() user: AuthUser) {
    const project = await this.projectsService.findBySlug(slug, user.id);
    return {
      timelineMode: project.timelineMode,
      timelineStart: project.timelineStart,
      timelineEnd: project.timelineEnd,
      timelineLabelPrefix: project.timelineLabelPrefix,
      timelineLabelSuffix: project.timelineLabelSuffix,
    };
  }

  @Put(":slug/timeline-config")
  @ApiOperation({ summary: "Save timeline config for a project" })
  async saveTimelineConfig(
    @Param("slug") slug: string,
    @User() user: AuthUser,
    @Body()
    config: {
      timelineMode?: string;
      timelineStart?: number;
      timelineEnd?: number;
      timelineLabelPrefix?: string;
      timelineLabelSuffix?: string;
    },
  ) {
    return this.projectsService.saveTimelineConfig(slug, user.id, config);
  }

  @Patch(":slug/graph-layout")
  @ApiOperation({ summary: "Patch graph layout positions" })
  @UsePipes(new ValidationPipe({ transform: false, whitelist: false }))
  async patchGraphLayout(
    @Param("slug") slug: string,
    @User() user: AuthUser,
    @Body() patch: Record<string, { x: number; y: number }>,
  ) {
    return this.projectsService.patchGraphLayout(slug, user.id, patch);
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get a project by slug" })
  findOne(@Param("slug") slug: string, @User() user: AuthUser) {
    return this.projectsService.findBySlug(slug, user.id);
  }

  @Patch(":slug")
  @ApiOperation({ summary: "Update a project" })
  update(
    @Param("slug") slug: string,
    @User() user: AuthUser,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(slug, user.id, dto);
  }

  @Delete(":slug")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a project" })
  remove(@Param("slug") slug: string, @User() user: AuthUser) {
    return this.projectsService.delete(slug, user.id);
  }
}
