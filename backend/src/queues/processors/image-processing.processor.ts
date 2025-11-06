import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';

export interface ImageProcessingJobData {
  fileId: string;
  filePath: string;
  operations: string[];
}

@Processor('image-processing')
export class ImageProcessingProcessor {
  private readonly logger = new Logger(ImageProcessingProcessor.name);

  @Process('process-image')
  async handleProcessImage(job: Job<ImageProcessingJobData>) {
    this.logger.log(`Processing image job ${job.id}`);
    const { fileId, filePath, operations } = job.data;

    try {
      await job.progress(10);

      this.logger.log(`Processing image: ${filePath}`);
      this.logger.log(`Operations: ${operations.join(', ')}`);

      // Simulate image processing
      for (let i = 0; i < operations.length; i++) {
        const operation = operations[i];
        this.logger.log(`Applying operation: ${operation}`);

        // Simulate processing time
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update progress
        const progress = 10 + ((i + 1) / operations.length) * 90;
        await job.progress(Math.round(progress));
      }

      this.logger.log(`Image processed successfully: ${fileId}`);

      return {
        success: true,
        fileId,
        processedAt: new Date(),
        operations,
      };
    } catch (error) {
      this.logger.error(`Failed to process image ${fileId}:`, error);
      throw error;
    }
  }

  @Process('resize-image')
  async handleResizeImage(
    job: Job<{ fileId: string; width: number; height: number }>,
  ) {
    this.logger.log(`Processing resize job ${job.id}`);
    const { fileId, width, height } = job.data;

    try {
      await job.progress(25);

      this.logger.log(`Resizing image ${fileId} to ${width}x${height}`);

      // Simulate resize operation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await job.progress(100);

      return {
        success: true,
        fileId,
        dimensions: { width, height },
      };
    } catch (error) {
      this.logger.error(`Failed to resize image ${fileId}:`, error);
      throw error;
    }
  }

  @Process('optimize-image')
  async handleOptimizeImage(job: Job<{ fileId: string; quality: number }>) {
    this.logger.log(`Processing optimize job ${job.id}`);
    const { fileId, quality } = job.data;

    try {
      await job.progress(25);

      this.logger.log(`Optimizing image ${fileId} with quality ${quality}`);

      // Simulate optimization
      await new Promise((resolve) => setTimeout(resolve, 800));

      await job.progress(100);

      return {
        success: true,
        fileId,
        quality,
        optimizedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to optimize image ${fileId}:`, error);
      throw error;
    }
  }
}
