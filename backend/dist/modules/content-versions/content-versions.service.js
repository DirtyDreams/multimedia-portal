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
var ContentVersionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentVersionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const dto_1 = require("./dto");
let ContentVersionsService = ContentVersionsService_1 = class ContentVersionsService {
    prisma;
    logger = new common_1.Logger(ContentVersionsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, createVersionDto) {
        const { contentType, contentId, versionNumber, title, content, excerpt, metadata, changeNote, } = createVersionDto;
        await this.verifyContentExists(contentType, contentId);
        const existingVersion = await this.prisma.contentVersion.findFirst({
            where: {
                contentType,
                contentId,
                versionNumber,
            },
        });
        if (existingVersion) {
            throw new common_1.BadRequestException(`Version ${versionNumber} already exists for this content`);
        }
        const version = await this.prisma.contentVersion.create({
            data: {
                contentType,
                contentId,
                versionNumber,
                title,
                content,
                excerpt,
                metadata,
                changeNote,
                userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });
        this.logger.log(`Created version ${versionNumber} for ${contentType} ${contentId}`);
        return version;
    }
    async autoSaveVersion(userId, contentType, contentId, title, content, excerpt, metadata, changeNote) {
        const latestVersion = await this.prisma.contentVersion.findFirst({
            where: {
                contentType,
                contentId,
            },
            orderBy: {
                versionNumber: 'desc',
            },
            select: {
                versionNumber: true,
            },
        });
        const nextVersionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
        return this.create(userId, {
            contentType,
            contentId,
            versionNumber: nextVersionNumber,
            title,
            content,
            excerpt,
            metadata,
            changeNote: changeNote || 'Auto-saved version',
        });
    }
    async findAllForContent(contentType, contentId, queryDto) {
        const { page = 1, limit = 10, userId } = queryDto;
        const skip = (page - 1) * limit;
        const where = {
            contentType,
            contentId,
            ...(userId && { userId }),
        };
        const [versions, total] = await Promise.all([
            this.prisma.contentVersion.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    versionNumber: 'desc',
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            email: true,
                        },
                    },
                },
            }),
            this.prisma.contentVersion.count({ where }),
        ]);
        return {
            data: versions,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const version = await this.prisma.contentVersion.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });
        if (!version) {
            throw new common_1.NotFoundException(`Version with ID ${id} not found`);
        }
        return version;
    }
    async findByVersionNumber(contentType, contentId, versionNumber) {
        const version = await this.prisma.contentVersion.findFirst({
            where: {
                contentType,
                contentId,
                versionNumber,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });
        if (!version) {
            throw new common_1.NotFoundException(`Version ${versionNumber} not found for ${contentType} ${contentId}`);
        }
        return version;
    }
    async findLatestVersion(contentType, contentId) {
        const version = await this.prisma.contentVersion.findFirst({
            where: {
                contentType,
                contentId,
            },
            orderBy: {
                versionNumber: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                    },
                },
            },
        });
        if (!version) {
            throw new common_1.NotFoundException(`No versions found for ${contentType} ${contentId}`);
        }
        return version;
    }
    async compareVersions(contentType, contentId, versionA, versionB) {
        const [vA, vB] = await Promise.all([
            this.findByVersionNumber(contentType, contentId, versionA),
            this.findByVersionNumber(contentType, contentId, versionB),
        ]);
        return {
            versionA: vA,
            versionB: vB,
            diff: {
                title: vA.title !== vB.title,
                content: vA.content !== vB.content,
                excerpt: vA.excerpt !== vB.excerpt,
            },
        };
    }
    async pruneOldVersions(contentType, contentId, keepCount = 10) {
        const versions = await this.prisma.contentVersion.findMany({
            where: {
                contentType,
                contentId,
            },
            orderBy: {
                versionNumber: 'desc',
            },
            select: {
                id: true,
                versionNumber: true,
            },
            take: keepCount + 1,
        });
        if (versions.length <= keepCount) {
            return { deleted: 0 };
        }
        const versionsToDelete = versions.slice(keepCount);
        const deleteResult = await this.prisma.contentVersion.deleteMany({
            where: {
                id: {
                    in: versionsToDelete.map((v) => v.id),
                },
            },
        });
        this.logger.log(`Pruned ${deleteResult.count} old versions for ${contentType} ${contentId}`);
        return { deleted: deleteResult.count };
    }
    async getRestoreData(contentType, contentId, versionNumber) {
        const version = await this.findByVersionNumber(contentType, contentId, versionNumber);
        return {
            title: version.title,
            content: version.content,
            excerpt: version.excerpt,
            metadata: version.metadata,
        };
    }
    async verifyContentExists(contentType, contentId) {
        let exists = false;
        switch (contentType) {
            case dto_1.VersionableType.ARTICLE:
                exists = !!(await this.prisma.article.findUnique({
                    where: { id: contentId },
                }));
                break;
            case dto_1.VersionableType.BLOG_POST:
                exists = !!(await this.prisma.blogPost.findUnique({
                    where: { id: contentId },
                }));
                break;
            case dto_1.VersionableType.WIKI_PAGE:
                exists = !!(await this.prisma.wikiPage.findUnique({
                    where: { id: contentId },
                }));
                break;
            case dto_1.VersionableType.GALLERY_ITEM:
                exists = !!(await this.prisma.galleryItem.findUnique({
                    where: { id: contentId },
                }));
                break;
            case dto_1.VersionableType.STORY:
                exists = !!(await this.prisma.story.findUnique({
                    where: { id: contentId },
                }));
                break;
        }
        if (!exists) {
            throw new common_1.NotFoundException(`Content ${contentType} with ID ${contentId} not found`);
        }
    }
};
exports.ContentVersionsService = ContentVersionsService;
exports.ContentVersionsService = ContentVersionsService = ContentVersionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContentVersionsService);
//# sourceMappingURL=content-versions.service.js.map