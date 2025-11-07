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
exports.WikiPagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_constants_1 = require("../../common/constants/pagination.constants");
let WikiPagesService = class WikiPagesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createWikiPageDto) {
        const { categoryIds, tagIds, parentId, ...wikiPageData } = createWikiPageDto;
        const slug = this.generateSlug(wikiPageData.title);
        return this.prisma.$transaction(async (tx) => {
            const existingWikiPage = await tx.wikiPage.findUnique({
                where: { slug },
            });
            if (existingWikiPage) {
                throw new common_1.ConflictException(`Wiki page with slug "${slug}" already exists`);
            }
            const author = await tx.author.findUnique({
                where: { id: wikiPageData.authorId },
            });
            if (!author) {
                throw new common_1.NotFoundException(`Author with ID "${wikiPageData.authorId}" not found`);
            }
            if (parentId) {
                const parent = await tx.wikiPage.findUnique({
                    where: { id: parentId },
                });
                if (!parent) {
                    throw new common_1.NotFoundException(`Parent wiki page with ID "${parentId}" not found`);
                }
            }
            const publishedAt = wikiPageData.status === 'PUBLISHED' ? new Date() : null;
            const wikiPage = await tx.wikiPage.create({
                data: {
                    ...wikiPageData,
                    slug,
                    userId,
                    parentId,
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
                    parent: true,
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
            return this.formatWikiPageResponse(wikiPage);
        });
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, search, status, authorId, parentId, category, tag, includeChildren = false, sortBy = 'createdAt', sortOrder = 'desc', } = queryDto;
        const safeLimit = (0, pagination_constants_1.enforcePaginationLimit)(limit);
        const skip = (page - 1) * safeLimit;
        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status) {
            where.status = status;
        }
        if (authorId) {
            where.authorId = authorId;
        }
        if (parentId !== undefined) {
            where.parentId = parentId === 'null' ? null : parentId;
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
        const [wikiPages, total] = await Promise.all([
            this.prisma.wikiPage.findMany({
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
                    parent: true,
                    children: includeChildren,
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
                            children: true,
                            comments: true,
                            ratings: true,
                        },
                    },
                },
            }),
            this.prisma.wikiPage.count({ where }),
        ]);
        const totalPages = Math.ceil(total / safeLimit);
        return {
            data: wikiPages.map((wikiPage) => this.formatWikiPageResponse(wikiPage)),
            meta: {
                total,
                page,
                limit: safeLimit,
                totalPages,
            },
        };
    }
    async getTree() {
        const rootPages = await this.prisma.wikiPage.findMany({
            where: { parentId: null, status: 'PUBLISHED' },
            orderBy: { title: 'asc' },
            include: {
                author: true,
                _count: {
                    select: {
                        children: true,
                    },
                },
            },
        });
        const tree = await Promise.all(rootPages.map((page) => this.buildTreeRecursive(page)));
        return tree;
    }
    async getChildren(parentId) {
        const children = await this.prisma.wikiPage.findMany({
            where: { parentId },
            orderBy: { title: 'asc' },
            include: {
                author: true,
                _count: {
                    select: {
                        children: true,
                        comments: true,
                        ratings: true,
                    },
                },
            },
        });
        return children.map((child) => this.formatWikiPageResponse(child));
    }
    async getBreadcrumbs(id) {
        const breadcrumbs = [];
        let currentPage = await this.prisma.wikiPage.findUnique({
            where: { id },
            select: { id: true, title: true, slug: true, parentId: true },
        });
        if (!currentPage) {
            throw new common_1.NotFoundException(`Wiki page with ID "${id}" not found`);
        }
        while (currentPage) {
            breadcrumbs.unshift({
                id: currentPage.id,
                title: currentPage.title,
                slug: currentPage.slug,
            });
            if (currentPage.parentId) {
                currentPage = await this.prisma.wikiPage.findUnique({
                    where: { id: currentPage.parentId },
                    select: { id: true, title: true, slug: true, parentId: true },
                });
            }
            else {
                currentPage = null;
            }
        }
        return breadcrumbs;
    }
    async findOne(id) {
        const wikiPage = await this.prisma.wikiPage.findUnique({
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
                parent: true,
                children: {
                    orderBy: { title: 'asc' },
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
                        children: true,
                        comments: true,
                        ratings: true,
                    },
                },
            },
        });
        if (!wikiPage) {
            throw new common_1.NotFoundException(`Wiki page with ID "${id}" not found`);
        }
        return this.formatWikiPageResponse(wikiPage);
    }
    async findBySlug(slug) {
        const wikiPage = await this.prisma.wikiPage.findUnique({
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
                parent: true,
                children: {
                    orderBy: { title: 'asc' },
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
                        children: true,
                        comments: true,
                        ratings: true,
                    },
                },
            },
        });
        if (!wikiPage) {
            throw new common_1.NotFoundException(`Wiki page with slug "${slug}" not found`);
        }
        return this.formatWikiPageResponse(wikiPage);
    }
    async update(id, updateWikiPageDto) {
        return this.prisma.$transaction(async (tx) => {
            const existingWikiPage = await tx.wikiPage.findUnique({
                where: { id },
            });
            if (!existingWikiPage) {
                throw new common_1.NotFoundException(`Wiki page with ID "${id}" not found`);
            }
            const { categoryIds, tagIds, title, parentId, ...wikiPageData } = updateWikiPageDto;
            if (parentId && parentId === id) {
                throw new common_1.BadRequestException('Wiki page cannot be its own parent');
            }
            if (parentId) {
                const wouldCreateCycle = await this.wouldCreateCircularReference(id, parentId, tx);
                if (wouldCreateCycle) {
                    throw new common_1.BadRequestException('Cannot set parent: would create circular reference');
                }
            }
            let slug = existingWikiPage.slug;
            if (title && title !== existingWikiPage.title) {
                slug = this.generateSlug(title);
                const slugConflict = await tx.wikiPage.findFirst({
                    where: {
                        slug,
                        NOT: { id },
                    },
                });
                if (slugConflict) {
                    throw new common_1.ConflictException(`Wiki page with slug "${slug}" already exists`);
                }
            }
            let publishedAt = existingWikiPage.publishedAt;
            if (wikiPageData.status === 'PUBLISHED' && !existingWikiPage.publishedAt) {
                publishedAt = new Date();
            }
            const wikiPage = await tx.wikiPage.update({
                where: { id },
                data: {
                    ...wikiPageData,
                    title,
                    slug,
                    publishedAt,
                    ...(parentId !== undefined && { parentId }),
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
                    parent: true,
                    children: true,
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
            return this.formatWikiPageResponse(wikiPage);
        });
    }
    async remove(id) {
        const wikiPage = await this.prisma.wikiPage.findUnique({
            where: { id },
            include: {
                children: true,
            },
        });
        if (!wikiPage) {
            throw new common_1.NotFoundException(`Wiki page with ID "${id}" not found`);
        }
        if (wikiPage.children && wikiPage.children.length > 0) {
            throw new common_1.BadRequestException('Cannot delete wiki page with children. Please delete or move children first.');
        }
        await this.prisma.wikiPage.delete({
            where: { id },
        });
        return { message: 'Wiki page deleted successfully' };
    }
    async buildTreeRecursive(page, depth = 0, maxDepth = 5) {
        if (depth >= maxDepth) {
            return {
                ...page,
                children: [],
                hasMoreChildren: page._count?.children > 0,
            };
        }
        const children = await this.prisma.wikiPage.findMany({
            where: { parentId: page.id, status: 'PUBLISHED' },
            orderBy: { title: 'asc' },
            include: {
                author: true,
                _count: {
                    select: {
                        children: true,
                    },
                },
            },
        });
        const childrenWithSubtree = await Promise.all(children.map((child) => this.buildTreeRecursive(child, depth + 1, maxDepth)));
        return {
            ...page,
            children: childrenWithSubtree,
        };
    }
    async wouldCreateCircularReference(pageId, newParentId, tx) {
        const prisma = tx || this.prisma;
        let currentParentId = newParentId;
        while (currentParentId) {
            if (currentParentId === pageId) {
                return true;
            }
            const parent = await prisma.wikiPage.findUnique({
                where: { id: currentParentId },
                select: { parentId: true },
            });
            currentParentId = parent?.parentId || null;
        }
        return false;
    }
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    formatWikiPageResponse(wikiPage) {
        return {
            ...wikiPage,
            categories: wikiPage.categories?.map((wc) => wc.category) || [],
            tags: wikiPage.tags?.map((wt) => wt.tag) || [],
            childrenCount: wikiPage._count?.children || 0,
            commentsCount: wikiPage._count?.comments || 0,
            ratingsCount: wikiPage._count?.ratings || 0,
        };
    }
};
exports.WikiPagesService = WikiPagesService;
exports.WikiPagesService = WikiPagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WikiPagesService);
//# sourceMappingURL=wiki-pages.service.js.map