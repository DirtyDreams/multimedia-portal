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
exports.GalleryItemsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const gallery_items_service_1 = require("./gallery-items.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const prisma_types_1 = require("../../types/prisma.types");
let GalleryItemsController = class GalleryItemsController {
    galleryItemsService;
    constructor(galleryItemsService) {
        this.galleryItemsService = galleryItemsService;
    }
    async upload(userId, file, createGalleryItemDto) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        if (typeof createGalleryItemDto.categoryIds === 'string') {
            createGalleryItemDto.categoryIds = JSON.parse(createGalleryItemDto.categoryIds);
        }
        if (typeof createGalleryItemDto.tagIds === 'string') {
            createGalleryItemDto.tagIds = JSON.parse(createGalleryItemDto.tagIds);
        }
        return this.galleryItemsService.create(userId, createGalleryItemDto, file);
    }
    async findAll(queryDto) {
        return this.galleryItemsService.findAll(queryDto);
    }
    async findOne(identifier) {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        if (isUUID) {
            return this.galleryItemsService.findOne(identifier);
        }
        return this.galleryItemsService.findBySlug(identifier);
    }
    async update(id, updateGalleryItemDto) {
        return this.galleryItemsService.update(id, updateGalleryItemDto);
    }
    async remove(id) {
        return this.galleryItemsService.remove(id);
    }
};
exports.GalleryItemsController = GalleryItemsController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN, prisma_types_1.UserRole.MODERATOR),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Upload and create a new gallery item (Admin/Moderator only)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file to upload',
                },
                title: {
                    type: 'string',
                    description: 'Gallery item title',
                },
                description: {
                    type: 'string',
                    description: 'Gallery item description (optional)',
                },
                status: {
                    type: 'string',
                    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
                    description: 'Gallery item status (optional)',
                },
                authorId: {
                    type: 'string',
                    description: 'Author ID',
                },
                categoryIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Category IDs (optional)',
                },
                tagIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Tag IDs (optional)',
                },
            },
            required: ['file', 'title', 'authorId'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Gallery item created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request - invalid file or data' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Gallery item with this slug already exists' }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.startsWith('image/')) {
                return callback(new common_1.BadRequestException('Only image files are allowed'), false);
            }
            callback(null, true);
        },
    })),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, current_user_decorator_1.CurrentUser)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, dto_1.CreateGalleryItemDto]),
    __metadata("design:returntype", Promise)
], GalleryItemsController.prototype, "upload", null);
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all gallery items with pagination and filtering' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Gallery items retrieved successfully' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.QueryGalleryItemDto]),
    __metadata("design:returntype", Promise)
], GalleryItemsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':identifier'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single gallery item by ID or slug' }),
    (0, swagger_1.ApiParam)({ name: 'identifier', description: 'Gallery item ID or slug' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Gallery item retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Gallery item not found' }),
    __param(0, (0, common_1.Param)('identifier')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GalleryItemsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN, prisma_types_1.UserRole.MODERATOR),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a gallery item (Admin/Moderator only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Gallery item ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Gallery item updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Gallery item not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Gallery item with this slug already exists' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateGalleryItemDto]),
    __metadata("design:returntype", Promise)
], GalleryItemsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(prisma_types_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a gallery item (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Gallery item ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Gallery item deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Gallery item not found' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GalleryItemsController.prototype, "remove", null);
exports.GalleryItemsController = GalleryItemsController = __decorate([
    (0, swagger_1.ApiTags)('gallery'),
    (0, common_1.Controller)('gallery'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [gallery_items_service_1.GalleryItemsService])
], GalleryItemsController);
//# sourceMappingURL=gallery-items.controller.js.map