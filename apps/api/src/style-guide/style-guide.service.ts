import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditLedgerService } from "../audit/audit-ledger.service";
import { AuditContext } from "../audit/audit.types";
import { UpdateStyleGuideDto } from "./dto/update-style-guide.dto";

@Injectable()
export class StyleGuideService {
  constructor(
    private prisma: PrismaService,
    private auditLedger: AuditLedgerService,
  ) {}

  async findByProject(projectId: string) {
    return this.prisma.styleGuide.findUnique({
      where: { projectId },
    });
  }

  async upsert(
    projectId: string,
    dto: UpdateStyleGuideDto,
    audit?: AuditContext,
  ) {
    const existing = await this.prisma.styleGuide.findUnique({
      where: { projectId },
    });

    const beforeSnapshot =
      audit && existing ? this.snapshot(existing) : undefined;

    const data = {
      pov: dto.pov,
      tense: dto.tense,
      voice: dto.voice,
      tone: dto.tone,
      pacing: dto.pacing,
      dialogueRules: dto.dialogueRules,
      proseStyle: dto.proseStyle,
      vocabulary: dto.vocabulary,
      customRules: dto.customRules,
    };

    const stripUndefined = (obj: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(obj).filter(([, v]) => v !== undefined),
      );

    const result = await this.prisma.styleGuide.upsert({
      where: { projectId },
      create: { projectId, ...stripUndefined(data) },
      update: stripUndefined(data),
    });

    if (audit) {
      await this.auditLedger.append({
        projectId,
        operation: existing ? "UPDATE" : "CREATE",
        targetModel: "StyleGuide",
        targetId: projectId,
        beforeData: beforeSnapshot,
        afterData: this.snapshot(result),
        actor: audit,
      });
    }

    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic snapshot for JSON column
  private snapshot(guide: any): object {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentionally stripping internal fields
    const { projectId, createdAt, updatedAt, ...rest } = guide;
    return rest;
  }
}
