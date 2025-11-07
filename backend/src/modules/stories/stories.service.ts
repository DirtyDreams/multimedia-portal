import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStoryDto, UpdateStoryDto, QueryStoryDto } from './dto';
import { enforcePaginationLimit } from '../../common/constants/pagination.constants';

@Injectable()
export class StoriesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new story
   */
  async create(userId: string, createStoryDto: CreateStoryDto) {
    const { categoryIds, tagIds, ...storyData } = createStoryDto;

    // Generate slug from title
    const slug = this.generateSlug(storyData.title);

    // Use transaction to ensure atomicity of story creation with categories and tags
    return this.prisma.$transaction(async (tx) => {
      // Check if slug already exists
      const existingStory = await tx.story.findUnique({
        where: { slug },
      });

      if (existingStory) {
        throw new ConflictException(`Story with slug "${slug}" already exists`);
      }

      // Verify author exists
      const author = await tx.author.findUnique({
        where: { id: storyData.authorId },
      });

      if (!author) {
        throw new NotFoundException(`Author with ID "${storyData.authorId}" not found`);
      }

      // Set publishedAt if status is PUBLISHED
      const publishedAt =
        storyData.status === 'PUBLISHED' ? new Date() : null;

      // Create story with relations
      const story = await tx.story.create({
        data: {
          ...storyData,
          slug,
          userId,
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

      return this.formatStoryResponse(story);
    });
  }

  /**
   * Find all stories with pagination and filtering
   */
  async findAll(queryDto: QueryStoryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      authorId,
      series,
      category,
      tag,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    // Enforce maximum limit for security
    const safeLimit = enforcePaginationLimit(limit);
    const skip = (page - 1) * safeLimit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (series) {
      where.series = series;
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
    const [stories, total] = await Promise.all([
      this.prisma.story.findMany({
        where,
        skip,
        take: safeLimit,
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
      this.prisma.story.count({ where }),
    ]);

    const totalPages = Math.ceil(total / safeLimit);

    return {
      data: stories.map((story) => this.formatStoryResponse(story)),
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages,
      },
    };
  }

  /**
   * Get all unique series names
   */
  async getSeries() {
    const stories = await this.prisma.story.findMany({
      where: {
        series: { not: null },
        status: 'PUBLISHED',
      },
      select: {
        series: true,
      },
      distinct: ['series'],
      orderBy: {
        series: 'asc',
      },
    });

    return stories
      .map((s) => s.series)
      .filter((s): s is string => s !== null);
  }

  /**
   * Find one story by ID
   */
  async findOne(id: string) {
    const story = await this.prisma.story.findUnique({
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

    if (!story) {
      throw new NotFoundException(`Story with ID "${id}" not found`);
    }

    return this.formatStoryResponse(story);
  }

  /**
   * Find one story by slug
   */
  async findBySlug(slug: string) {
    const story = await this.prisma.story.findUnique({
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

    if (!story) {
      throw new NotFoundException(`Story with slug "${slug}" not found`);
    }

    return this.formatStoryResponse(story);
  }

  /**
   * Update a story
   */
  async update(id: string, updateStoryDto: UpdateStoryDto) {
    // Use transaction to ensure atomicity of story update with categories and tags
    return this.prisma.$transaction(async (tx) => {
      // Check if story exists
      const existingStory = await tx.story.findUnique({
        where: { id },
      });

      if (!existingStory) {
        throw new NotFoundException(`Story with ID "${id}" not found`);
      }

      const { categoryIds, tagIds, title, ...storyData } = updateStoryDto;

      // If title is being updated, generate new slug
      let slug = existingStory.slug;
      if (title && title !== existingStory.title) {
        slug = this.generateSlug(title);

        // Check if new slug conflicts
        const slugConflict = await tx.story.findFirst({
          where: {
            slug,
            NOT: { id },
          },
        });

        if (slugConflict) {
          throw new ConflictException(`Story with slug "${slug}" already exists`);
        }
      }

      // Update publishedAt if status changes to PUBLISHED
      let publishedAt = existingStory.publishedAt;
      if (storyData.status === 'PUBLISHED' && !existingStory.publishedAt) {
        publishedAt = new Date();
      }

      // Update story
      const story = await tx.story.update({
        where: { id },
        data: {
          ...storyData,
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

      return this.formatStoryResponse(story);
    });
  }

  /**
   * Delete a story
   */
  async remove(id: string) {
    // Check if story exists
    const story = await this.prisma.story.findUnique({
      where: { id },
    });

    if (!story) {
      throw new NotFoundException(`Story with ID "${id}" not found`);
    }

    // Delete story (cascade will handle relations)
    await this.prisma.story.delete({
      where: { id },
    });

    return { message: 'Story deleted successfully' };
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
   * Format story response with flattened categories and tags
   */
  private formatStoryResponse(story: any) {
    return {
      ...story,
      categories: story.categories?.map((sc: any) => sc.category) || [],
      tags: story.tags?.map((st: any) => st.tag) || [],
      commentsCount: story._count?.comments || 0,
      ratingsCount: story._count?.ratings || 0,
    };
  }
}
