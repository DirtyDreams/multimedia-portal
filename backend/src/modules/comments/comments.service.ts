import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  QueryCommentDto,
  CommentableType,
} from './dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new comment
   */
  async create(userId: string, createCommentDto: CreateCommentDto) {
    const { contentType, contentId, parentId, content } = createCommentDto;

    // Verify content exists
    await this.verifyContentExists(contentType, contentId);

    // If this is a reply, verify parent comment exists
    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        throw new NotFoundException(`Parent comment with ID "${parentId}" not found`);
      }

      // Verify parent comment is for the same content
      if (
        parentComment.contentType !== contentType ||
        parentComment.contentId !== contentId
      ) {
        throw new BadRequestException(
          'Parent comment must be for the same content',
        );
      }
    }

    // Determine the specific content foreign key based on contentType
    const contentForeignKey = this.getContentForeignKey(contentType);

    // Create comment
    const comment = await this.prisma.comment.create({
      data: {
        content,
        contentType,
        contentId,
        parentId,
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
        replies: {
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
            createdAt: 'asc',
          },
        },
      },
    });

    return this.formatCommentResponse(comment);
  }

  /**
   * Find all comments with pagination and filtering
   */
  async findAll(queryDto: QueryCommentDto) {
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
    const where: any = {
      parentId: null, // Only top-level comments
    };

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
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
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
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                },
              },
              replies: {
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
                  createdAt: 'asc',
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      }),
      this.prisma.comment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: comments.map((comment) => this.formatCommentResponse(comment)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get comments for specific content
   */
  async getContentComments(contentType: CommentableType, contentId: string) {
    // Verify content exists
    await this.verifyContentExists(contentType, contentId);

    const comments = await this.prisma.comment.findMany({
      where: {
        contentType,
        contentId,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
              },
            },
            replies: {
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
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return comments.map((comment) => this.formatCommentResponse(comment));
  }

  /**
   * Find one comment by ID
   */
  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        replies: {
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
            createdAt: 'asc',
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }

    return this.formatCommentResponse(comment);
  }

  /**
   * Update a comment (only by owner)
   */
  async update(id: string, userId: string, updateCommentDto: UpdateCommentDto) {
    // Check if comment exists
    const existingComment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }

    // Verify user is the owner
    if (existingComment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    // Update comment
    const comment = await this.prisma.comment.update({
      where: { id },
      data: {
        content: updateCommentDto.content,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
        replies: {
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
            createdAt: 'asc',
          },
        },
      },
    });

    return this.formatCommentResponse(comment);
  }

  /**
   * Delete a comment (by owner or admin)
   */
  async remove(id: string, userId: string, isAdmin: boolean) {
    // Check if comment exists
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }

    // Verify user is the owner or admin
    if (!isAdmin && comment.userId !== userId) {
      throw new ForbiddenException(
        'You can only delete your own comments',
      );
    }

    // Delete comment (cascade will handle replies)
    await this.prisma.comment.delete({
      where: { id },
    });

    return { message: 'Comment deleted successfully' };
  }

  /**
   * Get comment count for specific content
   */
  async getCommentCount(contentType: CommentableType, contentId: string) {
    const count = await this.prisma.comment.count({
      where: {
        contentType,
        contentId,
      },
    });

    return { count };
  }

  /**
   * Verify content exists based on content type
   */
  private async verifyContentExists(
    contentType: CommentableType,
    contentId: string,
  ) {
    let content: any = null;

    switch (contentType) {
      case CommentableType.ARTICLE:
        content = await this.prisma.article.findUnique({
          where: { id: contentId },
        });
        break;

      case CommentableType.BLOG_POST:
        content = await this.prisma.blogPost.findUnique({
          where: { id: contentId },
        });
        break;

      case CommentableType.WIKI_PAGE:
        content = await this.prisma.wikiPage.findUnique({
          where: { id: contentId },
        });
        break;

      case CommentableType.GALLERY_ITEM:
        content = await this.prisma.galleryItem.findUnique({
          where: { id: contentId },
        });
        break;

      case CommentableType.STORY:
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
  private getContentForeignKey(contentType: CommentableType): string {
    const foreignKeyMap = {
      [CommentableType.ARTICLE]: 'articleId',
      [CommentableType.BLOG_POST]: 'blogPostId',
      [CommentableType.WIKI_PAGE]: 'wikiPageId',
      [CommentableType.GALLERY_ITEM]: 'galleryItemId',
      [CommentableType.STORY]: 'storyId',
    };

    return foreignKeyMap[contentType];
  }

  /**
   * Format comment response with nested replies
   */
  private formatCommentResponse(comment: any) {
    return {
      ...comment,
      repliesCount: comment.replies?.length || 0,
      replies: comment.replies?.map((reply: any) => ({
        ...reply,
        repliesCount: reply.replies?.length || 0,
      })),
    };
  }
}
