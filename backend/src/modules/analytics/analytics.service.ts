import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PrismaService } from '../../prisma/prisma.service';
import { createHash } from 'crypto';
import {
  AnalyticsEvent,
  EventType,
  ContentType,
  DashboardStats,
  ContentStats,
  PageViewStats,
  TrendData,
  PopularContent,
} from './interfaces/analytics.interface';
import { TrackEventDto, AnalyticsQueryDto, TimePeriod } from './dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Hash IP address for privacy-friendly tracking
   * @param ip IP address
   * @returns Hashed IP
   */
  private hashIp(ip: string): string {
    return createHash('sha256').update(ip + process.env.HASH_SALT || 'secret-salt').digest('hex');
  }

  /**
   * Track an analytics event
   * @param trackEventDto Event data
   * @param ip User IP address
   * @param userAgent User agent string
   */
  async trackEvent(
    trackEventDto: TrackEventDto,
    ip?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      const event: AnalyticsEvent = {
        type: trackEventDto.type,
        contentType: trackEventDto.contentType,
        contentId: trackEventDto.contentId,
        path: trackEventDto.path,
        referrer: trackEventDto.referrer,
        userAgent,
        timestamp: new Date(),
        sessionId: trackEventDto.sessionId,
        ipHash: ip ? this.hashIp(ip) : undefined,
      };

      // Store event in Redis for real-time aggregation
      await this.storeEventInRedis(event);

      // Update content view count if applicable
      if (event.type === EventType.CONTENT_VIEW && event.contentId && event.contentType) {
        await this.incrementContentViewCount(event.contentId, event.contentType);
      }

      this.logger.log(`Tracked event: ${event.type} ${event.path || event.contentId || ''}`);
    } catch (error) {
      this.logger.error(`Failed to track event: ${error.message}`, error.stack);
    }
  }

  /**
   * Store event in Redis for aggregation
   * @param event Analytics event
   */
  private async storeEventInRedis(event: AnalyticsEvent): Promise<void> {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const hour = new Date().getHours();

    // Daily views
    await this.cacheManager.set(
      `analytics:views:${date}`,
      ((await this.cacheManager.get<number>(`analytics:views:${date}`)) || 0) + 1,
      86400000, // 24 hours TTL
    );

    // Hourly views
    await this.cacheManager.set(
      `analytics:views:${date}:${hour}`,
      ((await this.cacheManager.get<number>(`analytics:views:${date}:${hour}`)) || 0) + 1,
      86400000,
    );

    // Path-specific views
    if (event.path) {
      await this.cacheManager.set(
        `analytics:path:${event.path}:${date}`,
        ((await this.cacheManager.get<number>(`analytics:path:${event.path}:${date}`)) || 0) + 1,
        604800000, // 7 days TTL
      );
    }

    // Content-specific views
    if (event.contentId && event.contentType) {
      const key = `analytics:content:${event.contentType}:${event.contentId}:${date}`;
      await this.cacheManager.set(
        key,
        ((await this.cacheManager.get<number>(key)) || 0) + 1,
        2592000000, // 30 days TTL
      );
    }

    // Unique visitors (using IP hash)
    if (event.ipHash) {
      const visitorsKey = `analytics:visitors:${date}`;
      const visitors = (await this.cacheManager.get<Set<string>>(visitorsKey)) || new Set();
      visitors.add(event.ipHash);
      await this.cacheManager.set(visitorsKey, visitors, 86400000);
    }
  }

  /**
   * Increment content view count in database
   * @param contentId Content ID
   * @param contentType Content type
   */
  private async incrementContentViewCount(
    contentId: string,
    contentType: ContentType,
  ): Promise<void> {
    try {
      const modelMap = {
        [ContentType.ARTICLE]: 'article',
        [ContentType.BLOG_POST]: 'blogPost',
        [ContentType.WIKI_PAGE]: 'wikiPage',
        [ContentType.GALLERY_ITEM]: 'galleryItem',
        [ContentType.STORY]: 'story',
      };

      const model = modelMap[contentType];
      if (!model) return;

      await (this.prisma[model] as any).update({
        where: { id: contentId },
        data: { viewCount: { increment: 1 } },
      });
    } catch (error) {
      this.logger.error(`Failed to increment view count: ${error.message}`);
    }
  }

  /**
   * Get dashboard statistics
   * @param query Analytics query parameters
   * @returns Dashboard statistics
   */
  async getDashboardStats(query: AnalyticsQueryDto): Promise<DashboardStats> {
    const { period = TimePeriod.WEEK } = query;

    // Get total counts from database
    const [
      totalArticles,
      totalBlogPosts,
      totalWikiPages,
      totalGalleryItems,
      totalStories,
      totalComments,
      totalRatings,
      avgRatingResult,
    ] = await Promise.all([
      this.prisma.article.count(),
      this.prisma.blogPost.count(),
      this.prisma.wikiPage.count(),
      this.prisma.galleryItem.count(),
      this.prisma.story.count(),
      this.prisma.comment.count(),
      this.prisma.rating.count(),
      this.prisma.rating.aggregate({ _avg: { value: true } }),
    ]);

    const totalContent = totalArticles + totalBlogPosts + totalWikiPages + totalGalleryItems + totalStories;

    // Get views from Redis
    const { totalViews, totalUniqueVisitors, viewsByDay } = await this.getViewsStats(period);

    // Get top content
    const topContent = await this.getPopularContent(query);

    return {
      totalViews,
      totalUniqueVisitors,
      totalContent,
      totalComments,
      totalRatings,
      avgRating: avgRatingResult._avg.value || 0,
      topContent: topContent.items.slice(0, 10),
      recentActivity: [], // Could implement recent events tracking
      viewsByDay,
    };
  }

  /**
   * Get views statistics for a time period
   * @param period Time period
   * @returns Views stats
   */
  private async getViewsStats(period: TimePeriod): Promise<{
    totalViews: number;
    totalUniqueVisitors: number;
    viewsByDay: { date: string; views: number }[];
  }> {
    const days = this.getPeriodDays(period);
    let totalViews = 0;
    const uniqueVisitors = new Set<string>();
    const viewsByDay: { date: string; views: number }[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const views = (await this.cacheManager.get<number>(`analytics:views:${dateStr}`)) || 0;
      const visitors = (await this.cacheManager.get<Set<string>>(`analytics:visitors:${dateStr}`)) || new Set();

      totalViews += views;
      visitors.forEach((v) => uniqueVisitors.add(v));

      viewsByDay.push({ date: dateStr, views });
    }

    return {
      totalViews,
      totalUniqueVisitors: uniqueVisitors.size,
      viewsByDay: viewsByDay.reverse(),
    };
  }

  /**
   * Get popular content
   * @param query Analytics query
   * @returns Popular content list
   */
  async getPopularContent(query: AnalyticsQueryDto): Promise<PopularContent> {
    const { period = TimePeriod.WEEK, contentType, limit = 10 } = query;

    const contentTypes = contentType
      ? [contentType]
      : [
          ContentType.ARTICLE,
          ContentType.BLOG_POST,
          ContentType.WIKI_PAGE,
          ContentType.GALLERY_ITEM,
          ContentType.STORY,
        ];

    const allContent: ContentStats[] = [];

    for (const type of contentTypes) {
      const items = await this.getPopularContentByType(type, period, limit);
      allContent.push(...items);
    }

    // Sort by views and limit
    allContent.sort((a, b) => b.views - a.views);

    return {
      contentType: contentType || null,
      items: allContent.slice(0, limit),
      period,
    };
  }

  /**
   * Get popular content by type
   * @param contentType Content type
   * @param period Time period
   * @param limit Results limit
   * @returns Content stats
   */
  private async getPopularContentByType(
    contentType: ContentType,
    period: TimePeriod,
    limit: number,
  ): Promise<ContentStats[]> {
    const modelMap = {
      [ContentType.ARTICLE]: 'article',
      [ContentType.BLOG_POST]: 'blogPost',
      [ContentType.WIKI_PAGE]: 'wikiPage',
      [ContentType.GALLERY_ITEM]: 'galleryItem',
      [ContentType.STORY]: 'story',
    };

    const model = modelMap[contentType];
    if (!model) return [];

    // Get content with highest view counts from database
    const content = await (this.prisma[model] as any).findMany({
      take: limit,
      orderBy: { viewCount: 'desc' },
      select: {
        id: true,
        title: true,
        viewCount: true,
        _count: {
          select: {
            comments: true,
            ratings: true,
          },
        },
      },
    });

    // Get ratings aggregation
    const contentStats: ContentStats[] = await Promise.all(
      content.map(async (item) => {
        const ratingAgg = await this.prisma.rating.aggregate({
          where: {
            contentType: contentType,
            contentId: item.id,
          },
          _avg: { value: true },
        });

        return {
          contentId: item.id,
          contentType,
          title: item.title,
          views: item.viewCount || 0,
          uniqueVisitors: 0, // Could calculate from Redis
          comments: item._count.comments || 0,
          avgRating: ratingAgg._avg.value || 0,
          totalRatings: item._count.ratings || 0,
        };
      }),
    );

    return contentStats;
  }

  /**
   * Get trend data
   * @param query Analytics query
   * @returns Trend data
   */
  async getTrends(query: AnalyticsQueryDto): Promise<TrendData> {
    const { period = TimePeriod.WEEK } = query;
    const days = this.getPeriodDays(period);

    const data: Array<{ date: string; views: number; visitors: number }> = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const views = (await this.cacheManager.get<number>(`analytics:views:${dateStr}`)) || 0;
      const visitors = (await this.cacheManager.get<Set<string>>(`analytics:visitors:${dateStr}`)) || new Set();

      data.push({
        date: dateStr,
        views,
        visitors: visitors.size,
      });
    }

    return { period, data };
  }

  /**
   * Get number of days for a time period
   * @param period Time period
   * @returns Number of days
   */
  private getPeriodDays(period: TimePeriod): number {
    switch (period) {
      case TimePeriod.DAY:
        return 1;
      case TimePeriod.WEEK:
        return 7;
      case TimePeriod.MONTH:
        return 30;
      case TimePeriod.YEAR:
        return 365;
      default:
        return 7;
    }
  }
}
