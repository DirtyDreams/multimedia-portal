import { SearchEnhancedService } from './search-enhanced.service';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto';
export declare class SearchEnhancedController {
    private readonly searchEnhancedService;
    private readonly searchService;
    constructor(searchEnhancedService: SearchEnhancedService, searchService: SearchService);
    search(query: SearchQueryDto, req: any): Promise<{}>;
    autocomplete(query: string, limit?: number): Promise<{}>;
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
    clearCache(): Promise<{
        message: string;
    }>;
    indexContent(contentType: string, contentId: string): Promise<{
        message: string;
    }>;
}
