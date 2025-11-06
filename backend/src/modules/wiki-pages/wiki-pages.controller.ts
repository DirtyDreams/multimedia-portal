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
import { WikiPagesService } from './wiki-pages.service';
import { CreateWikiPageDto, UpdateWikiPageDto, QueryWikiPageDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../types/prisma.types';

@ApiTags('wiki')
@Controller('wiki')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WikiPagesController {
  constructor(private readonly wikiPagesService: WikiPagesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new wiki page (Admin/Moderator only)' })
  @ApiResponse({ status: 201, description: 'Wiki page created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Parent wiki page not found' })
  @ApiResponse({ status: 409, description: 'Wiki page with this slug already exists' })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('id') userId: string,
    @Body() createWikiPageDto: CreateWikiPageDto,
  ) {
    return this.wikiPagesService.create(userId, createWikiPageDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all wiki pages with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Wiki pages retrieved successfully' })
  async findAll(@Query() queryDto: QueryWikiPageDto) {
    return this.wikiPagesService.findAll(queryDto);
  }

  @Get('tree')
  @Public()
  @ApiOperation({ summary: 'Get wiki pages as hierarchical tree structure' })
  @ApiResponse({ status: 200, description: 'Wiki tree retrieved successfully' })
  async getTree() {
    return this.wikiPagesService.getTree();
  }

  @Get(':identifier/children')
  @Public()
  @ApiOperation({ summary: 'Get children of a specific wiki page' })
  @ApiParam({ name: 'identifier', description: 'Wiki page ID' })
  @ApiResponse({ status: 200, description: 'Children retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Wiki page not found' })
  async getChildren(@Param('identifier') identifier: string) {
    return this.wikiPagesService.getChildren(identifier);
  }

  @Get(':identifier/breadcrumbs')
  @Public()
  @ApiOperation({ summary: 'Get breadcrumb path from root to wiki page' })
  @ApiParam({ name: 'identifier', description: 'Wiki page ID' })
  @ApiResponse({ status: 200, description: 'Breadcrumbs retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Wiki page not found' })
  async getBreadcrumbs(@Param('identifier') identifier: string) {
    return this.wikiPagesService.getBreadcrumbs(identifier);
  }

  @Get(':identifier')
  @Public()
  @ApiOperation({ summary: 'Get a single wiki page by ID or slug' })
  @ApiParam({ name: 'identifier', description: 'Wiki page ID or slug' })
  @ApiResponse({ status: 200, description: 'Wiki page retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Wiki page not found' })
  async findOne(@Param('identifier') identifier: string) {
    // Try to find by ID first (UUID format), otherwise by slug
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier,
      );

    if (isUUID) {
      return this.wikiPagesService.findOne(identifier);
    }

    return this.wikiPagesService.findBySlug(identifier);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a wiki page (Admin/Moderator only)' })
  @ApiParam({ name: 'id', description: 'Wiki page ID' })
  @ApiResponse({ status: 200, description: 'Wiki page updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or circular reference detected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Wiki page not found' })
  @ApiResponse({ status: 409, description: 'Wiki page with this slug already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateWikiPageDto: UpdateWikiPageDto,
  ) {
    return this.wikiPagesService.update(id, updateWikiPageDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a wiki page (Admin only)' })
  @ApiParam({ name: 'id', description: 'Wiki page ID' })
  @ApiResponse({ status: 200, description: 'Wiki page deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete page with children' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Wiki page not found' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.wikiPagesService.remove(id);
  }
}
