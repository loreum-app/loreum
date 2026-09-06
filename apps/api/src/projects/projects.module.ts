import { Module } from "@nestjs/common";
import { SearchModule } from "../search/search.module";
import { ProjectsController } from "./projects.controller";
import { PublicWikiController } from "./public-wiki.controller";
import { PublicWorldsController } from "./public-worlds.controller";
import { ProjectsService } from "./projects.service";

@Module({
  imports: [SearchModule],
  controllers: [
    ProjectsController,
    PublicWikiController,
    PublicWorldsController,
  ],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
