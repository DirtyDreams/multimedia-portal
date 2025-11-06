import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '../../config/config.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto, LoginDto, AuthResponseDto, UserResponseDto } from './dto';
import { User } from '../../types/prisma.types';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, username, password, name } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already registered');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username already taken');
      }
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
        role: 'USER',
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token session
    await this.saveSession(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { emailOrUsername, password } = loginDto;

    // Find user by email or username
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Save refresh token session
    await this.saveSession(user.id, tokens.refreshToken);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Logout user
   */
  async logout(userId: string, token: string): Promise<void> {
    // Invalidate session
    await this.prisma.session.deleteMany({
      where: {
        userId,
        token,
      },
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken);

      // Find session
      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Delete old session
      await this.prisma.session.delete({
        where: { id: session.id },
      });

      // Generate new tokens
      const tokens = await this.generateTokens(session.user);

      // Save new session
      await this.saveSession(session.user.id, tokens.refreshToken);

      return {
        ...tokens,
        user: this.sanitizeUser(session.user),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Hash password with bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash
   */
  private async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m', // Short-lived access token
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d', // Long-lived refresh token
    });

    return { accessToken, refreshToken };
  }

  /**
   * Save refresh token session in database
   */
  private async saveSession(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.session.create({
      data: {
        userId,
        token: refreshToken.substring(0, 50), // Store partial token as identifier
        refreshToken,
        expiresAt,
      },
    });
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: User): UserResponseDto {
    const { password, profileImage, emailVerified, isActive, ...sanitized } = user;
    return {
      ...sanitized,
      name: user.name ?? undefined,
    };
  }
}
