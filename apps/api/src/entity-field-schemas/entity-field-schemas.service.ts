import { Injectable } from "@nestjs/common";
import { EntityType, Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EntityFieldSchemasService {
  constructor(private prisma: PrismaService) {}

  async getSchema(projectId: string, entityType: EntityType) {
    const schema = await this.prisma.entityFieldSchema.findUnique({
      where: { projectId_entityType: { projectId, entityType } },
    });
    return schema?.fieldSchema ?? [];
  }

  async upsertSchema(
    projectId: string,
    entityType: EntityType,
    fieldSchema: unknown[],
  ) {
    return this.prisma.entityFieldSchema.upsert({
      where: { projectId_entityType: { projectId, entityType } },
      create: {
        projectId,
        entityType,
        fieldSchema: fieldSchema as Prisma.InputJsonValue,
      },
      update: { fieldSchema: fieldSchema as Prisma.InputJsonValue },
    });
  }
}
