import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class SearchIndexListener {
  private readonly logger = new Logger(SearchIndexListener.name);

  constructor(
    @InjectQueue('search-index') private searchIndexQueue: Queue,
  ) {}

  @OnEvent('entity.created')
  @OnEvent('entity.updated')
  async handleEntityChange(payload: { entityId: string; projectId: string }) {
    await this.searchIndexQueue.add('reindex-entity', payload, {
      jobId: `reindex-entity-${payload.entityId}`,
      delay: 1000, // Debounce rapid updates
    });
  }

  @OnEvent('lore-article.created')
  @OnEvent('lore-article.updated')
  async handleLoreArticleChange(payload: {
    articleId: string;
    projectId: string;
  }) {
    await this.searchIndexQueue.add('reindex-lore-article', payload, {
      jobId: `reindex-lore-${payload.articleId}`,
      delay: 1000,
    });
  }
}
