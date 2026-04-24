import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiCookieAuth } from "@nestjs/swagger";
import { ApiKeyAuthGuard } from "../auth/guards/api-key-auth.guard";
import { User } from "../auth/decorators/user.decorator";
import { AuthUser } from "../auth/types/jwt.types";
import { ProjectsService } from "../projects/projects.service";
import { EntityTypesService } from "./entity-types.service";
import { CreateEntityTypeDto } from "./dto/create-entity-type.dto";
import { UpdateEntityTypeDto } from "./dto/update-entity-type.dto";

@ApiTags("Entity Types")
@Controller("projects/:projectSlug/entity-types")
@UseGuards(ApiKeyAuthGuard)
@ApiCookieAuth("auth_token")
export class EntityTypesController {
  constructor(
    private entityTypesService: EntityTypesService,
    private projectsService: ProjectsService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new entity type" })
  async create(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Body() dto: CreateEntityTypeDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.entityTypesService.create(project.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List entity types for a project" })
  async findAll(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.entityTypesService.findAllByProject(project.id);
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get an entity type by slug" })
  async findOne(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("slug") slug: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.entityTypesService.findBySlug(project.id, slug);
  }

  @Patch(":slug")
  @ApiOperation({ summary: "Update an entity type" })
  async update(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("slug") slug: string,
    @Body() dto: UpdateEntityTypeDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.entityTypesService.update(project.id, slug, dto);
  }

  @Delete(":slug")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete an entity type" })
  async remove(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("slug") slug: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.entityTypesService.delete(project.id, slug);
  }
}
