import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { LoreController } from './lore.controller';
import { LoreService } from './lore.service';

@Module({
  imports: [ProjectsModule],
  controllers: [LoreController],
  providers: [LoreService],
  exports: [LoreService],
})
export class LoreModule {}
