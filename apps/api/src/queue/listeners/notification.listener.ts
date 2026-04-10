import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(
    @InjectQueue("notifications") private notificationsQueue: Queue,
  ) {}

  @OnEvent("notification.send")
  async handleNotificationSend(payload: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }) {
    await this.notificationsQueue.add("send-in-app", payload, {
      jobId: `notif-${payload.userId}-${payload.type}-${Date.now()}`,
    });
  }

  @OnEvent("email.send")
  async handleEmailSend(payload: {
    to: string;
    subject: string;
    template: string;
    data: Record<string, unknown>;
  }) {
    await this.notificationsQueue.add("send-email", payload, {
      attempts: 5,
      backoff: { type: "exponential", delay: 2000 },
    });
  }
}
