import { PrismaService } from '../../prisma/prisma.service';
interface SearchAnalytics {
    query: string;
    resultsCount: number;
    processingTimeMs: number;
    userId?: string;
    filters?: any;
}
export declare class SearchAnalyticsService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    trackSearch(analytics: SearchAnalytics): Promise<void>;
    getPopularQueries(limit?: number): Promise<Array<{
        query: string;
        count: number;
    }>>;
    getPerformanceMetrics(): Promise<{
        averageResponseTime: number;
        totalSearches: number;
        slowQueries: Array<{
            query: string;
            time: number;
        }>;
    }>;
}
export {};
