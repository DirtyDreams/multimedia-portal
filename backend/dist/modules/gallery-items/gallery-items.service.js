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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryItemsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const file_upload_service_1 = require("./file-upload.service");
let GalleryItemsService = class GalleryItemsService {
    prisma;
    fileUploadService;
    constructor(prisma, fileUploadService) {
        this.prisma = prisma;
        this.fileUploadService = fileUploadService;
    }
    async create(userId, createGalleryItemDto, file) {
        const { categoryIds, tagIds, ...galleryItemData } = createGalleryItemDto;
        this.fileUploadService.validateFileSize(file);
        await this.fileUploadService.validateImageDimensions(file.buffer);
        const processedImage = await this.fileUploadService.processImage(file);
        const slug = this.generateSlug(galleryItemData.title);
        const existingGalleryItem = await this.prisma.galleryItem.findUnique({
            where: { slug },
        });
        if (existingGalleryItem) {
            throw new common_1.ConflictException(`Gallery item with slug "${slug}" already exists`);
        }
        const author = await this.prisma.author.findUnique({
            where: { id: galleryItemData.authorId },
        });
        if (!author) {
            throw new common_1.NotFoundException(`Author with ID "${galleryItemData.authorId}" not found`);
        }
        const publishedAt = galleryItemData.status === 'PUBLISHED' ? new Date() : null;
        const galleryItem = await this.prisma.galleryItem.create({
            data: {
                ...galleryItemData,
                slug,
                userId,
                fileUrl: processedImage.large,
                fileType: processedImage.fileType,
                thumbnail: processedImage.thumbnail,
                publishedAt,
                categories: categoryIds
                    ? {
                        create: categoryIds.map((categoryId) => ({
                            category: { connect: { id: categoryId } },
                        })),
                    }
                    : undefined,
                tags: tagIds
                    ? {
                        create: tagIds.map((tagId) => ({
                            tag: { connect: { id: tagId } },
                        })),
                    }
                    : undefined,
            },
            include: {
                author: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        name: true,
                    },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });
        return this.formatGalleryItemResponse(galleryItem, processedImage);
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, search, status, authorId, fileType, category, tag, sortBy = 'createdAt', sortOrder = 'desc', } = queryDto;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status) {
            where.status = status;
        }
        if (authorId) {
            where.authorId = authorId;
        }
        if (fileType) {
            where.fileType = fileType;
        }
        if (category) {
            where.categories = {
                some: {
                    category: {
                        slug: category,
                    },
                },
            };
        }
        if (tag) {
            where.tags = {
                some: {
                    tag: {
                        slug: tag,
                    },
                },
            };
        }
        const [galleryItems, total] = await Promise.all([
            this.prisma.galleryItem.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    author: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            username: true,
                            name: true,
                        },
                    },
                    categories: {
                        include: {
                            category: true,
                        },
                    },
                    tags: {
                        include: {
                            tag: true,
                        },
                    },
                    _count: {
                        select: {
                            comments: true,
                            ratings: true,
                        },
                    },
                },
            }),
            this.prisma.galleryItem.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: galleryItems.map((item) => this.formatGalleryItemResponse(item)),
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
    async findOne(id) {
        const galleryItem = await this.prisma.galleryItem.findUnique({
            where: { id },
            include: {
                author: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        name: true,
                    },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
                tags: {
                    include: {
                        tag: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                        ratings: true,
                    },
                },
            },
        });
        if (!galleryItem) {
            throw new common_1.NotFoundException(`Gallery item with ID "${id}" not found`);
        }
        return this.formatGalleryItemResponse(galleryItem);
    }
    async findBySlug(slug) {
        const galleryItem = await this.prisma.galleryItem.findUnique({
            where: { slug },
            include: {
                author: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        name: true,
                    },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
                tags: {
                    include: {
                        tag: true,
                    },
                },
                _count: {
                    select: {
                        comments: true,
                        ratings: true,
                    },
                },
            },
        });
        if (!galleryItem) {
            throw new common_1.NotFoundException(`Gallery item with slug "${slug}" not found`);
        }
        return this.formatGalleryItemResponse(galleryItem);
    }
    async update(id, updateGalleryItemDto) {
        const existingGalleryItem = await this.prisma.galleryItem.findUnique({
            where: { id },
        });
        if (!existingGalleryItem) {
            throw new common_1.NotFoundException(`Gallery item with ID "${id}" not found`);
        }
        const { categoryIds, tagIds, title, ...galleryItemData } = updateGalleryItemDto;
        let slug = existingGalleryItem.slug;
        if (title && title !== existingGalleryItem.title) {
            slug = this.generateSlug(title);
            const slugConflict = await this.prisma.galleryItem.findFirst({
                where: {
                    slug,
                    NOT: { id },
                },
            });
            if (slugConflict) {
                throw new common_1.ConflictException(`Gallery item with slug "${slug}" already exists`);
            }
        }
        let publishedAt = existingGalleryItem.publishedAt;
        if (galleryItemData.status === 'PUBLISHED' && !existingGalleryItem.publishedAt) {
            publishedAt = new Date();
        }
        const galleryItem = await this.prisma.galleryItem.update({
            where: { id },
            data: {
                ...galleryItemData,
                title,
                slug,
                publishedAt,
                ...(categoryIds !== undefined && {
                    categories: {
                        deleteMany: {},
                        create: categoryIds.map((categoryId) => ({
                            category: { connect: { id: categoryId } },
                        })),
                    },
                }),
                ...(tagIds !== undefined && {
                    tags: {
                        deleteMany: {},
                        create: tagIds.map((tagId) => ({
                            tag: { connect: { id: tagId } },
                        })),
                    },
                }),
            },
            include: {
                author: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        username: true,
                        name: true,
                    },
                },
                categories: {
                    include: {
                        category: true,
                    },
                },
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });
        return this.formatGalleryItemResponse(galleryItem);
    }
    async remove(id) {
        const galleryItem = await this.prisma.galleryItem.findUnique({
            where: { id },
        });
        if (!galleryItem) {
            throw new common_1.NotFoundException(`Gallery item with ID "${id}" not found`);
        }
        await this.fileUploadService.deleteFiles(galleryItem.fileUrl);
        await this.prisma.galleryItem.delete({
            where: { id },
        });
        return { message: 'Gallery item deleted successfully' };
    }
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    formatGalleryItemResponse(galleryItem, processedImage) {
        const formatted = {
            ...galleryItem,
            categories: galleryItem.categories?.map((gc) => gc.category) || [],
            tags: galleryItem.tags?.map((gt) => gt.tag) || [],
            commentsCount: galleryItem._count?.comments || 0,
            ratingsCount: galleryItem._count?.ratings || 0,
        };
        if (processedImage) {
            formatted.images = {
                original: processedImage.original,
                large: processedImage.large,
                medium: processedImage.medium,
                thumbnail: processedImage.thumbnail,
            };
        }
        return formatted;
    }
};
exports.GalleryItemsService = GalleryItemsService;
exports.GalleryItemsService = GalleryItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        file_upload_service_1.FileUploadService])
], GalleryItemsService);
//# sourceMappingURL=gallery-items.service.js.map