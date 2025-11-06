import { ConfigService as NestConfigService } from '@nestjs/config';
export declare class ConfigService {
    private configService;
    constructor(configService: NestConfigService);
    get isDevelopment(): boolean;
    get isProduction(): boolean;
    get databaseUrl(): string;
    get dbHost(): string;
    get dbPort(): number;
    get dbUser(): string;
    get dbPassword(): string;
    get dbName(): string;
    get jwtSecret(): string;
    get jwtExpiration(): string;
    get redisHost(): string;
    get redisPort(): number;
    get serverPort(): number;
    get serverHost(): string;
    get corsOrigin(): string | string[];
    get logLevel(): string;
}
