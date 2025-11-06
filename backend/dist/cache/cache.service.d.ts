import type { Cache } from 'cache-manager';
export declare class CacheService {
    private cacheManager;
    private readonly logger;
    constructor(cacheManager: Cache);
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    deletePattern(pattern: string): Promise<void>;
    clear(): Promise<void>;
    wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>;
    generateListKey(contentType: string, params: Record<string, any>): string;
    generateDetailKey(contentType: string, id: string): string;
    generateSlugKey(contentType: string, slug: string): string;
    invalidateContentType(contentType: string): Promise<void>;
    invalidateContent(contentType: string, id: string): Promise<void>;
}
