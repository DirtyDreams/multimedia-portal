import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { SearchController } from './search.controller';
import { SearchEnhancedController } from './search-enhanced.controller';
import { SearchService } from './search.service';
import { SearchEnhancedService } from './search-enhanced.service';
import { SearchAnalyticsService } from './search-analytics.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    // Configure cache with TTL
    CacheModule.register({
      ttl: 300000, // 5 minutes default
      max: 100, // Maximum number of items in cache
    }),
    // Configure throttler for rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 20, // 20 requests per minute default
    }]),
  ],
  controllers: [SearchController, SearchEnhancedController],
  providers: [SearchService, SearchEnhancedService, SearchAnalyticsService],
  exports: [SearchService, SearchEnhancedService, SearchAnalyticsService],
})
export class SearchEnhancedModule {}
