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
exports.WikiPagesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const wiki_pages_service_1 = require("./wiki-pages.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const prisma_types_1 = require("../../types/prisma.types");
let WikiPagesController = class WikiPagesController {
    wikiPagesService;
    constructor(wikiPagesService) {
        this.wikiPagesService = wikiPagesService;
    }
    async create(userId, createWikiPageDto) {
        return this.wikiPagesService.create(userId, createWikiPageDto);
    }
    async findAll(queryDto) {
        return this.wikiPagesService.findAll(queryDto);
    }
    async getTree() {
        return this.wikiPagesService.getTree();
    }
    async getChildren(identifier) {
        return this.wikiPagesService.getChildren(identifier);
    }
    async getBreadcrumbs(identifier) {
        return this.wikiPagesService.getBreadcrumbs(identifier);
    }
    async findOne(identifier) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        if (isUUID) {
            return this.wikiPagesService.findOne(identifier);
        }
        return this.wikiPagesService.findBySlug(identifier);
    }
    async update(id, updateWikiPageDto) {
        return this.wikiPagesService.update(id, updateWikiPageDto);
    }
    async remove(id) {
        return this.wikiPagesService.remove(id);
    }
};
exports.WikiPagesController = WikiPagesController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN, prisma_types_1.UserRole.MODERATOR),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new wiki page (Admin/Moderator only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Wiki page created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Parent wiki page not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Wiki page with this slug already exists' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateWikiPageDto]),
    __metadata("design:returntype", Promise)
], WikiPagesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all wiki pages with pagination and filtering' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wiki pages retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryWikiPageDto]),
    __metadata("design:returntype", Promise)
], WikiPagesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('tree'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get wiki pages as hierarchical tree structure' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wiki tree retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WikiPagesController.prototype, "getTree", null);
__decorate([
    (0, common_1.Get)(':identifier/children'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get children of a specific wiki page' }),
    (0, swagger_1.ApiParam)({ name: 'identifier', description: 'Wiki page ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Children retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Wiki page not found' }),
    __param(0, (0, common_1.Param)('identifier')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WikiPagesController.prototype, "getChildren", null);
__decorate([
    (0, common_1.Get)(':identifier/breadcrumbs'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get breadcrumb path from root to wiki page' }),
    (0, swagger_1.ApiParam)({ name: 'identifier', description: 'Wiki page ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Breadcrumbs retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Wiki page not found' }),
    __param(0, (0, common_1.Param)('identifier')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WikiPagesController.prototype, "getBreadcrumbs", null);
__decorate([
    (0, common_1.Get)(':identifier'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single wiki page by ID or slug' }),
    (0, swagger_1.ApiParam)({ name: 'identifier', description: 'Wiki page ID or slug' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wiki page retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Wiki page not found' }),
    __param(0, (0, common_1.Param)('identifier')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WikiPagesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN, prisma_types_1.UserRole.MODERATOR),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a wiki page (Admin/Moderator only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Wiki page ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wiki page updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request or circular reference detected' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Wiki page not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Wiki page with this slug already exists' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateWikiPageDto]),
    __metadata("design:returntype", Promise)
], WikiPagesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a wiki page (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Wiki page ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wiki page deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cannot delete page with children' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Wiki page not found' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WikiPagesController.prototype, "remove", null);
exports.WikiPagesController = WikiPagesController = __decorate([
    (0, swagger_1.ApiTags)('wiki'),
    (0, common_1.Controller)('wiki'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [wiki_pages_service_1.WikiPagesService])
], WikiPagesController);
//# sourceMappingURL=wiki-pages.controller.js.map