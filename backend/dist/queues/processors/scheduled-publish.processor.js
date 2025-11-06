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
var ScheduledPublishProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduledPublishProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ScheduledPublishProcessor = ScheduledPublishProcessor_1 = class ScheduledPublishProcessor {
    prisma;
    logger = new common_1.Logger(ScheduledPublishProcessor_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async handlePublishContent(job) {
        this.logger.log(`Processing scheduled publish job ${job.id}`);
        const { contentType, contentId } = job.data;
        try {
            await job.progress(10);
            this.logger.log(`Publishing scheduled content: ${contentType} ${contentId}`);
            await job.progress(30);
            const updateData = {
                status: 'PUBLISHED',
                publishedAt: new Date(),
                scheduledPublishAt: null,
            };
            switch (contentType) {
                case 'article':
                    await this.prisma.article.update({
                        where: { id: contentId },
                        data: updateData,
                    });
                    break;
                case 'blogPost':
                    await this.prisma.blogPost.update({
                        where: { id: contentId },
                        data: updateData,
                    });
                    break;
                case 'wikiPage':
                    await this.prisma.wikiPage.update({
                        where: { id: contentId },
                        data: updateData,
                    });
                    break;
                case 'galleryItem':
                    await this.prisma.galleryItem.update({
                        where: { id: contentId },
                        data: updateData,
                    });
                    break;
                case 'story':
                    await this.prisma.story.update({
                        where: { id: contentId },
                        data: updateData,
                    });
                    break;
                default:
                    throw new Error(`Unknown content type: ${contentType}`);
            }
            await job.progress(100);
            this.logger.log(`Successfully published scheduled content: ${contentType} ${contentId}`);
            return {
                success: true,
                publishedAt: new Date(),
                contentType,
                contentId,
            };
        }
        catch (error) {
            this.logger.error(`Failed to publish scheduled content ${contentType} ${contentId}:`, error);
            throw error;
        }
    }
    async handleCheckScheduledContent(job) {
        this.logger.log(`Checking for scheduled content to publish`);
        try {
            await job.progress(10);
            const now = new Date();
            const articles = await this.prisma.article.findMany({
                where: {
                    status: 'SCHEDULED',
                    scheduledPublishAt: {
                        lte: now,
                    },
                },
                select: { id: true },
            });
            const blogPosts = await this.prisma.blogPost.findMany({
                where: {
                    status: 'SCHEDULED',
                    scheduledPublishAt: {
                        lte: now,
                    },
                },
                select: { id: true },
            });
            const wikiPages = await this.prisma.wikiPage.findMany({
                where: {
                    status: 'SCHEDULED',
                    scheduledPublishAt: {
                        lte: now,
                    },
                },
                select: { id: true },
            });
            const galleryItems = await this.prisma.galleryItem.findMany({
                where: {
                    status: 'SCHEDULED',
                    scheduledPublishAt: {
                        lte: now,
                    },
                },
                select: { id: true },
            });
            const stories = await this.prisma.story.findMany({
                where: {
                    status: 'SCHEDULED',
                    scheduledPublishAt: {
                        lte: now,
                    },
                },
                select: { id: true },
            });
            await job.progress(50);
            const totalContent = articles.length +
                blogPosts.length +
                wikiPages.length +
                galleryItems.length +
                stories.length;
            this.logger.log(`Found ${totalContent} scheduled content items to publish`);
            const updateData = {
                status: 'PUBLISHED',
                publishedAt: now,
                scheduledPublishAt: null,
            };
            if (articles.length > 0) {
                await this.prisma.article.updateMany({
                    where: {
                        id: { in: articles.map((a) => a.id) },
                    },
                    data: updateData,
                });
            }
            if (blogPosts.length > 0) {
                await this.prisma.blogPost.updateMany({
                    where: {
                        id: { in: blogPosts.map((b) => b.id) },
                    },
                    data: updateData,
                });
            }
            if (wikiPages.length > 0) {
                await this.prisma.wikiPage.updateMany({
                    where: {
                        id: { in: wikiPages.map((w) => w.id) },
                    },
                    data: updateData,
                });
            }
            if (galleryItems.length > 0) {
                await this.prisma.galleryItem.updateMany({
                    where: {
                        id: { in: galleryItems.map((g) => g.id) },
                    },
                    data: updateData,
                });
            }
            if (stories.length > 0) {
                await this.prisma.story.updateMany({
                    where: {
                        id: { in: stories.map((s) => s.id) },
                    },
                    data: updateData,
                });
            }
            await job.progress(100);
            this.logger.log(`Successfully published ${totalContent} scheduled content items`);
            return {
                success: true,
                published: totalContent,
                breakdown: {
                    articles: articles.length,
                    blogPosts: blogPosts.length,
                    wikiPages: wikiPages.length,
                    galleryItems: galleryItems.length,
                    stories: stories.length,
                },
            };
        }
        catch (error) {
            this.logger.error('Failed to check and publish scheduled content:', error);
            throw error;
        }
    }
};
exports.ScheduledPublishProcessor = ScheduledPublishProcessor;
__decorate([
    (0, bull_1.Process)('publish-content'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScheduledPublishProcessor.prototype, "handlePublishContent", null);
__decorate([
    (0, bull_1.Process)('check-scheduled-content'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ScheduledPublishProcessor.prototype, "handleCheckScheduledContent", null);
exports.ScheduledPublishProcessor = ScheduledPublishProcessor = ScheduledPublishProcessor_1 = __decorate([
    (0, bull_1.Processor)('scheduled-publish'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ScheduledPublishProcessor);
//# sourceMappingURL=scheduled-publish.processor.js.map