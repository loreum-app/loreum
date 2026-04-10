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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { AuthUser } from '../auth/types/jwt.types';
import { ProjectsService } from '../projects/projects.service';
import { ErasService } from './eras.service';
import { CreateEraDto } from './dto/create-era.dto';
import { UpdateEraDto } from './dto/update-era.dto';

@ApiTags('Timeline')
@Controller('projects/:projectSlug/timeline/eras')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('auth_token')
export class ErasController {
  constructor(
    private erasService: ErasService,
    private projectsService: ProjectsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create an era' })
  async create(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Body() dto: CreateEraDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.erasService.create(project.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List eras for a project' })
  async findAll(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.erasService.findAllByProject(project.id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get an era by slug' })
  async findOne(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Param('slug') slug: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.erasService.findBySlug(project.id, slug);
  }

  @Patch(':slug')
  @ApiOperation({ summary: 'Update an era' })
  async update(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Param('slug') slug: string,
    @Body() dto: UpdateEraDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.erasService.update(project.id, slug, dto);
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an era' })
  async remove(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Param('slug') slug: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.erasService.delete(project.id, slug);
  }
}
