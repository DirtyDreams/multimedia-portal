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
exports.StoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let StoriesService = class StoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createStoryDto) {
        const { categoryIds, tagIds, ...storyData } = createStoryDto;
        const slug = this.generateSlug(storyData.title);
        return this.prisma.$transaction(async (tx) => {
            const existingStory = await tx.story.findUnique({
                where: { slug },
            });
            if (existingStory) {
                throw new common_1.ConflictException(`Story with slug "${slug}" already exists`);
            }
            const author = await tx.author.findUnique({
                where: { id: storyData.authorId },
            });
            if (!author) {
                throw new common_1.NotFoundException(`Author with ID "${storyData.authorId}" not found`);
            }
            const publishedAt = storyData.status === 'PUBLISHED' ? new Date() : null;
            const story = await tx.story.create({
                data: {
                    ...storyData,
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
            return this.formatStoryResponse(story);
        });
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, search, status, authorId, series, category, tag, sortBy = 'createdAt', sortOrder = 'desc', } = queryDto;
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
        if (series) {
            where.series = series;
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
        const [stories, total] = await Promise.all([
            this.prisma.story.findMany({
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
            this.prisma.story.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: stories.map((story) => this.formatStoryResponse(story)),
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
    async getSeries() {
        const stories = await this.prisma.story.findMany({
            where: {
                series: { not: null },
                status: 'PUBLISHED',
            },
            select: {
                series: true,
            },
            distinct: ['series'],
            orderBy: {
                series: 'asc',
            },
        });
        return stories
            .map((s) => s.series)
            .filter((s) => s !== null);
    }
    async findOne(id) {
        const story = await this.prisma.story.findUnique({
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
        if (!story) {
            throw new common_1.NotFoundException(`Story with ID "${id}" not found`);
        }
        return this.formatStoryResponse(story);
    }
    async findBySlug(slug) {
        const story = await this.prisma.story.findUnique({
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
        if (!story) {
            throw new common_1.NotFoundException(`Story with slug "${slug}" not found`);
        }
        return this.formatStoryResponse(story);
    }
    async update(id, updateStoryDto) {
        return this.prisma.$transaction(async (tx) => {
            const existingStory = await tx.story.findUnique({
                where: { id },
            });
            if (!existingStory) {
                throw new common_1.NotFoundException(`Story with ID "${id}" not found`);
            }
            const { categoryIds, tagIds, title, ...storyData } = updateStoryDto;
            let slug = existingStory.slug;
            if (title && title !== existingStory.title) {
                slug = this.generateSlug(title);
                const slugConflict = await tx.story.findFirst({
                    where: {
                        slug,
                        NOT: { id },
                    },
                });
                if (slugConflict) {
                    throw new common_1.ConflictException(`Story with slug "${slug}" already exists`);
                }
            }
            let publishedAt = existingStory.publishedAt;
            if (storyData.status === 'PUBLISHED' && !existingStory.publishedAt) {
                publishedAt = new Date();
            }
            const story = await tx.story.update({
                where: { id },
                data: {
                    ...storyData,
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
            return this.formatStoryResponse(story);
        });
    }
    async remove(id) {
        const story = await this.prisma.story.findUnique({
            where: { id },
        });
        if (!story) {
            throw new common_1.NotFoundException(`Story with ID "${id}" not found`);
        }
        await this.prisma.story.delete({
            where: { id },
        });
        return { message: 'Story deleted successfully' };
    }
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    formatStoryResponse(story) {
        return {
            ...story,
            categories: story.categories?.map((sc) => sc.category) || [],
            tags: story.tags?.map((st) => st.tag) || [],
            commentsCount: story._count?.comments || 0,
            ratingsCount: story._count?.ratings || 0,
        };
    }
};
exports.StoriesService = StoriesService;
exports.StoriesService = StoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StoriesService);
//# sourceMappingURL=stories.service.js.map