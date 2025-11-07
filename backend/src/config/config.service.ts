import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {
    // Validate critical environment variables on startup
    this.validateEnvironmentVariables();
  }

  /**
   * Validate that all required environment variables are set
   * Throws error on startup if any critical variable is missing
   */
  private validateEnvironmentVariables(): void {
    const requiredVars = [
      'DATABASE_URL',
      'DB_USER',
      'DB_PASSWORD',
      'JWT_SECRET',
    ];

    const missingVars = requiredVars.filter(
      (varName) => !this.configService.get<string>(varName),
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(', ')}. ` +
          `Please check your .env file and ensure all required variables are set.`,
      );
    }

    // Validate JWT secret strength
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (jwtSecret && jwtSecret.length < 32) {
      console.warn(
        '⚠️  WARNING: JWT_SECRET is shorter than recommended 32 characters. ' +
          'Generate a strong secret using: openssl rand -base64 64',
      );
    }

    // Validate database URL format
    const dbUrl = this.configService.get<string>('DATABASE_URL');
    if (dbUrl && !dbUrl.startsWith('postgresql://')) {
      throw new Error(
        'DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql://',
      );
    }

    console.log('✅ Environment variables validated successfully');
  }

  get isDevelopment(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'development';
  }

  get isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  // Database
  get databaseUrl(): string {
    const url = this.configService.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }
    return url;
  }

  get dbHost(): string {
    return this.configService.get<string>('DB_HOST', 'localhost');
  }

  get dbPort(): number {
    return this.configService.get<number>('DB_PORT', 5432);
  }

  get dbUser(): string {
    const user = this.configService.get<string>('DB_USER');
    if (!user) {
      throw new Error('DB_USER is not defined in environment variables');
    }
    return user;
  }

  get dbPassword(): string {
    const password = this.configService.get<string>('DB_PASSWORD');
    if (!password) {
      throw new Error('DB_PASSWORD is not defined in environment variables');
    }
    return password;
  }

  get dbName(): string {
    return this.configService.get<string>('DB_NAME', 'multimedia_db');
  }

  // JWT
  get jwtSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    // Validate JWT secret strength
    const minLength = 32;
    if (secret.length < minLength) {
      throw new Error(
        `JWT_SECRET must be at least ${minLength} characters long. Current length: ${secret.length}. ` +
          `Generate a strong secret using: openssl rand -base64 64`,
      );
    }

    // Warn if using common/weak patterns
    const weakPatterns = [
      'secret',
      'password',
      'change-in-production',
      'your-secret',
      'jwt-secret',
      '123456',
      'test',
    ];
    const lowerSecret = secret.toLowerCase();
    for (const pattern of weakPatterns) {
      if (lowerSecret.includes(pattern)) {
        console.warn(
          `⚠️  WARNING: JWT_SECRET appears to contain a weak pattern ('${pattern}'). ` +
            `Please use a cryptographically random secret: openssl rand -base64 64`,
        );
        break;
      }
    }

    return secret;
  }

  get jwtExpiration(): string {
    return this.configService.get<string>('JWT_EXPIRATION', '86400');
  }

  // Redis
  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST', 'localhost');
  }

  get redisPort(): number {
    return this.configService.get<number>('REDIS_PORT', 6379);
  }

  // Server
  get serverPort(): number {
    return this.configService.get<number>('SERVER_PORT', 3000);
  }

  get serverHost(): string {
    return this.configService.get<string>('SERVER_HOST', '0.0.0.0');
  }

  // CORS
  get corsOrigin(): string | string[] {
    const origin = this.configService.get<string>('CORS_ORIGIN');
    return origin ? origin.split(',').map((o) => o.trim()) : '*';
  }

  // Logger
  get logLevel(): string {
    return this.configService.get<string>('LOG_LEVEL', 'debug');
  }
}
