import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEntityTypeDto } from "./dto/create-entity-type.dto";
import { UpdateEntityTypeDto } from "./dto/update-entity-type.dto";
import { slugify } from "../common/utils/slug";

@Injectable()
export class EntityTypesService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, dto: CreateEntityTypeDto) {
    const slug = await this.generateUniqueSlug(projectId, dto.name);

    return this.prisma.itemType.create({
      data: {
        projectId,
        name: dto.name,
        slug,
        icon: dto.icon,
        color: dto.color,
        fieldSchema: dto.fieldSchema?.map((f) => ({ ...f })) ?? [],
      },
    });
  }

  async findAllByProject(projectId: string) {
    return this.prisma.itemType.findMany({
      where: { projectId },
      orderBy: { name: "asc" },
      include: { _count: { select: { items: true } } },
    });
  }

  async findBySlug(projectId: string, slug: string) {
    const itemType = await this.prisma.itemType.findUnique({
      where: { projectId_slug: { projectId, slug } },
      include: { _count: { select: { items: true } } },
    });

    if (!itemType) {
      throw new NotFoundException("Item type not found");
    }

    return itemType;
  }

  async update(projectId: string, slug: string, dto: UpdateEntityTypeDto) {
    const itemType = await this.findBySlug(projectId, slug);

    const data: Record<string, unknown> = {};
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.fieldSchema !== undefined)
      data.fieldSchema = dto.fieldSchema.map((f) => ({ ...f }));

    if (dto.name !== undefined) {
      data.name = dto.name;
      data.slug = await this.generateUniqueSlug(
        projectId,
        dto.name,
        itemType.id,
      );
    }

    return this.prisma.itemType.update({
      where: { id: itemType.id },
      data,
      include: { _count: { select: { items: true } } },
    });
  }

  async delete(projectId: string, slug: string) {
    const itemType = await this.findBySlug(projectId, slug);

    await this.prisma.itemType.delete({
      where: { id: itemType.id },
    });
  }

  private async generateUniqueSlug(
    projectId: string,
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let counter = 0;

    while (true) {
      const existing = await this.prisma.itemType.findUnique({
        where: { projectId_slug: { projectId, slug } },
        select: { id: true },
      });

      if (!existing || existing.id === excludeId) return slug;
      counter++;
      slug = `${base}-${counter}`;
    }
  }
}
