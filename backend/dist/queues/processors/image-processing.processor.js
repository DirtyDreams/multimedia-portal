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
var ImageProcessingProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageProcessingProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
let ImageProcessingProcessor = ImageProcessingProcessor_1 = class ImageProcessingProcessor {
    logger = new common_1.Logger(ImageProcessingProcessor_1.name);
    async handleProcessImage(job) {
        this.logger.log(`Processing image job ${job.id}`);
        const { fileId, filePath, operations } = job.data;
        try {
            await job.progress(10);
            this.logger.log(`Processing image: ${filePath}`);
            this.logger.log(`Operations: ${operations.join(', ')}`);
            for (let i = 0; i < operations.length; i++) {
                const operation = operations[i];
                this.logger.log(`Applying operation: ${operation}`);
                await new Promise((resolve) => setTimeout(resolve, 500));
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
        }
        catch (error) {
            this.logger.error(`Failed to process image ${fileId}:`, error);
            throw error;
        }
    }
    async handleResizeImage(job) {
        this.logger.log(`Processing resize job ${job.id}`);
        const { fileId, width, height } = job.data;
        try {
            await job.progress(25);
            this.logger.log(`Resizing image ${fileId} to ${width}x${height}`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await job.progress(100);
            return {
                success: true,
                fileId,
                dimensions: { width, height },
            };
        }
        catch (error) {
            this.logger.error(`Failed to resize image ${fileId}:`, error);
            throw error;
        }
    }
    async handleOptimizeImage(job) {
        this.logger.log(`Processing optimize job ${job.id}`);
        const { fileId, quality } = job.data;
        try {
            await job.progress(25);
            this.logger.log(`Optimizing image ${fileId} with quality ${quality}`);
            await new Promise((resolve) => setTimeout(resolve, 800));
            await job.progress(100);
            return {
                success: true,
                fileId,
                quality,
                optimizedAt: new Date(),
            };
        }
        catch (error) {
            this.logger.error(`Failed to optimize image ${fileId}:`, error);
            throw error;
        }
    }
};
exports.ImageProcessingProcessor = ImageProcessingProcessor;
__decorate([
    (0, bull_1.Process)('process-image'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ImageProcessingProcessor.prototype, "handleProcessImage", null);
__decorate([
    (0, bull_1.Process)('resize-image'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ImageProcessingProcessor.prototype, "handleResizeImage", null);
__decorate([
    (0, bull_1.Process)('optimize-image'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ImageProcessingProcessor.prototype, "handleOptimizeImage", null);
exports.ImageProcessingProcessor = ImageProcessingProcessor = ImageProcessingProcessor_1 = __decorate([
    (0, bull_1.Processor)('image-processing')
], ImageProcessingProcessor);
//# sourceMappingURL=image-processing.processor.js.map