import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEraDto } from './dto/create-era.dto';
import { UpdateEraDto } from './dto/update-era.dto';
import { generateUniqueSlug } from '../common/utils/slug';

@Injectable()
export class ErasService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, dto: CreateEraDto) {
    const slug = await generateUniqueSlug(
      this.prisma,
      'era',
      dto.name,
      projectId,
    );

    return this.prisma.era.create({
      data: {
        projectId,
        name: dto.name,
        slug,
        description: dto.description,
        color: dto.color,
        startDate: dto.startDate,
        endDate: dto.endDate,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async findAllByProject(projectId: string) {
    return this.prisma.era.findMany({
      where: { projectId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { timelineEvents: true } },
      },
    });
  }

  async findBySlug(projectId: string, slug: string) {
    const era = await this.prisma.era.findUnique({
      where: { projectId_slug: { projectId, slug } },
      include: {
        timelineEvents: {
          orderBy: { dateValue: 'asc' },
          select: { id: true, name: true, dateValue: true, date: true },
        },
      },
    });
    if (!era) throw new NotFoundException('Era not found');
    return era;
  }

  async update(projectId: string, slug: string, dto: UpdateEraDto) {
    const era = await this.findBySlug(projectId, slug);

    let newSlug = slug;
    if (dto.name && dto.name !== era.name) {
      newSlug = await generateUniqueSlug(
        this.prisma,
        'era',
        dto.name,
        projectId,
      );
    }

    return this.prisma.era.update({
      where: { id: era.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name, slug: newSlug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.startDate !== undefined && { startDate: dto.startDate }),
        ...(dto.endDate !== undefined && { endDate: dto.endDate }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async delete(projectId: string, slug: string) {
    const era = await this.findBySlug(projectId, slug);
    await this.prisma.era.delete({ where: { id: era.id } });
  }
}
