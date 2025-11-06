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
exports.AuthorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuthorsService = class AuthorsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createAuthorDto) {
        const { name, ...authorData } = createAuthorDto;
        const slug = this.generateSlug(name);
        const existingAuthor = await this.prisma.author.findUnique({
            where: { slug },
        });
        if (existingAuthor) {
            throw new common_1.ConflictException(`Author with slug "${slug}" already exists`);
        }
        const author = await this.prisma.author.create({
            data: {
                name,
                slug,
                ...authorData,
            },
        });
        return this.formatAuthorResponse(author);
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, search, sortBy = 'name', sortOrder = 'asc', } = queryDto;
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { bio: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [authors, total] = await Promise.all([
            this.prisma.author.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    _count: {
                        select: {
                            articles: true,
                            blogPosts: true,
                            wikiPages: true,
                            galleryItems: true,
                            stories: true,
                        },
                    },
                },
            }),
            this.prisma.author.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            data: authors.map((author) => this.formatAuthorResponse(author)),
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
    async findOne(id) {
        const author = await this.prisma.author.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        articles: true,
                        blogPosts: true,
                        wikiPages: true,
                        galleryItems: true,
                        stories: true,
                    },
                },
            },
        });
        if (!author) {
            throw new common_1.NotFoundException(`Author with ID "${id}" not found`);
        }
        return this.formatAuthorResponse(author);
    }
    async findBySlug(slug) {
        const author = await this.prisma.author.findUnique({
            where: { slug },
            include: {
                _count: {
                    select: {
                        articles: true,
                        blogPosts: true,
                        wikiPages: true,
                        galleryItems: true,
                        stories: true,
                    },
                },
            },
        });
        if (!author) {
            throw new common_1.NotFoundException(`Author with slug "${slug}" not found`);
        }
        return this.formatAuthorResponse(author);
    }
    async getAuthorContent(id, contentType, page = 1, limit = 10) {
        const author = await this.prisma.author.findUnique({
            where: { id },
        });
        if (!author) {
            throw new common_1.NotFoundException(`Author with ID "${id}" not found`);
        }
        const skip = (page - 1) * limit;
        let content = [];
        let total = 0;
        switch (contentType) {
            case 'articles':
                [content, total] = await Promise.all([
                    this.prisma.article.findMany({
                        where: { authorId: id, status: 'PUBLISHED' },
                        skip,
                        take: limit,
                        orderBy: { publishedAt: 'desc' },
                    }),
                    this.prisma.article.count({
                        where: { authorId: id, status: 'PUBLISHED' },
                    }),
                ]);
                break;
            case 'blogPosts':
                [content, total] = await Promise.all([
                    this.prisma.blogPost.findMany({
                        where: { authorId: id, status: 'PUBLISHED' },
                        skip,
                        take: limit,
                        orderBy: { publishedAt: 'desc' },
                    }),
                    this.prisma.blogPost.count({
                        where: { authorId: id, status: 'PUBLISHED' },
                    }),
                ]);
                break;
            case 'wikiPages':
                [content, total] = await Promise.all([
                    this.prisma.wikiPage.findMany({
                        where: { authorId: id, status: 'PUBLISHED' },
                        skip,
                        take: limit,
                        orderBy: { publishedAt: 'desc' },
                    }),
                    this.prisma.wikiPage.count({
                        where: { authorId: id, status: 'PUBLISHED' },
                    }),
                ]);
                break;
            case 'galleryItems':
                [content, total] = await Promise.all([
                    this.prisma.galleryItem.findMany({
                        where: { authorId: id, status: 'PUBLISHED' },
                        skip,
                        take: limit,
                        orderBy: { publishedAt: 'desc' },
                    }),
                    this.prisma.galleryItem.count({
                        where: { authorId: id, status: 'PUBLISHED' },
                    }),
                ]);
                break;
            case 'stories':
                [content, total] = await Promise.all([
                    this.prisma.story.findMany({
                        where: { authorId: id, status: 'PUBLISHED' },
                        skip,
                        take: limit,
                        orderBy: { publishedAt: 'desc' },
                    }),
                    this.prisma.story.count({
                        where: { authorId: id, status: 'PUBLISHED' },
                    }),
                ]);
                break;
            default:
                throw new common_1.NotFoundException(`Invalid content type: ${contentType}`);
        }
        const totalPages = Math.ceil(total / limit);
        return {
            data: content,
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
        };
    }
    async update(id, updateAuthorDto) {
        const existingAuthor = await this.prisma.author.findUnique({
            where: { id },
        });
        if (!existingAuthor) {
            throw new common_1.NotFoundException(`Author with ID "${id}" not found`);
        }
        const { name, ...authorData } = updateAuthorDto;
        let slug = existingAuthor.slug;
        if (name && name !== existingAuthor.name) {
            slug = this.generateSlug(name);
            const slugConflict = await this.prisma.author.findFirst({
                where: {
                    slug,
                    NOT: { id },
                },
            });
            if (slugConflict) {
                throw new common_1.ConflictException(`Author with slug "${slug}" already exists`);
            }
        }
        const author = await this.prisma.author.update({
            where: { id },
            data: {
                name,
                slug,
                ...authorData,
            },
            include: {
                _count: {
                    select: {
                        articles: true,
                        blogPosts: true,
                        wikiPages: true,
                        galleryItems: true,
                        stories: true,
                    },
                },
            },
        });
        return this.formatAuthorResponse(author);
    }
    async remove(id) {
        const author = await this.prisma.author.findUnique({
            where: { id },
        });
        if (!author) {
            throw new common_1.NotFoundException(`Author with ID "${id}" not found`);
        }
        await this.prisma.author.delete({
            where: { id },
        });
        return { message: 'Author deleted successfully' };
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    formatAuthorResponse(author) {
        return {
            ...author,
            articlesCount: author._count?.articles || 0,
            blogPostsCount: author._count?.blogPosts || 0,
            wikiPagesCount: author._count?.wikiPages || 0,
            galleryItemsCount: author._count?.galleryItems || 0,
            storiesCount: author._count?.stories || 0,
        };
    }
};
exports.AuthorsService = AuthorsService;
exports.AuthorsService = AuthorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthorsService);
//# sourceMappingURL=authors.service.js.map