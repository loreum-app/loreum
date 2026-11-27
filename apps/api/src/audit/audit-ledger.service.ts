import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { LedgerOperation, Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { EntitlementsService } from "../billing/entitlements.service";
import { AuditContext } from "./audit.types";

interface AppendOptions {
  projectId: string;
  operation: LedgerOperation;
  targetModel: string;
  targetId: string;
  beforeData?: object | null;
  afterData?: object | null;
  actor: AuditContext;
  undoOfEntryId?: string;
}

interface FindOptions {
  targetModel?: string;
  targetId?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditLedgerService {
  private readonly logger = new Logger(AuditLedgerService.name);

  constructor(
    private prisma: PrismaService,
    private entitlements: EntitlementsService,
  ) {}

  async append(opts: AppendOptions) {
    const entry = await this.prisma.ledgerEntry.create({
      data: {
        projectId: opts.projectId,
        operation: opts.operation,
        targetModel: opts.targetModel,
        targetId: opts.targetId,
        beforeData: (opts.beforeData ??
          Prisma.JsonNull) as Prisma.InputJsonValue,
        afterData: (opts.afterData ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        undoOfEntryId: opts.undoOfEntryId,
        actorType: opts.actor.type,
        actorId: opts.actor.id,
        actorLabel: opts.actor.label,
      },
    });

    // If this is an UNDO entry, mark the original as undone
    if (opts.undoOfEntryId) {
      await this.prisma.ledgerEntry.update({
        where: { id: opts.undoOfEntryId },
        data: { undoneByEntryId: entry.id },
      });
    }

    // Prune in the background — don't block the response on it
    this.pruneForProject(opts.projectId).catch((err) =>
      this.logger.warn(`Ledger prune failed: ${err.message}`),
    );

    return entry;
  }

  async findByProject(projectId: string, options?: FindOptions) {
    const where: Prisma.LedgerEntryWhereInput = { projectId };
    if (options?.targetModel) where.targetModel = options.targetModel;
    if (options?.targetId) where.targetId = options.targetId;

    const [entries, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: options?.limit ?? 50,
        skip: options?.offset ?? 0,
      }),
      this.prisma.ledgerEntry.count({ where }),
    ]);

    return { entries, total };
  }

  async findById(projectId: string, id: string) {
    const entry = await this.prisma.ledgerEntry.findFirst({
      where: { id, projectId },
    });
    if (!entry) throw new NotFoundException("Ledger entry not found");
    return entry;
  }

  async undo(projectId: string, entryId: string, actor: AuditContext) {
    const entry = await this.findById(projectId, entryId);

    if (entry.undoneByEntryId) {
      throw new ConflictException("This change has already been undone");
    }
    if (entry.operation === "UNDO") {
      throw new ConflictException("Cannot undo an undo operation");
    }

    // Determine and execute the compensating operation, then record it.
    // The actual domain-level reversal is handled by the caller (controller)
    // which coordinates between this service and the domain services.
    // This method handles the ledger bookkeeping: creating the UNDO entry
    // and marking the original as undone.

    const undoEntry = await this.append({
      projectId,
      operation: "UNDO",
      targetModel: entry.targetModel,
      targetId: entry.targetId,
      beforeData: entry.afterData as object | null,
      afterData: entry.beforeData as object | null,
      actor,
      undoOfEntryId: entry.id,
    });

    return undoEntry;
  }

  private async pruneForProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) return;

    const limits = await this.entitlements.limits(project.ownerId);
    const maxEntries = limits.maxLedgerEntries;

    const count = await this.prisma.ledgerEntry.count({
      where: { projectId },
    });

    const excess = count - maxEntries;
    if (excess <= 0) return;

    // Delete the oldest entries beyond the cap
    await this.prisma.$executeRaw`
      DELETE FROM "ledger_entries"
      WHERE "id" IN (
        SELECT "id" FROM "ledger_entries"
        WHERE "projectId" = ${projectId}
        ORDER BY "createdAt" ASC
        LIMIT ${excess}
      )
    `;

    this.logger.log(`Pruned ${excess} ledger entries for project ${projectId}`);
  }
}
