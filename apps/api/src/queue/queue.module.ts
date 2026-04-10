import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AppConfig } from '../config/app.config';
import { NotificationProcessor } from './processors/notification.processor';
import { SearchIndexProcessor } from './processors/search-index.processor';
import { MaintenanceProcessor } from './processors/maintenance.processor';
import { NotificationListener } from './listeners/notification.listener';
import { SearchIndexListener } from './listeners/search-index.listener';
import { MaintenanceListener } from './listeners/maintenance.listener';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => {
        const url = new URL(config.redis.url);
        return {
          connection: {
            host: url.hostname,
            port: parseInt(url.port) || 6379,
          },
          defaultJobOptions: {
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
            removeOnComplete: 10,
            removeOnFail: 50,
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'search-index' },
      { name: 'maintenance' },
    ),
    // Domain modules will be imported here as they are created
    // so processors can call their service methods
  ],
  providers: [
    // Processors (retry, dedupe, dispatch to domain services)
    NotificationProcessor,
    SearchIndexProcessor,
    MaintenanceProcessor,
    // Listeners (event → job translation)
    NotificationListener,
    SearchIndexListener,
    MaintenanceListener,
  ],
  exports: [BullModule],
})
export class QueueModule {}
