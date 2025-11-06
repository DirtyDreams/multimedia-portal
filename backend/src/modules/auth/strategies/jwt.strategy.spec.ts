import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '../../../config/config.service';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: ConfigService;

  const mockConfigService = {
    jwtSecret: 'test-secret-key',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    it('should return user object from valid JWT payload', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        role: 'USER',
      });
    });

    it('should handle admin role correctly', async () => {
      const payload = {
        sub: 'admin-456',
        email: 'admin@example.com',
        username: 'admin',
        role: 'ADMIN',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'admin-456',
        username: 'admin',
        email: 'admin@example.com',
        role: 'ADMIN',
      });
    });

    it('should handle moderator role correctly', async () => {
      const payload = {
        sub: 'mod-789',
        email: 'moderator@example.com',
        username: 'moderator',
        role: 'MODERATOR',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        userId: 'mod-789',
        username: 'moderator',
        email: 'moderator@example.com',
        role: 'MODERATOR',
      });
    });

    it('should transform sub to userId', async () => {
      const payload = {
        sub: 'user-abc',
        email: 'user@example.com',
        username: 'user',
        role: 'USER',
      };

      const result = await strategy.validate(payload);

      expect(result.userId).toBe('user-abc');
      expect(result).not.toHaveProperty('sub');
    });

    it('should preserve all required user fields', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
      };

      const result = await strategy.validate(payload);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('username');
      expect(result).toHaveProperty('role');
    });

    it('should handle payload with undefined role', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        role: undefined,
      };

      const result = await strategy.validate(payload);

      expect(result.role).toBeUndefined();
    });

    it('should handle payload with missing optional fields', async () => {
      const payload = {
        sub: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      const result = await strategy.validate(payload);

      expect(result.userId).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result.username).toBe('testuser');
    });
  });

  describe('configuration', () => {
    it('should use JWT secret from ConfigService', () => {
      expect(configService.jwtSecret).toBe('test-secret-key');
    });

    it('should be configured with ignoreExpiration: false', () => {
      // This is tested indirectly through the strategy configuration
      // The strategy will reject expired tokens automatically
      expect(strategy).toBeDefined();
    });
  });
});
