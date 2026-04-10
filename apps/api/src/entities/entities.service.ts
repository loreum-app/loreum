import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEntityDto } from "./dto/create-entity.dto";
import { UpdateEntityDto } from "./dto/update-entity.dto";
import { generateUniqueSlug } from "../common/utils/slug";

const listInclude = {
  character: true,
  location: true,
  organization: true,
  item: { include: { itemType: true } },
  entityTags: { include: { tag: true } },
} as const;

const hubInclude = {
  character: true,
  location: true,
  organization: {
    include: {
      parentOrg: {
        include: { entity: { select: { name: true, slug: true } } },
      },
      members: {
        include: {
          character: {
            include: {
              entity: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
    },
  },
  item: { include: { itemType: true } },
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
  entityTags: {
    include: {
      tag: { select: { id: true, name: true, color: true } },
    },
  },
} as const;

@Injectable()
export class EntitiesService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, dto: CreateEntityDto) {
    const slug = await generateUniqueSlug(
      this.prisma,
      "entity",
      dto.name,
      projectId,
    );

    // Create base entity first
    const entity = await this.prisma.entity.create({
      data: {
        projectId,
        type: dto.type,
        name: dto.name,
        slug,
        summary: dto.summary,
        description: dto.description,
        backstory: dto.backstory,
        secrets: dto.secrets,
        notes: dto.notes,
        imageUrl: dto.imageUrl,
      },
    });

    // Create extension record
    switch (dto.type) {
      case "CHARACTER":
        await this.prisma.character.create({
          data: { entityId: entity.id, ...dto.character },
        });
        break;
      case "LOCATION":
        await this.prisma.location.create({
          data: { entityId: entity.id, ...dto.location },
        });
        break;
      case "ORGANIZATION":
        await this.prisma.organization.create({
          data: { entityId: entity.id, ...dto.organization },
        });
        break;
      case "ITEM":
        await this.prisma.item.create({
          data: {
            entityId: entity.id,
            itemTypeId: dto.item?.itemTypeId,
  
            fields: (dto.item?.fields ?? {}) as Prisma.InputJsonValue,
          },
        });
        break;
    }

    return this.prisma.entity.findUniqueOrThrow({
      where: { id: entity.id },
      include: listInclude,
    });
  }

  async findAllByProject(
    projectId: string,
    filters?: { type?: string; q?: string },
  ) {
    const where: Record<string, unknown> = { projectId };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.q) {
      where.name = { contains: filters.q, mode: "insensitive" };
    }

    return this.prisma.entity.findMany({
      where,
      orderBy: { name: "asc" },
      include: listInclude,
    });
  }

  async findBySlug(projectId: string, slug: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { projectId_slug: { projectId, slug } },
      include: listInclude,
    });

    if (!entity) {
      throw new NotFoundException("Entity not found");
    }

    return entity;
  }

  async findBySlugWithHub(projectId: string, slug: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { projectId_slug: { projectId, slug } },
      include: hubInclude,
    });

    if (!entity) {
      throw new NotFoundException("Entity not found");
    }

    return entity;
  }

  async update(projectId: string, slug: string, dto: UpdateEntityDto) {
    const entity = await this.findBySlug(projectId, slug);

    const data: Record<string, unknown> = {};
    if (dto.summary !== undefined) data.summary = dto.summary;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.backstory !== undefined) data.backstory = dto.backstory;
    if (dto.secrets !== undefined) data.secrets = dto.secrets;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;

    if (dto.name !== undefined) {
      data.name = dto.name;
      data.slug = await generateUniqueSlug(
        this.prisma,
        "entity",
        dto.name,
        projectId,
        entity.id,
      );
    }

    const updated = await this.prisma.entity.update({
      where: { id: entity.id },
      data,
    });

    // Extension table upserts
    if (dto.character) {
      await this.prisma.character.upsert({
        where: { entityId: entity.id },
        create: { entityId: entity.id, ...dto.character },
        update: dto.character,
      });
    }
    if (dto.location) {
      await this.prisma.location.upsert({
        where: { entityId: entity.id },
        create: { entityId: entity.id, ...dto.location },
        update: dto.location,
      });
    }
    if (dto.organization) {
      await this.prisma.organization.upsert({
        where: { entityId: entity.id },
        create: { entityId: entity.id, ...dto.organization },
        update: dto.organization,
      });
    }
    if (dto.item) {
      await this.prisma.item.upsert({
        where: { entityId: entity.id },
        create: {
          entityId: entity.id,
          itemTypeId: dto.item.itemTypeId,

          fields: (dto.item.fields ?? {}) as Prisma.InputJsonValue,
        },
        update: {
          itemTypeId: dto.item.itemTypeId,
           
          ...(dto.item.fields !== undefined
            ? { fields: (dto.item.fields ?? {}) as Prisma.InputJsonValue }
            : {}),
        },
      });
    }

    return this.prisma.entity.findUniqueOrThrow({
      where: { id: updated.id },
      include: hubInclude,
    });
  }

  async delete(projectId: string, slug: string) {
    const entity = await this.findBySlug(projectId, slug);

    await this.prisma.entity.delete({
      where: { id: entity.id },
    });
  }
}
