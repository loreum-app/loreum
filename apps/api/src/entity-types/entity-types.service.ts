import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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
        description: dto.description?.trim() || null,
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
    if (dto.description !== undefined)
      data.description = dto.description.trim() || null;
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

  /**
   * How much disappears if this type's entities are deleted along with it.
   * Deleting an ITEM entity cascades to everything that references it, so the
   * caller can show real numbers before asking for confirmation.
   */
  async deletionImpact(projectId: string, slug: string) {
    const itemType = await this.findBySlug(projectId, slug);
    const entityIds = (
      await this.prisma.item.findMany({
        where: { itemTypeId: itemType.id },
        select: { entityId: true },
      })
    ).map((i) => i.entityId);

    if (!entityIds.length) {
      return {
        entities: 0,
        relationships: 0,
        timelineEventLinks: 0,
        loreArticleLinks: 0,
        sceneAppearances: 0,
        tagLinks: 0,
      };
    }

    const [
      relationships,
      timelineEventLinks,
      loreArticleLinks,
      sceneAppearances,
      tagLinks,
    ] = await Promise.all([
      this.prisma.relationship.count({
        where: {
          OR: [
            { sourceEntityId: { in: entityIds } },
            { targetEntityId: { in: entityIds } },
          ],
        },
      }),
      this.prisma.timelineEventEntity.count({
        where: { entityId: { in: entityIds } },
      }),
      this.prisma.loreArticleEntity.count({
        where: { entityId: { in: entityIds } },
      }),
      this.prisma.sceneCharacter.count({
        where: { entityId: { in: entityIds } },
      }),
      this.prisma.entityTag.count({ where: { entityId: { in: entityIds } } }),
    ]);

    return {
      entities: entityIds.length,
      relationships,
      timelineEventLinks,
      loreArticleLinks,
      sceneAppearances,
      tagLinks,
    };
  }

  /**
   * Deleting a type never silently orphans its entities: the UI lists items
   * only by type, so an untyped item is unreachable. A type that still has
   * entities requires an explicit disposition — move them to another type, or
   * delete them along with it.
   */
  async delete(
    projectId: string,
    slug: string,
    disposition?: { entities?: "move" | "delete"; to?: string },
  ) {
    const itemType = await this.findBySlug(projectId, slug);
    const count = itemType._count.items;

    if (count === 0) {
      await this.prisma.itemType.delete({ where: { id: itemType.id } });
      return;
    }

    const mode = disposition?.entities;
    if (!mode) {
      throw new ConflictException(
        `"${itemType.name}" still has ${count} ${count === 1 ? "entity" : "entities"}. ` +
          "Move them to another type or delete them along with it.",
      );
    }

    if (mode === "move") {
      if (!disposition.to) {
        throw new BadRequestException(
          "A destination type slug is required to move the entities.",
        );
      }
      if (disposition.to === slug) {
        throw new BadRequestException(
          "The entities cannot be moved to the type being deleted.",
        );
      }
      const destination = await this.findBySlug(projectId, disposition.to);

      await this.prisma.$transaction([
        this.prisma.item.updateMany({
          where: { itemTypeId: itemType.id },
          data: { itemTypeId: destination.id },
        }),
        this.prisma.itemType.delete({ where: { id: itemType.id } }),
      ]);
      return;
    }

    // Deleting the entities cascades to their relationships, timeline and lore
    // links, tags, and scene appearances; the type goes with them.
    const entityIds = (
      await this.prisma.item.findMany({
        where: { itemTypeId: itemType.id },
        select: { entityId: true },
      })
    ).map((i) => i.entityId);

    await this.prisma.$transaction([
      this.prisma.entity.deleteMany({ where: { id: { in: entityIds } } }),
      this.prisma.itemType.delete({ where: { id: itemType.id } }),
    ]);
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
