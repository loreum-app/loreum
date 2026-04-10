import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { ProjectsService } from "./projects.service";
import { PrismaService } from "../prisma/prisma.service";

const entityListSelect = {
  id: true,
  type: true,
  name: true,
  slug: true,
  summary: true,
  imageUrl: true,
  character: { select: { status: true, species: true, role: true } },
  location: { select: { region: true, condition: true } },
  organization: { select: { status: true, territory: true } },
  item: { include: { itemType: { select: { name: true, slug: true } } } },
  entityTags: {
    include: { tag: { select: { id: true, name: true, color: true } } },
  },
} as const;

const entityHubSelect = {
  ...entityListSelect,
  description: true,
  backstory: true,
  notes: true,
  // secrets intentionally omitted
  sourceRelationships: {
    include: {
      targetEntity: {
        select: { id: true, name: true, slug: true, type: true },
      },
    },
  },
  targetRelationships: {
    include: {
      sourceEntity: {
        select: { id: true, name: true, slug: true, type: true },
      },
    },
  },
  timelineEventEntities: {
    include: {
      timelineEvent: {
        select: { id: true, name: true, date: true, significance: true },
      },
    },
  },
  loreArticleEntities: {
    include: {
      loreArticle: {
        select: { id: true, title: true, slug: true, category: true },
      },
    },
  },
} as const;

@ApiTags("Public Wiki")
@Controller("worlds/:slug")
export class PublicWikiController {
  constructor(
    private projectsService: ProjectsService,
    private prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get public project overview" })
  async getProject(@Param("slug") slug: string) {
    const project = await this.projectsService.findPublicBySlug(slug);
    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
    };
  }

  @Get("entities")
  @ApiOperation({ summary: "List public entities" })
  async listEntities(
    @Param("slug") slug: string,
    @Query("type") type?: string,
  ) {
    const project = await this.projectsService.findPublicBySlug(slug);
    return this.prisma.entity.findMany({
      where: {
        projectId: project.id,
        ...(type ? { type: type as never } : {}),
      },
      orderBy: { name: "asc" },
      select: entityListSelect,
    });
  }

  @Get("entities/:entitySlug")
  @ApiOperation({ summary: "Get a public entity with hub data" })
  async getEntity(
    @Param("slug") slug: string,
    @Param("entitySlug") entitySlug: string,
  ) {
    const project = await this.projectsService.findPublicBySlug(slug);
    return this.prisma.entity.findUniqueOrThrow({
      where: { projectId_slug: { projectId: project.id, slug: entitySlug } },
      select: entityHubSelect,
    });
  }

  @Get("relationships")
  @ApiOperation({ summary: "List public relationships" })
  async listRelationships(@Param("slug") slug: string) {
    const project = await this.projectsService.findPublicBySlug(slug);
    return this.prisma.relationship.findMany({
      where: { projectId: project.id },
      include: {
        sourceEntity: {
          select: { id: true, name: true, slug: true, type: true },
        },
        targetEntity: {
          select: { id: true, name: true, slug: true, type: true },
        },
      },
    });
  }

  @Get("timeline")
  @ApiOperation({ summary: "List public timeline events" })
  async listTimeline(@Param("slug") slug: string) {
    const project = await this.projectsService.findPublicBySlug(slug);
    return this.prisma.timelineEvent.findMany({
      where: { projectId: project.id },
      orderBy: { sortOrder: "asc" },
      include: {
        era: true,
        entities: {
          include: {
            entity: {
              select: { id: true, name: true, slug: true, type: true },
            },
          },
        },
      },
    });
  }

  @Get("eras")
  @ApiOperation({ summary: "List public eras" })
  async listEras(@Param("slug") slug: string) {
    const project = await this.projectsService.findPublicBySlug(slug);
    return this.prisma.era.findMany({
      where: { projectId: project.id },
      orderBy: { sortOrder: "asc" },
    });
  }

  @Get("lore")
  @ApiOperation({ summary: "List public lore articles" })
  async listLore(@Param("slug") slug: string) {
    const project = await this.projectsService.findPublicBySlug(slug);
    return this.prisma.loreArticle.findMany({
      where: { projectId: project.id },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  @Get("lore/:loreSlug")
  @ApiOperation({ summary: "Get a public lore article" })
  async getLoreArticle(
    @Param("slug") slug: string,
    @Param("loreSlug") loreSlug: string,
  ) {
    const project = await this.projectsService.findPublicBySlug(slug);
    return this.prisma.loreArticle.findUniqueOrThrow({
      where: { projectId_slug: { projectId: project.id, slug: loreSlug } },
      include: {
        entities: {
          include: {
            entity: {
              select: { id: true, name: true, slug: true, type: true },
            },
          },
        },
      },
    });
  }

  @Get("storyboard")
  @ApiOperation({ summary: "Get public storyboard overview" })
  async getStoryboard(@Param("slug") slug: string) {
    const project = await this.projectsService.findPublicBySlug(slug);

    const [plotlines, works] = await Promise.all([
      this.prisma.plotline.findMany({
        where: { projectId: project.id },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { plotPoints: true } } },
      }),
      this.prisma.work.findMany({
        where: { projectId: project.id },
        orderBy: { releaseOrder: "asc" },
        include: { _count: { select: { chapters: true } } },
      }),
    ]);

    return { plotlines, works };
  }
}
