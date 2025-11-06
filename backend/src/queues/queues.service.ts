import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  EmailJobData,
  ImageProcessingJobData,
  SearchIndexingJobData,
  ScheduledPublishJobData,
} from './processors';

@Injectable()
export class QueuesService implements OnModuleInit {
  private readonly logger = new Logger(QueuesService.name);

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('image-processing') private imageProcessingQueue: Queue,
    @InjectQueue('search-indexing') private searchIndexingQueue: Queue,
    @InjectQueue('scheduled-publish') private scheduledPublishQueue: Queue,
  ) {}

  async onModuleInit() {
    // Set up cron job to check for scheduled content every minute
    await this.setupScheduledPublishCron();
  }

  /**
   * Set up cron job to check for scheduled content
   */
  private async setupScheduledPublishCron() {
    try {
      // Add repeatable job that runs every minute
      await this.scheduledPublishQueue.add(
        'check-scheduled-content',
        {},
        {
          repeat: {
            cron: '* * * * *', // Every minute
          },
          jobId: 'check-scheduled-content-cron',
        },
      );
      this.logger.log(
        'Set up scheduled publish cron job (runs every minute)',
      );
    } catch (error) {
      this.logger.error('Failed to set up scheduled publish cron:', error);
    }
  }

  /**
   * Add email job to queue
   */
  async addEmailJob(
    jobName: string,
    data: EmailJobData | any,
    options?: any,
  ) {
    try {
      const job = await this.emailQueue.add(jobName, data, options);
      this.logger.log(`Added email job ${job.id} to queue`);
      return job;
    } catch (error) {
      this.logger.error('Failed to add email job:', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name: string) {
    return this.addEmailJob('send-welcome-email', { email, name });
  }

  /**
   * Send notification email
   */
  async sendNotificationEmail(email: string, notification: string) {
    return this.addEmailJob('send-notification-email', { email, notification });
  }

  /**
   * Add image processing job to queue
   */
  async addImageProcessingJob(
    jobName: string,
    data: ImageProcessingJobData | any,
    options?: any,
  ) {
    try {
      const job = await this.imageProcessingQueue.add(jobName, data, options);
      this.logger.log(`Added image processing job ${job.id} to queue`);
      return job;
    } catch (error) {
      this.logger.error('Failed to add image processing job:', error);
      throw error;
    }
  }

  /**
   * Process image
   */
  async processImage(fileId: string, filePath: string, operations: string[]) {
    return this.addImageProcessingJob('process-image', {
      fileId,
      filePath,
      operations,
    });
  }

  /**
   * Resize image
   */
  async resizeImage(fileId: string, width: number, height: number) {
    return this.addImageProcessingJob('resize-image', {
      fileId,
      width,
      height,
    });
  }

  /**
   * Optimize image
   */
  async optimizeImage(fileId: string, quality: number = 80) {
    return this.addImageProcessingJob('optimize-image', { fileId, quality });
  }

  /**
   * Add search indexing job to queue
   */
  async addSearchIndexingJob(
    jobName: string,
    data: SearchIndexingJobData | any,
    options?: any,
  ) {
    try {
      const job = await this.searchIndexingQueue.add(jobName, data, options);
      this.logger.log(`Added search indexing job ${job.id} to queue`);
      return job;
    } catch (error) {
      this.logger.error('Failed to add search indexing job:', error);
      throw error;
    }
  }

  /**
   * Index content
   */
  async indexContent(
    contentType: SearchIndexingJobData['contentType'],
    contentId: string,
  ) {
    return this.addSearchIndexingJob('index-content', {
      contentType,
      contentId,
      operation: 'index',
    });
  }

  /**
   * Delete content from index
   */
  async deleteContentFromIndex(
    contentType: SearchIndexingJobData['contentType'],
    contentId: string,
  ) {
    return this.addSearchIndexingJob('index-content', {
      contentType,
      contentId,
      operation: 'delete',
    });
  }

  /**
   * Reindex all content
   */
  async reindexAllContent() {
    return this.addSearchIndexingJob('reindex-all', {});
  }

  /**
   * Add scheduled publish job to queue
   */
  async addScheduledPublishJob(
    jobName: string,
    data: ScheduledPublishJobData | any,
    options?: any,
  ) {
    try {
      const job = await this.scheduledPublishQueue.add(jobName, data, options);
      this.logger.log(`Added scheduled publish job ${job.id} to queue`);
      return job;
    } catch (error) {
      this.logger.error('Failed to add scheduled publish job:', error);
      throw error;
    }
  }

  /**
   * Schedule content for future publishing
   */
  async scheduleContentPublish(
    contentType: ScheduledPublishJobData['contentType'],
    contentId: string,
    publishAt: Date,
  ) {
    const delay = publishAt.getTime() - Date.now();

    if (delay <= 0) {
      this.logger.warn(
        `Scheduled publish time is in the past for ${contentType} ${contentId}. Publishing immediately.`,
      );
      return this.addScheduledPublishJob('publish-content', {
        contentType,
        contentId,
      });
    }

    return this.addScheduledPublishJob(
      'publish-content',
      {
        contentType,
        contentId,
      },
      {
        delay,
        jobId: `publish-${contentType}-${contentId}`,
      },
    );
  }

  /**
   * Trigger immediate check for scheduled content
   */
  async checkScheduledContent() {
    return this.addScheduledPublishJob('check-scheduled-content', {});
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const [
      emailCounts,
      imageProcessingCounts,
      searchIndexingCounts,
      scheduledPublishCounts,
    ] = await Promise.all([
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
}
