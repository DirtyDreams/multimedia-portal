import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto, QueryArticleDto } from './dto';

@Injectable()
export class ArticlesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new article
   */
  async create(userId: string, createArticleDto: CreateArticleDto) {
    const { categoryIds, tagIds, ...articleData } = createArticleDto;

    // Generate slug from title
    const slug = this.generateSlug(articleData.title);

    // Check if slug already exists
    const existingArticle = await this.prisma.article.findUnique({
      where: { slug },
    });

    if (existingArticle) {
      throw new ConflictException(`Article with slug "${slug}" already exists`);
    }

    // Verify author exists
    const author = await this.prisma.author.findUnique({
      where: { id: articleData.authorId },
    });

    if (!author) {
      throw new NotFoundException(`Author with ID "${articleData.authorId}" not found`);
    }

    // Set publishedAt if status is PUBLISHED
    const publishedAt =
      articleData.status === 'PUBLISHED' ? new Date() : null;

    // Create article with relations
    const article = await this.prisma.article.create({
      data: {
        ...articleData,
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

    return this.formatArticleResponse(article);
  }

  /**
   * Find all articles with pagination and filtering
   */
  async findAll(queryDto: QueryArticleDto) {
    const { page = 1, limit = 10, search, status, authorId, category, tag, sortBy = 'createdAt', sortOrder = 'desc' } = queryDto;

    const skip = (page - 1) * limit;

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
    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
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
      this.prisma.article.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: articles.map((article) => this.formatArticleResponse(article)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Find one article by ID
   */
  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
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

    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }

    return this.formatArticleResponse(article);
  }

  /**
   * Find one article by slug
   */
  async findBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({
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

    if (!article) {
      throw new NotFoundException(`Article with slug "${slug}" not found`);
    }

    return this.formatArticleResponse(article);
  }

  /**
   * Update an article
   */
  async update(id: string, updateArticleDto: UpdateArticleDto) {
    // Check if article exists
    const existingArticle = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }

    const { categoryIds, tagIds, title, ...articleData } = updateArticleDto;

    // If title is being updated, generate new slug
    let slug = existingArticle.slug;
    if (title && title !== existingArticle.title) {
      slug = this.generateSlug(title);

      // Check if new slug conflicts
      const slugConflict = await this.prisma.article.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (slugConflict) {
        throw new ConflictException(`Article with slug "${slug}" already exists`);
      }
    }

    // Update publishedAt if status changes to PUBLISHED
    let publishedAt = existingArticle.publishedAt;
    if (articleData.status === 'PUBLISHED' && !existingArticle.publishedAt) {
      publishedAt = new Date();
    }

    // Update article
    const article = await this.prisma.article.update({
      where: { id },
      data: {
        ...articleData,
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

    return this.formatArticleResponse(article);
  }

  /**
   * Delete an article
   */
  async remove(id: string) {
    // Check if article exists
    const article = await this.prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID "${id}" not found`);
    }

    // Delete article (cascade will handle relations)
    await this.prisma.article.delete({
      where: { id },
    });

    return { message: 'Article deleted successfully' };
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
   * Format article response with flattened categories and tags
   */
  private formatArticleResponse(article: any) {
    return {
      ...article,
      categories: article.categories?.map((ac: any) => ac.category) || [],
      tags: article.tags?.map((at: any) => at.tag) || [],
      commentsCount: article._count?.comments || 0,
      ratingsCount: article._count?.ratings || 0,
    };
  }
}
