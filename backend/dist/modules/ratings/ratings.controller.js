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
exports.RatingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ratings_service_1 = require("./ratings.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const prisma_types_1 = require("../../types/prisma.types");
let RatingsController = class RatingsController {
    ratingsService;
    constructor(ratingsService) {
        this.ratingsService = ratingsService;
    }
    async create(userId, createRatingDto) {
        return this.ratingsService.create(userId, createRatingDto);
    }
    async findAll(queryDto) {
        return this.ratingsService.findAll(queryDto);
    }
    async getContentRatings(contentType, contentId) {
        return this.ratingsService.getContentRatings(contentType, contentId);
    }
    async getAverageRating(contentType, contentId) {
        return this.ratingsService.getAverageRating(contentType, contentId);
    }
    async getUserRating(userId, contentType, contentId) {
        return this.ratingsService.getUserRating(userId, contentType, contentId);
    }
    async findOne(id) {
        return this.ratingsService.findOne(id);
    }
    async update(id, userId, updateRatingDto) {
        return this.ratingsService.update(id, userId, updateRatingDto);
    }
    async remove(id, userId, userRole) {
        const isAdmin = userRole === prisma_types_1.UserRole.ADMIN || userRole === prisma_types_1.UserRole.MODERATOR;
        return this.ratingsService.remove(id, userId, isAdmin);
    }
};
exports.RatingsController = RatingsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Create or update a rating (Authenticated users)',
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Rating created/updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Content not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateRatingDto]),
    __metadata("design:returntype", Promise)
], RatingsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all ratings with pagination and filtering' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ratings retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryRatingDto]),
    __metadata("design:returntype", Promise)
], RatingsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('content/:contentType/:contentId'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get ratings for specific content' }),
    (0, swagger_1.ApiParam)({
        name: 'contentType',
        enum: dto_1.RatableType,
        description: 'Type of content',
    }),
    (0, swagger_1.ApiParam)({ name: 'contentId', description: 'Content UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ratings retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Content not found' }),
    __param(0, (0, common_1.Param)('contentType', new common_1.ParseEnumPipe(dto_1.RatableType))),
    __param(1, (0, common_1.Param)('contentId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RatingsController.prototype, "getContentRatings", null);
__decorate([
    (0, common_1.Get)('content/:contentType/:contentId/average'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get average rating for specific content' }),
    (0, swagger_1.ApiParam)({
        name: 'contentType',
        enum: dto_1.RatableType,
        description: 'Type of content',
    }),
    (0, swagger_1.ApiParam)({ name: 'contentId', description: 'Content UUID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Average rating retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Content not found' }),
    __param(0, (0, common_1.Param)('contentType', new common_1.ParseEnumPipe(dto_1.RatableType))),
    __param(1, (0, common_1.Param)('contentId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], RatingsController.prototype, "getAverageRating", null);
__decorate([
    (0, common_1.Get)('user/:contentType/:contentId'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user\'s rating for specific content' }),
    (0, swagger_1.ApiParam)({
        name: 'contentType',
        enum: dto_1.RatableType,
        description: 'Type of content',
    }),
    (0, swagger_1.ApiParam)({ name: 'contentId', description: 'Content UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User rating retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Param)('contentType', new common_1.ParseEnumPipe(dto_1.RatableType))),
    __param(2, (0, common_1.Param)('contentId', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], RatingsController.prototype, "getUserRating", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single rating by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Rating UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rating retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Rating not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RatingsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a rating (Only rating owner)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Rating UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rating updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - not rating owner' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Rating not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.UpdateRatingDto]),
    __metadata("design:returntype", Promise)
], RatingsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a rating (Rating owner or Admin)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Rating UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Rating deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - not rating owner or admin' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Rating not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(2, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], RatingsController.prototype, "remove", null);
exports.RatingsController = RatingsController = __decorate([
    (0, swagger_1.ApiTags)('ratings'),
    (0, common_1.Controller)('ratings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [ratings_service_1.RatingsService])
], RatingsController);
//# sourceMappingURL=ratings.controller.js.map