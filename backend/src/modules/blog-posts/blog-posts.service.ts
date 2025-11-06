import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBlogPostDto, UpdateBlogPostDto, QueryBlogPostDto } from './dto';

@Injectable()
export class BlogPostsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new blog post
   */
  async create(userId: string, createBlogPostDto: CreateBlogPostDto) {
    const { categoryIds, tagIds, ...blogPostData } = createBlogPostDto;

    // Generate slug from title
    const slug = this.generateSlug(blogPostData.title);

    // Check if slug already exists
    const existingBlogPost = await this.prisma.blogPost.findUnique({
      where: { slug },
    });

    if (existingBlogPost) {
      throw new ConflictException(`Blog post with slug "${slug}" already exists`);
    }

    // Verify author exists
    const author = await this.prisma.author.findUnique({
      where: { id: blogPostData.authorId },
    });

    if (!author) {
      throw new NotFoundException(`Author with ID "${blogPostData.authorId}" not found`);
    }

    // Set publishedAt if status is PUBLISHED
    const publishedAt =
      blogPostData.status === 'PUBLISHED' ? new Date() : null;

    // Create blog post with relations
    const blogPost = await this.prisma.blogPost.create({
      data: {
        ...blogPostData,
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

    return this.formatBlogPostResponse(blogPost);
  }

  /**
   * Find all blog posts with pagination and filtering
   */
  async findAll(queryDto: QueryBlogPostDto) {
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
    const [blogPosts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
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
      this.prisma.blogPost.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: blogPosts.map((blogPost) => this.formatBlogPostResponse(blogPost)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Find one blog post by ID
   */
  async findOne(id: string) {
    const blogPost = await this.prisma.blogPost.findUnique({
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

    if (!blogPost) {
      throw new NotFoundException(`Blog post with ID "${id}" not found`);
    }

    return this.formatBlogPostResponse(blogPost);
  }

  /**
   * Find one blog post by slug
   */
  async findBySlug(slug: string) {
    const blogPost = await this.prisma.blogPost.findUnique({
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

    if (!blogPost) {
      throw new NotFoundException(`Blog post with slug "${slug}" not found`);
    }

    return this.formatBlogPostResponse(blogPost);
  }

  /**
   * Update a blog post
   */
  async update(id: string, updateBlogPostDto: UpdateBlogPostDto) {
    // Check if blog post exists
    const existingBlogPost = await this.prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingBlogPost) {
      throw new NotFoundException(`Blog post with ID "${id}" not found`);
    }

    const { categoryIds, tagIds, title, ...blogPostData } = updateBlogPostDto;

    // If title is being updated, generate new slug
    let slug = existingBlogPost.slug;
    if (title && title !== existingBlogPost.title) {
      slug = this.generateSlug(title);

      // Check if new slug conflicts
      const slugConflict = await this.prisma.blogPost.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (slugConflict) {
        throw new ConflictException(`Blog post with slug "${slug}" already exists`);
      }
    }

    // Update publishedAt if status changes to PUBLISHED
    let publishedAt = existingBlogPost.publishedAt;
    if (blogPostData.status === 'PUBLISHED' && !existingBlogPost.publishedAt) {
      publishedAt = new Date();
    }

    // Update blog post
    const blogPost = await this.prisma.blogPost.update({
      where: { id },
      data: {
        ...blogPostData,
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

    return this.formatBlogPostResponse(blogPost);
  }

  /**
   * Delete a blog post
   */
  async remove(id: string) {
    // Check if blog post exists
    const blogPost = await this.prisma.blogPost.findUnique({
      where: { id },
    });

    if (!blogPost) {
      throw new NotFoundException(`Blog post with ID "${id}" not found`);
    }

    // Delete blog post (cascade will handle relations)
    await this.prisma.blogPost.delete({
      where: { id },
    });

    return { message: 'Blog post deleted successfully' };
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
   * Format blog post response with flattened categories and tags
   */
  private formatBlogPostResponse(blogPost: any) {
    return {
      ...blogPost,
      categories: blogPost.categories?.map((bc: any) => bc.category) || [],
      tags: blogPost.tags?.map((bt: any) => bt.tag) || [],
      commentsCount: blogPost._count?.comments || 0,
      ratingsCount: blogPost._count?.ratings || 0,
    };
  }
}
