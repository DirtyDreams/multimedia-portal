import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import {
  TrackPageViewDto,
  TrackContentViewDto,
  TrackSearchDto,
  TrackEngagementDto,
} from './dto/track-event.dto';
import {
  DashboardStatsDto,
  PopularContentDto,
  TrendsDto,
  UserPathDto,
} from './dto/analytics-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Public } from '../../common/decorators';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get client IP from request
   */
  private getClientIP(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      req.ip ||
      '0.0.0.0'
    );
  }

  /**
   * Track page view event
   */
  @Public()
  @Post('track/page-view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Track page view',
    description: 'Track a page view event. Privacy-friendly, no personal data stored.',
  })
  @ApiResponse({ status: 204, description: 'Event tracked successfully' })
  async trackPageView(@Body() dto: TrackPageViewDto, @Req() req: Request): Promise<void> {
    const ip = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    await this.analyticsService.trackPageView(
      dto.path,
      ip,
      userAgent,
      dto.referrer,
      dto.duration,
    );
  }

  /**
   * Track content view event
   */
  @Public()
  @Post('track/content-view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Track content view',
    description: 'Track when specific content is viewed.',
  })
  @ApiResponse({ status: 204, description: 'Event tracked successfully' })
  async trackContentView(@Body() dto: TrackContentViewDto, @Req() req: Request): Promise<void> {
    const ip = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    await this.analyticsService.trackContentView(
      dto.contentType,
      dto.contentId,
      ip,
      userAgent,
      dto.duration,
    );
  }

  /**
   * Track search event
   */
  @Public()
  @Post('track/search')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Track search query',
    description: 'Track search queries to understand user needs.',
  })
  @ApiResponse({ status: 204, description: 'Event tracked successfully' })
  async trackSearch(@Body() dto: TrackSearchDto, @Req() req: Request): Promise<void> {
    const ip = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    await this.analyticsService.trackSearch(dto.query, dto.resultsCount, ip, userAgent);
  }

  /**
   * Track engagement event
   */
  @Public()
  @Post('track/engagement')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Track user engagement',
    description: 'Track engagement events like comments, ratings, shares.',
  })
  @ApiResponse({ status: 204, description: 'Event tracked successfully' })
  async trackEngagement(@Body() dto: TrackEngagementDto, @Req() req: Request): Promise<void> {
    const ip = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';

    await this.analyticsService.trackEngagement(
      dto.eventName,
      dto.contentType,
      dto.contentId,
      ip,
      userAgent,
    );
  }

  /**
   * Get dashboard statistics (Admin only)
   */
  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get analytics dashboard data',
    description: 'Retrieve overall analytics statistics for dashboard. Admin/Moderator only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Moderator role required' })
  async getDashboard(): Promise<DashboardStatsDto> {
    return this.analyticsService.getDashboardStats();
  }

  /**
   * Get popular content (Admin only)
   */
  @Get('popular')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get popular content',
    description: 'Retrieve most viewed content. Admin/Moderator only.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['last_7_days', 'last_30_days', 'all_time'],
    description: 'Time period for popular content',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of items to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Popular content retrieved successfully',
    type: PopularContentDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getPopularContent(
    @Query('period') period?: string,
    @Query('limit') limit?: number,
  ): Promise<PopularContentDto> {
    return this.analyticsService.getPopularContent(period || 'last_7_days', limit || 50);
  }

  /**
   * Get trend data (Admin only)
   */
  @Get('trends')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get analytics trends',
    description: 'Retrieve analytics trends over time. Admin/Moderator only.',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['daily', 'weekly', 'monthly'],
    description: 'Aggregation period',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days to include',
  })
  @ApiResponse({
    status: 200,
    description: 'Trends retrieved successfully',
    type: TrendsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getTrends(
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
    @Query('days') days?: number,
  ): Promise<TrendsDto> {
    return this.analyticsService.getTrends(period || 'daily', days || 30);
  }

  /**
   * Get user navigation paths (Admin only)
   */
  @Get('user-paths')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Get user navigation paths',
    description: 'Retrieve common user navigation paths. Admin/Moderator only.',
  })
  @ApiResponse({
    status: 200,
    description: 'User paths retrieved successfully',
    type: UserPathDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUserPaths(): Promise<UserPathDto> {
    return this.analyticsService.getUserPaths();
  }
}
