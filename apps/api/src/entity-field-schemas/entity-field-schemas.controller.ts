import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiCookieAuth } from "@nestjs/swagger";
import { ApiKeyAuthGuard } from "../auth/guards/api-key-auth.guard";
import { User } from "../auth/decorators/user.decorator";
import { AuthUser } from "../auth/types/jwt.types";
import { ProjectsService } from "../projects/projects.service";
import { EntityFieldSchemasService } from "./entity-field-schemas.service";
import { EntityType } from "../../generated/prisma/client";

const CONFIGURABLE_TYPES = new Set<string>([
  "CHARACTER",
  "LOCATION",
  "ORGANIZATION",
]);

function validateEntityType(raw: string): EntityType {
  const upper = raw.toUpperCase();
  if (!CONFIGURABLE_TYPES.has(upper)) {
    throw new BadRequestException(
      `Entity type "${raw}" does not support custom field schemas. Use CHARACTER, LOCATION, or ORGANIZATION.`,
    );
  }
  return upper as EntityType;
}

@ApiTags("Entity Field Schemas")
@Controller("projects/:projectSlug/entity-schemas")
@UseGuards(ApiKeyAuthGuard)
@ApiCookieAuth("auth_token")
export class EntityFieldSchemasController {
  constructor(
    private entityFieldSchemasService: EntityFieldSchemasService,
    private projectsService: ProjectsService,
  ) {}

  @Get(":entityType")
  @ApiOperation({ summary: "Get the custom field schema for an entity type" })
  async getSchema(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("entityType") entityTypeParam: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    const entityType = validateEntityType(entityTypeParam);
    return this.entityFieldSchemasService.getSchema(project.id, entityType);
  }

  @Put(":entityType")
  @ApiOperation({
    summary: "Create or update the custom field schema for an entity type",
  })
  async upsertSchema(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("entityType") entityTypeParam: string,
    @Body() body: { fieldSchema: unknown[] },
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    const entityType = validateEntityType(entityTypeParam);
    return this.entityFieldSchemasService.upsertSchema(
      project.id,
      entityType,
      body.fieldSchema,
    );
  }
}
