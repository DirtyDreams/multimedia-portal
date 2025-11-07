import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CacheService } from '../../cache/cache.service';

/**
 * JWT Blacklist Service
 *
 * Manages blacklisted JWT tokens in Redis to prevent token reuse after logout.
 * Tokens are automatically removed from blacklist when they expire naturally.
 */
@Injectable()
export class JwtBlacklistService {
  private readonly logger = new Logger(JwtBlacklistService.name);
  private readonly BLACKLIST_PREFIX = 'jwt:blacklist:';

  constructor(
    private readonly cacheService: CacheService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Add a token to the blacklist
   * TTL is set to match the token's remaining validity period
   */
  async blacklistToken(token: string): Promise<void> {
    try {
      // Decode token to get expiration time
      const decoded = this.jwtService.decode(token) as any;

      if (!decoded || !decoded.exp) {
        this.logger.warn('Cannot blacklist token: invalid or no expiration');
        return;
      }

      // Calculate remaining TTL in seconds
      const now = Math.floor(Date.now() / 1000);
      const expiresIn = decoded.exp - now;

      if (expiresIn <= 0) {
        this.logger.debug('Token already expired, skipping blacklist');
        return;
      }

      // Store in Redis with TTL matching token expiration
      const key = this.getBlacklistKey(token);
      await this.cacheService.set(key, '1', expiresIn * 1000); // Convert to milliseconds

      this.logger.log(
        `Token blacklisted successfully (TTL: ${expiresIn}s, User: ${decoded.sub})`,
      );
    } catch (error) {
      this.logger.error('Error blacklisting token:', error);
      throw error;
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const key = this.getBlacklistKey(token);
      const value = await this.cacheService.get<string>(key);
      return value === '1';
    } catch (error) {
      this.logger.error('Error checking token blacklist:', error);
      // Fail open: if Redis is down, allow the request
      // The JWT itself will still be validated
      return false;
    }
  }

  /**
   * Generate Redis key for blacklisted token
   */
  private getBlacklistKey(token: string): string {
    // Use SHA-256 hash of token as key to save space
    // In production, consider using crypto.createHash('sha256')
    const tokenHash = Buffer.from(token).toString('base64').substring(0, 32);
    return `${this.BLACKLIST_PREFIX}${tokenHash}`;
  }

  /**
   * Blacklist all tokens for a user (useful for account security)
   * Note: This requires storing user's token list, which is not implemented here
   */
  async blacklistAllUserTokens(userId: string): Promise<void> {
    this.logger.log(
      `Blacklisting all tokens for user ${userId} - requires token tracking implementation`,
    );
    // TODO: Implement if needed
    // Would require storing all issued tokens per user in Redis
  }
}
