import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLedgerService } from "../audit/audit-ledger.service";
import { AuditContext } from "../audit/audit.types";
import { CreateLoreArticleDto } from "./dto/create-lore-article.dto";
import { UpdateLoreArticleDto } from "./dto/update-lore-article.dto";
import { generateUniqueSlug } from "../common/utils/slug";

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
  constructor(
    private prisma: PrismaService,
    private auditLedger: AuditLedgerService,
  ) {}

  async create(
    projectId: string,
    dto: CreateLoreArticleDto,
    audit?: AuditContext,
  ) {
    const slug = await generateUniqueSlug(
      this.prisma,
      "loreArticle",
      dto.title,
      projectId,
    );

    const entityIds = await this.resolveEntitySlugs(projectId, dto.entitySlugs);

    const tagIds = await this.resolveTagNames(projectId, dto.tags);

    const created = await this.prisma.loreArticle.create({
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

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "CREATE",
        targetModel: "LoreArticle",
        targetId: created.id,
        afterData: this.snapshot(created),
        actor: audit,
      });
    }

    return created;
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
      where.title = { contains: filters.q, mode: "insensitive" };
    }

    if (filters?.entity) {
      where.entities = {
        some: { entity: { slug: filters.entity } },
      };
    }

    return this.prisma.loreArticle.findMany({
      where,
      orderBy: { title: "asc" },
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
      throw new NotFoundException("Lore article not found");
    }

    return article;
  }

  async update(
    projectId: string,
    slug: string,
    dto: UpdateLoreArticleDto,
    audit?: AuditContext,
  ) {
    const article = await this.findBySlug(projectId, slug);
    const beforeSnapshot = audit ? this.snapshot(article) : undefined;

    const data: Record<string, unknown> = {};
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.category !== undefined) data.category = dto.category;

    if (dto.title !== undefined) {
      data.title = dto.title;
      data.slug = await generateUniqueSlug(
        this.prisma,
        "loreArticle",
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

    const updated = await this.prisma.loreArticle.update({
      where: { id: article.id },
      data,
      include: articleInclude,
    });

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "UPDATE",
        targetModel: "LoreArticle",
        targetId: updated.id,
        beforeData: beforeSnapshot,
        afterData: this.snapshot(updated),
        actor: audit,
      });
    }

    return updated;
  }

  async delete(projectId: string, slug: string, audit?: AuditContext) {
    const article = await this.findBySlug(projectId, slug);
    const beforeSnapshot = audit ? this.snapshot(article) : undefined;

    await this.prisma.loreArticle.delete({
      where: { id: article.id },
    });

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "DELETE",
        targetModel: "LoreArticle",
        targetId: article.id,
        beforeData: beforeSnapshot,
        actor: audit,
      });
    }
  }

  /** Resolve tag names to ids, creating tags that do not exist yet. */
  private async resolveTagNames(
    projectId: string,
    names?: string[],
  ): Promise<string[]> {
    const wanted = [
      ...new Set((names ?? []).map((n) => n.trim()).filter(Boolean)),
    ];
    if (!wanted.length) return [];
    const existing = await this.prisma.tag.findMany({
      where: { projectId, name: { in: wanted } },
      select: { name: true },
    });
    const known = new Set(existing.map((t) => t.name));
    const missing = wanted.filter((n) => !known.has(n));
    if (missing.length) {
      await this.prisma.tag.createMany({
        data: missing.map((name) => ({ projectId, name })),
        skipDuplicates: true,
      });
    }
    const tags = await this.prisma.tag.findMany({
      where: { projectId, name: { in: wanted } },
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic snapshot for JSON column
  private snapshot(article: any): object {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentionally stripping internal fields
    const { projectId, searchVector, createdAt, updatedAt, ...rest } = article;
    const clean = { ...rest };
    if (clean.entities) {
      clean.entitySlugs = clean.entities
        .map((e: { entity?: { slug?: string } }) => e.entity?.slug)
        .filter(Boolean);
      delete clean.entities;
    }
    if (clean.loreArticleTags) {
      clean.tags = clean.loreArticleTags
        .map((lt: { tag?: { name?: string } }) => lt.tag?.name)
        .filter(Boolean);
      delete clean.loreArticleTags;
    }
    return clean;
  }
}
