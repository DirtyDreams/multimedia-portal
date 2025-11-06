import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SearchEnhancedService } from './search-enhanced.service';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../types/prisma.types';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchEnhancedController {
  constructor(
    private readonly searchEnhancedService: SearchEnhancedService,
    private readonly searchService: SearchService, // Keep original for reindex
  ) {}

  @Get()
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({
    summary: 'Search content with filters, facets, and caching',
    description: 'Optimized search endpoint with Redis caching and rate limiting'
  })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async search(@Query() query: SearchQueryDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.searchEnhancedService.search(query, userId);
  }

  @Get('autocomplete')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute (more lenient for autocomplete)
  @ApiOperation({
    summary: 'Get autocomplete suggestions with aggressive caching',
    description: 'Fast autocomplete endpoint optimized for real-time suggestions'
  })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions retrieved' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limit exceeded' })
  async autocomplete(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchEnhancedService.autocomplete(query, limit);
  }

  @Post('reindex')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 1, ttl: 300000 } }) // 1 request per 5 minutes
  @ApiOperation({
    summary: 'Reindex all content and clear cache (Admin only)',
    description: 'Full reindexing operation - should be used sparingly'
  })
  @ApiResponse({ status: 200, description: 'Content reindexed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  @ApiResponse({ status: 429, description: 'Too many requests - wait before reindexing again' })
  async reindex() {
    // Clear cache before reindexing
    await this.searchEnhancedService.clearSearchCache();

    // Use original service for full reindex
    return this.searchService.indexAllContent();
  }

  @Post('clear-cache')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Clear search cache (Admin only)',
    description: 'Manually clear Redis cache for search results'
  })
  @ApiResponse({ status: 200, description: 'Cache cleared successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async clearCache() {
    await this.searchEnhancedService.clearSearchCache();
    return { message: 'Search cache cleared successfully' };
  }

  @Post('index/:contentType/:contentId')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Index or update a single content item (Admin/Moderator)',
    description: 'Index individual content item with cache invalidation'
  })
  @ApiResponse({ status: 200, description: 'Content indexed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - moderator+ only' })
  async indexContent(
    @Query('contentType') contentType: string,
    @Query('contentId') contentId: string,
  ) {
    await this.searchEnhancedService.indexContent(contentId, contentType);
    return { message: `${contentType} ${contentId} indexed successfully` };
  }
}
