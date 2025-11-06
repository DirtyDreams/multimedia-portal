import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { CacheService } from './cache.service';
import { cacheConfig } from './cache.config';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      useFactory: cacheConfig,
      isGlobal: true,
    }),
  ],
  providers: [CacheService],
  exports: [CacheService, NestCacheModule],
})
export class CacheModule {}
