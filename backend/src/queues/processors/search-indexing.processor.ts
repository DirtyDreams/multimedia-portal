import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { SearchService } from '../../modules/search/search.service';

export interface SearchIndexingJobData {
  contentType: 'article' | 'blogPost' | 'wikiPage' | 'story' | 'galleryItem';
  contentId: string;
  operation: 'index' | 'delete';
}

@Processor('search-indexing')
export class SearchIndexingProcessor {
  private readonly logger = new Logger(SearchIndexingProcessor.name);

  constructor(private searchService: SearchService) {}

  @Process('index-content')
  async handleIndexContent(job: Job<SearchIndexingJobData>) {
    this.logger.log(`Processing search indexing job ${job.id}`);
    const { contentType, contentId, operation } = job.data;

    try {
      await job.progress(10);

      if (operation === 'delete') {
        await this.searchService.deleteDocument(contentId);
        this.logger.log(`Deleted document ${contentId} from search index`);
      } else {
        // Index based on content type
        switch (contentType) {
          case 'article':
            await this.searchService.indexArticle(contentId);
            break;
          case 'blogPost':
            await this.searchService.indexBlogPost(contentId);
            break;
          // Other content types will use indexAllContent for now
          default:
            this.logger.warn(
              `Indexing for ${contentType} not yet implemented, will be indexed in bulk reindex`,
            );
        }

        this.logger.log(`Indexed ${contentType} ${contentId} successfully`);
      }

      await job.progress(100);

      return {
        success: true,
        contentType,
        contentId,
        operation,
        indexedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to ${operation} ${contentType} ${contentId}:`,
        error,
      );
      throw error;
    }
  }

  @Process('reindex-all')
  async handleReindexAll(job: Job) {
    this.logger.log(`Processing full reindex job ${job.id}`);

    try {
      await job.progress(10);

      this.logger.log('Starting full content reindex...');

      const result = await this.searchService.indexAllContent();

      await job.progress(100);

      this.logger.log(
        `Full reindex completed: ${result.indexed} documents indexed`,
      );

      return {
        success: true,
        ...result,
        reindexedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to reindex all content:', error);
      throw error;
    }
  }
}
