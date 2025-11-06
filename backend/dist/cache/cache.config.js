"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheTTL = exports.cacheConfig = void 0;
const cache_manager_redis_yet_1 = require("cache-manager-redis-yet");
const cacheConfig = async () => {
    return {
        store: await (0, cache_manager_redis_yet_1.redisStore)({
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379', 10),
            },
        }),
        ttl: 300 * 1000,
        max: 100,
    };
};
exports.cacheConfig = cacheConfig;
exports.CacheTTL = {
    ONE_MINUTE: 60 * 1000,
    FIVE_MINUTES: 5 * 60 * 1000,
    TEN_MINUTES: 10 * 60 * 1000,
    THIRTY_MINUTES: 30 * 60 * 1000,
    ONE_HOUR: 60 * 60 * 1000,
    ONE_DAY: 24 * 60 * 60 * 1000,
};
//# sourceMappingURL=cache.config.js.map