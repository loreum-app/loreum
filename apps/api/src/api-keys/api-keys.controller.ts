import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiCookieAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { User } from "../auth/decorators/user.decorator";
import { AuthUser } from "../auth/types/jwt.types";
import { ProjectsService } from "../projects/projects.service";
import { ApiKeysService } from "./api-keys.service";
import { CreateApiKeyDto } from "./dto/create-api-key.dto";

@ApiTags("API Keys")
@Controller("projects/:projectSlug/api-keys")
@UseGuards(JwtAuthGuard)
@ApiCookieAuth("auth_token")
export class ApiKeysController {
  constructor(
    private apiKeysService: ApiKeysService,
    private projectsService: ProjectsService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Generate a new API key for a project" })
  async create(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Body() dto: CreateApiKeyDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.apiKeysService.create(project.id, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: "List API keys for a project" })
  async list(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.apiKeysService.listByProject(project.id);
  }

  @Delete(":keyId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke an API key" })
  async revoke(
    @Param("projectSlug") projectSlug: string,
    @Param("keyId") keyId: string,
    @User() user: AuthUser,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    await this.apiKeysService.revoke(keyId, project.id);
  }
}
