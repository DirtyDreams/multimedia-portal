import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import { CreateStoryDto, UpdateStoryDto, QueryStoryDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../types/prisma.types';

@ApiTags('stories')
@Controller('stories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new story (Admin/Moderator only)' })
  @ApiResponse({ status: 201, description: 'Story created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Story with this slug already exists' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createStoryDto: CreateStoryDto,
  ) {
    return this.storiesService.create(userId, createStoryDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all stories with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Stories retrieved successfully' })
  async findAll(@Query() queryDto: QueryStoryDto) {
    return this.storiesService.findAll(queryDto);
  }

  @Get('series')
  @Public()
  @ApiOperation({ summary: 'Get all unique series names' })
  @ApiResponse({ status: 200, description: 'Series list retrieved successfully' })
  async getSeries() {
    return this.storiesService.getSeries();
  }

  @Get(':identifier')
  @Public()
  @ApiOperation({ summary: 'Get a story by ID or slug' })
  @ApiParam({
    name: 'identifier',
    description: 'Story UUID or slug',
    example: '123e4567-e89b-12d3-a456-426614174000 or my-story-slug',
  })
  @ApiResponse({ status: 200, description: 'Story retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  async findOne(@Param('identifier') identifier: string) {
    // Check if identifier is a UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(identifier)) {
      return this.storiesService.findOne(identifier);
    } else {
      return this.storiesService.findBySlug(identifier);
    }
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a story (Admin/Moderator only)' })
  @ApiParam({ name: 'id', description: 'Story UUID' })
  @ApiResponse({ status: 200, description: 'Story updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  @ApiResponse({ status: 409, description: 'Story with this slug already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStoryDto: UpdateStoryDto,
  ) {
    return this.storiesService.update(id, updateStoryDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a story (Admin only)' })
  @ApiParam({ name: 'id', description: 'Story UUID' })
  @ApiResponse({ status: 200, description: 'Story deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Story not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.storiesService.remove(id);
  }
}
