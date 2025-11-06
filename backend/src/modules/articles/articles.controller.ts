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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto, UpdateArticleDto, QueryArticleDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../types/prisma.types';

@ApiTags('articles')
@Controller('articles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new article (Admin/Moderator only)' })
  @ApiResponse({ status: 201, description: 'Article created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Article with this slug already exists' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('id') userId: string,
    @Body() createArticleDto: CreateArticleDto,
  ) {
    return this.articlesService.create(userId, createArticleDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all articles with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Articles retrieved successfully' })
  async findAll(@Query() queryDto: QueryArticleDto) {
    return this.articlesService.findAll(queryDto);
  }

  @Get(':identifier')
  @Public()
  @ApiOperation({ summary: 'Get a single article by ID or slug' })
  @ApiParam({ name: 'identifier', description: 'Article ID or slug' })
  @ApiResponse({ status: 200, description: 'Article retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async findOne(@Param('identifier') identifier: string) {
    // Try to find by ID first (UUID format), otherwise by slug
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier,
      );

    if (isUUID) {
      return this.articlesService.findOne(identifier);
    }

    return this.articlesService.findBySlug(identifier);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an article (Admin/Moderator only)' })
  @ApiParam({ name: 'id', description: 'Article ID' })
  @ApiResponse({ status: 200, description: 'Article updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @ApiResponse({ status: 409, description: 'Article with this slug already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an article (Admin only)' })
  @ApiParam({ name: 'id', description: 'Article ID' })
  @ApiResponse({ status: 200, description: 'Article deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }
}
