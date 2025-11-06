import type { Job } from 'bull';
export interface ImageProcessingJobData {
    fileId: string;
    filePath: string;
    operations: string[];
}
export declare class ImageProcessingProcessor {
    private readonly logger;
    handleProcessImage(job: Job<ImageProcessingJobData>): Promise<{
        success: boolean;
        fileId: string;
        processedAt: Date;
        operations: string[];
    }>;
    handleResizeImage(job: Job<{
        fileId: string;
        width: number;
        height: number;
    }>): Promise<{
        success: boolean;
        fileId: string;
        dimensions: {
            width: number;
            height: number;
        };
    }>;
    handleOptimizeImage(job: Job<{
        fileId: string;
        quality: number;
    }>): Promise<{
        success: boolean;
        fileId: string;
        quality: number;
        optimizedAt: Date;
    }>;
}
