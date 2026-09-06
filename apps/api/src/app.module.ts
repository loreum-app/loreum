import { Module } from "@nestjs/common";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AppConfigModule } from "./config/config.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { ApiKeysModule } from "./api-keys/api-keys.module";
import { OAuthModule } from "./oauth/oauth.module";
import { BillingModule } from "./billing/billing.module";
import { SearchModule } from "./search/search.module";
import { AppThrottlerGuard } from "./common/guards/app-throttler.guard";
import { QueueModule } from "./queue/queue.module";
import { ProjectsModule } from "./projects/projects.module";
import { EntityTypesModule } from "./entity-types/entity-types.module";
import { EntitiesModule } from "./entities/entities.module";
import { TagsModule } from "./tags/tags.module";
import { RelationshipsModule } from "./relationships/relationships.module";
import { TimelineModule } from "./timeline/timeline.module";
import { LoreModule } from "./lore/lore.module";
import { StoryboardModule } from "./storyboard/storyboard.module";
import { McpModule } from "./mcp/mcp.module";
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

    // Auth + plans
    AuthModule,
    ApiKeysModule,
    BillingModule,
    OAuthModule,

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
    SearchModule,
    McpModule,
    // GraphModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: AppThrottlerGuard }],
})
export class AppModule {}
