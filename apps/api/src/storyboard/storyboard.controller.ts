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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { User } from "../auth/decorators/user.decorator";
import { AuthUser } from "../auth/types/jwt.types";
import { ProjectsService } from "../projects/projects.service";
import { StoryboardService } from "./storyboard.service";
import { CreatePlotlineDto } from "./dto/create-plotline.dto";
import { CreatePlotPointDto } from "./dto/create-plot-point.dto";
import { CreateWorkDto } from "./dto/create-work.dto";
import { CreateChapterDto } from "./dto/create-chapter.dto";
import { CreateSceneDto } from "./dto/create-scene.dto";
import { UpdatePlotlineDto } from "./dto/update-plotline.dto";
import { UpdatePlotPointDto } from "./dto/update-plot-point.dto";
import { UpdateWorkDto } from "./dto/update-work.dto";
import { UpdateChapterDto } from "./dto/update-chapter.dto";
import { UpdateSceneDto } from "./dto/update-scene.dto";

@ApiTags("Storyboard")
@Controller("projects/:projectSlug/storyboard")
@UseGuards(JwtAuthGuard)
@ApiCookieAuth("auth_token")
export class StoryboardController {
  constructor(
    private storyboardService: StoryboardService,
    private projectsService: ProjectsService,
  ) {}

  // ── Plotlines ──

  @Post("plotlines")
  @ApiOperation({ summary: "Create a plotline" })
  async createPlotline(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Body() dto: CreatePlotlineDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.createPlotline(project.id, dto);
  }

  @Get("plotlines")
  @ApiOperation({ summary: "List plotlines" })
  async findAllPlotlines(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.findAllPlotlines(project.id);
  }

  @Get("plotlines/:slug")
  @ApiOperation({ summary: "Get a plotline by slug" })
  async findPlotline(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("slug") slug: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.findPlotlineBySlug(project.id, slug);
  }

  @Patch("plotlines/:slug")
  @ApiOperation({ summary: "Update a plotline" })
  async updatePlotline(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("slug") slug: string,
    @Body() dto: UpdatePlotlineDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.updatePlotline(project.id, slug, dto);
  }

  @Delete("plotlines/:slug")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a plotline" })
  async removePlotline(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("slug") slug: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.deletePlotline(project.id, slug);
  }

  // ── Plot Points ──

  @Post("plotlines/:plotlineSlug/points")
  @ApiOperation({ summary: "Create a plot point in a plotline" })
  async createPlotPoint(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("plotlineSlug") plotlineSlug: string,
    @Body() dto: CreatePlotPointDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.createPlotPoint(
      project.id,
      plotlineSlug,
      dto,
    );
  }

  @Patch("points/:id")
  @ApiOperation({ summary: "Update a plot point" })
  async updatePlotPoint(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdatePlotPointDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.updatePlotPoint(project.id, id, dto);
  }

  @Delete("points/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a plot point" })
  async removePlotPoint(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("id") id: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.deletePlotPoint(project.id, id);
  }

  // ── Works ──

  @Post("works")
  @ApiOperation({ summary: "Create a work" })
  async createWork(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Body() dto: CreateWorkDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.createWork(project.id, dto);
  }

  @Get("works")
  @ApiOperation({ summary: "List works" })
  async findAllWorks(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.findAllWorks(project.id);
  }

  @Get("works/:slug")
  @ApiOperation({ summary: "Get a work by slug with chapters" })
  async findWork(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("slug") slug: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.findWorkBySlug(project.id, slug);
  }

  @Patch("works/:slug")
  @ApiOperation({ summary: "Update a work" })
  async updateWork(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("slug") slug: string,
    @Body() dto: UpdateWorkDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.updateWork(project.id, slug, dto);
  }

  @Delete("works/:slug")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a work" })
  async removeWork(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("slug") slug: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.deleteWork(project.id, slug);
  }

  // ── Chapters ──

  @Post("works/:workSlug/chapters")
  @ApiOperation({ summary: "Create a chapter in a work" })
  async createChapter(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("workSlug") workSlug: string,
    @Body() dto: CreateChapterDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.createChapter(project.id, workSlug, dto);
  }

  @Patch("chapters/:id")
  @ApiOperation({ summary: "Update a chapter" })
  async updateChapter(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateChapterDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.updateChapter(project.id, id, dto);
  }

  @Delete("chapters/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a chapter" })
  async removeChapter(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("id") id: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.deleteChapter(project.id, id);
  }

  // ── Scenes ──

  @Post("scenes")
  @ApiOperation({ summary: "Create a scene" })
  async createScene(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Body() dto: CreateSceneDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.createScene(project.id, dto);
  }

  @Get("scenes")
  @ApiOperation({ summary: "List scenes by chapter" })
  async findScenes(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Query("chapterId") chapterId: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.findScenesByChapter(project.id, chapterId);
  }

  @Patch("scenes/:id")
  @ApiOperation({ summary: "Update a scene" })
  async updateScene(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: UpdateSceneDto,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.updateScene(project.id, id, dto);
  }

  @Delete("scenes/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a scene" })
  async removeScene(
    @Param("projectSlug") projectSlug: string,
    @User() user: AuthUser,
    @Param("id") id: string,
  ) {
    const project = await this.projectsService.findBySlug(projectSlug, user.id);
    return this.storyboardService.deleteScene(project.id, id);
  }
}
