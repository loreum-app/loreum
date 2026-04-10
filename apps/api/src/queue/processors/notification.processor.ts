import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

@Processor("notifications")
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing notification job: ${job.name} (${job.id})`);

    try {
      switch (job.name) {
        case "send-in-app":
          // TODO: Call NotificationsService.sendInApp(job.data)
          break;

        case "send-email":
          // TODO: Call EmailService.send(job.data)
          break;

        default:
          this.logger.warn(`Unknown notification job: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(
        `Notification job failed: ${job.name} (${job.id}): ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}
