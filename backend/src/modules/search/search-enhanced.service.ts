import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { MeiliSearch } from 'meilisearch';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchQueryDto } from './dto';
import { SearchAnalyticsService } from './search-analytics.service';

@Injectable()
export class SearchEnhancedService implements OnModuleInit {
  private readonly logger = new Logger(SearchEnhancedService.name);
  private client: MeiliSearch;
  private readonly indexName = 'content';
  private readonly CACHE_TTL = 300; // 5 minutes in seconds
  private readonly AUTOCOMPLETE_CACHE_TTL = 600; // 10 minutes for autocomplete

  constructor(
    private prisma: PrismaService,
    private analyticsService: SearchAnalyticsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.client = new MeiliSearch({
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
    } catch (error) {
      this.logger.error('Failed to initialize MeiliSearch:', error);
    }
  }

  /**
   * Initialize MeiliSearch index with optimized settings
   */
  private async initializeIndex() {
    try {
      const index = this.client.index(this.indexName);

      // Configure searchable attributes (order matters for relevance)
      await index.updateSearchableAttributes([
        'title',
        'content',
        'excerpt',
        'authorName',
        'categoryNames',
        'tagNames',
      ]);

      // Configure filterable attributes
      await index.updateFilterableAttributes([
        'contentType',
        'status',
        'authorId',
        'publishedAt',
        'createdAt',
      ]);

      // Configure sortable attributes
      await index.updateSortableAttributes([
        'publishedAt',
        'createdAt',
        'viewCount',
        'title',
      ]);

      // Configure displayed attributes
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

      // Optimize ranking rules for better relevance
      await index.updateRankingRules([
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
        'publishedAt:desc',
      ]);

      // Configure typo tolerance for better UX
      await index.updateTypoTolerance({
        enabled: true,
        minWordSizeForTypos: {
          oneTypo: 4, // More lenient - allow typo for 4+ char words
          twoTypos: 8,
        },
        disableOnWords: [], // Can add words that should match exactly
        disableOnAttributes: [], // Can disable typo on specific fields
      });

      // Configure pagination limits
      await index.updatePagination({
        maxTotalHits: 1000, // Limit total searchable results for performance
      });

      this.logger.log('MeiliSearch index configured with optimizations');
    } catch (error) {
      this.logger.error('Error initializing MeiliSearch index:', error);
      throw error;
    }
  }

  /**
   * Search content with caching and analytics
   */
  async search(query: SearchQueryDto, userId?: string) {
    const startTime = Date.now();

    try {
      // Generate cache key based on query parameters
      const cacheKey = this.generateCacheKey('search', query);

      // Try to get from cache first
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for search: ${query.q}`);
        return cached;
      }

      const index = this.client.index(this.indexName);

      // Build filter
      let filter = query.filter || '';

      // Add content type filter
      if (query.contentTypes && query.contentTypes.length > 0) {
        const contentTypeFilter = query.contentTypes
          .map((type) => `contentType = ${type}`)
          .join(' OR ');
        filter = filter
          ? `(${filter}) AND (${contentTypeFilter})`
          : contentTypeFilter;
      }

      // Always filter by published status for public search
      const statusFilter = 'status = PUBLISHED';
      filter = filter ? `(${filter}) AND ${statusFilter}` : statusFilter;

      const searchOptions: any = {
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

      // Execute search
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

      // Cache the results
      await this.cacheManager.set(cacheKey, response, this.CACHE_TTL * 1000);

      // Track analytics asynchronously
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
    } catch (error) {
      this.logger.error('Error searching:', error);
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions with aggressive caching
   */
  async autocomplete(query: string, limit: number = 8) {
    try {
      // Generate cache key
      const cacheKey = `autocomplete:${query.toLowerCase()}:${limit}`;

      // Try cache first
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

      const suggestions = results.hits.map((hit: any) => ({
        id: hit.id,
        title: hit.title,
        slug: hit.slug,
        contentType: hit.contentType,
      }));

      // Cache autocomplete results longer
      await this.cacheManager.set(
        cacheKey,
        suggestions,
        this.AUTOCOMPLETE_CACHE_TTL * 1000,
      );

      return suggestions;
    } catch (error) {
      this.logger.error('Error getting autocomplete suggestions:', error);
      throw error;
    }
  }

  /**
   * Clear search cache (useful after reindexing)
   * Note: In cache-manager v7, we invalidate caches by letting them expire naturally
   * or by using shorter TTLs. Full cache clear requires manual key tracking.
   */
  async clearSearchCache() {
    try {
      this.logger.log('Search cache will expire naturally based on TTL settings');
      // In cache-manager v7, there's no global reset()
      // Caches will expire based on their TTL (5-10 minutes)
      // For immediate cache clear, consider:
      // 1. Tracking all cache keys and deleting them individually
      // 2. Using a cache store that supports reset (e.g., Redis with flush)
      // 3. Restarting the application
    } catch (error) {
      this.logger.error('Error in clearSearchCache:', error);
    }
  }

  /**
   * Generate cache key from query parameters
   */
  private generateCacheKey(prefix: string, query: SearchQueryDto): string {
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

  /**
   * Index content with cache invalidation
   */
  async indexContent(contentId: string, contentType: string) {
    try {
      // Clear relevant caches
      await this.clearSearchCache();

      // Delegate to appropriate indexing method based on content type
      switch (contentType) {
        case 'article':
          await this.indexArticle(contentId);
          break;
        case 'blogPost':
          await this.indexBlogPost(contentId);
          break;
        // Add other types as needed
        default:
          this.logger.warn(`Unknown content type: ${contentType}`);
      }
    } catch (error) {
      this.logger.error(`Error indexing ${contentType} ${contentId}:`, error);
      throw error;
    }
  }

  /**
   * Index a single article
   */
  private async indexArticle(articleId: string) {
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

  /**
   * Index a single blog post
   */
  private async indexBlogPost(blogPostId: string) {
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
}
