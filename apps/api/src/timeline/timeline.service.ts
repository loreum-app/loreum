import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLedgerService } from "../audit/audit-ledger.service";
import { AuditContext } from "../audit/audit.types";
import { CreateTimelineEventDto } from "./dto/create-timeline-event.dto";
import { UpdateTimelineEventDto } from "./dto/update-timeline-event.dto";

const eventInclude = {
  entities: {
    include: {
      entity: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
        },
      },
    },
  },
  era: { select: { id: true, name: true, slug: true, color: true } },
};

@Injectable()
export class TimelineService {
  constructor(
    private prisma: PrismaService,
    private auditLedger: AuditLedgerService,
  ) {}

  async create(
    projectId: string,
    dto: CreateTimelineEventDto,
    audit?: AuditContext,
  ) {
    const entityIds = await this.resolveEntitySlugs(projectId, dto.entitySlugs);
    const eraId = await this.resolveEraSlug(projectId, dto.eraSlug);

    const created = await this.prisma.timelineEvent.create({
      data: {
        projectId,
        name: dto.name,
        description: dto.description,
        date: dto.date,
        dateValue: dto.dateValue,
        endDate: dto.endDate,
        endDateValue: dto.endDateValue,
        sortOrder: dto.sortOrder,
        periodStart: dto.periodStart,
        periodEnd: dto.periodEnd,
        significance: dto.significance ?? "moderate",
        eraId,
        entities: {
          create: entityIds.map((entityId) => ({ entityId })),
        },
      },
      include: eventInclude,
    });

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "CREATE",
        targetModel: "TimelineEvent",
        targetId: created.id,
        afterData: this.snapshot(created),
        actor: audit,
      });
    }

    return created;
  }

  async findAllByProject(
    projectId: string,
    filters?: { entity?: string; significance?: string },
  ) {
    const where: Record<string, unknown> = { projectId };

    if (filters?.significance) {
      where.significance = filters.significance;
    }

    if (filters?.entity) {
      where.entities = {
        some: { entity: { slug: filters.entity } },
      };
    }

    return this.prisma.timelineEvent.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      include: eventInclude,
    });
  }

  async findById(projectId: string, id: string) {
    const event = await this.prisma.timelineEvent.findFirst({
      where: { id, projectId },
      include: eventInclude,
    });

    if (!event) {
      throw new NotFoundException("Timeline event not found");
    }

    return event;
  }

  async update(
    projectId: string,
    id: string,
    dto: UpdateTimelineEventDto,
    audit?: AuditContext,
  ) {
    const event = await this.findById(projectId, id);
    const beforeSnapshot = audit ? this.snapshot(event) : undefined;

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.date !== undefined) data.date = dto.date;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.periodStart !== undefined) data.periodStart = dto.periodStart;
    if (dto.periodEnd !== undefined) data.periodEnd = dto.periodEnd;
    if (dto.significance !== undefined) data.significance = dto.significance;
    if (dto.dateValue !== undefined) data.dateValue = dto.dateValue;
    if (dto.endDate !== undefined) data.endDate = dto.endDate;
    if (dto.endDateValue !== undefined) data.endDateValue = dto.endDateValue;

    if (dto.eraSlug !== undefined) {
      data.eraId = await this.resolveEraSlug(projectId, dto.eraSlug);
    }

    if (dto.entitySlugs !== undefined) {
      const entityIds = await this.resolveEntitySlugs(
        projectId,
        dto.entitySlugs,
      );
      data.entities = {
        deleteMany: {},
        create: entityIds.map((entityId) => ({ entityId })),
      };
    }

    const updated = await this.prisma.timelineEvent.update({
      where: { id: event.id },
      data,
      include: eventInclude,
    });

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "UPDATE",
        targetModel: "TimelineEvent",
        targetId: updated.id,
        beforeData: beforeSnapshot,
        afterData: this.snapshot(updated),
        actor: audit,
      });
    }

    return updated;
  }

  async delete(projectId: string, id: string, audit?: AuditContext) {
    const event = await this.findById(projectId, id);
    const beforeSnapshot = audit ? this.snapshot(event) : undefined;

    await this.prisma.timelineEvent.delete({
      where: { id: event.id },
    });

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "DELETE",
        targetModel: "TimelineEvent",
        targetId: event.id,
        beforeData: beforeSnapshot,
        actor: audit,
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic snapshot for JSON column
  private snapshot(event: any): object {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentionally stripping internal fields
    const { projectId, createdAt, ...rest } = event;
    const clean = { ...rest };
    if (clean.entities) {
      clean.entitySlugs = clean.entities
        .map((e: { entity?: { slug?: string } }) => e.entity?.slug)
        .filter(Boolean);
      delete clean.entities;
    }
    if (clean.era) {
      clean.eraSlug = clean.era.slug;
      delete clean.era;
    }
    return clean;
  }

  private async resolveEraSlug(
    projectId: string,
    slug?: string,
  ): Promise<string | undefined> {
    if (!slug) return undefined;
    const era = await this.prisma.era.findUnique({
      where: { projectId_slug: { projectId, slug } },
      select: { id: true },
    });
    return era?.id;
  }

  private async resolveEntitySlugs(
    projectId: string,
    slugs?: string[],
  ): Promise<string[]> {
    if (!slugs?.length) return [];

    const entities = await this.prisma.entity.findMany({
      where: { projectId, slug: { in: slugs } },
      select: { id: true },
    });

    return entities.map((e) => e.id);
  }
}
