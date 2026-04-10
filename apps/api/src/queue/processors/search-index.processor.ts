import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";

@Processor("search-index")
export class SearchIndexProcessor extends WorkerHost {
  private readonly logger = new Logger(SearchIndexProcessor.name);

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing search index job: ${job.name} (${job.id})`);

    try {
      switch (job.name) {
        case "reindex-entity":
          // TODO: Call SearchService.reindexEntity(job.data.entityId)
          break;

        case "reindex-lore-article":
          // TODO: Call SearchService.reindexLoreArticle(job.data.articleId)
          break;

        case "reindex-project":
          // TODO: Call SearchService.reindexProject(job.data.projectId)
          break;

        default:
          this.logger.warn(`Unknown search index job: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(
        `Search index job failed: ${job.name} (${job.id}): ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }
}
