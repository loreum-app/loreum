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
import { RelationshipsService } from "./relationships.service";
import { CreateRelationshipDto } from "./dto/create-relationship.dto";
import { UpdateRelationshipDto } from "./dto/update-relationship.dto";

@ApiTags("Relationships")
@Controller("projects/:projectSlug/relationships")
@UseGuards(ApiKeyAuthGuard)
@ApiCookieAuth("auth_token")
export class RelationshipsController {
  constructor(
    private relationshipsService: RelationshipsService,
    private projectsService: ProjectsService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a relationship between entities" })
  async create(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Body() dto: CreateRelationshipDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.relationshipsService.create(project.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List relationships for a project" })
  async findAll(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Query("entity") entity?: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.relationshipsService.findAllByProject(project.id, {
      entity,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a relationship by ID" })
  async findOne(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("id") id: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.relationshipsService.findById(project.id, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a relationship" })
  async update(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateRelationshipDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.relationshipsService.update(project.id, id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a relationship" })
  async remove(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("id") id: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.relationshipsService.delete(project.id, id);
  }
}
