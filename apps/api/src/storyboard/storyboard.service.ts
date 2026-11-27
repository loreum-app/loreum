import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLedgerService } from "../audit/audit-ledger.service";
import { AuditContext } from "../audit/audit.types";
import { generateUniqueSlug } from "../common/utils/slug";
import {
  assertSceneInProject,
  assertTimelineEventInProject,
} from "../common/utils/project-refs";
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
  entities: {
    include: {
      entity: { select: { id: true, name: true, slug: true, type: true } },
    },
  },
  location: { select: { id: true, name: true, slug: true, type: true } },
};

@Injectable()
export class StoryboardService {
  constructor(
    private prisma: PrismaService,
    private auditLedger: AuditLedgerService,
  ) {}

  // ── Overview ──

  async getOverview(projectId: string) {
    const [plotlines, works] = await Promise.all([
      this.prisma.plotline.findMany({
        where: { projectId },
        orderBy: { sortOrder: "asc" },
        include: {
          childPlotlines: { select: { id: true, name: true, slug: true } },
          _count: { select: { plotPoints: true } },
        },
      }),
      this.prisma.work.findMany({
        where: { projectId },
        orderBy: { releaseOrder: "asc" },
        include: {
          chapters: {
            orderBy: { sequenceNumber: "asc" },
            select: {
              id: true,
              title: true,
              sequenceNumber: true,
              _count: { select: { scenes: true } },
            },
          },
        },
      }),
    ]);

    return { plotlines, works };
  }

  // ── Plotlines ──

  async createPlotline(
    projectId: string,
    dto: CreatePlotlineDto,
    audit?: AuditContext,
  ) {
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

    const created = await this.prisma.plotline.create({
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

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "CREATE",
        targetModel: "Plotline",
        targetId: created.id,
        afterData: this.snapshot(created),
        actor: audit,
      });
    }

