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
import { TimelineService } from './timeline.service';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { UpdateTimelineEventDto } from './dto/update-timeline-event.dto';

@ApiTags('Timeline')
@Controller('projects/:projectSlug/timeline')
@UseGuards(JwtAuthGuard)
@ApiCookieAuth('auth_token')
export class TimelineController {
  constructor(
    private timelineService: TimelineService,
    private projectsService: ProjectsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a timeline event' })
  async create(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Body() dto: CreateTimelineEventDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.timelineService.create(project.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List timeline events for a project' })
  async findAll(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Query('entity') entity?: string,
    @Query('significance') significance?: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.timelineService.findAllByProject(project.id, {
      entity,
      significance,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a timeline event by ID' })
  async findOne(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Param('id') id: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.timelineService.findById(project.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a timeline event' })
  async update(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateTimelineEventDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.timelineService.update(project.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a timeline event' })
  async remove(
    @Param('projectSlug') projectSlug: string,
    @User() user: AuthUser,
    @Param('id') id: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.timelineService.delete(project.id, id);
  }
}
