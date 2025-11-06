import { Module } from '@nestjs/common';
import { ArticlesController } from './articles.controller';
import { ArticlesService } from './articles.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ContentVersionsModule } from '../content-versions/content-versions.module';

@Module({
  imports: [PrismaModule, ContentVersionsModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
