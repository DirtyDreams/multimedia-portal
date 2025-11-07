import { JwtService } from '@nestjs/jwt';
import { CacheService } from '../../cache/cache.service';
export declare class JwtBlacklistService {
    private readonly cacheService;
    private readonly jwtService;
    private readonly logger;
    private readonly BLACKLIST_PREFIX;
    constructor(cacheService: CacheService, jwtService: JwtService);
    blacklistToken(token: string): Promise<void>;
    isBlacklisted(token: string): Promise<boolean>;
    private getBlacklistKey;
    blacklistAllUserTokens(userId: string): Promise<void>;
}
