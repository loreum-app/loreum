import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
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
import { LoreService } from "./lore.service";
import { CreateLoreArticleDto } from "./dto/create-lore-article.dto";
import { UpdateLoreArticleDto } from "./dto/update-lore-article.dto";

@ApiTags("Lore")
@Controller("projects/:projectSlug/lore")
@UseGuards(ApiKeyAuthGuard)
@ApiCookieAuth("auth_token")
export class LoreController {
  constructor(
    private loreService: LoreService,
    private projectsService: ProjectsService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a lore article" })
  async create(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Body() dto: CreateLoreArticleDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.loreService.create(project.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List lore articles for a project" })
  async findAll(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Query("q") q?: string,
    @Query("category") category?: string,
    @Query("entity") entity?: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.loreService.findAllByProject(project.id, {
      q,
      category,
      entity,
    });
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get a lore article by slug" })
  async findOne(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("slug") slug: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.loreService.findBySlug(project.id, slug);
  }

  @Patch(":slug")
  @ApiOperation({ summary: "Update a lore article" })
  async update(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("slug") slug: string,
    @Body() dto: UpdateLoreArticleDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.loreService.update(project.id, slug, dto);
  }

  @Delete(":slug")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a lore article" })
  async remove(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("slug") slug: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.loreService.delete(project.id, slug);
  }
}
