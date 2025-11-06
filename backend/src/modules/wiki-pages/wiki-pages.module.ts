import { Module } from '@nestjs/common';
import { WikiPagesController } from './wiki-pages.controller';
import { WikiPagesService } from './wiki-pages.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WikiPagesController],
  providers: [WikiPagesService],
  exports: [WikiPagesService],
})
export class WikiPagesModule {}
