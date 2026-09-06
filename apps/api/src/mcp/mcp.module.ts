import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ProjectsModule } from "../projects/projects.module";
import { EntitiesModule } from "../entities/entities.module";
import { EntityTypesModule } from "../entity-types/entity-types.module";
import { StoryboardModule } from "../storyboard/storyboard.module";
import { RelationshipsModule } from "../relationships/relationships.module";
import { LoreModule } from "../lore/lore.module";
import { TimelineModule } from "../timeline/timeline.module";
import { TagsModule } from "../tags/tags.module";
import { SearchModule } from "../search/search.module";
import { OAuthModule } from "../oauth/oauth.module";
import { McpController } from "./mcp.controller";
import { McpService } from "./mcp.service";
import { McpAuthGuard } from "./mcp-auth.guard";
import { McpAccessLogMiddleware } from "./mcp-access-log.middleware";

@Module({
  imports: [
    ProjectsModule,
    EntitiesModule,
    EntityTypesModule,
    StoryboardModule,
    RelationshipsModule,
    LoreModule,
    TimelineModule,
    TagsModule,
    SearchModule,
    OAuthModule,
  ],
  controllers: [McpController],
  providers: [McpService, McpAuthGuard],
})
export class McpModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(McpAccessLogMiddleware).forRoutes("mcp", "mcp/*path");
  }
}
