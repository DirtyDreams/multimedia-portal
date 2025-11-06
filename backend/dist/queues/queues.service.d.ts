import { OnModuleInit } from '@nestjs/common';
import type { Queue } from 'bull';
import { EmailJobData, ImageProcessingJobData, SearchIndexingJobData, ScheduledPublishJobData } from './processors';
export declare class QueuesService implements OnModuleInit {
    private emailQueue;
    private imageProcessingQueue;
    private searchIndexingQueue;
    private scheduledPublishQueue;
    private readonly logger;
    constructor(emailQueue: Queue, imageProcessingQueue: Queue, searchIndexingQueue: Queue, scheduledPublishQueue: Queue);
    onModuleInit(): Promise<void>;
    private setupScheduledPublishCron;
    addEmailJob(jobName: string, data: EmailJobData | any, options?: any): Promise<import("bull").Job<any>>;
    sendWelcomeEmail(email: string, name: string): Promise<import("bull").Job<any>>;
    sendNotificationEmail(email: string, notification: string): Promise<import("bull").Job<any>>;
    addImageProcessingJob(jobName: string, data: ImageProcessingJobData | any, options?: any): Promise<import("bull").Job<any>>;
    processImage(fileId: string, filePath: string, operations: string[]): Promise<import("bull").Job<any>>;
    resizeImage(fileId: string, width: number, height: number): Promise<import("bull").Job<any>>;
    optimizeImage(fileId: string, quality?: number): Promise<import("bull").Job<any>>;
    addSearchIndexingJob(jobName: string, data: SearchIndexingJobData | any, options?: any): Promise<import("bull").Job<any>>;
    indexContent(contentType: SearchIndexingJobData['contentType'], contentId: string): Promise<import("bull").Job<any>>;
    deleteContentFromIndex(contentType: SearchIndexingJobData['contentType'], contentId: string): Promise<import("bull").Job<any>>;
    reindexAllContent(): Promise<import("bull").Job<any>>;
    addScheduledPublishJob(jobName: string, data: ScheduledPublishJobData | any, options?: any): Promise<import("bull").Job<any>>;
    scheduleContentPublish(contentType: ScheduledPublishJobData['contentType'], contentId: string, publishAt: Date): Promise<import("bull").Job<any>>;
    checkScheduledContent(): Promise<import("bull").Job<any>>;
    getQueueStats(): Promise<{
        email: import("bull").JobCounts;
        imageProcessing: import("bull").JobCounts;
        searchIndexing: import("bull").JobCounts;
        scheduledPublish: import("bull").JobCounts;
    }>;
}
