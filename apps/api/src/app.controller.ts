import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "./prisma/prisma.service";

@ApiTags("System")
@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get("health")
  @ApiOperation({ summary: "Health check" })
  async health() {
    const checks: Record<string, "ok" | "error"> = {};

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      checks.database = "ok";
    } catch {
      checks.database = "error";
    }

    const healthy = Object.values(checks).every((v) => v === "ok");

    return {
      status: healthy ? "healthy" : "degraded",
      checks,
    };
  }
}
