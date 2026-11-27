import { Module } from "@nestjs/common";
import { ProjectsModule } from "../projects/projects.module";
import { StyleGuideController } from "./style-guide.controller";
import { StyleGuideService } from "./style-guide.service";

@Module({
  imports: [ProjectsModule],
  controllers: [StyleGuideController],
  providers: [StyleGuideService],
  exports: [StyleGuideService],
})
export class StyleGuideModule {}
