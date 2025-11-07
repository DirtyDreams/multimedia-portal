import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { BlogPostsModule } from './modules/blog-posts/blog-posts.module';
import { WikiPagesModule } from './modules/wiki-pages/wiki-pages.module';
import { GalleryItemsModule } from './modules/gallery-items/gallery-items.module';
import { StoriesModule } from './modules/stories/stories.module';
import { AuthorsModule } from './modules/authors/authors.module';
import { CommentsModule } from './modules/comments/comments.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SearchModule } from './modules/search/search.module';
import { QueuesModule } from './queues/queues.module';
import { CacheModule } from './cache/cache.module';
import { ConfigModule as CustomConfigModule } from './config/config.module';
import { ContentVersionsModule } from './modules/content-versions/content-versions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per minute (default)
      },
    ]),
    PrismaModule,
    CustomConfigModule,
    CacheModule,
    QueuesModule,
    AuthModule,
    ArticlesModule,
    BlogPostsModule,
    WikiPagesModule,
    GalleryItemsModule,
    StoriesModule,
    AuthorsModule,
    CommentsModule,
    RatingsModule,
    NotificationsModule,
    SearchModule,
    ContentVersionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
