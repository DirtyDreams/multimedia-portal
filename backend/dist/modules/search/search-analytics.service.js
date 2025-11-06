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
var SearchAnalyticsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchAnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let SearchAnalyticsService = SearchAnalyticsService_1 = class SearchAnalyticsService {
    prisma;
    logger = new common_1.Logger(SearchAnalyticsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async trackSearch(analytics) {
        try {
            this.logger.log(`Search analytics: query="${analytics.query}", ` +
                `results=${analytics.resultsCount}, ` +
                `time=${analytics.processingTimeMs}ms, ` +
                `userId=${analytics.userId || 'anonymous'}`);
        }
        catch (error) {
            this.logger.error('Failed to track search analytics:', error);
        }
    }
    async getPopularQueries(limit = 10) {
        return [];
    }
    async getPerformanceMetrics() {
        return {
            averageResponseTime: 0,
            totalSearches: 0,
            slowQueries: [],
        };
    }
};
exports.SearchAnalyticsService = SearchAnalyticsService;
exports.SearchAnalyticsService = SearchAnalyticsService = SearchAnalyticsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SearchAnalyticsService);
//# sourceMappingURL=search-analytics.service.js.map