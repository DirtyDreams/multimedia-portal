import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Search content with filters and facets' })
  @ApiResponse({ status: 200, description: 'Search results retrieved successfully' })
  async search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }

  @Get('autocomplete')
  @Public()
  @ApiOperation({ summary: 'Get autocomplete suggestions' })
  @ApiResponse({ status: 200, description: 'Autocomplete suggestions retrieved' })
  async autocomplete(
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.searchService.autocomplete(query, limit);
  }

  @Post('reindex')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reindex all content (Admin only)' })
  @ApiResponse({ status: 200, description: 'Content reindexed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async reindex() {
    return this.searchService.indexAllContent();
  }
}
