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
exports.ContentVersionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const content_versions_service_1 = require("./content-versions.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const prisma_types_1 = require("../../types/prisma.types");
let ContentVersionsController = class ContentVersionsController {
    contentVersionsService;
    constructor(contentVersionsService) {
        this.contentVersionsService = contentVersionsService;
    }
    async create(user, createVersionDto) {
        return this.contentVersionsService.create(user.userId, createVersionDto);
    }
    async findAllForContent(contentType, contentId, queryDto) {
        return this.contentVersionsService.findAllForContent(contentType, contentId, queryDto);
    }
    async findLatestVersion(contentType, contentId) {
        return this.contentVersionsService.findLatestVersion(contentType, contentId);
    }
    async findByVersionNumber(contentType, contentId, versionNumber) {
        return this.contentVersionsService.findByVersionNumber(contentType, contentId, parseInt(versionNumber, 10));
    }
    async compareVersions(contentType, contentId, versionA, versionB) {
        return this.contentVersionsService.compareVersions(contentType, contentId, parseInt(versionA, 10), parseInt(versionB, 10));
    }
    async getRestoreData(contentType, contentId, versionNumber) {
        return this.contentVersionsService.getRestoreData(contentType, contentId, parseInt(versionNumber, 10));
    }
    async pruneOldVersions(contentType, contentId, keepCount) {
        return this.contentVersionsService.pruneOldVersions(contentType, contentId, keepCount ? parseInt(keepCount, 10) : 10);
    }
};
exports.ContentVersionsController = ContentVersionsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN, prisma_types_1.UserRole.MODERATOR),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new content version' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Version created successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Version already exists' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Content not found' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateContentVersionDto]),
    __metadata("design:returntype", Promise)
], ContentVersionsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':contentType/:contentId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all versions for a piece of content' }),
    (0, swagger_1.ApiParam)({
        name: 'contentType',
        enum: dto_1.VersionableType,
        description: 'Type of content',
    }),
    (0, swagger_1.ApiParam)({ name: 'contentId', description: 'ID of the content' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Versions retrieved successfully',
    }),
    __param(0, (0, common_1.Param)('contentType')),
    __param(1, (0, common_1.Param)('contentId')),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, dto_1.QueryContentVersionDto]),
    __metadata("design:returntype", Promise)
], ContentVersionsController.prototype, "findAllForContent", null);
__decorate([
    (0, common_1.Get)(':contentType/:contentId/latest'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get the latest version for a piece of content' }),
    (0, swagger_1.ApiParam)({
        name: 'contentType',
        enum: dto_1.VersionableType,
        description: 'Type of content',
    }),
    (0, swagger_1.ApiParam)({ name: 'contentId', description: 'ID of the content' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Latest version retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No versions found' }),
    __param(0, (0, common_1.Param)('contentType')),
    __param(1, (0, common_1.Param)('contentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ContentVersionsController.prototype, "findLatestVersion", null);
__decorate([
    (0, common_1.Get)(':contentType/:contentId/:versionNumber'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a specific version by number' }),
    (0, swagger_1.ApiParam)({
        name: 'contentType',
        enum: dto_1.VersionableType,
        description: 'Type of content',
    }),
    (0, swagger_1.ApiParam)({ name: 'contentId', description: 'ID of the content' }),
    (0, swagger_1.ApiParam)({ name: 'versionNumber', description: 'Version number' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Version retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Version not found' }),
    __param(0, (0, common_1.Param)('contentType')),
    __param(1, (0, common_1.Param)('contentId')),
    __param(2, (0, common_1.Param)('versionNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ContentVersionsController.prototype, "findByVersionNumber", null);
__decorate([
    (0, common_1.Get)(':contentType/:contentId/compare/:versionA/:versionB'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Compare two versions' }),
    (0, swagger_1.ApiParam)({
        name: 'contentType',
        enum: dto_1.VersionableType,
        description: 'Type of content',
    }),
    (0, swagger_1.ApiParam)({ name: 'contentId', description: 'ID of the content' }),
    (0, swagger_1.ApiParam)({ name: 'versionA', description: 'First version number' }),
    (0, swagger_1.ApiParam)({ name: 'versionB', description: 'Second version number' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Versions compared successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Version not found' }),
    __param(0, (0, common_1.Param)('contentType')),
    __param(1, (0, common_1.Param)('contentId')),
    __param(2, (0, common_1.Param)('versionA')),
    __param(3, (0, common_1.Param)('versionB')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ContentVersionsController.prototype, "compareVersions", null);
__decorate([
    (0, common_1.Get)(':contentType/:contentId/restore/:versionNumber'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN, prisma_types_1.UserRole.MODERATOR),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get data to restore content to a specific version' }),
    (0, swagger_1.ApiParam)({
        name: 'contentType',
        enum: dto_1.VersionableType,
        description: 'Type of content',
    }),
    (0, swagger_1.ApiParam)({ name: 'contentId', description: 'ID of the content' }),
    (0, swagger_1.ApiParam)({ name: 'versionNumber', description: 'Version number to restore' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Restore data retrieved successfully',
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Version not found' }),
    __param(0, (0, common_1.Param)('contentType')),
    __param(1, (0, common_1.Param)('contentId')),
    __param(2, (0, common_1.Param)('versionNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ContentVersionsController.prototype, "getRestoreData", null);
__decorate([
    (0, common_1.Delete)(':contentType/:contentId/prune'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Prune old versions (keep only latest N)' }),
    (0, swagger_1.ApiParam)({
        name: 'contentType',
        enum: dto_1.VersionableType,
        description: 'Type of content',
    }),
    (0, swagger_1.ApiParam)({ name: 'contentId', description: 'ID of the content' }),
    (0, swagger_1.ApiQuery)({
        name: 'keepCount',
        required: false,
        description: 'Number of versions to keep (default: 10)',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Old versions pruned successfully',
    }),
    __param(0, (0, common_1.Param)('contentType')),
    __param(1, (0, common_1.Param)('contentId')),
    __param(2, (0, common_1.Query)('keepCount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ContentVersionsController.prototype, "pruneOldVersions", null);
exports.ContentVersionsController = ContentVersionsController = __decorate([
    (0, swagger_1.ApiTags)('Content Versions'),
    (0, common_1.Controller)('content-versions'),
    __metadata("design:paramtypes", [content_versions_service_1.ContentVersionsService])
], ContentVersionsController);
//# sourceMappingURL=content-versions.controller.js.map