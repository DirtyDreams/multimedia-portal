"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
let CacheService = CacheService_1 = class CacheService {
    cacheManager;
    logger = new common_1.Logger(CacheService_1.name);
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
    }
    async get(key) {
        try {
            const value = await this.cacheManager.get(key);
            if (value) {
                this.logger.debug(`Cache hit for key: ${key}`);
            }
            else {
                this.logger.debug(`Cache miss for key: ${key}`);
            }
            return value;
        }
        catch (error) {
            this.logger.error(`Error getting cache for key ${key}:`, error);
            return undefined;
        }
    }
    async set(key, value, ttl) {
        try {
            await this.cacheManager.set(key, value, ttl);
            this.logger.debug(`Cache set for key: ${key}, TTL: ${ttl || 'default'}`);
        }
        catch (error) {
            this.logger.error(`Error setting cache for key ${key}:`, error);
        }
    }
    async delete(key) {
        try {
            await this.cacheManager.del(key);
            this.logger.debug(`Cache deleted for key: ${key}`);
        }
        catch (error) {
            this.logger.error(`Error deleting cache for key ${key}:`, error);
        }
    }
    async deletePattern(pattern) {
        try {
            this.logger.warn(`Pattern deletion not implemented yet for pattern: ${pattern}`);
        }
        catch (error) {
            this.logger.error(`Error deleting cache pattern ${pattern}:`, error);
        }
    }
    async clear() {
        try {
            this.logger.warn('Clear all cache operation not fully implemented');
        }
        catch (error) {
            this.logger.error('Error clearing cache:', error);
        }
    }
    async wrap(key, fn, ttl) {
        try {
            const cached = await this.get(key);
            if (cached !== undefined) {
                return cached;
            }
            const result = await fn();
            await this.set(key, result, ttl);
            return result;
        }
        catch (error) {
            this.logger.error(`Error in cache wrap for key ${key}:`, error);
            return fn();
        }
    }
    generateListKey(contentType, params) {
        const sortedParams = Object.keys(params)
            .sort()
            .map((key) => `${key}:${params[key]}`)
            .join('|');
        return `${contentType}:list:${sortedParams}`;
    }
    generateDetailKey(contentType, id) {
        return `${contentType}:detail:${id}`;
    }
    generateSlugKey(contentType, slug) {
        return `${contentType}:slug:${slug}`;
    }
    async invalidateContentType(contentType) {
        await this.deletePattern(`${contentType}:*`);
    }
    async invalidateContent(contentType, id) {
        await this.delete(this.generateDetailKey(contentType, id));
        await this.invalidateContentType(contentType);
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], CacheService);
//# sourceMappingURL=cache.service.js.map