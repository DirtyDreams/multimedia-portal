import { CacheModuleOptions } from '@nestjs/cache-manager';
export declare const cacheConfig: () => Promise<CacheModuleOptions>;
export declare const CacheTTL: {
    ONE_MINUTE: number;
    FIVE_MINUTES: number;
    TEN_MINUTES: number;
    THIRTY_MINUTES: number;
    ONE_HOUR: number;
    ONE_DAY: number;
};
