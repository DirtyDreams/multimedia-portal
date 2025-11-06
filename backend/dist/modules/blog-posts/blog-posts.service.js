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
exports.BlogPostsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let BlogPostsService = class BlogPostsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createBlogPostDto) {
        const { categoryIds, tagIds, ...blogPostData } = createBlogPostDto;
        const slug = this.generateSlug(blogPostData.title);
        const existingBlogPost = await this.prisma.blogPost.findUnique({
            where: { slug },
        });
        if (existingBlogPost) {
            throw new common_1.ConflictException(`Blog post with slug "${slug}" already exists`);
        }
        const author = await this.prisma.author.findUnique({
            where: { id: blogPostData.authorId },
        });
        if (!author) {
            throw new common_1.NotFoundException(`Author with ID "${blogPostData.authorId}" not found`);
        }
        const publishedAt = blogPostData.status === 'PUBLISHED' ? new Date() : null;
        const blogPost = await this.prisma.blogPost.create({
            data: {
                ...blogPostData,
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
        return this.formatBlogPostResponse(blogPost);
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, search, status, authorId, category, tag, sortBy = 'createdAt', sortOrder = 'desc' } = queryDto;
        const skip = (page - 1) * limit;
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
        const [blogPosts, total] = await Promise.all([
            this.prisma.blogPost.findMany({
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
            this.prisma.blogPost.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: blogPosts.map((blogPost) => this.formatBlogPostResponse(blogPost)),
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
    async findOne(id) {
        const blogPost = await this.prisma.blogPost.findUnique({
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
        if (!blogPost) {
            throw new common_1.NotFoundException(`Blog post with ID "${id}" not found`);
        }
        return this.formatBlogPostResponse(blogPost);
    }
    async findBySlug(slug) {
        const blogPost = await this.prisma.blogPost.findUnique({
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
        if (!blogPost) {
            throw new common_1.NotFoundException(`Blog post with slug "${slug}" not found`);
        }
        return this.formatBlogPostResponse(blogPost);
    }
    async update(id, updateBlogPostDto) {
        const existingBlogPost = await this.prisma.blogPost.findUnique({
            where: { id },
        });
        if (!existingBlogPost) {
            throw new common_1.NotFoundException(`Blog post with ID "${id}" not found`);
        }
        const { categoryIds, tagIds, title, ...blogPostData } = updateBlogPostDto;
        let slug = existingBlogPost.slug;
        if (title && title !== existingBlogPost.title) {
            slug = this.generateSlug(title);
            const slugConflict = await this.prisma.blogPost.findFirst({
                where: {
                    slug,
                    NOT: { id },
                },
            });
            if (slugConflict) {
                throw new common_1.ConflictException(`Blog post with slug "${slug}" already exists`);
            }
        }
        let publishedAt = existingBlogPost.publishedAt;
        if (blogPostData.status === 'PUBLISHED' && !existingBlogPost.publishedAt) {
            publishedAt = new Date();
        }
        const blogPost = await this.prisma.blogPost.update({
            where: { id },
            data: {
                ...blogPostData,
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
        return this.formatBlogPostResponse(blogPost);
    }
    async remove(id) {
        const blogPost = await this.prisma.blogPost.findUnique({
            where: { id },
        });
        if (!blogPost) {
            throw new common_1.NotFoundException(`Blog post with ID "${id}" not found`);
        }
        await this.prisma.blogPost.delete({
            where: { id },
        });
        return { message: 'Blog post deleted successfully' };
    }
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    formatBlogPostResponse(blogPost) {
        return {
            ...blogPost,
            categories: blogPost.categories?.map((bc) => bc.category) || [],
            tags: blogPost.tags?.map((bt) => bt.tag) || [],
            commentsCount: blogPost._count?.comments || 0,
            ratingsCount: blogPost._count?.ratings || 0,
        };
    }
};
exports.BlogPostsService = BlogPostsService;
exports.BlogPostsService = BlogPostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BlogPostsService);
//# sourceMappingURL=blog-posts.service.js.map