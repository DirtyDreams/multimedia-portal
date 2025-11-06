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
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import {
  CreateRatingDto,
  UpdateRatingDto,
  QueryRatingDto,
  RatableType,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../types/prisma.types';

@ApiTags('ratings')
@Controller('ratings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create or update a rating (Authenticated users)',
  })
  @ApiResponse({ status: 201, description: 'Rating created/updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createRatingDto: CreateRatingDto,
  ) {
    return this.ratingsService.create(userId, createRatingDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all ratings with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Ratings retrieved successfully' })
  async findAll(@Query() queryDto: QueryRatingDto) {
    return this.ratingsService.findAll(queryDto);
  }

  @Get('content/:contentType/:contentId')
  @Public()
  @ApiOperation({ summary: 'Get ratings for specific content' })
  @ApiParam({
    name: 'contentType',
    enum: RatableType,
    description: 'Type of content',
  })
  @ApiParam({ name: 'contentId', description: 'Content UUID' })
  @ApiResponse({ status: 200, description: 'Ratings retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getContentRatings(
    @Param('contentType', new ParseEnumPipe(RatableType))
    contentType: RatableType,
    @Param('contentId', ParseUUIDPipe) contentId: string,
  ) {
    return this.ratingsService.getContentRatings(contentType, contentId);
  }

  @Get('content/:contentType/:contentId/average')
  @Public()
  @ApiOperation({ summary: 'Get average rating for specific content' })
  @ApiParam({
    name: 'contentType',
    enum: RatableType,
    description: 'Type of content',
  })
  @ApiParam({ name: 'contentId', description: 'Content UUID' })
  @ApiResponse({
    status: 200,
    description: 'Average rating retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getAverageRating(
    @Param('contentType', new ParseEnumPipe(RatableType))
    contentType: RatableType,
    @Param('contentId', ParseUUIDPipe) contentId: string,
  ) {
    return this.ratingsService.getAverageRating(contentType, contentId);
  }

  @Get('user/:contentType/:contentId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user\'s rating for specific content' })
  @ApiParam({
    name: 'contentType',
    enum: RatableType,
    description: 'Type of content',
  })
  @ApiParam({ name: 'contentId', description: 'Content UUID' })
  @ApiResponse({ status: 200, description: 'User rating retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserRating(
    @CurrentUser('id') userId: string,
    @Param('contentType', new ParseEnumPipe(RatableType))
    contentType: RatableType,
    @Param('contentId', ParseUUIDPipe) contentId: string,
  ) {
    return this.ratingsService.getUserRating(userId, contentType, contentId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a single rating by ID' })
  @ApiParam({ name: 'id', description: 'Rating UUID' })
  @ApiResponse({ status: 200, description: 'Rating retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Rating not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.ratingsService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a rating (Only rating owner)' })
  @ApiParam({ name: 'id', description: 'Rating UUID' })
  @ApiResponse({ status: 200, description: 'Rating updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not rating owner' })
  @ApiResponse({ status: 404, description: 'Rating not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() updateRatingDto: UpdateRatingDto,
  ) {
    return this.ratingsService.update(id, userId, updateRatingDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a rating (Rating owner or Admin)' })
  @ApiParam({ name: 'id', description: 'Rating UUID' })
  @ApiResponse({ status: 200, description: 'Rating deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not rating owner or admin' })
  @ApiResponse({ status: 404, description: 'Rating not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;
    return this.ratingsService.remove(id, userId, isAdmin);
  }
}
