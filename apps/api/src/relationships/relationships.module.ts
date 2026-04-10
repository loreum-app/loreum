import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { EntitiesModule } from '../entities/entities.module';
import { RelationshipsController } from './relationships.controller';
import { RelationshipsService } from './relationships.service';

@Module({
  imports: [ProjectsModule, EntitiesModule],
  controllers: [RelationshipsController],
  providers: [RelationshipsService],
  exports: [RelationshipsService],
})
export class RelationshipsModule {}
