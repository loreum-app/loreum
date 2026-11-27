import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLedgerService } from "../audit/audit-ledger.service";
import { AuditContext } from "../audit/audit.types";
import { CreateEraDto } from "./dto/create-era.dto";
import { UpdateEraDto } from "./dto/update-era.dto";
import { generateUniqueSlug } from "../common/utils/slug";

@Injectable()
export class ErasService {
  constructor(
    private prisma: PrismaService,
    private auditLedger: AuditLedgerService,
  ) {}

  async create(projectId: string, dto: CreateEraDto, audit?: AuditContext) {
    const slug = await generateUniqueSlug(
      this.prisma,
      "era",
      dto.name,
      projectId,
    );

    const created = await this.prisma.era.create({
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

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "CREATE",
        targetModel: "Era",
        targetId: created.id,
        afterData: this.snapshot(created),
        actor: audit,
      });
    }

    return created;
  }

  async findAllByProject(projectId: string) {
    return this.prisma.era.findMany({
      where: { projectId },
      orderBy: { sortOrder: "asc" },
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
          orderBy: { dateValue: "asc" },
          select: { id: true, name: true, dateValue: true, date: true },
        },
      },
    });
    if (!era) throw new NotFoundException("Era not found");
    return era;
  }

  async update(
    projectId: string,
    slug: string,
    dto: UpdateEraDto,
    audit?: AuditContext,
  ) {
    const era = await this.findBySlug(projectId, slug);
    const beforeSnapshot = audit ? this.snapshot(era) : undefined;

    let newSlug = slug;
    if (dto.name && dto.name !== era.name) {
      newSlug = await generateUniqueSlug(
        this.prisma,
        "era",
        dto.name,
        projectId,
      );
    }

    const updated = await this.prisma.era.update({
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

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "UPDATE",
        targetModel: "Era",
        targetId: updated.id,
        beforeData: beforeSnapshot,
        afterData: this.snapshot(updated),
        actor: audit,
      });
    }

    return updated;
  }

  async delete(projectId: string, slug: string, audit?: AuditContext) {
    const era = await this.findBySlug(projectId, slug);
    const beforeSnapshot = audit ? this.snapshot(era) : undefined;

    await this.prisma.era.delete({ where: { id: era.id } });

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: "DELETE",
        targetModel: "Era",
        targetId: era.id,
        beforeData: beforeSnapshot,
        actor: audit,
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic snapshot for JSON column
  private snapshot(era: any): object {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentionally stripping internal fields
    const { projectId, createdAt, updatedAt, timelineEvents, _count, ...rest } =
      era;
    return rest;
  }
}
