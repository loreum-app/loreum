import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("Public Wiki")
@Controller("worlds")
export class PublicWorldsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "List public worlds" })
  async listPublicWorlds(@Query("q") q?: string) {
    const where: Record<string, unknown> = {
      visibility: { in: ["PUBLIC", "UNLISTED"] },
    };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    return this.prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    });
  }
}
