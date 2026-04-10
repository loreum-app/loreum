import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MaintenanceListener implements OnModuleInit {
  private readonly logger = new Logger(MaintenanceListener.name);

  constructor(
    @InjectQueue('maintenance') private maintenanceQueue: Queue,
  ) {}

  async onModuleInit() {
    // Register repeatable maintenance jobs on startup
    await this.maintenanceQueue.upsertJobScheduler(
      'session-cleanup-scheduler',
      { every: 24 * 60 * 60 * 1000 }, // Every 24 hours
      { name: 'session-cleanup', data: {} },
    );

    this.logger.log('Registered maintenance job schedulers');
  }
}
