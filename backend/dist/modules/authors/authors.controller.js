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
exports.AuthorsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const authors_service_1 = require("./authors.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const prisma_types_1 = require("../../types/prisma.types");
const file_upload_service_1 = require("../gallery-items/file-upload.service");
let AuthorsController = class AuthorsController {
    authorsService;
    fileUploadService;
    constructor(authorsService, fileUploadService) {
        this.authorsService = authorsService;
        this.fileUploadService = fileUploadService;
    }
    async create(createAuthorDto) {
        return this.authorsService.create(createAuthorDto);
    }
    async uploadProfileImage(file) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        const processedImage = await this.fileUploadService.processImage(file);
        return {
            profileImageUrl: processedImage.original,
            thumbnailUrl: processedImage.thumbnail,
        };
    }
    async findAll(queryDto) {
        return this.authorsService.findAll(queryDto);
    }
    async findOne(identifier) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(identifier)) {
            return this.authorsService.findOne(identifier);
        }
        else {
            return this.authorsService.findBySlug(identifier);
        }
    }
    async getAuthorContent(id, contentType, page, limit) {
        return this.authorsService.getAuthorContent(id, contentType, page, limit);
    }
    async update(id, updateAuthorDto) {
        return this.authorsService.update(id, updateAuthorDto);
    }
    async remove(id) {
        return this.authorsService.remove(id);
    }
};
exports.AuthorsController = AuthorsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN, prisma_types_1.UserRole.MODERATOR),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new author (Admin/Moderator only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Author created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Author with this slug already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateAuthorDto]),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('upload-profile-image'),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN, prisma_types_1.UserRole.MODERATOR),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Upload author profile image (Admin/Moderator only)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile image uploaded successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid file' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.startsWith('image/')) {
                return callback(new common_1.BadRequestException('Only image files are allowed'), false);
            }
            callback(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "uploadProfileImage", null);
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all authors with pagination and filtering' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Authors retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryAuthorDto]),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':identifier'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get an author by ID or slug' }),
    (0, swagger_1.ApiParam)({
        name: 'identifier',
        description: 'Author UUID or slug',
        example: '123e4567-e89b-12d3-a456-426614174000 or john-doe',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Author retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Author not found' }),
    __param(0, (0, common_1.Param)('identifier')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/content/:contentType'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get author content by type (articles, blogPosts, etc.)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Author UUID' }),
    (0, swagger_1.ApiParam)({
        name: 'contentType',
        description: 'Content type',
        enum: ['articles', 'blogPosts', 'wikiPages', 'galleryItems', 'stories'],
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Content retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Author not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Param)('contentType')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "getAuthorContent", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN, prisma_types_1.UserRole.MODERATOR),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update an author (Admin/Moderator only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Author UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Author updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid input data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Author not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Author with this slug already exists' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateAuthorDto]),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an author (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Author UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Author deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden - insufficient permissions' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Author not found' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthorsController.prototype, "remove", null);
exports.AuthorsController = AuthorsController = __decorate([
    (0, swagger_1.ApiTags)('authors'),
    (0, common_1.Controller)('authors'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [authors_service_1.AuthorsService,
        file_upload_service_1.FileUploadService])
], AuthorsController);
//# sourceMappingURL=authors.controller.js.map