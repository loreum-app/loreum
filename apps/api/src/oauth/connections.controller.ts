import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  UseGuards,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { User } from "../auth/decorators/user.decorator";
import { AuthUser } from "../auth/types/jwt.types";
import { ProjectsService } from "../projects/projects.service";
import { ConnectionsService } from "./connections.service";

/** "Connected apps": OAuth grants a user has made for a project. */
@ApiTags("MCP Connections")
@Controller("projects/:projectSlug/connections")
@UseGuards(JwtAuthGuard)
@ApiCookieAuth("auth_token")
export class ConnectionsController {
  constructor(
    private connections: ConnectionsService,
    private projectsService: ProjectsService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List active MCP OAuth connections for a project" })
  async list(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.connections.listByProject(project.id);
  }

  @Delete(":connectionId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Revoke an MCP OAuth connection (all its tokens stop working)",
  })
  async revoke(
    @Param("projectSlug") projectSlug: string,
    @Param("connectionId") connectionId: string,
    @User() user: AuthUser,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    await this.connections.revokeForProject(connectionId, project.id);
  }
}
