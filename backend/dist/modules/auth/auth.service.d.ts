import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../config/config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, LoginDto, AuthResponseDto, UserResponseDto } from './dto';
export declare class AuthService {
    private jwtService;
    private prisma;
    private configService;
    constructor(jwtService: JwtService, prisma: PrismaService, configService: ConfigService);
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    getProfile(userId: string): Promise<UserResponseDto>;
    logout(userId: string, token: string): Promise<void>;
    refreshToken(refreshToken: string): Promise<AuthResponseDto>;
    private hashPassword;
    private comparePassword;
    private generateTokens;
    private saveSession;
    private sanitizeUser;
}
