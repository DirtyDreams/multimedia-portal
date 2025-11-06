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
} from '@nestjs/swagger';
import { AuthorsService } from './authors.service';
import { CreateAuthorDto, UpdateAuthorDto, QueryAuthorDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../types/prisma.types';
import { FileUploadService } from '../gallery-items/file-upload.service';

@ApiTags('authors')
@Controller('authors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuthorsController {
  constructor(
    private readonly authorsService: AuthorsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new author (Admin/Moderator only)' })
  @ApiResponse({ status: 201, description: 'Author created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Author with this slug already exists' })
  async create(@Body() createAuthorDto: CreateAuthorDto) {
    return this.authorsService.create(createAuthorDto);
  }

  @Post('upload-profile-image')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload author profile image (Admin/Moderator only)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Profile image uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const processedImage = await this.fileUploadService.processImage(file);

    return {
      profileImageUrl: processedImage.original,
      thumbnailUrl: processedImage.thumbnail,
    };
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all authors with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Authors retrieved successfully' })
  async findAll(@Query() queryDto: QueryAuthorDto) {
    return this.authorsService.findAll(queryDto);
  }

  @Get(':identifier')
  @Public()
  @ApiOperation({ summary: 'Get an author by ID or slug' })
  @ApiParam({
    name: 'identifier',
    description: 'Author UUID or slug',
    example: '123e4567-e89b-12d3-a456-426614174000 or john-doe',
  })
  @ApiResponse({ status: 200, description: 'Author retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Author not found' })
  async findOne(@Param('identifier') identifier: string) {
    // Check if identifier is a UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(identifier)) {
      return this.authorsService.findOne(identifier);
    } else {
      return this.authorsService.findBySlug(identifier);
    }
  }

  @Get(':id/content/:contentType')
  @Public()
  @ApiOperation({ summary: 'Get author content by type (articles, blogPosts, etc.)' })
  @ApiParam({ name: 'id', description: 'Author UUID' })
  @ApiParam({
    name: 'contentType',
    description: 'Content type',
    enum: ['articles', 'blogPosts', 'wikiPages', 'galleryItems', 'stories'],
  })
  @ApiResponse({ status: 200, description: 'Content retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Author not found' })
  async getAuthorContent(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contentType') contentType: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.authorsService.getAuthorContent(id, contentType, page, limit);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an author (Admin/Moderator only)' })
  @ApiParam({ name: 'id', description: 'Author UUID' })
  @ApiResponse({ status: 200, description: 'Author updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Author not found' })
  @ApiResponse({ status: 409, description: 'Author with this slug already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
  ) {
    return this.authorsService.update(id, updateAuthorDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an author (Admin only)' })
  @ApiParam({ name: 'id', description: 'Author UUID' })
  @ApiResponse({ status: 200, description: 'Author deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Author not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.authorsService.remove(id);
  }
}
