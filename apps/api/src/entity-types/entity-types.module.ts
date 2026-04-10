import { Module } from "@nestjs/common";
import { ProjectsModule } from "../projects/projects.module";
import { EntityTypesController } from "./entity-types.controller";
import { EntityTypesService } from "./entity-types.service";

@Module({
  imports: [ProjectsModule],
  controllers: [EntityTypesController],
  providers: [EntityTypesService],
  exports: [EntityTypesService],
})
export class EntityTypesModule {}
