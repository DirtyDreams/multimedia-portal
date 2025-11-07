import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { AuditLogModule } from './modules/audit-log/audit-log.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Rate Limiting - Throttler
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: config.get('THROTTLE_TTL', 60000), // 60 seconds default
            limit: config.get('THROTTLE_LIMIT', 10), // 10 requests per TTL
          },
          {
            name: 'medium',
            ttl: config.get('THROTTLE_TTL_MEDIUM', 900000), // 15 minutes
            limit: config.get('THROTTLE_LIMIT_MEDIUM', 100),
          },
          {
            name: 'long',
            ttl: config.get('THROTTLE_TTL_LONG', 86400000), // 24 hours
            limit: config.get('THROTTLE_LIMIT_LONG', 1000),
          },
        ],
      }),
    }),
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
    AuditLogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply ThrottlerGuard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
