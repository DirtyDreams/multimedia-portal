import { Controller, Post, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Req() req: any) {
    return {
      message: 'User registration endpoint',
      data: null,
    };
  }

  @Post('login')
  async login(@Req() req: any) {
    return {
      message: 'User login endpoint',
      token: null,
    };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getProfile(@Req() req: any) {
    return {
      message: 'Current user profile',
      user: req.user,
    };
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  logout(@Req() req: any) {
    return {
      message: 'User logged out successfully',
    };
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  refreshToken(@Req() req: any) {
    return {
      message: 'Token refreshed',
      token: null,
    };
  }
}
