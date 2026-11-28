import { Module } from "@nestjs/common";
import { ProjectsModule } from "../projects/projects.module";
import { EntityFieldSchemasController } from "./entity-field-schemas.controller";
import { EntityFieldSchemasService } from "./entity-field-schemas.service";

@Module({
  imports: [ProjectsModule],
  controllers: [EntityFieldSchemasController],
  providers: [EntityFieldSchemasService],
  exports: [EntityFieldSchemasService],
})
export class EntityFieldSchemasModule {}
