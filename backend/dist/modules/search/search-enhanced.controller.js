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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchEnhancedController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const throttler_1 = require("@nestjs/throttler");
const search_enhanced_service_1 = require("./search-enhanced.service");
const search_service_1 = require("./search.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const prisma_types_1 = require("../../types/prisma.types");
let SearchEnhancedController = class SearchEnhancedController {
    searchEnhancedService;
    searchService;
    constructor(searchEnhancedService, searchService) {
        this.searchEnhancedService = searchEnhancedService;
        this.searchService = searchService;
    }
    async search(query, req) {
        const userId = req.user?.id;
        return this.searchEnhancedService.search(query, userId);
    }
    async autocomplete(query, limit) {
        return this.searchEnhancedService.autocomplete(query, limit);
    }
    async reindex() {
        await this.searchEnhancedService.clearSearchCache();
        return this.searchService.indexAllContent();
    }
    async clearCache() {
        await this.searchEnhancedService.clearSearchCache();
        return { message: 'Search cache cleared successfully' };
    }
    async indexContent(contentType, contentId) {
        await this.searchEnhancedService.indexContent(contentId, contentType);
        return { message: `${contentType} ${contentId} indexed successfully` };
    }
};
exports.SearchEnhancedController = SearchEnhancedController;
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)({ default: { limit: 20, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({
        summary: 'Search content with filters, facets, and caching',
        description: 'Optimized search endpoint with Redis caching and rate limiting'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Search results retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Too many requests - rate limit exceeded' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.SearchQueryDto, Object]),
    __metadata("design:returntype", Promise)
], SearchEnhancedController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('autocomplete'),
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)({ default: { limit: 30, ttl: 60000 } }),
    (0, swagger_1.ApiOperation)({
        summary: 'Get autocomplete suggestions with aggressive caching',
        description: 'Fast autocomplete endpoint optimized for real-time suggestions'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Autocomplete suggestions retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Too many requests - rate limit exceeded' }),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], SearchEnhancedController.prototype, "autocomplete", null);
__decorate([
    (0, common_1.Post)('reindex'),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, throttler_1.Throttle)({ default: { limit: 1, ttl: 300000 } }),
    (0, swagger_1.ApiOperation)({
        summary: 'Reindex all content and clear cache (Admin only)',
        description: 'Full reindexing operation - should be used sparingly'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Content reindexed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - admin only' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Too many requests - wait before reindexing again' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SearchEnhancedController.prototype, "reindex", null);
__decorate([
    (0, common_1.Post)('clear-cache'),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Clear search cache (Admin only)',
        description: 'Manually clear Redis cache for search results'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cache cleared successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - admin only' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SearchEnhancedController.prototype, "clearCache", null);
__decorate([
    (0, common_1.Post)('index/:contentType/:contentId'),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN, prisma_types_1.UserRole.MODERATOR),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Index or update a single content item (Admin/Moderator)',
        description: 'Index individual content item with cache invalidation'
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Content indexed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - moderator+ only' }),
    __param(0, (0, common_1.Query)('contentType')),
    __param(1, (0, common_1.Query)('contentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SearchEnhancedController.prototype, "indexContent", null);
exports.SearchEnhancedController = SearchEnhancedController = __decorate([
    (0, swagger_1.ApiTags)('search'),
    (0, common_1.Controller)('search'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [search_enhanced_service_1.SearchEnhancedService,
        search_service_1.SearchService])
], SearchEnhancedController);
//# sourceMappingURL=search-enhanced.controller.js.map