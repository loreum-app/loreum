import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { PrismaService } from "../../prisma/prisma.service";

@Processor("maintenance")
export class MaintenanceProcessor extends WorkerHost {
  private readonly logger = new Logger(MaintenanceProcessor.name);

  constructor(private prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing maintenance job: ${job.name} (${job.id})`);

    try {
      switch (job.name) {
        case "session-cleanup":
          await this.handleSessionCleanup();
          break;

        default:
          this.logger.warn(`Unknown maintenance job: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(
        `Maintenance job failed: ${job.name} (${job.id}): ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  private async handleSessionCleanup(): Promise<void> {
    const result = await this.prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            isValid: false,
            createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        ],
      },
    });
    this.logger.log(`Cleaned up ${result.count} expired/invalid sessions`);
  }
}
