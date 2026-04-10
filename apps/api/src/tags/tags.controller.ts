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
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@ApiTags('Tags')
@Controller('projects/:projectSlug/tags')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('auth_token')
export class TagsController {
  constructor(
    private tagsService: TagsService,
    private projectsService: ProjectsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  async create(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Body() dto: CreateTagDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.tagsService.create(project.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List tags for a project' })
  async findAll(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.tagsService.findAllByProject(project.id);
  }

  @Get(':name')
  @ApiOperation({ summary: 'Get a tag by name' })
  async findOne(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Param('name') name: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.tagsService.findByName(project.id, name);
  }

  @Patch(':name')
  @ApiOperation({ summary: 'Update a tag' })
  async update(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Param('name') name: string,
    @Body() dto: UpdateTagDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.tagsService.update(project.id, name, dto);
  }

  @Delete(':name')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a tag' })
  async remove(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Param('name') name: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.tagsService.delete(project.id, name);
  }
}
