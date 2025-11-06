import { Module } from '@nestjs/common';
import { ContentVersionsController } from './content-versions.controller';
import { ContentVersionsService } from './content-versions.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContentVersionsController],
  providers: [ContentVersionsService],
  exports: [ContentVersionsService],
})
export class ContentVersionsModule {}
