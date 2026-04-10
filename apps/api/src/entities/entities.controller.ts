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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { AuthUser } from '../auth/types/jwt.types';
import { ProjectsService } from '../projects/projects.service';
import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';

@ApiTags('Entities')
@Controller('projects/:projectSlug/entities')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('auth_token')
export class EntitiesController {
  constructor(
    private entitiesService: EntitiesService,
    private projectsService: ProjectsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new entity' })
  async create(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Body() dto: CreateEntityDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.entitiesService.create(project.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List entities for a project' })
  async findAll(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Query('type') type?: string,
    @Query('q') q?: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.entitiesService.findAllByProject(project.id, { type, q });
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get an entity with all connected data' })
  async findOne(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Param('slug') slug: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.entitiesService.findBySlugWithHub(project.id, slug);
  }

  @Patch(':slug')
  @ApiOperation({ summary: 'Update an entity' })
  async update(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Param('slug') slug: string,
    @Body() dto: UpdateEntityDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.entitiesService.update(project.id, slug, dto);
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an entity' })
  async remove(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Param('slug') slug: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.entitiesService.delete(project.id, slug);
  }
}
