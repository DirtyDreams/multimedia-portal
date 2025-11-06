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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var QueuesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuesService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
let QueuesService = QueuesService_1 = class QueuesService {
    emailQueue;
    imageProcessingQueue;
    searchIndexingQueue;
    scheduledPublishQueue;
    logger = new common_1.Logger(QueuesService_1.name);
    constructor(emailQueue, imageProcessingQueue, searchIndexingQueue, scheduledPublishQueue) {
        this.emailQueue = emailQueue;
        this.imageProcessingQueue = imageProcessingQueue;
        this.searchIndexingQueue = searchIndexingQueue;
        this.scheduledPublishQueue = scheduledPublishQueue;
    }
    async onModuleInit() {
        await this.setupScheduledPublishCron();
    }
    async setupScheduledPublishCron() {
        try {
            await this.scheduledPublishQueue.add('check-scheduled-content', {}, {
                repeat: {
                    cron: '* * * * *',
                },
                jobId: 'check-scheduled-content-cron',
            });
            this.logger.log('Set up scheduled publish cron job (runs every minute)');
        }
        catch (error) {
            this.logger.error('Failed to set up scheduled publish cron:', error);
        }
    }
    async addEmailJob(jobName, data, options) {
        try {
            const job = await this.emailQueue.add(jobName, data, options);
            this.logger.log(`Added email job ${job.id} to queue`);
            return job;
        }
        catch (error) {
            this.logger.error('Failed to add email job:', error);
            throw error;
        }
    }
    async sendWelcomeEmail(email, name) {
        return this.addEmailJob('send-welcome-email', { email, name });
    }
    async sendNotificationEmail(email, notification) {
        return this.addEmailJob('send-notification-email', { email, notification });
    }
    async addImageProcessingJob(jobName, data, options) {
        try {
            const job = await this.imageProcessingQueue.add(jobName, data, options);
            this.logger.log(`Added image processing job ${job.id} to queue`);
            return job;
        }
        catch (error) {
            this.logger.error('Failed to add image processing job:', error);
            throw error;
        }
    }
    async processImage(fileId, filePath, operations) {
        return this.addImageProcessingJob('process-image', {
            fileId,
            filePath,
            operations,
        });
    }
    async resizeImage(fileId, width, height) {
        return this.addImageProcessingJob('resize-image', {
            fileId,
            width,
            height,
        });
    }
    async optimizeImage(fileId, quality = 80) {
        return this.addImageProcessingJob('optimize-image', { fileId, quality });
    }
    async addSearchIndexingJob(jobName, data, options) {
        try {
            const job = await this.searchIndexingQueue.add(jobName, data, options);
            this.logger.log(`Added search indexing job ${job.id} to queue`);
            return job;
        }
        catch (error) {
            this.logger.error('Failed to add search indexing job:', error);
            throw error;
        }
    }
    async indexContent(contentType, contentId) {
        return this.addSearchIndexingJob('index-content', {
            contentType,
            contentId,
            operation: 'index',
        });
    }
    async deleteContentFromIndex(contentType, contentId) {
        return this.addSearchIndexingJob('index-content', {
            contentType,
            contentId,
            operation: 'delete',
        });
    }
    async reindexAllContent() {
        return this.addSearchIndexingJob('reindex-all', {});
    }
    async addScheduledPublishJob(jobName, data, options) {
        try {
            const job = await this.scheduledPublishQueue.add(jobName, data, options);
            this.logger.log(`Added scheduled publish job ${job.id} to queue`);
            return job;
        }
        catch (error) {
            this.logger.error('Failed to add scheduled publish job:', error);
            throw error;
        }
    }
    async scheduleContentPublish(contentType, contentId, publishAt) {
        const delay = publishAt.getTime() - Date.now();
        if (delay <= 0) {
            this.logger.warn(`Scheduled publish time is in the past for ${contentType} ${contentId}. Publishing immediately.`);
            return this.addScheduledPublishJob('publish-content', {
                contentType,
                contentId,
            });
        }
        return this.addScheduledPublishJob('publish-content', {
            contentType,
            contentId,
        }, {
            delay,
            jobId: `publish-${contentType}-${contentId}`,
        });
    }
    async checkScheduledContent() {
        return this.addScheduledPublishJob('check-scheduled-content', {});
    }
    async getQueueStats() {
        const [emailCounts, imageProcessingCounts, searchIndexingCounts, scheduledPublishCounts,] = await Promise.all([
            this.emailQueue.getJobCounts(),
            this.imageProcessingQueue.getJobCounts(),
            this.searchIndexingQueue.getJobCounts(),
            this.scheduledPublishQueue.getJobCounts(),
        ]);
        return {
            email: emailCounts,
            imageProcessing: imageProcessingCounts,
            searchIndexing: searchIndexingCounts,
            scheduledPublish: scheduledPublishCounts,
        };
    }
};
exports.QueuesService = QueuesService;
exports.QueuesService = QueuesService = QueuesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('email')),
    __param(1, (0, bull_1.InjectQueue)('image-processing')),
    __param(2, (0, bull_1.InjectQueue)('search-indexing')),
    __param(3, (0, bull_1.InjectQueue)('scheduled-publish')),
    __metadata("design:paramtypes", [Object, Object, Object, Object])
], QueuesService);
//# sourceMappingURL=queues.service.js.map