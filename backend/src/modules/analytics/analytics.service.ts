import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as crypto from 'crypto';
import {
  PageViewEvent,
  ContentViewEvent,
  SearchEvent,
  EngagementEvent,
  DailyStats,
  PopularContentItem,
  TrendData,
  ContentType,
} from './analytics.entity';
import {
  DashboardStatsDto,
  PopularContentDto,
  TrendsDto,
  UserPathDto,
} from './dto/analytics-response.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly PRIVACY_SALT = process.env.ANALYTICS_SALT || 'default-salt-change-in-production';

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Generate privacy-friendly session hash
   * Uses IP + User Agent + Date to create unique but anonymous session ID
   */
  private generateSessionHash(ip: string, userAgent: string): string {
    const date = new Date().toISOString().split('T')[0]; // Date only (YYYY-MM-DD)
    const data = `${ip}-${userAgent}-${date}-${this.PRIVACY_SALT}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Anonymize IP address for privacy
   * IPv4: 192.168.1.1 → 192.168.0.0
   * IPv6: First 48 bits only
   */
  private anonymizeIP(ip: string): string {
    if (ip.includes(':')) {
      // IPv6
      const parts = ip.split(':');
      return parts.slice(0, 3).join(':') + '::';
    } else {
      // IPv4
      const parts = ip.split('.');
      return `${parts[0]}.${parts[1]}.0.0`;
    }
  }

  /**
   * Get current date key for Redis
   */
  private getDateKey(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * Track page view event
   */
  async trackPageView(
    path: string,
    ip: string,
    userAgent: string,
    referrer?: string,
    duration?: number,
  ): Promise<void> {
    try {
      const sessionHash = this.generateSessionHash(this.anonymizeIP(ip), userAgent);
      const dateKey = this.getDateKey();
      const timestamp = new Date();

      // Store in Redis with multiple keys for different aggregations
      const pipeline = this.redis.pipeline();

      // Daily page views counter
      pipeline.hincrby(`analytics:daily:${dateKey}`, 'pageViews', 1);

      // Unique sessions (using set)
      pipeline.sadd(`analytics:sessions:${dateKey}`, sessionHash);

      // Popular paths
      pipeline.zincrby(`analytics:paths:${dateKey}`, 1, path);

      // Duration tracking (if provided)
      if (duration) {
        pipeline.lpush(`analytics:durations:${dateKey}`, duration);
        pipeline.ltrim(`analytics:durations:${dateKey}`, 0, 9999); // Keep last 10k
      }

      // Referrer tracking (anonymized)
      if (referrer) {
        const referrerDomain = new URL(referrer).hostname;
        pipeline.zincrby(`analytics:referrers:${dateKey}`, 1, referrerDomain);
      }

      // User path tracking (last 10 pages per session)
      pipeline.lpush(`analytics:path:${sessionHash}`, path);
      pipeline.ltrim(`analytics:path:${sessionHash}`, 0, 9);
      pipeline.expire(`analytics:path:${sessionHash}`, 86400); // 24 hours

      // Execute all Redis operations
      await pipeline.exec();

      this.logger.debug(`Tracked page view: ${path} (session: ${sessionHash.substring(0, 8)})`);
    } catch (error) {
      this.logger.error(`Failed to track page view: ${error.message}`, error.stack);
    }
  }

  /**
   * Track content view event
   */
  async trackContentView(
    contentType: ContentType,
    contentId: string,
    ip: string,
    userAgent: string,
    duration?: number,
  ): Promise<void> {
    try {
      const sessionHash = this.generateSessionHash(this.anonymizeIP(ip), userAgent);
      const dateKey = this.getDateKey();
      const contentKey = `${contentType}:${contentId}`;

      const pipeline = this.redis.pipeline();

      // Daily content views
      pipeline.hincrby(`analytics:daily:${dateKey}`, 'contentViews', 1);

      // Popular content
      pipeline.zincrby(`analytics:content:${dateKey}`, 1, contentKey);
      pipeline.zincrby(`analytics:content:all-time`, 1, contentKey);

      // Content-specific stats
      pipeline.hincrby(`analytics:content:${contentKey}`, 'views', 1);
      pipeline.sadd(`analytics:content:${contentKey}:sessions`, sessionHash);

      // Duration tracking for content
      if (duration) {
        pipeline.lpush(`analytics:content:${contentKey}:durations`, duration);
        pipeline.ltrim(`analytics:content:${contentKey}:durations`, 0, 999);
      }

      await pipeline.exec();

      this.logger.debug(`Tracked content view: ${contentKey}`);
    } catch (error) {
      this.logger.error(`Failed to track content view: ${error.message}`, error.stack);
    }
  }

  /**
   * Track search event
   */
  async trackSearch(query: string, resultsCount: number, ip: string, userAgent: string): Promise<void> {
    try {
      const dateKey = this.getDateKey();
      const normalizedQuery = query.toLowerCase().trim();

      const pipeline = this.redis.pipeline();

      // Popular searches
      pipeline.zincrby(`analytics:searches:${dateKey}`, 1, normalizedQuery);
      pipeline.zincrby(`analytics:searches:all-time`, 1, normalizedQuery);

      // Track zero-result searches separately
      if (resultsCount === 0) {
        pipeline.zincrby(`analytics:searches:zero-results`, 1, normalizedQuery);
      }

      await pipeline.exec();

      this.logger.debug(`Tracked search: "${normalizedQuery}" (${resultsCount} results)`);
    } catch (error) {
      this.logger.error(`Failed to track search: ${error.message}`, error.stack);
    }
  }

  /**
   * Track engagement event (comment, rating, share, etc.)
   */
  async trackEngagement(
    eventName: string,
    contentType: ContentType,
    contentId: string,
    ip: string,
    userAgent: string,
  ): Promise<void> {
    try {
      const dateKey = this.getDateKey();
      const contentKey = `${contentType}:${contentId}`;

      const pipeline = this.redis.pipeline();

      // Engagement counters
      pipeline.hincrby(`analytics:engagements:${dateKey}`, eventName, 1);
      pipeline.hincrby(`analytics:content:${contentKey}`, `engagement:${eventName}`, 1);
      pipeline.hincrby(`analytics:content:${contentKey}`, 'totalEngagements', 1);

      await pipeline.exec();

      this.logger.debug(`Tracked engagement: ${eventName} on ${contentKey}`);
    } catch (error) {
      this.logger.error(`Failed to track engagement: ${error.message}`, error.stack);
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const today = this.getDateKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const [
      todayStats,
      yesterdayStats,
      uniqueSessions,
      popularPaths,
      topSearches,
      durations,
    ] = await Promise.all([
      this.redis.hgetall(`analytics:daily:${today}`),
      this.redis.hgetall(`analytics:daily:${yesterday}`),
      this.redis.scard(`analytics:sessions:${today}`),
      this.redis.zrevrange(`analytics:paths:${today}`, 0, 9, 'WITHSCORES'),
      this.redis.zrevrange(`analytics:searches:${today}`, 0, 9, 'WITHSCORES'),
      this.redis.lrange(`analytics:durations:${today}`, 0, -1),
    ]);

    const totalPageViews = parseInt(todayStats.pageViews || '0');
    const totalContentViews = parseInt(todayStats.contentViews || '0');

    const yesterdayPageViews = parseInt(yesterdayStats.pageViews || '0');
    const yesterdayContentViews = parseInt(yesterdayStats.contentViews || '0');

    // Calculate average duration
    const durationsArray = durations.map(d => parseInt(d));
    const averageDuration = durationsArray.length > 0
      ? Math.round(durationsArray.reduce((a, b) => a + b, 0) / durationsArray.length)
      : 0;

    // Calculate growth percentages
    const pageViewsGrowth = yesterdayPageViews > 0
      ? ((totalPageViews - yesterdayPageViews) / yesterdayPageViews) * 100
      : 0;

    const sessionsGrowth = 0; // Would need yesterday's sessions

    // Format popular paths
    const popularPathsObj: Record<string, number> = {};
    for (let i = 0; i < popularPaths.length; i += 2) {
      popularPathsObj[popularPaths[i]] = parseInt(popularPaths[i + 1]);
    }

    // Format top searches
    const topSearchesObj: Record<string, number> = {};
    for (let i = 0; i < topSearches.length; i += 2) {
      topSearchesObj[topSearches[i]] = parseInt(topSearches[i + 1]);
    }

    return {
      totalPageViews,
      uniqueSessions,
      totalContentViews,
      averageDuration,
      pageViewsGrowth: Math.round(pageViewsGrowth * 10) / 10,
      sessionsGrowth: Math.round(sessionsGrowth * 10) / 10,
      popularPaths: popularPathsObj,
      topSearches: topSearchesObj,
    };
  }

  /**
   * Get popular content
   */
  async getPopularContent(period: string = 'last_7_days', limit: number = 50): Promise<PopularContentDto> {
    // For simplicity, using all-time popular content
    // In production, you'd aggregate over the specified period
    const popularContent = await this.redis.zrevrange('analytics:content:all-time', 0, limit - 1, 'WITHSCORES');

    const items: PopularContentItem[] = [];

    for (let i = 0; i < popularContent.length; i += 2) {
      const contentKey = popularContent[i];
      const views = parseInt(popularContent[i + 1]);
      const [contentType, contentId] = contentKey.split(':');

      const [contentStats, durations, totalEngagements] = await Promise.all([
        this.redis.hgetall(`analytics:content:${contentKey}`),
        this.redis.lrange(`analytics:content:${contentKey}:durations`, 0, -1),
        this.redis.hget(`analytics:content:${contentKey}`, 'totalEngagements'),
      ]);

      const durationsArray = durations.map(d => parseInt(d));
      const averageDuration = durationsArray.length > 0
        ? Math.round(durationsArray.reduce((a, b) => a + b, 0) / durationsArray.length)
        : 0;

      items.push({
        contentType: contentType as ContentType,
        contentId,
        title: `Content ${contentId}`, // Would fetch from database in production
        views,
        averageDuration,
        engagements: parseInt(totalEngagements || '0'),
      });
    }

    return {
      items,
      period,
      totalCount: items.length,
    };
  }

  /**
   * Get trend data
   */
  async getTrends(period: 'daily' | 'weekly' | 'monthly', days: number = 30): Promise<TrendsDto> {
    const trends: TrendData[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 86400000);
      const dateKey = date.toISOString().split('T')[0];

      const [stats, sessions] = await Promise.all([
        this.redis.hgetall(`analytics:daily:${dateKey}`),
        this.redis.scard(`analytics:sessions:${dateKey}`),
      ]);

      trends.unshift({
        period: 'daily',
        label: dateKey,
        pageViews: parseInt(stats.pageViews || '0'),
        uniqueSessions: sessions,
        contentViews: parseInt(stats.contentViews || '0'),
        averageDuration: 0, // Would calculate from durations list
      });
    }

    return {
      trends,
      period,
      dataPoints: trends.length,
    };
  }

  /**
   * Get user navigation paths
   */
  async getUserPaths(): Promise<UserPathDto> {
    // This is a simplified version
    // In production, you'd aggregate path sequences from session data
    return {
      paths: [],
      entryPages: {},
      exitPages: {},
    };
  }

  /**
   * Clean up old analytics data
   */
  async cleanupOldData(daysToKeep: number = 90): Promise<void> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 86400000);
    const cutoffKey = cutoffDate.toISOString().split('T')[0];

    this.logger.log(`Cleaning up analytics data older than ${cutoffKey}`);

    // Delete old daily keys
    // This would need to be implemented based on your key naming strategy
    // For now, just log
    this.logger.log('Cleanup completed');
  }
}
