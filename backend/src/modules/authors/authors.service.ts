import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAuthorDto, UpdateAuthorDto, QueryAuthorDto } from './dto';

@Injectable()
export class AuthorsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new author
   */
  async create(createAuthorDto: CreateAuthorDto) {
    const { name, ...authorData } = createAuthorDto;

    // Generate slug from name
    const slug = this.generateSlug(name);

    // Check if slug already exists
    const existingAuthor = await this.prisma.author.findUnique({
      where: { slug },
    });

    if (existingAuthor) {
      throw new ConflictException(`Author with slug "${slug}" already exists`);
    }

    // Create author
    const author = await this.prisma.author.create({
      data: {
        name,
        slug,
        ...authorData,
      },
    });

    return this.formatAuthorResponse(author);
  }

  /**
   * Find all authors with pagination and filtering
   */
  async findAll(queryDto: QueryAuthorDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'name',
      sortOrder = 'asc',
    } = queryDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Execute query with pagination
    const [authors, total] = await Promise.all([
      this.prisma.author.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              articles: true,
              blogPosts: true,
              wikiPages: true,
              galleryItems: true,
              stories: true,
            },
          },
        },
      }),
      this.prisma.author.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: authors.map((author) => this.formatAuthorResponse(author)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Find one author by ID
   */
  async findOne(id: string) {
    const author = await this.prisma.author.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true,
            blogPosts: true,
            wikiPages: true,
            galleryItems: true,
            stories: true,
          },
        },
      },
    });

    if (!author) {
      throw new NotFoundException(`Author with ID "${id}" not found`);
    }

    return this.formatAuthorResponse(author);
  }

  /**
   * Find one author by slug
   */
  async findBySlug(slug: string) {
    const author = await this.prisma.author.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            articles: true,
            blogPosts: true,
            wikiPages: true,
            galleryItems: true,
            stories: true,
          },
        },
      },
    });

    if (!author) {
      throw new NotFoundException(`Author with slug "${slug}" not found`);
    }

    return this.formatAuthorResponse(author);
  }

  /**
   * Get author's content (articles, blog posts, etc.)
   */
  async getAuthorContent(id: string, contentType: string, page = 1, limit = 10) {
    // Verify author exists
    const author = await this.prisma.author.findUnique({
      where: { id },
    });

    if (!author) {
      throw new NotFoundException(`Author with ID "${id}" not found`);
    }

    const skip = (page - 1) * limit;
    let content: any[] = [];
    let total = 0;

    switch (contentType) {
      case 'articles':
        [content, total] = await Promise.all([
          this.prisma.article.findMany({
            where: { authorId: id, status: 'PUBLISHED' },
            skip,
            take: limit,
            orderBy: { publishedAt: 'desc' },
          }),
          this.prisma.article.count({
            where: { authorId: id, status: 'PUBLISHED' },
          }),
        ]);
        break;

      case 'blogPosts':
        [content, total] = await Promise.all([
          this.prisma.blogPost.findMany({
            where: { authorId: id, status: 'PUBLISHED' },
            skip,
            take: limit,
            orderBy: { publishedAt: 'desc' },
          }),
          this.prisma.blogPost.count({
            where: { authorId: id, status: 'PUBLISHED' },
          }),
        ]);
        break;

      case 'wikiPages':
        [content, total] = await Promise.all([
          this.prisma.wikiPage.findMany({
            where: { authorId: id, status: 'PUBLISHED' },
            skip,
            take: limit,
            orderBy: { publishedAt: 'desc' },
          }),
          this.prisma.wikiPage.count({
            where: { authorId: id, status: 'PUBLISHED' },
          }),
        ]);
        break;

      case 'galleryItems':
        [content, total] = await Promise.all([
          this.prisma.galleryItem.findMany({
            where: { authorId: id, status: 'PUBLISHED' },
            skip,
            take: limit,
            orderBy: { publishedAt: 'desc' },
          }),
          this.prisma.galleryItem.count({
            where: { authorId: id, status: 'PUBLISHED' },
          }),
        ]);
        break;

      case 'stories':
        [content, total] = await Promise.all([
          this.prisma.story.findMany({
            where: { authorId: id, status: 'PUBLISHED' },
            skip,
            take: limit,
            orderBy: { publishedAt: 'desc' },
          }),
          this.prisma.story.count({
            where: { authorId: id, status: 'PUBLISHED' },
          }),
        ]);
        break;

      default:
        throw new NotFoundException(`Invalid content type: ${contentType}`);
    }

    const totalPages = Math.ceil(total / limit);

    return {
      data: content,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Update an author
   */
  async update(id: string, updateAuthorDto: UpdateAuthorDto) {
    // Check if author exists
    const existingAuthor = await this.prisma.author.findUnique({
      where: { id },
    });

    if (!existingAuthor) {
      throw new NotFoundException(`Author with ID "${id}" not found`);
    }

    const { name, ...authorData } = updateAuthorDto;

    // If name is being updated, generate new slug
    let slug = existingAuthor.slug;
    if (name && name !== existingAuthor.name) {
      slug = this.generateSlug(name);

      // Check if new slug conflicts
      const slugConflict = await this.prisma.author.findFirst({
        where: {
          slug,
          NOT: { id },
        },
      });

      if (slugConflict) {
        throw new ConflictException(`Author with slug "${slug}" already exists`);
      }
    }

    // Update author
    const author = await this.prisma.author.update({
      where: { id },
      data: {
        name,
        slug,
        ...authorData,
      },
      include: {
        _count: {
          select: {
            articles: true,
            blogPosts: true,
            wikiPages: true,
            galleryItems: true,
            stories: true,
          },
        },
      },
    });

    return this.formatAuthorResponse(author);
  }

  /**
   * Delete an author
   */
  async remove(id: string) {
    // Check if author exists
    const author = await this.prisma.author.findUnique({
      where: { id },
    });

    if (!author) {
      throw new NotFoundException(`Author with ID "${id}" not found`);
    }

    // Delete author (cascade will handle relations)
    await this.prisma.author.delete({
      where: { id },
    });

    return { message: 'Author deleted successfully' };
  }

  /**
   * Generate URL-friendly slug from name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Format author response with content counts
   */
  private formatAuthorResponse(author: any) {
    return {
      ...author,
      articlesCount: author._count?.articles || 0,
      blogPostsCount: author._count?.blogPosts || 0,
      wikiPagesCount: author._count?.wikiPages || 0,
      galleryItemsCount: author._count?.galleryItems || 0,
      storiesCount: author._count?.stories || 0,
    };
  }
}
