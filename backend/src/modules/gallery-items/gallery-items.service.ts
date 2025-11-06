import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FileUploadService } from './file-upload.service';
import { CreateGalleryItemDto, UpdateGalleryItemDto, QueryGalleryItemDto } from './dto';

@Injectable()
export class GalleryItemsService {
  constructor(
    private prisma: PrismaService,
    private fileUploadService: FileUploadService,
  ) {}

  /**
   * Create a new gallery item with uploaded file
   */
  async create(
    userId: string,
    createGalleryItemDto: CreateGalleryItemDto,
    file: Express.Multer.File,
  ) {
    const { categoryIds, tagIds, ...galleryItemData } = createGalleryItemDto;

    // Validate and process file
    this.fileUploadService.validateFileSize(file);
    await this.fileUploadService.validateImageDimensions(file.buffer);

    // Process image
    const processedImage = await this.fileUploadService.processImage(file);

    // Generate slug from title
    const slug = this.generateSlug(galleryItemData.title);

    // Check if slug already exists
    const existingGalleryItem = await this.prisma.galleryItem.findUnique({
      where: { slug },
    });

    if (existingGalleryItem) {
      throw new ConflictException(`Gallery item with slug "${slug}" already exists`);
    }

    // Verify author exists
    const author = await this.prisma.author.findUnique({
      where: { id: galleryItemData.authorId },
    });

    if (!author) {
      throw new NotFoundException(`Author with ID "${galleryItemData.authorId}" not found`);
    }

    // Set publishedAt if status is PUBLISHED
    const publishedAt =
      galleryItemData.status === 'PUBLISHED' ? new Date() : null;

    // Create gallery item with relations
    const galleryItem = await this.prisma.galleryItem.create({
      data: {
        ...galleryItemData,
        slug,
        userId,
        fileUrl: processedImage.large, // Main display image
        fileType: processedImage.fileType,
        thumbnail: processedImage.thumbnail,
        publishedAt,
        categories: categoryIds
          ? {
              create: categoryIds.map((categoryId) => ({
                category: { connect: { id: categoryId } },
              })),
            }
          : undefined,
        tags: tagIds
          ? {
              create: tagIds.map((tagId) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
      include: {
        author: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.formatGalleryItemResponse(galleryItem, processedImage);
  }

  /**
   * Find all gallery items with pagination and filtering
   */
  async findAll(queryDto: QueryGalleryItemDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      authorId,
      fileType,
      category,
      tag,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (fileType) {
      where.fileType = fileType;
    }

    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category,
          },
        },
      };
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            slug: tag,
          },
        },
      };
    }

    // Execute query with pagination
    const [galleryItems, total] = await Promise.all([
      this.prisma.galleryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          author: true,
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
            },
          },
          categories: {
            include: {
              category: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              comments: true,
              ratings: true,
            },
          },
        },
      }),
      this.prisma.galleryItem.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: galleryItems.map((item) => this.formatGalleryItemResponse(item)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Find one gallery item by ID
   */
  async findOne(id: string) {
    const galleryItem = await this.prisma.galleryItem.findUnique({
      where: { id },
      include: {
        author: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            comments: true,
            ratings: true,
          },
        },
      },
    });

    if (!galleryItem) {
      throw new NotFoundException(`Gallery item with ID "${id}" not found`);
    }

    return this.formatGalleryItemResponse(galleryItem);
  }

  /**
   * Find one gallery item by slug
   */
  async findBySlug(slug: string) {
    const galleryItem = await this.prisma.galleryItem.findUnique({
      where: { slug },
      include: {
        author: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            comments: true,
            ratings: true,
          },
        },
      },
    });

    if (!galleryItem) {
      throw new NotFoundException(`Gallery item with slug "${slug}" not found`);
    }

    return this.formatGalleryItemResponse(galleryItem);
  }

  /**
   * Update a gallery item
   */
  async update(id: string, updateGalleryItemDto: UpdateGalleryItemDto) {
    // Check if gallery item exists
    const existingGalleryItem = await this.prisma.galleryItem.findUnique({
      where: { id },
    });

    if (!existingGalleryItem) {
      throw new NotFoundException(`Gallery item with ID "${id}" not found`);
    }

    const { categoryIds, tagIds, title, ...galleryItemData } = updateGalleryItemDto;

    // If title is being updated, generate new slug
    let slug = existingGalleryItem.slug;
    if (title && title !== existingGalleryItem.title) {
      slug = this.generateSlug(title);

      // Check if new slug conflicts
      const slugConflict = await this.prisma.galleryItem.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (slugConflict) {
        throw new ConflictException(`Gallery item with slug "${slug}" already exists`);
      }
    }

    // Update publishedAt if status changes to PUBLISHED
    let publishedAt = existingGalleryItem.publishedAt;
    if (galleryItemData.status === 'PUBLISHED' && !existingGalleryItem.publishedAt) {
      publishedAt = new Date();
    }

    // Update gallery item
    const galleryItem = await this.prisma.galleryItem.update({
      where: { id },
      data: {
        ...galleryItemData,
        title,
        slug,
        publishedAt,
        ...(categoryIds !== undefined && {
          categories: {
            deleteMany: {},
            create: categoryIds.map((categoryId) => ({
              category: { connect: { id: categoryId } },
            })),
          },
        }),
        ...(tagIds !== undefined && {
          tags: {
            deleteMany: {},
            create: tagIds.map((tagId) => ({
              tag: { connect: { id: tagId } },
            })),
          },
        }),
      },
      include: {
        author: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return this.formatGalleryItemResponse(galleryItem);
  }

  /**
   * Delete a gallery item and associated files
   */
  async remove(id: string) {
    // Check if gallery item exists
    const galleryItem = await this.prisma.galleryItem.findUnique({
      where: { id },
    });

    if (!galleryItem) {
      throw new NotFoundException(`Gallery item with ID "${id}" not found`);
    }

    // Delete files from storage
    await this.fileUploadService.deleteFiles(galleryItem.fileUrl);

    // Delete gallery item (cascade will handle relations)
    await this.prisma.galleryItem.delete({
      where: { id },
    });

    return { message: 'Gallery item deleted successfully' };
  }

  /**
   * Generate URL-friendly slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Format gallery item response with flattened categories and tags
   */
  private formatGalleryItemResponse(galleryItem: any, processedImage?: any) {
    const formatted: any = {
      ...galleryItem,
      categories: galleryItem.categories?.map((gc: any) => gc.category) || [],
      tags: galleryItem.tags?.map((gt: any) => gt.tag) || [],
      commentsCount: galleryItem._count?.comments || 0,
      ratingsCount: galleryItem._count?.ratings || 0,
    };

    // Add image URLs if processedImage is provided
    if (processedImage) {
      formatted.images = {
        original: processedImage.original,
        large: processedImage.large,
        medium: processedImage.medium,
        thumbnail: processedImage.thumbnail,
      };
    }

    return formatted;
  }
}
