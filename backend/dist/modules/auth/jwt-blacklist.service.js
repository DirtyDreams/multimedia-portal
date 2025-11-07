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
var JwtBlacklistService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtBlacklistService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const cache_service_1 = require("../../cache/cache.service");
let JwtBlacklistService = JwtBlacklistService_1 = class JwtBlacklistService {
    cacheService;
    jwtService;
    logger = new common_1.Logger(JwtBlacklistService_1.name);
    BLACKLIST_PREFIX = 'jwt:blacklist:';
    constructor(cacheService, jwtService) {
        this.cacheService = cacheService;
        this.jwtService = jwtService;
    }
    async blacklistToken(token) {
        try {
            const decoded = this.jwtService.decode(token);
            if (!decoded || !decoded.exp) {
                this.logger.warn('Cannot blacklist token: invalid or no expiration');
                return;
            }
            const now = Math.floor(Date.now() / 1000);
            const expiresIn = decoded.exp - now;
            if (expiresIn <= 0) {
                this.logger.debug('Token already expired, skipping blacklist');
                return;
            }
            const key = this.getBlacklistKey(token);
            await this.cacheService.set(key, '1', expiresIn * 1000);
            this.logger.log(`Token blacklisted successfully (TTL: ${expiresIn}s, User: ${decoded.sub})`);
        }
        catch (error) {
            this.logger.error('Error blacklisting token:', error);
            throw error;
        }
    }
    async isBlacklisted(token) {
        try {
            const key = this.getBlacklistKey(token);
            const value = await this.cacheService.get(key);
            return value === '1';
        }
        catch (error) {
            this.logger.error('Error checking token blacklist:', error);
            return false;
        }
    }
    getBlacklistKey(token) {
        const tokenHash = Buffer.from(token).toString('base64').substring(0, 32);
        return `${this.BLACKLIST_PREFIX}${tokenHash}`;
    }
    async blacklistAllUserTokens(userId) {
        this.logger.log(`Blacklisting all tokens for user ${userId} - requires token tracking implementation`);
    }
};
exports.JwtBlacklistService = JwtBlacklistService;
exports.JwtBlacklistService = JwtBlacklistService = JwtBlacklistService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cache_service_1.CacheService,
        jwt_1.JwtService])
], JwtBlacklistService);
//# sourceMappingURL=jwt-blacklist.service.js.map