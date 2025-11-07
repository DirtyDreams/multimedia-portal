import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWikiPageDto, UpdateWikiPageDto, QueryWikiPageDto } from './dto';
import { enforcePaginationLimit } from '../../common/constants/pagination.constants';

@Injectable()
export class WikiPagesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new wiki page
   */
  async create(userId: string, createWikiPageDto: CreateWikiPageDto) {
    const { categoryIds, tagIds, parentId, ...wikiPageData } = createWikiPageDto;

    // Generate slug from title
    const slug = this.generateSlug(wikiPageData.title);

    // Use transaction to ensure atomicity of wiki page creation with hierarchy and relations
    return this.prisma.$transaction(async (tx) => {
      // Check if slug already exists
      const existingWikiPage = await tx.wikiPage.findUnique({
        where: { slug },
      });

      if (existingWikiPage) {
        throw new ConflictException(`Wiki page with slug "${slug}" already exists`);
      }

      // Verify author exists
      const author = await tx.author.findUnique({
        where: { id: wikiPageData.authorId },
      });

      if (!author) {
        throw new NotFoundException(`Author with ID "${wikiPageData.authorId}" not found`);
      }

      // Verify parent exists if provided
      if (parentId) {
        const parent = await tx.wikiPage.findUnique({
          where: { id: parentId },
        });

        if (!parent) {
          throw new NotFoundException(`Parent wiki page with ID "${parentId}" not found`);
        }
      }

      // Set publishedAt if status is PUBLISHED
      const publishedAt =
        wikiPageData.status === 'PUBLISHED' ? new Date() : null;

      // Create wiki page with relations
      const wikiPage = await tx.wikiPage.create({
        data: {
          ...wikiPageData,
          slug,
          userId,
          parentId,
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
          parent: true,
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

      return this.formatWikiPageResponse(wikiPage);
    });
  }

  /**
   * Find all wiki pages with pagination and filtering
   */
  async findAll(queryDto: QueryWikiPageDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      authorId,
      parentId,
      category,
      tag,
      includeChildren = false,
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
      ];
    }

    if (status) {
      where.status = status;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (parentId !== undefined) {
      where.parentId = parentId === 'null' ? null : parentId;
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
    const [wikiPages, total] = await Promise.all([
      this.prisma.wikiPage.findMany({
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
          parent: true,
          children: includeChildren,
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
              children: true,
              comments: true,
              ratings: true,
            },
          },
        },
      }),
      this.prisma.wikiPage.count({ where }),
    ]);

    const totalPages = Math.ceil(total / safeLimit);

    return {
      data: wikiPages.map((wikiPage) => this.formatWikiPageResponse(wikiPage)),
      meta: {
        total,
        page,
        limit: safeLimit,
        totalPages,
      },
    };
  }

  /**
   * Get tree structure starting from root pages
   */
  async getTree() {
    const rootPages = await this.prisma.wikiPage.findMany({
      where: { parentId: null, status: 'PUBLISHED' },
      orderBy: { title: 'asc' },
      include: {
        author: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    // Recursively build tree for each root page
    const tree = await Promise.all(
      rootPages.map((page) => this.buildTreeRecursive(page)),
    );

    return tree;
  }

  /**
   * Get children of a specific page
   */
  async getChildren(parentId: string) {
    const children = await this.prisma.wikiPage.findMany({
      where: { parentId },
      orderBy: { title: 'asc' },
      include: {
        author: true,
        _count: {
          select: {
            children: true,
            comments: true,
            ratings: true,
          },
        },
      },
    });

    return children.map((child) => this.formatWikiPageResponse(child));
  }

  /**
   * Get breadcrumb path from root to page
   */
  async getBreadcrumbs(id: string) {
    const breadcrumbs: Array<{ id: string; title: string; slug: string }> = [];
    let currentPage = await this.prisma.wikiPage.findUnique({
      where: { id },
      select: { id: true, title: true, slug: true, parentId: true },
    });

    if (!currentPage) {
      throw new NotFoundException(`Wiki page with ID "${id}" not found`);
    }

    // Traverse up the tree
    while (currentPage) {
      breadcrumbs.unshift({
        id: currentPage.id,
        title: currentPage.title,
        slug: currentPage.slug,
      });

      if (currentPage.parentId) {
        currentPage = await this.prisma.wikiPage.findUnique({
          where: { id: currentPage.parentId },
          select: { id: true, title: true, slug: true, parentId: true },
        });
      } else {
        currentPage = null;
      }
    }

    return breadcrumbs;
  }

  /**
   * Find one wiki page by ID
   */
  async findOne(id: string) {
    const wikiPage = await this.prisma.wikiPage.findUnique({
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
        parent: true,
        children: {
          orderBy: { title: 'asc' },
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
            children: true,
            comments: true,
            ratings: true,
          },
        },
      },
    });

    if (!wikiPage) {
      throw new NotFoundException(`Wiki page with ID "${id}" not found`);
    }

    return this.formatWikiPageResponse(wikiPage);
  }

  /**
   * Find one wiki page by slug
   */
  async findBySlug(slug: string) {
    const wikiPage = await this.prisma.wikiPage.findUnique({
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
        parent: true,
        children: {
          orderBy: { title: 'asc' },
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
            children: true,
            comments: true,
            ratings: true,
          },
        },
      },
    });

    if (!wikiPage) {
      throw new NotFoundException(`Wiki page with slug "${slug}" not found`);
    }

    return this.formatWikiPageResponse(wikiPage);
  }

  /**
   * Update a wiki page
   */
  async update(id: string, updateWikiPageDto: UpdateWikiPageDto) {
    // Use transaction to ensure atomicity of wiki page update with hierarchy and relations
    return this.prisma.$transaction(async (tx) => {
      // Check if wiki page exists
      const existingWikiPage = await tx.wikiPage.findUnique({
        where: { id },
      });

      if (!existingWikiPage) {
        throw new NotFoundException(`Wiki page with ID "${id}" not found`);
      }

      const { categoryIds, tagIds, title, parentId, ...wikiPageData } = updateWikiPageDto;

      // Prevent circular references
      if (parentId && parentId === id) {
        throw new BadRequestException('Wiki page cannot be its own parent');
      }

      // Check if new parent would create a circular reference
      if (parentId) {
        const wouldCreateCycle = await this.wouldCreateCircularReference(id, parentId, tx);
        if (wouldCreateCycle) {
          throw new BadRequestException('Cannot set parent: would create circular reference');
        }
      }

      // If title is being updated, generate new slug
      let slug = existingWikiPage.slug;
      if (title && title !== existingWikiPage.title) {
        slug = this.generateSlug(title);

        // Check if new slug conflicts
        const slugConflict = await tx.wikiPage.findFirst({
          where: {
            slug,
            NOT: { id },
          },
        });

        if (slugConflict) {
          throw new ConflictException(`Wiki page with slug "${slug}" already exists`);
        }
      }

      // Update publishedAt if status changes to PUBLISHED
      let publishedAt = existingWikiPage.publishedAt;
      if (wikiPageData.status === 'PUBLISHED' && !existingWikiPage.publishedAt) {
        publishedAt = new Date();
      }

      // Update wiki page
      const wikiPage = await tx.wikiPage.update({
        where: { id },
        data: {
          ...wikiPageData,
          title,
          slug,
          publishedAt,
          ...(parentId !== undefined && { parentId }),
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
          parent: true,
          children: true,
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

      return this.formatWikiPageResponse(wikiPage);
    });
  }

  /**
   * Delete a wiki page
   */
  async remove(id: string) {
    // Check if wiki page exists
    const wikiPage = await this.prisma.wikiPage.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!wikiPage) {
      throw new NotFoundException(`Wiki page with ID "${id}" not found`);
    }

    // Check if page has children
    if (wikiPage.children && wikiPage.children.length > 0) {
      throw new BadRequestException(
        'Cannot delete wiki page with children. Please delete or move children first.',
      );
    }

    // Delete wiki page (cascade will handle relations)
    await this.prisma.wikiPage.delete({
      where: { id },
    });

    return { message: 'Wiki page deleted successfully' };
  }

  /**
   * Build tree structure recursively
   */
  private async buildTreeRecursive(page: any, depth: number = 0, maxDepth: number = 5): Promise<any> {
    if (depth >= maxDepth) {
      return {
        ...page,
        children: [],
        hasMoreChildren: page._count?.children > 0,
      };
    }

    const children = await this.prisma.wikiPage.findMany({
      where: { parentId: page.id, status: 'PUBLISHED' },
      orderBy: { title: 'asc' },
      include: {
        author: true,
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    const childrenWithSubtree = await Promise.all(
      children.map((child) => this.buildTreeRecursive(child, depth + 1, maxDepth)),
    );

    return {
      ...page,
      children: childrenWithSubtree,
    };
  }

  /**
   * Check if setting a parent would create a circular reference
   */
  private async wouldCreateCircularReference(
    pageId: string,
    newParentId: string,
    tx?: any,
  ): Promise<boolean> {
    const prisma = tx || this.prisma;
    let currentParentId: string | null = newParentId;

    while (currentParentId) {
      if (currentParentId === pageId) {
        return true; // Circular reference detected
      }

      const parent = await prisma.wikiPage.findUnique({
        where: { id: currentParentId },
        select: { parentId: true },
      });

      currentParentId = parent?.parentId || null;
    }

    return false;
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
   * Format wiki page response with flattened categories and tags
   */
  private formatWikiPageResponse(wikiPage: any) {
    return {
      ...wikiPage,
      categories: wikiPage.categories?.map((wc: any) => wc.category) || [],
      tags: wikiPage.tags?.map((wt: any) => wt.tag) || [],
      childrenCount: wikiPage._count?.children || 0,
      commentsCount: wikiPage._count?.comments || 0,
      ratingsCount: wikiPage._count?.ratings || 0,
    };
  }
}
