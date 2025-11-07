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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ConfigService = class ConfigService {
    configService;
    constructor(configService) {
        this.configService = configService;
        this.validateEnvironmentVariables();
    }
    validateEnvironmentVariables() {
        const requiredVars = [
            'DATABASE_URL',
            'DB_USER',
            'DB_PASSWORD',
            'JWT_SECRET',
        ];
        const missingVars = requiredVars.filter((varName) => !this.configService.get(varName));
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}. ` +
                `Please check your .env file and ensure all required variables are set.`);
        }
        const jwtSecret = this.configService.get('JWT_SECRET');
        if (jwtSecret && jwtSecret.length < 32) {
            console.warn('⚠️  WARNING: JWT_SECRET is shorter than recommended 32 characters. ' +
                'Generate a strong secret using: openssl rand -base64 64');
        }
        const dbUrl = this.configService.get('DATABASE_URL');
        if (dbUrl && !dbUrl.startsWith('postgresql://')) {
            throw new Error('DATABASE_URL must be a valid PostgreSQL connection string starting with postgresql://');
        }
        console.log('✅ Environment variables validated successfully');
    }
    get isDevelopment() {
        return this.configService.get('NODE_ENV') === 'development';
    }
    get isProduction() {
        return this.configService.get('NODE_ENV') === 'production';
    }
    get databaseUrl() {
        const url = this.configService.get('DATABASE_URL');
        if (!url) {
            throw new Error('DATABASE_URL is not defined in environment variables');
        }
        return url;
    }
    get dbHost() {
        return this.configService.get('DB_HOST', 'localhost');
    }
    get dbPort() {
        return this.configService.get('DB_PORT', 5432);
    }
    get dbUser() {
        const user = this.configService.get('DB_USER');
        if (!user) {
            throw new Error('DB_USER is not defined in environment variables');
        }
        return user;
    }
    get dbPassword() {
        const password = this.configService.get('DB_PASSWORD');
        if (!password) {
            throw new Error('DB_PASSWORD is not defined in environment variables');
        }
        return password;
    }
    get dbName() {
        return this.configService.get('DB_NAME', 'multimedia_db');
    }
    get jwtSecret() {
        const secret = this.configService.get('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const minLength = 32;
        if (secret.length < minLength) {
            throw new Error(`JWT_SECRET must be at least ${minLength} characters long. Current length: ${secret.length}. ` +
                `Generate a strong secret using: openssl rand -base64 64`);
        }
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
                console.warn(`⚠️  WARNING: JWT_SECRET appears to contain a weak pattern ('${pattern}'). ` +
                    `Please use a cryptographically random secret: openssl rand -base64 64`);
                break;
            }
        }
        return secret;
    }
    get jwtExpiration() {
        return this.configService.get('JWT_EXPIRATION', '86400');
    }
    get bcryptSaltRounds() {
        const saltRounds = this.configService.get('BCRYPT_SALT_ROUNDS', 12);
        if (saltRounds < 10 || saltRounds > 20) {
            console.warn(`⚠️  WARNING: BCRYPT_SALT_ROUNDS (${saltRounds}) is outside recommended range (10-14). ` +
                `Higher values increase security but slow down hashing.`);
        }
        return saltRounds;
    }
    get redisHost() {
        return this.configService.get('REDIS_HOST', 'localhost');
    }
    get redisPort() {
        return this.configService.get('REDIS_PORT', 6379);
    }
    get serverPort() {
        return this.configService.get('SERVER_PORT', 3000);
    }
    get serverHost() {
        return this.configService.get('SERVER_HOST', '0.0.0.0');
    }
    get corsOrigin() {
        const origin = this.configService.get('CORS_ORIGIN');
        return origin ? origin.split(',').map((o) => o.trim()) : '*';
    }
    get logLevel() {
        return this.configService.get('LOG_LEVEL', 'debug');
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ConfigService);
//# sourceMappingURL=config.service.js.map