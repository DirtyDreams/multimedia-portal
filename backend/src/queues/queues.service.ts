import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  EmailJobData,
  ImageProcessingJobData,
  SearchIndexingJobData,
} from './processors';

@Injectable()
export class QueuesService {
  private readonly logger = new Logger(QueuesService.name);

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('image-processing') private imageProcessingQueue: Queue,
    @InjectQueue('search-indexing') private searchIndexingQueue: Queue,
  ) {}

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
   * Get queue statistics
   */
  async getQueueStats() {
    const [emailCounts, imageProcessingCounts, searchIndexingCounts] =
      await Promise.all([
        this.emailQueue.getJobCounts(),
        this.imageProcessingQueue.getJobCounts(),
        this.searchIndexingQueue.getJobCounts(),
      ]);

    return {
      email: emailCounts,
      imageProcessing: imageProcessingCounts,
      searchIndexing: searchIndexingCounts,
    };
  }
}
