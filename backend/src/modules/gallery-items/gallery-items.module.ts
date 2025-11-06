import { Module } from '@nestjs/common';
import { GalleryItemsController } from './gallery-items.controller';
import { GalleryItemsService } from './gallery-items.service';
import { FileUploadService } from './file-upload.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GalleryItemsController],
  providers: [GalleryItemsService, FileUploadService],
  exports: [GalleryItemsService, FileUploadService],
})
export class GalleryItemsModule {}
