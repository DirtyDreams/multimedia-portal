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
  ApiQuery,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  QueryCommentDto,
  CommentableType,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../types/prisma.types';

@ApiTags('comments')
@Controller('comments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new comment (Authenticated users)' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Content or parent comment not found' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(userId, createCommentDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all comments with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  async findAll(@Query() queryDto: QueryCommentDto) {
    return this.commentsService.findAll(queryDto);
  }

  @Get('content/:contentType/:contentId')
  @Public()
  @ApiOperation({ summary: 'Get comments for specific content' })
  @ApiParam({
    name: 'contentType',
    enum: CommentableType,
    description: 'Type of content',
  })
  @ApiParam({ name: 'contentId', description: 'Content UUID' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Content not found' })
  async getContentComments(
    @Param('contentType', new ParseEnumPipe(CommentableType))
    contentType: CommentableType,
    @Param('contentId', ParseUUIDPipe) contentId: string,
  ) {
    return this.commentsService.getContentComments(contentType, contentId);
  }

  @Get('content/:contentType/:contentId/count')
  @Public()
  @ApiOperation({ summary: 'Get comment count for specific content' })
  @ApiParam({
    name: 'contentType',
    enum: CommentableType,
    description: 'Type of content',
  })
  @ApiParam({ name: 'contentId', description: 'Content UUID' })
  @ApiResponse({ status: 200, description: 'Comment count retrieved successfully' })
  async getCommentCount(
    @Param('contentType', new ParseEnumPipe(CommentableType))
    contentType: CommentableType,
    @Param('contentId', ParseUUIDPipe) contentId: string,
  ) {
    return this.commentsService.getCommentCount(contentType, contentId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get a single comment by ID' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Comment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentsService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a comment (Only comment owner)' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Comment updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not comment owner' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, userId, updateCommentDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a comment (Comment owner or Admin)',
  })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not comment owner or admin' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.MODERATOR;
    return this.commentsService.remove(id, userId, isAdmin);
  }
}
