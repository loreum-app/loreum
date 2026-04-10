import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { generateUniqueSlug } from "../common/utils/slug";
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

const plotPointInclude = {
  scene: { select: { id: true, title: true } },
  timelineEvent: { select: { id: true, name: true, date: true } },
  entity: { select: { id: true, name: true, slug: true, type: true } },
};

@Injectable()
export class StoryboardService {
  constructor(private prisma: PrismaService) {}

  // ── Plotlines ──

  async createPlotline(projectId: string, dto: CreatePlotlineDto) {
    const slug = await generateUniqueSlug(
      this.prisma,
      "plotline",
      dto.name,
      projectId,
    );

    let parentPlotlineId: string | undefined;
    if (dto.parentPlotlineSlug) {
      const parent = await this.findPlotlineBySlug(
        projectId,
        dto.parentPlotlineSlug,
      );
      parentPlotlineId = parent.id;
    }

    return this.prisma.plotline.create({
      data: {
        projectId,
        name: dto.name,
        slug,
        description: dto.description,
        thematicStatement: dto.thematicStatement,
        parentPlotlineId,
      },
      include: { childPlotlines: true },
    });
  }

  async findAllPlotlines(projectId: string) {
    return this.prisma.plotline.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
      include: {
        childPlotlines: true,
        _count: { select: { plotPoints: true } },
      },
    });
  }

  async findPlotlineBySlug(projectId: string, slug: string) {
    const plotline = await this.prisma.plotline.findUnique({
      where: { projectId_slug: { projectId, slug } },
      include: {
        childPlotlines: true,
        parentPlotline: { select: { id: true, name: true, slug: true } },
        plotPoints: {
          orderBy: { sequenceNumber: "asc" },
          include: plotPointInclude,
        },
      },
    });
    if (!plotline) throw new NotFoundException("Plotline not found");
    return plotline;
  }

  async updatePlotline(
    projectId: string,
    slug: string,
    dto: UpdatePlotlineDto,
  ) {
    const plotline = await this.findPlotlineBySlug(projectId, slug);

    let newSlug = slug;
    if (dto.name && dto.name !== plotline.name) {
      newSlug = await generateUniqueSlug(
        this.prisma,
        "plotline",
        dto.name,
        projectId,
      );
    }

    return this.prisma.plotline.update({
      where: { id: plotline.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name, slug: newSlug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.thematicStatement !== undefined && {
          thematicStatement: dto.thematicStatement,
        }),
      },
      include: {
        childPlotlines: true,
        plotPoints: {
          orderBy: { sequenceNumber: "asc" },
          include: plotPointInclude,
        },
      },
    });
  }

  async deletePlotline(projectId: string, slug: string) {
    const plotline = await this.findPlotlineBySlug(projectId, slug);
    await this.prisma.plotline.delete({ where: { id: plotline.id } });
  }

  // ── Plot Points ──

  async createPlotPoint(
    projectId: string,
    plotlineSlug: string,
    dto: CreatePlotPointDto,
  ) {
    const plotline = await this.findPlotlineBySlug(projectId, plotlineSlug);

    let entityId: string | undefined;
    if (dto.entitySlug) {
      const entity = await this.prisma.entity.findFirst({
        where: { projectId, slug: dto.entitySlug },
      });
      if (entity) entityId = entity.id;
    }

    return this.prisma.plotPoint.create({
      data: {
        plotlineId: plotline.id,
        sequenceNumber: dto.sequenceNumber,
        title: dto.title,
        description: dto.description,
        label: dto.label,
        sceneId: dto.sceneId,
        timelineEventId: dto.timelineEventId,
        entityId,
      },
      include: plotPointInclude,
    });
  }

  async updatePlotPoint(
    projectId: string,
    id: string,
    dto: UpdatePlotPointDto,
  ) {
    const point = await this.prisma.plotPoint.findFirst({
      where: { id, plotline: { projectId } },
    });
    if (!point) throw new NotFoundException("Plot point not found");

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.sequenceNumber !== undefined)
      data.sequenceNumber = dto.sequenceNumber;
    if (dto.sceneId !== undefined) data.sceneId = dto.sceneId;
    if (dto.timelineEventId !== undefined)
      data.timelineEventId = dto.timelineEventId;

    if (dto.entitySlug !== undefined) {
      if (dto.entitySlug === null) {
        data.entityId = null;
      } else {
        const entity = await this.prisma.entity.findFirst({
          where: { projectId, slug: dto.entitySlug },
        });
        data.entityId = entity?.id ?? null;
      }
    }

    return this.prisma.plotPoint.update({
      where: { id },
      data,
      include: plotPointInclude,
    });
  }

  async deletePlotPoint(projectId: string, id: string) {
    const point = await this.prisma.plotPoint.findFirst({
      where: { id, plotline: { projectId } },
    });
    if (!point) throw new NotFoundException("Plot point not found");
    await this.prisma.plotPoint.delete({ where: { id } });
  }

  // ── Works ──

  async createWork(projectId: string, dto: CreateWorkDto) {
    const slug = await generateUniqueSlug(
      this.prisma,
      "work",
      dto.title,
      projectId,
    );

    return this.prisma.work.create({
      data: {
        projectId,
        title: dto.title,
        slug,
        chronologicalOrder: dto.chronologicalOrder,
        releaseOrder: dto.releaseOrder,
        synopsis: dto.synopsis,
        status: dto.status ?? "concept",
      },
      include: { chapters: { orderBy: { sequenceNumber: "asc" } } },
    });
  }

  async findAllWorks(projectId: string) {
    return this.prisma.work.findMany({
      where: { projectId },
      orderBy: { releaseOrder: "asc" },
      include: {
        _count: { select: { chapters: true } },
      },
    });
  }

  async findWorkBySlug(projectId: string, slug: string) {
    const work = await this.prisma.work.findUnique({
      where: { projectId_slug: { projectId, slug } },
      include: {
        chapters: {
          orderBy: { sequenceNumber: "asc" },
          include: {
            _count: { select: { scenes: true } },
          },
        },
      },
    });
    if (!work) throw new NotFoundException("Work not found");
    return work;
  }

  async updateWork(projectId: string, slug: string, dto: UpdateWorkDto) {
    const work = await this.findWorkBySlug(projectId, slug);

    let newSlug = slug;
    if (dto.title && dto.title !== work.title) {
      newSlug = await generateUniqueSlug(
        this.prisma,
        "work",
        dto.title,
        projectId,
      );
    }

    return this.prisma.work.update({
      where: { id: work.id },
      data: {
        ...(dto.title !== undefined && { title: dto.title, slug: newSlug }),
        ...(dto.synopsis !== undefined && { synopsis: dto.synopsis }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: {
        chapters: {
          orderBy: { sequenceNumber: "asc" },
          include: { _count: { select: { scenes: true } } },
        },
      },
    });
  }

  async deleteWork(projectId: string, slug: string) {
    const work = await this.findWorkBySlug(projectId, slug);
    await this.prisma.work.delete({ where: { id: work.id } });
  }

  // ── Chapters ──

  async createChapter(
    projectId: string,
    workSlug: string,
    dto: CreateChapterDto,
  ) {
    const work = await this.findWorkBySlug(projectId, workSlug);

    return this.prisma.chapter.create({
      data: {
        workId: work.id,
        title: dto.title,
        sequenceNumber: dto.sequenceNumber,
        notes: dto.notes,
      },
      include: { _count: { select: { scenes: true } } },
    });
  }

  async updateChapter(projectId: string, id: string, dto: UpdateChapterDto) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id, work: { projectId } },
    });
    if (!chapter) throw new NotFoundException("Chapter not found");

    return this.prisma.chapter.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.sequenceNumber !== undefined && {
          sequenceNumber: dto.sequenceNumber,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: { _count: { select: { scenes: true } } },
    });
  }

  async deleteChapter(projectId: string, id: string) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id, work: { projectId } },
    });
    if (!chapter) throw new NotFoundException("Chapter not found");
    await this.prisma.chapter.delete({ where: { id } });
  }

  // ── Scenes ──

  async createScene(projectId: string, dto: CreateSceneDto) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id: dto.chapterId, work: { projectId } },
    });
    if (!chapter) throw new NotFoundException("Chapter not found");

    let plotlineId: string | undefined;
    if (dto.plotlineSlug) {
      const plotline = await this.prisma.plotline.findFirst({
        where: { projectId, slug: dto.plotlineSlug },
      });
      if (plotline) plotlineId = plotline.id;
    }

    let povCharacterId: string | undefined;
    if (dto.povCharacterSlug) {
      const pov = await this.prisma.entity.findFirst({
        where: { projectId, slug: dto.povCharacterSlug },
      });
      if (pov) povCharacterId = pov.id;
    }

    let locationId: string | undefined;
    if (dto.locationSlug) {
      const loc = await this.prisma.entity.findFirst({
        where: { projectId, slug: dto.locationSlug },
      });
      if (loc) locationId = loc.id;
    }

    return this.prisma.scene.create({
      data: {
        chapterId: dto.chapterId,
        sequenceNumber: dto.sequenceNumber,
        title: dto.title,
        description: dto.description,
        plotlineId,
        povCharacterId,
        locationId,
        timelineEventId: dto.timelineEventId,
      },
    });
  }

  async findScenesByChapter(projectId: string, chapterId: string) {
    return this.prisma.scene.findMany({
      where: { chapterId, chapter: { work: { projectId } } },
      orderBy: { sequenceNumber: "asc" },
      include: {
        plotline: { select: { id: true, name: true, slug: true } },
        povCharacter: { select: { id: true, name: true, slug: true } },
        location: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async updateScene(projectId: string, id: string, dto: UpdateSceneDto) {
    const scene = await this.prisma.scene.findFirst({
      where: { id, chapter: { work: { projectId } } },
    });
    if (!scene) throw new NotFoundException("Scene not found");

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.sequenceNumber !== undefined)
      data.sequenceNumber = dto.sequenceNumber;
    if (dto.timelineEventId !== undefined)
      data.timelineEventId = dto.timelineEventId;

    if (dto.plotlineSlug !== undefined) {
      if (dto.plotlineSlug === null) {
        data.plotlineId = null;
      } else {
        const plotline = await this.prisma.plotline.findFirst({
          where: { projectId, slug: dto.plotlineSlug },
        });
        data.plotlineId = plotline?.id ?? null;
      }
    }

    if (dto.povCharacterSlug !== undefined) {
      if (dto.povCharacterSlug === null) {
        data.povCharacterId = null;
      } else {
        const pov = await this.prisma.entity.findFirst({
          where: { projectId, slug: dto.povCharacterSlug },
        });
        data.povCharacterId = pov?.id ?? null;
      }
    }

    if (dto.locationSlug !== undefined) {
      if (dto.locationSlug === null) {
        data.locationId = null;
      } else {
        const loc = await this.prisma.entity.findFirst({
          where: { projectId, slug: dto.locationSlug },
        });
        data.locationId = loc?.id ?? null;
      }
    }

    return this.prisma.scene.update({
      where: { id },
      data,
      include: {
        plotline: { select: { id: true, name: true, slug: true } },
        povCharacter: { select: { id: true, name: true, slug: true } },
        location: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async deleteScene(projectId: string, id: string) {
    const scene = await this.prisma.scene.findFirst({
      where: { id, chapter: { work: { projectId } } },
    });
    if (!scene) throw new NotFoundException("Scene not found");
    await this.prisma.scene.delete({ where: { id } });
  }
}
