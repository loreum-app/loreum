import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTimelineEventDto } from './dto/create-timeline-event.dto';
import { UpdateTimelineEventDto } from './dto/update-timeline-event.dto';

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
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, dto: CreateTimelineEventDto) {
    const entityIds = await this.resolveEntitySlugs(projectId, dto.entitySlugs);
    const eraId = await this.resolveEraSlug(projectId, dto.eraSlug);

    return this.prisma.timelineEvent.create({
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
        significance: dto.significance ?? 'moderate',
        eraId,
        entities: {
          create: entityIds.map((entityId) => ({ entityId })),
        },
      },
      include: eventInclude,
    });
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
      orderBy: { sortOrder: 'asc' },
      include: eventInclude,
    });
  }

  async findById(projectId: string, id: string) {
    const event = await this.prisma.timelineEvent.findFirst({
      where: { id, projectId },
      include: eventInclude,
    });

    if (!event) {
      throw new NotFoundException('Timeline event not found');
    }

    return event;
  }

  async update(projectId: string, id: string, dto: UpdateTimelineEventDto) {
    const event = await this.findById(projectId, id);

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

    return this.prisma.timelineEvent.update({
      where: { id: event.id },
      data,
      include: eventInclude,
    });
  }

  async delete(projectId: string, id: string) {
    const event = await this.findById(projectId, id);

    await this.prisma.timelineEvent.delete({
      where: { id: event.id },
    });
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
