import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { BlogPostsModule } from './modules/blog-posts/blog-posts.module';
import { WikiPagesModule } from './modules/wiki-pages/wiki-pages.module';
import { GalleryItemsModule } from './modules/gallery-items/gallery-items.module';
import { ConfigModule as CustomConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    CustomConfigModule,
    AuthModule,
    ArticlesModule,
    BlogPostsModule,
    WikiPagesModule,
    GalleryItemsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
