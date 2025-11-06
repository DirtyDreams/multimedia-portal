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
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const dto_1 = require("./dto");
let CommentsService = class CommentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createCommentDto) {
        const { contentType, contentId, parentId, content } = createCommentDto;
        await this.verifyContentExists(contentType, contentId);
        if (parentId) {
            const parentComment = await this.prisma.comment.findUnique({
                where: { id: parentId },
            });
            if (!parentComment) {
                throw new common_1.NotFoundException(`Parent comment with ID "${parentId}" not found`);
            }
            if (parentComment.contentType !== contentType ||
                parentComment.contentId !== contentId) {
                throw new common_1.BadRequestException('Parent comment must be for the same content');
            }
        }
        const contentForeignKey = this.getContentForeignKey(contentType);
        const comment = await this.prisma.comment.create({
            data: {
                content,
                contentType,
                contentId,
                parentId,
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
                replies: {
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
                        createdAt: 'asc',
                    },
                },
            },
        });
        return this.formatCommentResponse(comment);
    }
    async findAll(queryDto) {
        const { page = 1, limit = 20, contentType, contentId, userId, sortBy = 'createdAt', sortOrder = 'desc', } = queryDto;
        const skip = (page - 1) * limit;
        const where = {
            parentId: null,
        };
        if (contentType) {
            where.contentType = contentType;
        }
        if (contentId) {
            where.contentId = contentId;
        }
        if (userId) {
            where.userId = userId;
        }
        const [comments, total] = await Promise.all([
            this.prisma.comment.findMany({
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
                    replies: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    name: true,
                                },
                            },
                            replies: {
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
                                    createdAt: 'asc',
                                },
                            },
                        },
                        orderBy: {
                            createdAt: 'asc',
                        },
                    },
                },
            }),
            this.prisma.comment.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: comments.map((comment) => this.formatCommentResponse(comment)),
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
    async getContentComments(contentType, contentId) {
        await this.verifyContentExists(contentType, contentId);
        const comments = await this.prisma.comment.findMany({
            where: {
                contentType,
                contentId,
                parentId: null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                    },
                },
                replies: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                name: true,
                            },
                        },
                        replies: {
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
                                createdAt: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return comments.map((comment) => this.formatCommentResponse(comment));
    }
    async findOne(id) {
        const comment = await this.prisma.comment.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                    },
                },
                replies: {
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
                        createdAt: 'asc',
                    },
                },
            },
        });
        if (!comment) {
            throw new common_1.NotFoundException(`Comment with ID "${id}" not found`);
        }
        return this.formatCommentResponse(comment);
    }
    async update(id, userId, updateCommentDto) {
        const existingComment = await this.prisma.comment.findUnique({
            where: { id },
        });
        if (!existingComment) {
            throw new common_1.NotFoundException(`Comment with ID "${id}" not found`);
        }
        if (existingComment.userId !== userId) {
            throw new common_1.ForbiddenException('You can only edit your own comments');
        }
        const comment = await this.prisma.comment.update({
            where: { id },
            data: {
                content: updateCommentDto.content,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                    },
                },
                replies: {
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
                        createdAt: 'asc',
                    },
                },
            },
        });
        return this.formatCommentResponse(comment);
    }
    async remove(id, userId, isAdmin) {
        const comment = await this.prisma.comment.findUnique({
            where: { id },
        });
        if (!comment) {
            throw new common_1.NotFoundException(`Comment with ID "${id}" not found`);
        }
        if (!isAdmin && comment.userId !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own comments');
        }
        await this.prisma.comment.delete({
            where: { id },
        });
        return { message: 'Comment deleted successfully' };
    }
    async getCommentCount(contentType, contentId) {
        const count = await this.prisma.comment.count({
            where: {
                contentType,
                contentId,
            },
        });
        return { count };
    }
    async verifyContentExists(contentType, contentId) {
        let content = null;
        switch (contentType) {
            case dto_1.CommentableType.ARTICLE:
                content = await this.prisma.article.findUnique({
                    where: { id: contentId },
                });
                break;
            case dto_1.CommentableType.BLOG_POST:
                content = await this.prisma.blogPost.findUnique({
                    where: { id: contentId },
                });
                break;
            case dto_1.CommentableType.WIKI_PAGE:
                content = await this.prisma.wikiPage.findUnique({
                    where: { id: contentId },
                });
                break;
            case dto_1.CommentableType.GALLERY_ITEM:
                content = await this.prisma.galleryItem.findUnique({
                    where: { id: contentId },
                });
                break;
            case dto_1.CommentableType.STORY:
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
            [dto_1.CommentableType.ARTICLE]: 'articleId',
            [dto_1.CommentableType.BLOG_POST]: 'blogPostId',
            [dto_1.CommentableType.WIKI_PAGE]: 'wikiPageId',
            [dto_1.CommentableType.GALLERY_ITEM]: 'galleryItemId',
            [dto_1.CommentableType.STORY]: 'storyId',
        };
        return foreignKeyMap[contentType];
    }
    formatCommentResponse(comment) {
        return {
            ...comment,
            repliesCount: comment.replies?.length || 0,
            replies: comment.replies?.map((reply) => ({
                ...reply,
                repliesCount: reply.replies?.length || 0,
            })),
        };
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CommentsService);
//# sourceMappingURL=comments.service.js.map