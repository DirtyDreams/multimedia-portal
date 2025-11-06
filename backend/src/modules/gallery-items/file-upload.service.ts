import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ProcessedImage {
  original: string;
  thumbnail: string;
  medium: string;
  large: string;
  fileType: string;
  mimeType: string;
}

@Injectable()
export class FileUploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'gallery');
  private readonly sizes = {
    thumbnail: { width: 200, height: 200 },
    medium: { width: 800, height: 600 },
    large: { width: 1920, height: 1080 },
  };

  /**
   * Process uploaded image: resize, convert to WebP, remove EXIF
   */
  async processImage(file: Express.Multer.File): Promise<ProcessedImage> {
    try {
      // Validate file type
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('File must be an image');
      }

      // Generate unique filename
      const uniqueId = uuidv4();
      const baseFilename = `${uniqueId}`;

      // Process original image
      const originalBuffer = await this.processOriginalImage(file.buffer);
      const originalPath = await this.saveFile(
        originalBuffer,
        'original',
        `${baseFilename}.webp`,
      );

      // Generate thumbnail
      const thumbnailBuffer = await this.resizeImage(
        file.buffer,
        this.sizes.thumbnail.width,
        this.sizes.thumbnail.height,
        true, // crop to fit
      );
      const thumbnailPath = await this.saveFile(
        thumbnailBuffer,
        'thumbnail',
        `${baseFilename}.webp`,
      );

      // Generate medium size
      const mediumBuffer = await this.resizeImage(
        file.buffer,
        this.sizes.medium.width,
        this.sizes.medium.height,
        false, // maintain aspect ratio
      );
      const mediumPath = await this.saveFile(
        mediumBuffer,
        'medium',
        `${baseFilename}.webp`,
      );

      // Generate large size
      const largeBuffer = await this.resizeImage(
        file.buffer,
        this.sizes.large.width,
        this.sizes.large.height,
        false, // maintain aspect ratio
      );
      const largePath = await this.saveFile(
        largeBuffer,
        'large',
        `${baseFilename}.webp`,
      );

      return {
        original: this.getPublicUrl(originalPath),
        thumbnail: this.getPublicUrl(thumbnailPath),
        medium: this.getPublicUrl(mediumPath),
        large: this.getPublicUrl(largePath),
        fileType: 'image',
        mimeType: 'image/webp',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to process image: ${error.message}`);
    }
  }

  /**
   * Process original image: convert to WebP and remove EXIF data
   */
  private async processOriginalImage(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
      .rotate() // Auto-rotate based on EXIF
      .webp({ quality: 90 })
      .toBuffer();
  }

  /**
   * Resize image to specified dimensions
   */
  private async resizeImage(
    buffer: Buffer,
    width: number,
    height: number,
    crop: boolean = false,
  ): Promise<Buffer> {
    const sharpInstance = sharp(buffer)
      .rotate(); // Auto-rotate based on EXIF

    if (crop) {
      // Crop to exact dimensions (cover)
      return sharpInstance
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 85 })
        .toBuffer();
    } else {
      // Maintain aspect ratio (contain)
      return sharpInstance
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
    }
  }

  /**
   * Save file to disk
   */
  private async saveFile(
    buffer: Buffer,
    sizeDir: string,
    filename: string,
  ): Promise<string> {
    const dirPath = path.join(this.uploadDir, sizeDir);
    const filePath = path.join(dirPath, filename);

    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Write file
    await fs.writeFile(filePath, buffer);

    return filePath;
  }

  /**
   * Convert file path to public URL
   */
  private getPublicUrl(filePath: string): string {
    // Convert absolute path to relative URL
    const relativePath = filePath.replace(process.cwd(), '');
    return relativePath.replace(/\\/g, '/'); // Normalize path separators
  }

  /**
   * Delete gallery item files
   */
  async deleteFiles(fileUrl: string): Promise<void> {
    try {
      // Extract filename from URL
      const filename = path.basename(fileUrl);

      // Delete all sizes
      const sizes = ['original', 'thumbnail', 'medium', 'large'];
      await Promise.all(
        sizes.map(async (size) => {
          const filePath = path.join(this.uploadDir, size, filename);
          try {
            await fs.unlink(filePath);
          } catch (error) {
            // File might not exist, ignore error
          }
        }),
      );
    } catch (error) {
      // Log error but don't throw - files might already be deleted
      console.error(`Failed to delete files: ${error.message}`);
    }
  }

  /**
   * Validate file size (max 10MB)
   */
  validateFileSize(file: Express.Multer.File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      );
    }
  }

  /**
   * Validate image dimensions
   */
  async validateImageDimensions(buffer: Buffer): Promise<void> {
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new BadRequestException('Invalid image file');
    }

    // Minimum dimensions
    if (metadata.width < 200 || metadata.height < 200) {
      throw new BadRequestException(
        'Image dimensions too small (minimum 200x200px)',
      );
    }

    // Maximum dimensions
    if (metadata.width > 10000 || metadata.height > 10000) {
      throw new BadRequestException(
        'Image dimensions too large (maximum 10000x10000px)',
      );
    }
  }
}
