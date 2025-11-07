import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto, AnalyticsQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../types/prisma.types';
import type { Request } from 'express';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Track an analytics event',
    description: 'Privacy-friendly event tracking without storing personal data',
  })
  @ApiResponse({
    status: 204,
    description: 'Event tracked successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid event data',
  })
  async trackEvent(@Body() trackEventDto: TrackEventDto, @Req() req: Request): Promise<void> {
    const ip = req.ip || req.headers['x-forwarded-for'] as string;
    const userAgent = req.headers['user-agent'];

    await this.analyticsService.trackEvent(trackEventDto, ip, userAgent);
  }

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get analytics dashboard data (Admin/Moderator only)',
    description: 'Comprehensive dashboard statistics including views, content, and trends',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard stats retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalViews: { type: 'number', example: 15420 },
        totalUniqueVisitors: { type: 'number', example: 3250 },
        totalContent: { type: 'number', example: 85 },
        totalComments: { type: 'number', example: 423 },
        totalRatings: { type: 'number', example: 156 },
        avgRating: { type: 'number', example: 4.2 },
        topContent: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              contentId: { type: 'string' },
              contentType: { type: 'string' },
              title: { type: 'string' },
              views: { type: 'number' },
              comments: { type: 'number' },
              avgRating: { type: 'number' },
            },
          },
        },
        viewsByDay: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string' },
              views: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin/Moderator only',
  })
  async getDashboard(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getDashboardStats(query);
  }

  @Get('popular')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get popular content (Admin/Moderator only)',
    description: 'List of most viewed and engaged content',
  })
  @ApiResponse({
    status: 200,
    description: 'Popular content retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        contentType: { type: 'string', nullable: true },
        period: { type: 'string', enum: ['day', 'week', 'month'] },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              contentId: { type: 'string' },
              contentType: { type: 'string' },
              title: { type: 'string' },
              views: { type: 'number' },
              comments: { type: 'number' },
              avgRating: { type: 'number' },
              totalRatings: { type: 'number' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin/Moderator only',
  })
  async getPopularContent(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getPopularContent(query);
  }

  @Get('trends')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get analytics trends over time (Admin/Moderator only)',
    description: 'Views and visitor trends for the specified time period',
  })
  @ApiResponse({
    status: 200,
    description: 'Trends data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        period: { type: 'string', enum: ['day', 'week', 'month', 'year'] },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', example: '2025-11-07' },
              views: { type: 'number', example: 423 },
              visitors: { type: 'number', example: 87 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin/Moderator only',
  })
  async getTrends(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getTrends(query);
  }
}
