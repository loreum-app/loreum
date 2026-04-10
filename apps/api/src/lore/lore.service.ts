import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoreArticleDto } from './dto/create-lore-article.dto';
import { UpdateLoreArticleDto } from './dto/update-lore-article.dto';
import { generateUniqueSlug } from '../common/utils/slug';

const articleInclude = {
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
  loreArticleTags: {
    include: {
      tag: { select: { id: true, name: true, color: true } },
    },
  },
};

@Injectable()
export class LoreService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, dto: CreateLoreArticleDto) {
    const slug = await generateUniqueSlug(
      this.prisma,
      'loreArticle',
      dto.title,
      projectId,
    );

    const entityIds = await this.resolveEntitySlugs(
      projectId,
      dto.entitySlugs,
    );

    const tagIds = await this.resolveTagNames(projectId, dto.tags);

    return this.prisma.loreArticle.create({
      data: {
        projectId,
        title: dto.title,
        slug,
        content: dto.content,
        category: dto.category,
        entities: {
          create: entityIds.map((entityId) => ({ entityId })),
        },
        loreArticleTags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
      include: articleInclude,
    });
  }

  async findAllByProject(
    projectId: string,
    filters?: { q?: string; category?: string; entity?: string },
  ) {
    const where: Record<string, unknown> = { projectId };

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.q) {
      where.title = { contains: filters.q, mode: 'insensitive' };
    }

    if (filters?.entity) {
      where.entities = {
        some: { entity: { slug: filters.entity } },
      };
    }

    return this.prisma.loreArticle.findMany({
      where,
      orderBy: { title: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findBySlug(projectId: string, slug: string) {
    const article = await this.prisma.loreArticle.findUnique({
      where: { projectId_slug: { projectId, slug } },
      include: articleInclude,
    });

    if (!article) {
      throw new NotFoundException('Lore article not found');
    }

    return article;
  }

  async update(projectId: string, slug: string, dto: UpdateLoreArticleDto) {
    const article = await this.findBySlug(projectId, slug);

    const data: Record<string, unknown> = {};
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.category !== undefined) data.category = dto.category;

    if (dto.title !== undefined) {
      data.title = dto.title;
      data.slug = await generateUniqueSlug(
        this.prisma,
        'loreArticle',
        dto.title,
        projectId,
        article.id,
      );
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

    if (dto.tags !== undefined) {
      const tagIds = await this.resolveTagNames(projectId, dto.tags);
      data.loreArticleTags = {
        deleteMany: {},
        create: tagIds.map((tagId) => ({ tagId })),
      };
    }

    return this.prisma.loreArticle.update({
      where: { id: article.id },
      data,
      include: articleInclude,
    });
  }

  async delete(projectId: string, slug: string) {
    const article = await this.findBySlug(projectId, slug);

    await this.prisma.loreArticle.delete({
      where: { id: article.id },
    });
  }

  private async resolveTagNames(
    projectId: string,
    names?: string[],
  ): Promise<string[]> {
    if (!names?.length) return [];
    const tags = await this.prisma.tag.findMany({
      where: { projectId, name: { in: names } },
      select: { id: true },
    });
    return tags.map((t) => t.id);
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
