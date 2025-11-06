import { OnModuleInit } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchQueryDto } from './dto';
import { SearchAnalyticsService } from './search-analytics.service';
export declare class SearchEnhancedService implements OnModuleInit {
    private prisma;
    private analyticsService;
    private cacheManager;
    private readonly logger;
    private client;
    private readonly indexName;
    private readonly CACHE_TTL;
    private readonly AUTOCOMPLETE_CACHE_TTL;
    constructor(prisma: PrismaService, analyticsService: SearchAnalyticsService, cacheManager: Cache);
    onModuleInit(): Promise<void>;
    private initializeIndex;
    search(query: SearchQueryDto, userId?: string): Promise<{}>;
    autocomplete(query: string, limit?: number): Promise<{}>;
    clearSearchCache(): Promise<void>;
    private generateCacheKey;
    indexContent(contentId: string, contentType: string): Promise<void>;
    private indexArticle;
    private indexBlogPost;
}