    return created;
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
    audit?: AuditContext,
  ) {
    const plotline = await this.findPlotlineBySlug(projectId, slug);
    const beforeSnapshot = audit ? this.snapshot(plotline) : undefined;

    let newSlug = slug;
    if (dto.name && dto.name !== plotline.name) {
      newSlug = await generateUniqueSlug(
        this.prisma,
        "plotline",
        dto.name,
        projectId,
      );
    }

    const updated = await this.prisma.plotline.update({
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

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "UPDATE",
        targetModel: "Plotline",
        targetId: updated.id,
        beforeData: beforeSnapshot,
        afterData: this.snapshot(updated),
        actor: audit,
      });
    }

    return updated;
  }

  async deletePlotline(projectId: string, slug: string, audit?: AuditContext) {
    const plotline = await this.findPlotlineBySlug(projectId, slug);
    const beforeSnapshot = audit ? this.snapshot(plotline) : undefined;

    await this.prisma.plotline.delete({ where: { id: plotline.id } });

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "DELETE",
        targetModel: "Plotline",
        targetId: plotline.id,
        beforeData: beforeSnapshot,
        actor: audit,
      });
    }
  }

  // ── Plot Points ──

  async createPlotPoint(
    projectId: string,
    plotlineSlug: string,
    dto: CreatePlotPointDto,
    audit?: AuditContext,
  ) {
    const plotline = await this.findPlotlineBySlug(projectId, plotlineSlug);
    await assertSceneInProject(this.prisma, projectId, dto.sceneId);
    await assertTimelineEventInProject(
      this.prisma,
      projectId,
      dto.timelineEventId,
    );

    let locationId: string | undefined;
    if (dto.locationSlug) {
      const location = await this.prisma.entity.findFirst({
        where: { projectId, slug: dto.locationSlug },
      });
      if (location) locationId = location.id;
    }

    const entityIds: string[] = [];
    if (dto.entitySlugs?.length) {
      const found = await this.prisma.entity.findMany({
        where: { projectId, slug: { in: dto.entitySlugs } },
        select: { id: true },
      });
      entityIds.push(...found.map((e) => e.id));
    }

    const created = await this.prisma.plotPoint.create({
      data: {
        plotlineId: plotline.id,
        sequenceNumber: dto.sequenceNumber,
        title: dto.title,
        description: dto.description,
        label: dto.label,
        sceneId: dto.sceneId,
        timelineEventId: dto.timelineEventId,
        locationId,
        entities: {
          create: entityIds.map((entityId) => ({ entityId })),
        },
      },
      include: plotPointInclude,
    });

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "CREATE",
        targetModel: "PlotPoint",
        targetId: created.id,
        afterData: this.snapshot(created),
        actor: audit,
      });
    }

    return created;
  }

  async updatePlotPoint(
    projectId: string,
    id: string,
    dto: UpdatePlotPointDto,
    audit?: AuditContext,
  ) {
    const point = await this.prisma.plotPoint.findFirst({
      where: { id, plotline: { projectId } },
      include: plotPointInclude,
    });
    if (!point) throw new NotFoundException("Plot point not found");
    const beforeSnapshot = audit ? this.snapshot(point) : undefined;
    await assertSceneInProject(this.prisma, projectId, dto.sceneId);
    await assertTimelineEventInProject(
      this.prisma,
      projectId,
      dto.timelineEventId,
    );

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.sequenceNumber !== undefined)
      data.sequenceNumber = dto.sequenceNumber;
    if (dto.sceneId !== undefined) data.sceneId = dto.sceneId;
    if (dto.timelineEventId !== undefined)
      data.timelineEventId = dto.timelineEventId;

    if (dto.entitySlugs !== undefined) {
      await this.prisma.plotPointEntity.deleteMany({
        where: { plotPointId: id },
      });
      if (dto.entitySlugs.length > 0) {
        const found = await this.prisma.entity.findMany({
          where: { projectId, slug: { in: dto.entitySlugs } },
          select: { id: true },
        });
        await this.prisma.plotPointEntity.createMany({
          data: found.map((e) => ({ plotPointId: id, entityId: e.id })),
        });
      }
    }

    if (dto.locationSlug !== undefined) {
      if (dto.locationSlug === null) {
        data.locationId = null;
      } else {
        const location = await this.prisma.entity.findFirst({
          where: { projectId, slug: dto.locationSlug },
        });
        data.locationId = location?.id ?? null;
      }
    }

    const updated = await this.prisma.plotPoint.update({
      where: { id },
      data,
      include: plotPointInclude,
    });

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "UPDATE",
        targetModel: "PlotPoint",
        targetId: updated.id,
        beforeData: beforeSnapshot,
        afterData: this.snapshot(updated),
        actor: audit,
      });
    }

    return updated;
  }

  async deletePlotPoint(projectId: string, id: string, audit?: AuditContext) {
    const point = await this.prisma.plotPoint.findFirst({
      where: { id, plotline: { projectId } },
      include: plotPointInclude,
    });
    if (!point) throw new NotFoundException("Plot point not found");
    const beforeSnapshot = audit ? this.snapshot(point) : undefined;

    await this.prisma.plotPoint.delete({ where: { id } });

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "DELETE",
        targetModel: "PlotPoint",
        targetId: point.id,
        beforeData: beforeSnapshot,
        actor: audit,
      });
    }
  }

  // ── Works ──

  async createWork(
    projectId: string,
    dto: CreateWorkDto,
    audit?: AuditContext,
  ) {
    const slug = await generateUniqueSlug(
      this.prisma,
      "work",
      dto.title,
      projectId,
    );

    const created = await this.prisma.work.create({
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

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "CREATE",
        targetModel: "Work",
        targetId: created.id,
        afterData: this.snapshot(created),
        actor: audit,
      });
    }

    return created;
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

  async updateWork(
    projectId: string,
    slug: string,
    dto: UpdateWorkDto,
    audit?: AuditContext,
  ) {
    const work = await this.findWorkBySlug(projectId, slug);
    const beforeSnapshot = audit ? this.snapshot(work) : undefined;

    let newSlug = slug;
    if (dto.title && dto.title !== work.title) {
      newSlug = await generateUniqueSlug(
        this.prisma,
        "work",
        dto.title,
        projectId,
      );
    }

    const updated = await this.prisma.work.update({
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

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "UPDATE",
        targetModel: "Work",
        targetId: updated.id,
        beforeData: beforeSnapshot,
        afterData: this.snapshot(updated),
        actor: audit,
      });
    }

    return updated;
  }

  async deleteWork(projectId: string, slug: string, audit?: AuditContext) {
    const work = await this.findWorkBySlug(projectId, slug);
    const beforeSnapshot = audit ? this.snapshot(work) : undefined;

    await this.prisma.work.delete({ where: { id: work.id } });

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "DELETE",
        targetModel: "Work",
        targetId: work.id,
        beforeData: beforeSnapshot,
        actor: audit,
      });
    }
  }

  // ── Chapters ──

  async createChapter(
    projectId: string,
    workSlug: string,
    dto: CreateChapterDto,
    audit?: AuditContext,
  ) {
    const work = await this.findWorkBySlug(projectId, workSlug);

    const created = await this.prisma.chapter.create({
      data: {
        workId: work.id,
        title: dto.title,
        sequenceNumber: dto.sequenceNumber,
        notes: dto.notes,
      },
      include: { _count: { select: { scenes: true } } },
    });

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "CREATE",
        targetModel: "Chapter",
        targetId: created.id,
        afterData: this.snapshot(created),
        actor: audit,
      });
    }

    return created;
  }

  async updateChapter(
    projectId: string,
    id: string,
    dto: UpdateChapterDto,
    audit?: AuditContext,
  ) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id, work: { projectId } },
    });
    if (!chapter) throw new NotFoundException("Chapter not found");
    const beforeSnapshot = audit ? this.snapshot(chapter) : undefined;

    const updated = await this.prisma.chapter.update({
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

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "UPDATE",
        targetModel: "Chapter",
        targetId: updated.id,
        beforeData: beforeSnapshot,
        afterData: this.snapshot(updated),
        actor: audit,
      });
    }

    return updated;
  }

  async deleteChapter(projectId: string, id: string, audit?: AuditContext) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id, work: { projectId } },
    });
    if (!chapter) throw new NotFoundException("Chapter not found");
    const beforeSnapshot = audit ? this.snapshot(chapter) : undefined;

    await this.prisma.chapter.delete({ where: { id } });

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "DELETE",
        targetModel: "Chapter",
        targetId: chapter.id,
        beforeData: beforeSnapshot,
        actor: audit,
      });
    }
  }

  // ── Scenes ──

  async createScene(
    projectId: string,
    dto: CreateSceneDto,
    audit?: AuditContext,
  ) {
    const chapter = await this.prisma.chapter.findFirst({
      where: { id: dto.chapterId, work: { projectId } },
    });
    if (!chapter) throw new NotFoundException("Chapter not found");
    await assertTimelineEventInProject(
      this.prisma,
      projectId,
      dto.timelineEventId,
    );

    let plotlineId: string | undefined;
    if (dto.plotlineSlug) {
      const plotline = await this.prisma.plotline.findFirst({
        where: { projectId, slug: dto.plotlineSlug },
      });
      if (plotline) plotlineId = plotline.id;
    }

    let locationId: string | undefined;
    if (dto.locationSlug) {
      const loc = await this.prisma.entity.findFirst({
        where: { projectId, slug: dto.locationSlug },
      });
      if (loc) locationId = loc.id;
    }

    let povEntityId: string | undefined;
    if (dto.povCharacterSlug) {
      const pov = await this.prisma.entity.findFirst({
        where: { projectId, slug: dto.povCharacterSlug },
      });
      if (pov) povEntityId = pov.id;
    }

    const scene = await this.prisma.scene.create({
      data: {
        chapterId: dto.chapterId,
        sequenceNumber: dto.sequenceNumber,
        title: dto.title,
        description: dto.description,
        content: dto.content,
        styleNotes: dto.styleNotes,
        plotlineId,
        locationId,
        timelineEventId: dto.timelineEventId,
      },
    });

    if (povEntityId) {
      await this.prisma.sceneCharacter.create({
        data: { sceneId: scene.id, entityId: povEntityId, isPov: true },
      });
    }

    if (dto.characterSlugs?.length) {
      const charEntities = await this.prisma.entity.findMany({
        where: { projectId, slug: { in: dto.characterSlugs } },
        select: { id: true },
      });
      const existingPovId = povEntityId;
      const nonPovIds = charEntities
        .map((e) => e.id)
        .filter((id) => id !== existingPovId);
      if (nonPovIds.length) {
        await this.prisma.sceneCharacter.createMany({
          data: nonPovIds.map((entityId) => ({
            sceneId: scene.id,
            entityId,
            isPov: false,
          })),
          skipDuplicates: true,
        });
      }
    }

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "CREATE",
        targetModel: "Scene",
        targetId: scene.id,
        afterData: this.snapshot(scene),
        actor: audit,
      });
    }

    return scene;
  }

  async findSceneById(projectId: string, id: string) {
    const scene = await this.prisma.scene.findFirst({
      where: { id, chapter: { work: { projectId } } },
      include: {
        chapter: {
          select: {
            id: true,
            title: true,
            sequenceNumber: true,
            work: { select: { id: true, title: true, slug: true } },
          },
        },
        plotline: { select: { id: true, name: true, slug: true } },
        location: { select: { id: true, name: true, slug: true } },
        characters: {
          select: {
            role: true,
            isPov: true,
            entity: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
    if (!scene) throw new NotFoundException("Scene not found");
    return scene;
  }

  async findScenesByChapter(projectId: string, chapterId: string) {
    return this.prisma.scene.findMany({
      where: { chapterId, chapter: { work: { projectId } } },
      orderBy: { sequenceNumber: "asc" },
      include: {
        plotline: { select: { id: true, name: true, slug: true } },
        timelineEvent: { select: { id: true, name: true, date: true } },
        characters: {
          select: {
            entityId: true,
            role: true,
            isPov: true,
            entity: { select: { id: true, name: true, slug: true } },
          },
        },
        location: { select: { id: true, name: true, slug: true } },
      },
    });
  }

  async updateScene(
    projectId: string,
    id: string,
    dto: UpdateSceneDto,
    audit?: AuditContext,
  ) {
    const scene = await this.prisma.scene.findFirst({
      where: { id, chapter: { work: { projectId } } },
      include: {
        plotline: { select: { id: true, name: true, slug: true } },
        characters: {
          select: {
            entityId: true,
            role: true,
            isPov: true,
            entity: { select: { id: true, name: true, slug: true } },
          },
        },
        location: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!scene) throw new NotFoundException("Scene not found");
    const beforeSnapshot = audit ? this.snapshot(scene) : undefined;
    await assertTimelineEventInProject(
      this.prisma,
      projectId,
      dto.timelineEventId,
    );

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.styleNotes !== undefined) data.styleNotes = dto.styleNotes;
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

    const updated = await this.prisma.scene.update({
      where: { id },
      data,
      include: {
        plotline: { select: { id: true, name: true, slug: true } },
        characters: {
          select: {
            entityId: true,
            role: true,
            isPov: true,
            entity: { select: { id: true, name: true, slug: true } },
          },
        },
        location: { select: { id: true, name: true, slug: true } },
      },
    });

    if (dto.povCharacterSlug !== undefined) {
      await this.prisma.sceneCharacter.deleteMany({
        where: { sceneId: id, isPov: true },
      });

      if (dto.povCharacterSlug !== null) {
        const pov = await this.prisma.entity.findFirst({
          where: { projectId, slug: dto.povCharacterSlug },
        });
        if (pov) {
          await this.prisma.sceneCharacter.upsert({
            where: { sceneId_entityId: { sceneId: id, entityId: pov.id } },
            create: { sceneId: id, entityId: pov.id, isPov: true },
            update: { isPov: true },
          });
        }
      }
    }

    if (dto.characterSlugs !== undefined) {
      await this.prisma.sceneCharacter.deleteMany({
        where: { sceneId: id, isPov: false },
      });
      if (dto.characterSlugs.length) {
        const charEntities = await this.prisma.entity.findMany({
          where: { projectId, slug: { in: dto.characterSlugs } },
          select: { id: true },
        });
        if (charEntities.length) {
          await this.prisma.sceneCharacter.createMany({
            data: charEntities.map((e) => ({
              sceneId: id,
              entityId: e.id,
              isPov: false,
            })),
            skipDuplicates: true,
          });
        }
      }
    }

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "UPDATE",
        targetModel: "Scene",
        targetId: updated.id,
        beforeData: beforeSnapshot,
        afterData: this.snapshot(updated),
        actor: audit,
      });
    }

    return updated;
  }

  async deleteScene(projectId: string, id: string, audit?: AuditContext) {
    const scene = await this.prisma.scene.findFirst({
      where: { id, chapter: { work: { projectId } } },
      include: {
        plotline: { select: { id: true, name: true, slug: true } },
        characters: {
          select: {
            entityId: true,
            role: true,
            isPov: true,
            entity: { select: { id: true, name: true, slug: true } },
          },
        },
        location: { select: { id: true, name: true, slug: true } },
      },
    });
    if (!scene) throw new NotFoundException("Scene not found");
    const beforeSnapshot = audit ? this.snapshot(scene) : undefined;

    await this.prisma.scene.delete({ where: { id } });

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "DELETE",
        targetModel: "Scene",
        targetId: scene.id,
        beforeData: beforeSnapshot,
        actor: audit,
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic snapshot for JSON column
  private snapshot(record: any): object {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentionally stripping internal fields
    const { projectId, searchVector, createdAt, updatedAt, ...rest } = record;
    return rest;
  }
}
