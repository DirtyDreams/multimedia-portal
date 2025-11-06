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
exports.RatingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const dto_1 = require("./dto");
let RatingsService = class RatingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createRatingDto) {
        const { contentType, contentId, value } = createRatingDto;
        await this.verifyContentExists(contentType, contentId);
        const existingRating = await this.prisma.rating.findFirst({
            where: {
                userId,
                contentType,
                contentId,
            },
        });
        const contentForeignKey = this.getContentForeignKey(contentType);
        if (existingRating) {
            const rating = await this.prisma.rating.update({
                where: { id: existingRating.id },
                data: { value },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                        },
                    },
                },
            });
            return this.formatRatingResponse(rating);
        }
        const rating = await this.prisma.rating.create({
            data: {
                value,
                contentType,
                contentId,
                userId,
                [contentForeignKey]: contentId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                    },
                },
            },
        });
        return this.formatRatingResponse(rating);
    }
    async findAll(queryDto) {
        const { page = 1, limit = 20, contentType, contentId, userId, sortBy = 'createdAt', sortOrder = 'desc', } = queryDto;
        const skip = (page - 1) * limit;
        const where = {};
        if (contentType) {
            where.contentType = contentType;
        }
        if (contentId) {
            where.contentId = contentId;
        }
        if (userId) {
            where.userId = userId;
        }
        const [ratings, total] = await Promise.all([
            this.prisma.rating.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            name: true,
                        },
                    },
                },
            }),
            this.prisma.rating.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: ratings.map((rating) => this.formatRatingResponse(rating)),
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
    async getContentRatings(contentType, contentId) {
        await this.verifyContentExists(contentType, contentId);
        const ratings = await this.prisma.rating.findMany({
            where: {
                contentType,
                contentId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return ratings.map((rating) => this.formatRatingResponse(rating));
    }
    async getAverageRating(contentType, contentId) {
        await this.verifyContentExists(contentType, contentId);
        const result = await this.prisma.rating.aggregate({
            where: {
                contentType,
                contentId,
            },
            _avg: {
                value: true,
            },
            _count: {
                value: true,
            },
        });
        return {
            average: result._avg.value || 0,
            count: result._count.value,
        };
    }
    async getUserRating(userId, contentType, contentId) {
        const rating = await this.prisma.rating.findFirst({
            where: {
                userId,
                contentType,
                contentId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                    },
                },
            },
        });
        if (!rating) {
            return null;
        }
        return this.formatRatingResponse(rating);
    }
    async findOne(id) {
        const rating = await this.prisma.rating.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                    },
                },
            },
        });
        if (!rating) {
            throw new common_1.NotFoundException(`Rating with ID "${id}" not found`);
        }
        return this.formatRatingResponse(rating);
    }
    async update(id, userId, updateRatingDto) {
        const existingRating = await this.prisma.rating.findUnique({
            where: { id },
        });
        if (!existingRating) {
            throw new common_1.NotFoundException(`Rating with ID "${id}" not found`);
        }
        if (existingRating.userId !== userId) {
            throw new common_1.ForbiddenException('You can only edit your own ratings');
        }
        const rating = await this.prisma.rating.update({
            where: { id },
            data: {
                value: updateRatingDto.value,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                    },
                },
            },
        });
        return this.formatRatingResponse(rating);
    }
    async remove(id, userId, isAdmin) {
        const rating = await this.prisma.rating.findUnique({
            where: { id },
        });
        if (!rating) {
            throw new common_1.NotFoundException(`Rating with ID "${id}" not found`);
        }
        if (!isAdmin && rating.userId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own ratings');
        }
        await this.prisma.rating.delete({
            where: { id },
        });
        return { message: 'Rating deleted successfully' };
    }
    async verifyContentExists(contentType, contentId) {
        let content = null;
        switch (contentType) {
            case dto_1.RatableType.ARTICLE:
                content = await this.prisma.article.findUnique({
                    where: { id: contentId },
                });
                break;
            case dto_1.RatableType.BLOG_POST:
                content = await this.prisma.blogPost.findUnique({
                    where: { id: contentId },
                });
                break;
            case dto_1.RatableType.WIKI_PAGE:
                content = await this.prisma.wikiPage.findUnique({
                    where: { id: contentId },
                });
                break;
            case dto_1.RatableType.GALLERY_ITEM:
                content = await this.prisma.galleryItem.findUnique({
                    where: { id: contentId },
                });
                break;
            case dto_1.RatableType.STORY:
                content = await this.prisma.story.findUnique({
                    where: { id: contentId },
                });
                break;
            default:
                throw new common_1.BadRequestException(`Invalid content type: ${contentType}`);
        }
        if (!content) {
            throw new common_1.NotFoundException(`Content with ID "${contentId}" not found for type "${contentType}"`);
        }
    }
    getContentForeignKey(contentType) {
        const foreignKeyMap = {
            [dto_1.RatableType.ARTICLE]: 'articleId',
            [dto_1.RatableType.BLOG_POST]: 'blogPostId',
            [dto_1.RatableType.WIKI_PAGE]: 'wikiPageId',
            [dto_1.RatableType.GALLERY_ITEM]: 'galleryItemId',
            [dto_1.RatableType.STORY]: 'storyId',
        };
        return foreignKeyMap[contentType];
    }
    formatRatingResponse(rating) {
        return {
            ...rating,
        };
    }
};
exports.RatingsService = RatingsService;
exports.RatingsService = RatingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RatingsService);
//# sourceMappingURL=ratings.service.js.map