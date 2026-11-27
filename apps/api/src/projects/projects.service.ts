import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EntitlementsService } from "../billing/entitlements.service";
import { AuditLedgerService } from "../audit/audit-ledger.service";
import { AuditContext } from "../audit/audit.types";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { slugify } from "../common/utils/slug";

/**
 * Tells API/MCP callers how to fill timeline date fields for this world. The
 * gantt reads different fields per mode (ISO `date` strings in standard mode,
 * numeric `dateValue` in custom mode), and nothing else in the payload says so.
 */
export function timelineDateGuide(project: {
  timelineMode: string;
  timelineStart: number | null;
  timelineEnd: number | null;
  timelineLabelPrefix: string | null;
  timelineLabelSuffix: string | null;
}): string {
  if (project.timelineMode === "custom") {
    const prefix = project.timelineLabelPrefix ?? "";
    const suffix = project.timelineLabelSuffix ?? "";
    const range =
      project.timelineStart != null && project.timelineEnd != null
        ? ` between ${project.timelineStart} and ${project.timelineEnd}`
        : "";
    const example = `${prefix}${project.timelineStart ?? 1000}${suffix}`;
    return (
      `Custom numeric calendar. Timeline events: set dateValue (and endDateValue for spans) to a number${range}; ` +
      `the gantt ignores the date string, so set date to the display label, e.g. "${example}". ` +
      "Eras: startDate and endDate are numbers on the same scale."
    );
  }
  const range =
    project.timelineStart != null && project.timelineEnd != null
      ? ` Configured year range: ${project.timelineStart}–${project.timelineEnd}.`
      : "";
  return (
    "Standard (real-world) calendar. Timeline events: set date (and endDate for spans) to an ISO date, YYYY-MM-DD; " +
    "leave dateValue and endDateValue unset. Eras: startDate and endDate are calendar years, e.g. 2071." +
    range
  );
}

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private entitlements: EntitlementsService,
    private auditLedger: AuditLedgerService,
  ) {}

  async create(userId: string, dto: CreateProjectDto, audit?: AuditContext) {
    const { maxProjects } = await this.entitlements.limits(userId);
    if (maxProjects !== null) {
      const count = await this.prisma.project.count({
        where: { ownerId: userId },
      });
      if (count >= maxProjects) {
        throw new ForbiddenException(
          `Your plan allows ${maxProjects} project${maxProjects === 1 ? "" : "s"}. Upgrade to create more.`,
        );
      }
    }

    const slug = await this.generateUniqueSlug(dto.name);

    const created = await this.prisma.project.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description?.trim() || null,
        visibility: dto.visibility,
        ownerId: userId,
      },
    });

    if (audit) {
      await this.auditLedger.append({
        projectId: created.id,
        operation: "CREATE",
        targetModel: "Project",
        targetId: created.id,
        afterData: this.snapshot(created),
        actor: audit,
      });
    }

    return created;
  }

  /**
   * Orientation payload for MCP clients: identity, timeline settings, and how
   * much content of each kind exists.
   */
  async getSummary(projectId: string) {
    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });
    const [byType, lore, events, eras, relationships, plotlines, works, tags] =
      await Promise.all([
        this.prisma.entity.groupBy({
          by: ["type"],
          where: { projectId },
          _count: { _all: true },
        }),
        this.prisma.loreArticle.count({ where: { projectId } }),
        this.prisma.timelineEvent.count({ where: { projectId } }),
        this.prisma.era.count({ where: { projectId } }),
        this.prisma.relationship.count({ where: { projectId } }),
        this.prisma.plotline.count({ where: { projectId } }),
        this.prisma.work.count({ where: { projectId } }),
        this.prisma.tag.count({ where: { projectId } }),
      ]);
    const entities: Record<string, number> = {};
    for (const row of byType) entities[row.type] = row._count._all;

    return {
      name: project.name,
      slug: project.slug,
      description: project.description,
      visibility: project.visibility,
      timeline: {
        mode: project.timelineMode,
        start: project.timelineStart,
        end: project.timelineEnd,
        labelPrefix: project.timelineLabelPrefix,
        labelSuffix: project.timelineLabelSuffix,
        dateGuide: timelineDateGuide(project),
      },
      counts: {
        entities,
        relationships,
        loreArticles: lore,
        timelineEvents: events,
        eras,
        plotlines,
        works,
        tags,
      },
    };
  }

  async findAllByUser(userId: string) {
    return this.prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
    });
  }

  async findBySlug(slug: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { slug },
    });

    if (!project) {
      throw new NotFoundException(`Project not found`);
    }

    this.assertOwner(project.ownerId, userId);
    return project;
  }

  async findPublicBySlug(slug: string) {
    const project = await this.prisma.project.findUnique({
      where: { slug },
    });

    if (!project || project.visibility === "PRIVATE") {
      throw new NotFoundException("Project not found");
    }

    return project;
  }

  async update(
    slug: string,
    userId: string,
    dto: UpdateProjectDto,
    audit?: AuditContext,
  ) {
    const project = await this.findBySlug(slug, userId);
    const beforeSnapshot = audit ? this.snapshot(project) : undefined;

    const data: Record<string, unknown> = {};
    if (dto.description !== undefined)
      data.description = dto.description.trim() || null;
    if (dto.visibility !== undefined) data.visibility = dto.visibility;

    if (dto.name !== undefined) {
      data.name = dto.name;
      data.slug = await this.generateUniqueSlug(dto.name, project.id);
    }

    const updated = await this.prisma.project.update({
      where: { id: project.id },
      data,
    });

    if (audit) {
      await this.auditLedger.append({
        projectId: updated.id,
        operation: "UPDATE",
        targetModel: "Project",
        targetId: updated.id,
        beforeData: beforeSnapshot,
        afterData: this.snapshot(updated),
        actor: audit,
      });
    }

    return updated;
  }

  async delete(slug: string, userId: string) {
    const project = await this.findBySlug(slug, userId);

    await this.prisma.project.delete({
      where: { id: project.id },
    });
  }

  async saveTimelineConfig(
    slug: string,
    userId: string,
    config: {
      timelineMode?: string;
      timelineStart?: number;
      timelineEnd?: number;
      timelineLabelPrefix?: string;
      timelineLabelSuffix?: string;
    },
    audit?: AuditContext,
  ) {
    const project = await this.findBySlug(slug, userId);
    const beforeSnapshot = audit
      ? {
          timelineMode: project.timelineMode,
          timelineStart: project.timelineStart,
          timelineEnd: project.timelineEnd,
          timelineLabelPrefix: project.timelineLabelPrefix,
          timelineLabelSuffix: project.timelineLabelSuffix,
        }
      : undefined;

    const updated = await this.prisma.project.update({
      where: { id: project.id },
      data: {
        ...(config.timelineMode !== undefined && {
          timelineMode: config.timelineMode,
        }),
        timelineStart: config.timelineStart,
        timelineEnd: config.timelineEnd,
        timelineLabelPrefix: config.timelineLabelPrefix,
        timelineLabelSuffix: config.timelineLabelSuffix,
      },
      select: {
        timelineMode: true,
        timelineStart: true,
        timelineEnd: true,
        timelineLabelPrefix: true,
        timelineLabelSuffix: true,
      },
    });

    if (audit) {
      await this.auditLedger.append({
        projectId: project.id,
        operation: "UPDATE",
        targetModel: "Project",
        targetId: project.id,
        beforeData: beforeSnapshot,
        afterData: updated,
        actor: audit,
      });
    }

    return updated;
  }

  async patchGraphLayout(
    slug: string,
    userId: string,
    patch: Record<string, { x: number; y: number }>,
  ) {
    const project = await this.findBySlug(slug, userId);
    await this.prisma.$executeRaw`
      UPDATE projects
      SET "graphLayout" = COALESCE("graphLayout", '{}') || ${JSON.stringify(patch)}::jsonb
      WHERE id = ${project.id}
    `;
    return patch; // $executeRaw returns an affected row count, not the updated record, which is why we return patch directly instead of the updated project.
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic snapshot for JSON column
  private snapshot(record: any): object {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentionally stripping internal fields
    const { ownerId, graphLayout, createdAt, updatedAt, ...rest } = record;
    return rest;
  }

  private assertOwner(ownerId: string, userId: string) {
    if (ownerId !== userId) {
      throw new ForbiddenException("You do not own this project");
    }
  }

  private async generateUniqueSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let counter = 0;

    while (true) {
      const existing = await this.prisma.project.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing || existing.id === excludeId) return slug;
      counter++;
      slug = `${base}-${counter}`;
    }
  }
}
