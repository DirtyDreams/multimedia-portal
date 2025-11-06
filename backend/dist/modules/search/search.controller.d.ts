import { SearchService } from './search.service';
import { SearchQueryDto } from './dto';
export declare class SearchController {
    private readonly searchService;
    constructor(searchService: SearchService);
    search(query: SearchQueryDto): Promise<{
        hits: import("meilisearch", { with: { "resolution-mode": "import" } }).Hits<import("meilisearch", { with: { "resolution-mode": "import" } }).RecordAny>;
        query: string;
        processingTimeMs: number;
        limit: number | undefined;
        offset: number | undefined;
        estimatedTotalHits: number | undefined;
        facetDistribution: import("meilisearch", { with: { "resolution-mode": "import" } }).FacetDistribution | undefined;
    }>;
    autocomplete(query: string, limit?: number): Promise<{
        title: any;
        contentType: any;
    }[]>;
    reindex(): Promise<{
        indexed: number;
        breakdown: {
            articles: any;
            blogPosts: any;
            wikiPages: any;
            stories: any;
            galleryItems: any;
        };
    }>;
}
