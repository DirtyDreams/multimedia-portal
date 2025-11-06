"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SearchEnhancedService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchEnhancedService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const meilisearch_1 = require("meilisearch");
const prisma_service_1 = require("../../prisma/prisma.service");
const search_analytics_service_1 = require("./search-analytics.service");
let SearchEnhancedService = SearchEnhancedService_1 = class SearchEnhancedService {
    prisma;
    analyticsService;
    cacheManager;
    logger = new common_1.Logger(SearchEnhancedService_1.name);
    client;
    indexName = 'content';
    CACHE_TTL = 300;
    AUTOCOMPLETE_CACHE_TTL = 600;
    constructor(prisma, analyticsService, cacheManager) {
        this.prisma = prisma;
        this.analyticsService = analyticsService;
        this.cacheManager = cacheManager;
        this.client = new meilisearch_1.MeiliSearch({
            host: process.env.MEILI_HOST
                ? `http://${process.env.MEILI_HOST}:${process.env.MEILI_PORT || 7700}`
                : 'http://localhost:7700',
            apiKey: process.env.MEILI_MASTER_KEY,
        });
    }
    async onModuleInit() {
        try {
            await this.initializeIndex();
            this.logger.log('MeiliSearch initialized successfully with caching');
        }
        catch (error) {
            this.logger.error('Failed to initialize MeiliSearch:', error);
        }
    }
    async initializeIndex() {
        try {
            const index = this.client.index(this.indexName);
            await index.updateSearchableAttributes([
                'title',
                'content',
                'excerpt',
                'authorName',
                'categoryNames',
                'tagNames',
            ]);
            await index.updateFilterableAttributes([
                'contentType',
                'status',
                'authorId',
                'publishedAt',
                'createdAt',
            ]);
            await index.updateSortableAttributes([
                'publishedAt',
                'createdAt',
                'viewCount',
                'title',
            ]);
            await index.updateDisplayedAttributes([
                'id',
                'title',
                'slug',
                'excerpt',
                'contentType',
                'status',
                'publishedAt',
                'authorId',
                'authorName',
                'featuredImage',
                'coverImage',
                'categoryNames',
                'tagNames',
            ]);
            await index.updateRankingRules([
                'words',
                'typo',
                'proximity',
                'attribute',
                'sort',
                'exactness',
                'publishedAt:desc',
            ]);
            await index.updateTypoTolerance({
                enabled: true,
                minWordSizeForTypos: {
                    oneTypo: 4,
                    twoTypos: 8,
                },
                disableOnWords: [],
                disableOnAttributes: [],
            });
            await index.updatePagination({
                maxTotalHits: 1000,
            });
            this.logger.log('MeiliSearch index configured with optimizations');
        }
        catch (error) {
            this.logger.error('Error initializing MeiliSearch index:', error);
            throw error;
        }
    }
    async search(query, userId) {
        const startTime = Date.now();
        try {
            const cacheKey = this.generateCacheKey('search', query);
            const cached = await this.cacheManager.get(cacheKey);
            if (cached) {
                this.logger.debug(`Cache hit for search: ${query.q}`);
                return cached;
            }
            const index = this.client.index(this.indexName);
            let filter = query.filter || '';
            if (query.contentTypes && query.contentTypes.length > 0) {
                const contentTypeFilter = query.contentTypes
                    .map((type) => `contentType = ${type}`)
                    .join(' OR ');
                filter = filter
                    ? `(${filter}) AND (${contentTypeFilter})`
                    : contentTypeFilter;
            }
            const statusFilter = 'status = PUBLISHED';
            filter = filter ? `(${filter}) AND ${statusFilter}` : statusFilter;
            const searchOptions = {
                limit: query.limit || 20,
                offset: query.offset || 0,
                filter,
            };
            if (query.attributesToRetrieve) {
                searchOptions.attributesToRetrieve = query.attributesToRetrieve;
            }
            if (query.facets) {
                searchOptions.facets = query.facets;
            }
            const results = await index.search(query.q, searchOptions);
            const response = {
                hits: results.hits,
                query: results.query,
                processingTimeMs: results.processingTimeMs,
                limit: results.limit,
                offset: results.offset,
                estimatedTotalHits: results.estimatedTotalHits,
                facetDistribution: results.facetDistribution,
            };
            await this.cacheManager.set(cacheKey, response, this.CACHE_TTL * 1000);
            const totalTime = Date.now() - startTime;
            this.analyticsService.trackSearch({
                query: query.q,
                resultsCount: results.estimatedTotalHits || 0,
                processingTimeMs: totalTime,
                userId,
                filters: query,
            }).catch((err) => {
                this.logger.error('Failed to track search analytics:', err);
            });
            return response;
        }
        catch (error) {
            this.logger.error('Error searching:', error);
            throw error;
        }
    }
    async autocomplete(query, limit = 8) {
        try {
            const cacheKey = `autocomplete:${query.toLowerCase()}:${limit}`;
            const cached = await this.cacheManager.get(cacheKey);
            if (cached) {
                this.logger.debug(`Cache hit for autocomplete: ${query}`);
                return cached;
            }
            const index = this.client.index(this.indexName);
            const results = await index.search(query, {
                limit,
                attributesToRetrieve: ['id', 'title', 'slug', 'contentType'],
                filter: 'status = PUBLISHED',
            });
            const suggestions = results.hits.map((hit) => ({
                id: hit.id,
                title: hit.title,
                slug: hit.slug,
                contentType: hit.contentType,
            }));
            await this.cacheManager.set(cacheKey, suggestions, this.AUTOCOMPLETE_CACHE_TTL * 1000);
            return suggestions;
        }
        catch (error) {
            this.logger.error('Error getting autocomplete suggestions:', error);
            throw error;
        }
    }
    async clearSearchCache() {
        try {
            this.logger.log('Search cache will expire naturally based on TTL settings');
        }
        catch (error) {
            this.logger.error('Error in clearSearchCache:', error);
        }
    }
    generateCacheKey(prefix, query) {
        const parts = [
            prefix,
            query.q,
            query.limit || 20,
            query.offset || 0,
            query.contentTypes?.sort().join(',') || '',
            query.filter || '',
        ];
        return parts.join(':');
    }
    async indexContent(contentId, contentType) {
        try {
            await this.clearSearchCache();
            switch (contentType) {
                case 'article':
                    await this.indexArticle(contentId);
                    break;
                case 'blogPost':
                    await this.indexBlogPost(contentId);
                    break;
                default:
                    this.logger.warn(`Unknown content type: ${contentType}`);
            }
        }
        catch (error) {
            this.logger.error(`Error indexing ${contentType} ${contentId}:`, error);
            throw error;
        }
    }
    async indexArticle(articleId) {
        const article = await this.prisma.article.findUnique({
            where: { id: articleId },
            include: {
                author: true,
                categories: { include: { category: true } },
                tags: { include: { tag: true } },
            },
        });
        if (!article) {
            this.logger.warn(`Article ${articleId} not found for indexing`);
            return;
        }
        const document = {
            id: article.id,
            title: article.title,
            slug: article.slug,
            content: article.content,
            excerpt: article.excerpt,
            contentType: 'article',
            status: article.status,
            publishedAt: article.publishedAt?.getTime() || null,
            createdAt: article.createdAt.getTime(),
            authorId: article.authorId,
            authorName: article.author.name,
            featuredImage: article.featuredImage,
            categoryNames: article.categories.map((c) => c.category.name),
            tagNames: article.tags.map((t) => t.tag.name),
        };
        await this.client.index(this.indexName).addDocuments([document]);
        this.logger.log(`Indexed article: ${articleId}`);
    }
    async indexBlogPost(blogPostId) {
        const blogPost = await this.prisma.blogPost.findUnique({
            where: { id: blogPostId },
            include: {
                author: true,
                categories: { include: { category: true } },
                tags: { include: { tag: true } },
            },
        });
        if (!blogPost) {
            this.logger.warn(`Blog post ${blogPostId} not found for indexing`);
            return;
        }
        const document = {
            id: blogPost.id,
            title: blogPost.title,
            slug: blogPost.slug,
            content: blogPost.content,
            excerpt: blogPost.excerpt,
            contentType: 'blogPost',
            status: blogPost.status,
            publishedAt: blogPost.publishedAt?.getTime() || null,
            createdAt: blogPost.createdAt.getTime(),
            authorId: blogPost.authorId,
            authorName: blogPost.author.name,
            featuredImage: blogPost.featuredImage,
            categoryNames: blogPost.categories.map((c) => c.category.name),
            tagNames: blogPost.tags.map((t) => t.tag.name),
        };
        await this.client.index(this.indexName).addDocuments([document]);
        this.logger.log(`Indexed blog post: ${blogPostId}`);
    }
};
exports.SearchEnhancedService = SearchEnhancedService;
exports.SearchEnhancedService = SearchEnhancedService = SearchEnhancedService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        search_analytics_service_1.SearchAnalyticsService, Object])
], SearchEnhancedService);
//# sourceMappingURL=search-enhanced.service.js.map