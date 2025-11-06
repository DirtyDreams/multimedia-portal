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
var SearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const common_1 = require("@nestjs/common");
const meilisearch_1 = require("meilisearch");
const prisma_service_1 = require("../../prisma/prisma.service");
let SearchService = SearchService_1 = class SearchService {
    prisma;
    logger = new common_1.Logger(SearchService_1.name);
    client;
    indexName = 'content';
    constructor(prisma) {
        this.prisma = prisma;
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
            this.logger.log('MeiliSearch initialized successfully');
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
                    oneTypo: 5,
                    twoTypos: 9,
                },
            });
            this.logger.log('MeiliSearch index configured successfully');
        }
        catch (error) {
            this.logger.error('Error initializing MeiliSearch index:', error);
            throw error;
        }
    }
    async search(query) {
        try {
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
            return {
                hits: results.hits,
                query: results.query,
                processingTimeMs: results.processingTimeMs,
                limit: results.limit,
                offset: results.offset,
                estimatedTotalHits: results.estimatedTotalHits,
                facetDistribution: results.facetDistribution,
            };
        }
        catch (error) {
            this.logger.error('Error searching:', error);
            throw error;
        }
    }
    async indexArticle(articleId) {
        try {
            const article = await this.prisma.article.findUnique({
                where: { id: articleId },
                include: {
                    author: true,
                    categories: {
                        include: { category: true },
                    },
                    tags: {
                        include: { tag: true },
                    },
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
        catch (error) {
            this.logger.error(`Error indexing article ${articleId}:`, error);
        }
    }
    async indexBlogPost(blogPostId) {
        try {
            const blogPost = await this.prisma.blogPost.findUnique({
                where: { id: blogPostId },
                include: {
                    author: true,
                    categories: {
                        include: { category: true },
                    },
                    tags: {
                        include: { tag: true },
                    },
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
        catch (error) {
            this.logger.error(`Error indexing blog post ${blogPostId}:`, error);
        }
    }
    async indexAllContent() {
        try {
            this.logger.log('Starting full content indexing...');
            const articles = await this.prisma.article.findMany({
                include: {
                    author: true,
                    categories: { include: { category: true } },
                    tags: { include: { tag: true } },
                },
            });
            const articleDocuments = articles.map((article) => ({
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
            }));
            const blogPosts = await this.prisma.blogPost.findMany({
                include: {
                    author: true,
                    categories: { include: { category: true } },
                    tags: { include: { tag: true } },
                },
            });
            const blogPostDocuments = blogPosts.map((blogPost) => ({
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
            }));
            const wikiPages = await this.prisma.wikiPage.findMany({
                include: {
                    author: true,
                    categories: { include: { category: true } },
                    tags: { include: { tag: true } },
                },
            });
            const wikiPageDocuments = wikiPages.map((page) => ({
                id: page.id,
                title: page.title,
                slug: page.slug,
                content: page.content,
                excerpt: page.content.substring(0, 200),
                contentType: 'wikiPage',
                status: page.status,
                publishedAt: page.publishedAt?.getTime() || null,
                createdAt: page.createdAt.getTime(),
                authorId: page.authorId,
                authorName: page.author.name,
                categoryNames: page.categories.map((c) => c.category.name),
                tagNames: page.tags.map((t) => t.tag.name),
            }));
            const stories = await this.prisma.story.findMany({
                include: {
                    author: true,
                    categories: { include: { category: true } },
                    tags: { include: { tag: true } },
                },
            });
            const storyDocuments = stories.map((story) => ({
                id: story.id,
                title: story.title,
                slug: story.slug,
                content: story.content,
                excerpt: story.excerpt,
                contentType: 'story',
                status: story.status,
                publishedAt: story.publishedAt?.getTime() || null,
                createdAt: story.createdAt.getTime(),
                authorId: story.authorId,
                authorName: story.author.name,
                featuredImage: story.featuredImage,
                categoryNames: story.categories.map((c) => c.category.name),
                tagNames: story.tags.map((t) => t.tag.name),
            }));
            const galleryItems = await this.prisma.galleryItem.findMany({
                include: {
                    author: true,
                    categories: { include: { category: true } },
                    tags: { include: { tag: true } },
                },
            });
            const galleryItemDocuments = galleryItems.map((item) => ({
                id: item.id,
                title: item.title,
                slug: item.slug,
                content: item.description || '',
                excerpt: item.description,
                contentType: 'galleryItem',
                status: item.status,
                publishedAt: item.publishedAt?.getTime() || null,
                createdAt: item.createdAt.getTime(),
                authorId: item.authorId,
                authorName: item.author.name,
                coverImage: item.thumbnail,
                categoryNames: item.categories.map((c) => c.category.name),
                tagNames: item.tags.map((t) => t.tag.name),
            }));
            const allDocuments = [
                ...articleDocuments,
                ...blogPostDocuments,
                ...wikiPageDocuments,
                ...storyDocuments,
                ...galleryItemDocuments,
            ];
            if (allDocuments.length > 0) {
                await this.client.index(this.indexName).addDocuments(allDocuments);
                this.logger.log(`Indexed ${allDocuments.length} documents successfully`);
            }
            return {
                indexed: allDocuments.length,
                breakdown: {
                    articles: articleDocuments.length,
                    blogPosts: blogPostDocuments.length,
                    wikiPages: wikiPageDocuments.length,
                    stories: storyDocuments.length,
                    galleryItems: galleryItemDocuments.length,
                },
            };
        }
        catch (error) {
            this.logger.error('Error indexing all content:', error);
            throw error;
        }
    }
    async deleteDocument(documentId) {
        try {
            await this.client.index(this.indexName).deleteDocument(documentId);
            this.logger.log(`Deleted document: ${documentId}`);
        }
        catch (error) {
            this.logger.error(`Error deleting document ${documentId}:`, error);
        }
    }
    async autocomplete(query, limit = 5) {
        try {
            const index = this.client.index(this.indexName);
            const results = await index.search(query, {
                limit,
                attributesToRetrieve: ['title', 'contentType'],
                filter: 'status = PUBLISHED',
            });
            return results.hits.map((hit) => ({
                title: hit.title,
                contentType: hit.contentType,
            }));
        }
        catch (error) {
            this.logger.error('Error getting autocomplete suggestions:', error);
            throw error;
        }
    }
};
exports.SearchService = SearchService;
exports.SearchService = SearchService = SearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchService);
//# sourceMappingURL=search.service.js.map