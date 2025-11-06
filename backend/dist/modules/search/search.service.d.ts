import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchQueryDto } from './dto';
export declare class SearchService implements OnModuleInit {
    private prisma;
    private readonly logger;
    private client;
    private readonly indexName;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    private initializeIndex;
    search(query: SearchQueryDto): Promise<{
        hits: import("meilisearch", { with: { "resolution-mode": "import" } }).Hits<import("meilisearch", { with: { "resolution-mode": "import" } }).RecordAny>;
        query: string;
        processingTimeMs: number;
        limit: number | undefined;
        offset: number | undefined;
        estimatedTotalHits: number | undefined;
        facetDistribution: import("meilisearch", { with: { "resolution-mode": "import" } }).FacetDistribution | undefined;
    }>;
    indexArticle(articleId: string): Promise<void>;
    indexBlogPost(blogPostId: string): Promise<void>;
    indexAllContent(): Promise<{
        indexed: number;
        breakdown: {
            articles: any;
            blogPosts: any;
            wikiPages: any;
            stories: any;
            galleryItems: any;
        };
    }>;
    deleteDocument(documentId: string): Promise<void>;
    autocomplete(query: string, limit?: number): Promise<{
        title: any;
        contentType: any;
    }[]>;
}
