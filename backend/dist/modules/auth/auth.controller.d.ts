import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, AuthResponseDto, UserResponseDto } from './dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    getProfile(userId: string): Promise<UserResponseDto>;
    logout(userId: string, token: string): Promise<{
        message: string;
    }>;
    refreshToken(refreshToken: string): Promise<AuthResponseDto>;
}
