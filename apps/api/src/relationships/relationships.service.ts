import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { EntitiesService } from "../entities/entities.service";
import { CreateRelationshipDto } from "./dto/create-relationship.dto";
import { UpdateRelationshipDto } from "./dto/update-relationship.dto";

const entityInclude = {
  sourceEntity: {
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
    },
  },
  targetEntity: {
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
    },
  },
};

@Injectable()
export class RelationshipsService {
  constructor(
    private prisma: PrismaService,
    private entitiesService: EntitiesService,
  ) {}

  async create(projectId: string, dto: CreateRelationshipDto) {
    const source = await this.entitiesService.findBySlug(
      projectId,
      dto.sourceEntitySlug,
    );
    const target = await this.entitiesService.findBySlug(
      projectId,
      dto.targetEntitySlug,
    );

    return this.prisma.relationship.create({
      data: {
        projectId,
        sourceEntityId: source.id,
        targetEntityId: target.id,
        label: dto.label,
        description: dto.description,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma JSON field
        ...(dto.metadata && { metadata: dto.metadata as any }),
        bidirectional: dto.bidirectional ?? false,
      },
      include: entityInclude,
    });
  }

  async findAllByProject(projectId: string, filters?: { entity?: string }) {
    const where: Record<string, unknown> = { projectId };

    if (filters?.entity) {
      where.OR = [
        { sourceEntity: { slug: filters.entity } },
        { targetEntity: { slug: filters.entity } },
      ];
    }

    return this.prisma.relationship.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: entityInclude,
    });
  }

  async findById(projectId: string, id: string) {
    const relationship = await this.prisma.relationship.findFirst({
      where: { id, projectId },
      include: entityInclude,
    });

    if (!relationship) {
      throw new NotFoundException("Relationship not found");
    }

    return relationship;
  }

  async update(projectId: string, id: string, dto: UpdateRelationshipDto) {
    const relationship = await this.findById(projectId, id);

    const data: Record<string, unknown> = {};
    if (dto.label !== undefined) data.label = dto.label;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.bidirectional !== undefined) data.bidirectional = dto.bidirectional;
    if (dto.metadata !== undefined) data.metadata = dto.metadata;

    return this.prisma.relationship.update({
      where: { id: relationship.id },
      data,
      include: entityInclude,
    });
  }

  async delete(projectId: string, id: string) {
    const relationship = await this.findById(projectId, id);

    await this.prisma.relationship.delete({
      where: { id: relationship.id },
    });
  }
}
