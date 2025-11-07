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
exports.ArticlesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_constants_1 = require("../../common/constants/pagination.constants");
let ArticlesService = class ArticlesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createArticleDto) {
        const { categoryIds, tagIds, ...articleData } = createArticleDto;
        const slug = this.generateSlug(articleData.title);
        return this.prisma.$transaction(async (tx) => {
            const existingArticle = await tx.article.findUnique({
                where: { slug },
            });
            if (existingArticle) {
                throw new common_1.ConflictException(`Article with slug "${slug}" already exists`);
            }
            const author = await tx.author.findUnique({
                where: { id: articleData.authorId },
            });
            if (!author) {
                throw new common_1.NotFoundException(`Author with ID "${articleData.authorId}" not found`);
            }
            const publishedAt = articleData.status === 'PUBLISHED' ? new Date() : null;
            const article = await tx.article.create({
                data: {
                    ...articleData,
                    slug,
                    userId,
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
            return this.formatArticleResponse(article);
        });
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, search, status, authorId, category, tag, sortBy = 'createdAt', sortOrder = 'desc' } = queryDto;
        const safeLimit = (0, pagination_constants_1.enforcePaginationLimit)(limit);
        const skip = (page - 1) * safeLimit;
        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
                { excerpt: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status) {
            where.status = status;
        }
        if (authorId) {
            where.authorId = authorId;
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
        const [articles, total] = await Promise.all([
            this.prisma.article.findMany({
                where,
                skip,
                take: safeLimit,
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
            this.prisma.article.count({ where }),
        ]);
        const totalPages = Math.ceil(total / safeLimit);
        return {
            data: articles.map((article) => this.formatArticleResponse(article)),
            meta: {
                total,
                page,
                limit: safeLimit,
                totalPages,
            },
        };
    }
    async findOne(id) {
        const article = await this.prisma.article.findUnique({
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
        if (!article) {
            throw new common_1.NotFoundException(`Article with ID "${id}" not found`);
        }
        return this.formatArticleResponse(article);
    }
    async findBySlug(slug) {
        const article = await this.prisma.article.findUnique({
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
        if (!article) {
            throw new common_1.NotFoundException(`Article with slug "${slug}" not found`);
        }
        return this.formatArticleResponse(article);
    }
    async update(id, updateArticleDto) {
        return this.prisma.$transaction(async (tx) => {
            const existingArticle = await tx.article.findUnique({
                where: { id },
            });
            if (!existingArticle) {
                throw new common_1.NotFoundException(`Article with ID "${id}" not found`);
            }
            const { categoryIds, tagIds, title, ...articleData } = updateArticleDto;
            let slug = existingArticle.slug;
            if (title && title !== existingArticle.title) {
                slug = this.generateSlug(title);
                const slugConflict = await tx.article.findFirst({
                    where: {
                        slug,
                        NOT: { id },
                    },
                });
                if (slugConflict) {
                    throw new common_1.ConflictException(`Article with slug "${slug}" already exists`);
                }
            }
            let publishedAt = existingArticle.publishedAt;
            if (articleData.status === 'PUBLISHED' && !existingArticle.publishedAt) {
                publishedAt = new Date();
            }
            const article = await tx.article.update({
                where: { id },
                data: {
                    ...articleData,
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
            return this.formatArticleResponse(article);
        });
    }
    async remove(id) {
        const article = await this.prisma.article.findUnique({
            where: { id },
        });
        if (!article) {
            throw new common_1.NotFoundException(`Article with ID "${id}" not found`);
        }
        await this.prisma.article.delete({
            where: { id },
        });
        return { message: 'Article deleted successfully' };
    }
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    formatArticleResponse(article) {
        return {
            ...article,
            categories: article.categories?.map((ac) => ac.category) || [],
            tags: article.tags?.map((at) => at.tag) || [],
            commentsCount: article._count?.comments || 0,
            ratingsCount: article._count?.ratings || 0,
        };
    }
};
exports.ArticlesService = ArticlesService;
exports.ArticlesService = ArticlesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ArticlesService);
//# sourceMappingURL=articles.service.js.map