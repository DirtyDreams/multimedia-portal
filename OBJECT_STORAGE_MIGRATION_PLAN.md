# Object Storage Migration Plan

## Current Issue

**Critical Problem**: File uploads are currently stored in the local filesystem (`backend/src/modules/gallery-items/file-upload.service.ts:18`):
```typescript
private readonly uploadDir = path.join(process.cwd(), 'uploads', 'gallery');
```

**Impact**:
- ❌ Cannot scale horizontally (stateless servers required)
- ❌ Files lost if container/server is destroyed
- ❌ No backup strategy for uploaded files
- ❌ Cannot leverage CDN for static asset delivery
- ❌ Poor performance for distributed deployments

## Recommended Solution: MinIO/S3 Object Storage

MinIO configuration already exists in `.env.example`, indicating planned support.

### Architecture Overview

```
User Upload → NestJS API → MinIO/S3 → Store File + Return URL
                          ↓
                    Update Database with:
                    - File URL/key
                    - Metadata
                    - Thumbnail URLs
```

### Implementation Steps

#### 1. Install Required Dependencies

```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage mime-types
npm install --save-dev @types/mime-types
```

#### 2. Create MinIO/S3 Service

Create `backend/src/common/services/storage.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ConfigService } from '../../config/config.service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get('MINIO_BUCKET');

    this.s3Client = new S3Client({
      region: 'us-east-1', // MinIO doesn't use regions but SDK requires it
      endpoint: `http://${this.configService.get('MINIO_ENDPOINT')}:${this.configService.get('MINIO_PORT')}`,
      credentials: {
        accessKeyId: this.configService.get('MINIO_ACCESS_KEY'),
        secretAccessKey: this.configService.get('MINIO_SECRET_KEY'),
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  /**
   * Upload file to object storage
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ key: string; url: string; size: number }> {
    const key = `${folder}/${Date.now()}-${file.originalname}`;

    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: {
            originalName: file.originalname,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      await upload.done();

      const url = `${this.configService.get('MINIO_ENDPOINT')}:${this.configService.get('MINIO_PORT')}/${this.bucket}/${key}`;

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        key,
        url,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`, error.stack);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Delete file from object storage
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`, error.stack);
      throw new Error(`File deletion failed: ${error.message}`);
    }
  }

  /**
   * Generate signed URL for private files (expires in 1 hour)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: ${error.message}`, error.stack);
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }
  }
}
```

#### 3. Update ConfigService

Add MinIO configuration getters to `backend/src/config/config.service.ts`:

```typescript
// MinIO/S3
get minioEndpoint(): string {
  return this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
}

get minioPort(): number {
  return this.configService.get<number>('MINIO_PORT', 9000);
}

get minioUseSsl(): boolean {
  return this.configService.get<boolean>('MINIO_USE_SSL', false);
}

get minioAccessKey(): string {
  const key = this.configService.get<string>('MINIO_ACCESS_KEY');
  if (!key) {
    throw new Error('MINIO_ACCESS_KEY is not defined');
  }
  return key;
}

get minioSecretKey(): string {
  const key = this.configService.get<string>('MINIO_SECRET_KEY');
  if (!key) {
    throw new Error('MINIO_SECRET_KEY is not defined');
  }
  return key;
}

get minioBucket(): string {
  return this.configService.get<string>('MINIO_BUCKET', 'multimedia');
}
```

#### 4. Update FileUploadService

Replace `backend/src/modules/gallery-items/file-upload.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { StorageService } from '../../common/services/storage.service';

@Injectable()
export class FileUploadService {
  constructor(private storageService: StorageService) {}

  async uploadGalleryFile(file: Express.Multer.File) {
    // Upload to object storage
    const result = await this.storageService.uploadFile(file, 'gallery');

    return {
      url: result.url,
      key: result.key,
      filename: file.originalname,
      mimetype: file.mimetype,
      size: result.size,
    };
  }

  async deleteGalleryFile(key: string) {
    await this.storageService.deleteFile(key);
  }
}
```

#### 5. Update Database Schema

Add `storageKey` field to track object storage location:

```prisma
model GalleryItem {
  id          String   @id @default(uuid())
  title       String
  description String?
  fileUrl     String   // Keep for backward compatibility
  storageKey  String?  // NEW: Object storage key
  filename    String
  mimetype    String
  fileSize    Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("gallery_items")
}
```

Run migration:
```bash
cd backend
npx prisma migrate dev --name add_storage_key_to_gallery
```

#### 6. Update GalleryItems Service

Update creation logic to store `storageKey`:

```typescript
async create(userId: string, file: Express.Multer.File, createDto: CreateGalleryItemDto) {
  const uploadResult = await this.fileUploadService.uploadGalleryFile(file);

  return this.prisma.galleryItem.create({
    data: {
      ...createDto,
      fileUrl: uploadResult.url,
      storageKey: uploadResult.key, // NEW
      filename: uploadResult.filename,
      mimetype: uploadResult.mimetype,
      fileSize: uploadResult.size,
      userId,
    },
  });
}
```

Update deletion logic:

```typescript
async remove(id: string, userId: string) {
  const item = await this.findOne(id);

  // Check ownership or admin
  // ...

  // Delete from object storage
  if (item.storageKey) {
    await this.fileUploadService.deleteGalleryFile(item.storageKey);
  }

  return this.prisma.galleryItem.delete({ where: { id } });
}
```

### Migration Strategy for Existing Files

If there are already uploaded files in local storage:

#### Option 1: Gradual Migration (Recommended)

```typescript
// Create migration script
async function migrateExistingFiles() {
  const items = await prisma.galleryItem.findMany({
    where: { storageKey: null }, // Only items not migrated yet
  });

  for (const item of items) {
    try {
      // Read file from local storage
      const localPath = path.join('uploads', 'gallery', item.filename);
      const fileBuffer = await fs.readFile(localPath);

      // Upload to MinIO
      const result = await storageService.uploadFile({
        buffer: fileBuffer,
        originalname: item.filename,
        mimetype: item.mimetype,
        size: item.fileSize,
      }, 'gallery');

      // Update database
      await prisma.galleryItem.update({
        where: { id: item.id },
        data: {
          fileUrl: result.url,
          storageKey: result.key,
        },
      });

      // Optionally delete local file
      await fs.unlink(localPath);

      console.log(`Migrated: ${item.filename}`);
    } catch (error) {
      console.error(`Failed to migrate ${item.filename}:`, error);
    }
  }
}
```

#### Option 2: Dual-Mode (Transition Period)

Keep both systems running, check `storageKey` to determine source:

```typescript
async getFileUrl(item: GalleryItem): Promise<string> {
  if (item.storageKey) {
    // Use object storage
    return item.fileUrl;
  } else {
    // Fall back to local storage
    return `http://localhost:3000/uploads/gallery/${item.filename}`;
  }
}
```

### Testing Checklist

- [ ] MinIO/S3 connection works
- [ ] File upload succeeds
- [ ] File URL is accessible
- [ ] File deletion works
- [ ] Database correctly stores `storageKey`
- [ ] Existing files (if any) are migrated
- [ ] Old local files are cleaned up
- [ ] Error handling works for network failures
- [ ] Large file uploads work (>10MB)
- [ ] Concurrent uploads work correctly

### Deployment Checklist

- [ ] MinIO/S3 service is running
- [ ] Bucket is created with correct permissions
- [ ] Environment variables are configured
- [ ] Database migration is run
- [ ] Application can connect to MinIO/S3
- [ ] Uploads directory is backed up (if needed)
- [ ] CDN is configured (optional but recommended)
- [ ] Monitoring/alerting is set up

### Rollback Plan

If issues occur:

1. Keep `fileUrl` column for backward compatibility
2. Revert to local storage by:
   - Disabling StorageService
   - Reverting FileUploadService changes
   - Using local file system again

### Future Enhancements

Once object storage is working:

1. **CDN Integration**: Add CloudFront/CDN in front of MinIO
2. **Image Processing**: Generate thumbnails and multiple sizes
3. **Presigned URLs**: For private/restricted files
4. **Lifecycle Policies**: Auto-delete old files
5. **Backup Strategy**: Regular S3 backups
6. **Multi-region**: Replicate across regions

### Cost Estimates

**MinIO (Self-hosted)**:
- Server costs: Variable based on storage needs
- No per-request fees
- Full control over data

**AWS S3**:
- Storage: ~$0.023/GB/month
- Requests: ~$0.0004/1000 requests
- Data transfer: ~$0.09/GB (first 10TB)

### Conclusion

This migration is **essential for production readiness** and should be prioritized. The implementation is straightforward with MinIO already configured in environment variables.

**Estimated Implementation Time**: 4-6 hours including testing

**Priority**: HIGH (blocks horizontal scaling)
