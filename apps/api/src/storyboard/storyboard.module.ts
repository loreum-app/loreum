import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { StoryboardController } from './storyboard.controller';
import { StoryboardService } from './storyboard.service';

@Module({
  imports: [ProjectsModule],
  controllers: [StoryboardController],
  providers: [StoryboardService],
  exports: [StoryboardService],
})
export class StoryboardModule {}
