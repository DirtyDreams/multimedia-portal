import type { Job } from 'bull';
import { SearchService } from '../../modules/search/search.service';
export interface SearchIndexingJobData {
    contentType: 'article' | 'blogPost' | 'wikiPage' | 'story' | 'galleryItem';
    contentId: string;
    operation: 'index' | 'delete';
}
export declare class SearchIndexingProcessor {
    private searchService;
    private readonly logger;
    constructor(searchService: SearchService);
    handleIndexContent(job: Job<SearchIndexingJobData>): Promise<{
        success: boolean;
        contentType: "article" | "blogPost" | "wikiPage" | "galleryItem" | "story";
        contentId: string;
        operation: "index" | "delete";
        indexedAt: Date;
    }>;
    handleReindexAll(job: Job): Promise<{
        reindexedAt: Date;
        indexed: number;
        breakdown: {
            articles: any;
            blogPosts: any;
            wikiPages: any;
            stories: any;
            galleryItems: any;
        };
        success: boolean;
    }>;
}
