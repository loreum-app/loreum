import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AppConfigModule } from "./config/config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { QueueModule } from "./queue/queue.module";
import { ProjectsModule } from "./projects/projects.module";
import { EntityTypesModule } from "./entity-types/entity-types.module";
import { EntitiesModule } from "./entities/entities.module";
import { TagsModule } from "./tags/tags.module";
import { RelationshipsModule } from "./relationships/relationships.module";
import { TimelineModule } from "./timeline/timeline.module";
import { LoreModule } from "./lore/lore.module";
import { StoryboardModule } from "./storyboard/storyboard.module";
import { AppController } from "./app.controller";

@Module({
  imports: [
    // Core infrastructure
    AppConfigModule,
    PrismaModule,
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        { name: "short", ttl: 1000, limit: 10 }, // 10 req/sec
        { name: "medium", ttl: 10000, limit: 50 }, // 50 req/10s
        { name: "long", ttl: 60000, limit: 200 }, // 200 req/min
      ],
    }),

    // Auth
    AuthModule,

    // Queue (centralized — imports domain modules for processor dispatch)
    QueueModule,

    // Domain modules
    ProjectsModule,
    EntityTypesModule,
    EntitiesModule,
    TagsModule,
    RelationshipsModule,
    TimelineModule,
    LoreModule,
    StoryboardModule,
    // SearchModule,
    // GraphModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
