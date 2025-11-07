import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
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
    // Rate Limiting - 10 requests per minute per IP
    ThrottlerModule.forRoot([{
      ttl: 60000, // Time window in milliseconds (1 minute)
      limit: 10, // Maximum number of requests within the time window
    }]),
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
    // Apply ThrottlerGuard globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Apply AuditLogInterceptor globally for admin action logging
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
