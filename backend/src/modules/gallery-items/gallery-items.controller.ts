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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { GalleryItemsService } from './gallery-items.service';
import { CreateGalleryItemDto, UpdateGalleryItemDto, QueryGalleryItemDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../types/prisma.types';

@ApiTags('gallery')
@Controller('gallery')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GalleryItemsController {
  constructor(private readonly galleryItemsService: GalleryItemsService) {}

  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload and create a new gallery item (Admin/Moderator only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file to upload',
        },
        title: {
          type: 'string',
          description: 'Gallery item title',
        },
        description: {
          type: 'string',
          description: 'Gallery item description (optional)',
        },
        status: {
          type: 'string',
          enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
          description: 'Gallery item status (optional)',
        },
        authorId: {
          type: 'string',
          description: 'Author ID',
        },
        categoryIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Category IDs (optional)',
        },
        tagIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tag IDs (optional)',
        },
      },
      required: ['file', 'title', 'authorId'],
    },
  })
  @ApiResponse({ status: 201, description: 'Gallery item created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Gallery item with this slug already exists' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @HttpCode(HttpStatus.CREATED)
  async upload(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() createGalleryItemDto: CreateGalleryItemDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Parse categoryIds and tagIds if they're strings (from form-data)
    if (typeof createGalleryItemDto.categoryIds === 'string') {
      createGalleryItemDto.categoryIds = JSON.parse(
        createGalleryItemDto.categoryIds as any,
      );
    }
    if (typeof createGalleryItemDto.tagIds === 'string') {
      createGalleryItemDto.tagIds = JSON.parse(
        createGalleryItemDto.tagIds as any,
      );
    }

    return this.galleryItemsService.create(userId, createGalleryItemDto, file);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all gallery items with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Gallery items retrieved successfully' })
  async findAll(@Query() queryDto: QueryGalleryItemDto) {
    return this.galleryItemsService.findAll(queryDto);
  }

  @Get(':identifier')
  @Public()
  @ApiOperation({ summary: 'Get a single gallery item by ID or slug' })
  @ApiParam({ name: 'identifier', description: 'Gallery item ID or slug' })
  @ApiResponse({ status: 200, description: 'Gallery item retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Gallery item not found' })
  async findOne(@Param('identifier') identifier: string) {
    // Try to find by ID first (UUID format), otherwise by slug
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        identifier,
      );

    if (isUUID) {
      return this.galleryItemsService.findOne(identifier);
    }

    return this.galleryItemsService.findBySlug(identifier);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a gallery item (Admin/Moderator only)' })
  @ApiParam({ name: 'id', description: 'Gallery item ID' })
  @ApiResponse({ status: 200, description: 'Gallery item updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Gallery item not found' })
  @ApiResponse({ status: 409, description: 'Gallery item with this slug already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateGalleryItemDto: UpdateGalleryItemDto,
  ) {
    return this.galleryItemsService.update(id, updateGalleryItemDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a gallery item (Admin only)' })
  @ApiParam({ name: 'id', description: 'Gallery item ID' })
  @ApiResponse({ status: 200, description: 'Gallery item deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Gallery item not found' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.galleryItemsService.remove(id);
  }
}
