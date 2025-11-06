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
exports.BlogPostsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const blog_posts_service_1 = require("./blog-posts.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const prisma_types_1 = require("../../types/prisma.types");
let BlogPostsController = class BlogPostsController {
    blogPostsService;
    constructor(blogPostsService) {
        this.blogPostsService = blogPostsService;
    }
    async create(userId, createBlogPostDto) {
        return this.blogPostsService.create(userId, createBlogPostDto);
    }
    async findAll(queryDto) {
        return this.blogPostsService.findAll(queryDto);
    }
    async findOne(identifier) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        if (isUUID) {
            return this.blogPostsService.findOne(identifier);
        }
        return this.blogPostsService.findBySlug(identifier);
    }
    async update(id, updateBlogPostDto) {
        return this.blogPostsService.update(id, updateBlogPostDto);
    }
    async remove(id) {
        return this.blogPostsService.remove(id);
    }
};
exports.BlogPostsController = BlogPostsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN, prisma_types_1.UserRole.MODERATOR),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new blog post (Admin/Moderator only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Blog post created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Blog post with this slug already exists' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.CreateBlogPostDto]),
    __metadata("design:returntype", Promise)
], BlogPostsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all blog posts with pagination and filtering' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Blog posts retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryBlogPostDto]),
    __metadata("design:returntype", Promise)
], BlogPostsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':identifier'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single blog post by ID or slug' }),
    (0, swagger_1.ApiParam)({ name: 'identifier', description: 'Blog post ID or slug' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Blog post retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Blog post not found' }),
    __param(0, (0, common_1.Param)('identifier')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BlogPostsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN, prisma_types_1.UserRole.MODERATOR),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a blog post (Admin/Moderator only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Blog post ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Blog post updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Blog post not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Blog post with this slug already exists' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateBlogPostDto]),
    __metadata("design:returntype", Promise)
], BlogPostsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a blog post (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Blog post ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Blog post deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Blog post not found' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BlogPostsController.prototype, "remove", null);
exports.BlogPostsController = BlogPostsController = __decorate([
    (0, swagger_1.ApiTags)('blog'),
    (0, common_1.Controller)('blog'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [blog_posts_service_1.BlogPostsService])
], BlogPostsController);
//# sourceMappingURL=blog-posts.controller.js.map