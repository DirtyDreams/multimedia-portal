import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateRatingDto,
  UpdateRatingDto,
  QueryRatingDto,
  RatableType,
} from './dto';

@Injectable()
export class RatingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new rating or update existing one
   */
  async create(userId: string, createRatingDto: CreateRatingDto) {
    const { contentType, contentId, value } = createRatingDto;

    // Verify content exists
    await this.verifyContentExists(contentType, contentId);

    // Check if user already rated this content
    const existingRating = await this.prisma.rating.findFirst({
      where: {
        userId,
        contentType,
        contentId,
      },
    });

    // Determine the specific content foreign key based on contentType
    const contentForeignKey = this.getContentForeignKey(contentType);

    if (existingRating) {
      // Update existing rating
      const rating = await this.prisma.rating.update({
        where: { id: existingRating.id },
        data: { value },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      });

      return this.formatRatingResponse(rating);
    }

    // Create new rating
    const rating = await this.prisma.rating.create({
      data: {
        value,
        contentType,
        contentId,
        userId,
        [contentForeignKey]: contentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return this.formatRatingResponse(rating);
  }

  /**
   * Find all ratings with pagination and filtering
   */
  async findAll(queryDto: QueryRatingDto) {
    const {
      page = 1,
      limit = 20,
      contentType,
      contentId,
      userId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (contentType) {
      where.contentType = contentType;
    }

    if (contentId) {
      where.contentId = contentId;
    }

    if (userId) {
      where.userId = userId;
    }

    // Execute query with pagination
    const [ratings, total] = await Promise.all([
      this.prisma.rating.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.rating.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: ratings.map((rating) => this.formatRatingResponse(rating)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get ratings for specific content
   */
  async getContentRatings(contentType: RatableType, contentId: string) {
    // Verify content exists
    await this.verifyContentExists(contentType, contentId);

    const ratings = await this.prisma.rating.findMany({
      where: {
        contentType,
        contentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return ratings.map((rating) => this.formatRatingResponse(rating));
  }

  /**
   * Get average rating for specific content
   */
  async getAverageRating(contentType: RatableType, contentId: string) {
    // Verify content exists
    await this.verifyContentExists(contentType, contentId);

    const result = await this.prisma.rating.aggregate({
      where: {
        contentType,
        contentId,
      },
      _avg: {
        value: true,
      },
      _count: {
        value: true,
      },
    });

    return {
      average: result._avg.value || 0,
      count: result._count.value,
    };
  }

  /**
   * Get user's rating for specific content
   */
  async getUserRating(
    userId: string,
    contentType: RatableType,
    contentId: string,
  ) {
    const rating = await this.prisma.rating.findFirst({
      where: {
        userId,
        contentType,
        contentId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    if (!rating) {
      return null;
    }

    return this.formatRatingResponse(rating);
  }

  /**
   * Find one rating by ID
   */
  async findOne(id: string) {
    const rating = await this.prisma.rating.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    if (!rating) {
      throw new NotFoundException(`Rating with ID "${id}" not found`);
    }

    return this.formatRatingResponse(rating);
  }

  /**
   * Update a rating (only by owner)
   */
  async update(id: string, userId: string, updateRatingDto: UpdateRatingDto) {
    // Check if rating exists
    const existingRating = await this.prisma.rating.findUnique({
      where: { id },
    });

    if (!existingRating) {
      throw new NotFoundException(`Rating with ID "${id}" not found`);
    }

    // Verify user is the owner
    if (existingRating.userId !== userId) {
      throw new ForbiddenException('You can only edit your own ratings');
    }

    // Update rating
    const rating = await this.prisma.rating.update({
      where: { id },
      data: {
        value: updateRatingDto.value,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    return this.formatRatingResponse(rating);
  }

  /**
   * Delete a rating (by owner or admin)
   */
  async remove(id: string, userId: string, isAdmin: boolean) {
    // Check if rating exists
    const rating = await this.prisma.rating.findUnique({
      where: { id },
    });

    if (!rating) {
      throw new NotFoundException(`Rating with ID "${id}" not found`);
    }

    // Verify user is the owner or admin
    if (!isAdmin && rating.userId !== userId) {
      throw new ForbiddenException('You can only delete your own ratings');
    }

    // Delete rating
    await this.prisma.rating.delete({
      where: { id },
    });

    return { message: 'Rating deleted successfully' };
  }

  /**
   * Verify content exists based on content type
   */
  private async verifyContentExists(
    contentType: RatableType,
    contentId: string,
  ) {
    let content: any = null;

    switch (contentType) {
      case RatableType.ARTICLE:
        content = await this.prisma.article.findUnique({
          where: { id: contentId },
        });
        break;

      case RatableType.BLOG_POST:
        content = await this.prisma.blogPost.findUnique({
          where: { id: contentId },
        });
        break;

      case RatableType.WIKI_PAGE:
        content = await this.prisma.wikiPage.findUnique({
          where: { id: contentId },
        });
        break;

      case RatableType.GALLERY_ITEM:
        content = await this.prisma.galleryItem.findUnique({
          where: { id: contentId },
        });
        break;

      case RatableType.STORY:
        content = await this.prisma.story.findUnique({
          where: { id: contentId },
        });
        break;

      default:
        throw new BadRequestException(`Invalid content type: ${contentType}`);
    }

    if (!content) {
      throw new NotFoundException(
        `Content with ID "${contentId}" not found for type "${contentType}"`,
      );
    }
  }

  /**
   * Get the foreign key field name based on content type
   */
  private getContentForeignKey(contentType: RatableType): string {
    const foreignKeyMap = {
      [RatableType.ARTICLE]: 'articleId',
      [RatableType.BLOG_POST]: 'blogPostId',
      [RatableType.WIKI_PAGE]: 'wikiPageId',
      [RatableType.GALLERY_ITEM]: 'galleryItemId',
      [RatableType.STORY]: 'storyId',
    };

    return foreignKeyMap[contentType];
  }

  /**
   * Format rating response
   */
  private formatRatingResponse(rating: any) {
    return {
      ...rating,
    };
  }
}
