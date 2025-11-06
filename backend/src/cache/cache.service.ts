import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit for key: ${key}`);
      } else {
        this.logger.debug(`Cache miss for key: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Error getting cache for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache set for key: ${key}, TTL: ${ttl || 'default'}`);
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache for key ${key}:`, error);
    }
  }

  /**
   * Delete all values matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      // Note: This requires a Redis-specific implementation
      // For now, we'll log that pattern deletion was attempted
      this.logger.warn(
        `Pattern deletion not implemented yet for pattern: ${pattern}`,
      );
    } catch (error) {
      this.logger.error(
        `Error deleting cache pattern ${pattern}:`,
        error,
      );
    }
  }

  /**
   * Clear all cache
   * Note: This method is not fully implemented for Redis store
   */
  async clear(): Promise<void> {
    try {
      // Note: cache-manager's reset/clear functionality may vary by store
      // For Redis, this would require a store-specific implementation
      this.logger.warn('Clear all cache operation not fully implemented');
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
    }
  }

  /**
   * Wrap a function with caching logic
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      // Check cache first
      const cached = await this.get<T>(key);
      if (cached !== undefined) {
        return cached;
      }

      // Execute function and cache result
      const result = await fn();
      await this.set(key, result, ttl);
      return result;
    } catch (error) {
      this.logger.error(`Error in cache wrap for key ${key}:`, error);
      // If caching fails, still execute the function
      return fn();
    }
  }

  /**
   * Generate cache key for content list
   */
  generateListKey(
    contentType: string,
    params: Record<string, any>,
  ): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}:${params[key]}`)
      .join('|');
    return `${contentType}:list:${sortedParams}`;
  }

  /**
   * Generate cache key for content detail
   */
  generateDetailKey(contentType: string, id: string): string {
    return `${contentType}:detail:${id}`;
  }

  /**
   * Generate cache key for content slug
   */
  generateSlugKey(contentType: string, slug: string): string {
    return `${contentType}:slug:${slug}`;
  }

  /**
   * Invalidate all cache for a content type
   */
  async invalidateContentType(contentType: string): Promise<void> {
    await this.deletePattern(`${contentType}:*`);
  }

  /**
   * Invalidate cache for specific content
   */
  async invalidateContent(contentType: string, id: string): Promise<void> {
    await this.delete(this.generateDetailKey(contentType, id));
    // Also invalidate list caches
    await this.invalidateContentType(contentType);
  }
}
