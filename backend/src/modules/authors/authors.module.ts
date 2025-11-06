import { Module } from '@nestjs/common';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GalleryItemsModule } from '../gallery-items/gallery-items.module';

@Module({
  imports: [PrismaModule, GalleryItemsModule],
  controllers: [AuthorsController],
  providers: [AuthorsService],
  exports: [AuthorsService],
})
export class AuthorsModule {}
