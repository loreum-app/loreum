import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { TimelineController } from './timeline.controller';
import { ErasController } from './eras.controller';
import { TimelineService } from './timeline.service';
import { ErasService } from './eras.service';

@Module({
  imports: [ProjectsModule],
  controllers: [ErasController, TimelineController],
  providers: [TimelineService, ErasService],
  exports: [TimelineService, ErasService],
})
export class TimelineModule {}
