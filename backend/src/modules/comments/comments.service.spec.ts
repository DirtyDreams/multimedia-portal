import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCommentDto,
  UpdateCommentDto,
  QueryCommentDto,
  CommentableType,
} from './dto';

describe('CommentsService', () => {
  let service: CommentsService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    name: 'Test User',
  };

  const mockComment = {
    id: 'comment-123',
    content: 'Test comment',
    contentType: CommentableType.ARTICLE,
    contentId: 'article-123',
    articleId: 'article-123',
    parentId: null,
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
    replies: [],
  };

  const mockPrismaService = {
    comment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    article: {
      findUnique: jest.fn(),
    },
    blogPost: {
      findUnique: jest.fn(),
    },
    wikiPage: {
      findUnique: jest.fn(),
    },
    galleryItem: {
      findUnique: jest.fn(),
    },
    story: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-123';
    const createDto: CreateCommentDto = {
      content: 'Test comment',
      contentType: CommentableType.ARTICLE,
      contentId: 'article-123',
    };

    it('should successfully create a comment', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue({ id: 'article-123' });
      mockPrismaService.comment.create.mockResolvedValue(mockComment);

      const result = await service.create(userId, createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockComment.id);
      expect(mockPrismaService.article.findUnique).toHaveBeenCalledWith({
        where: { id: 'article-123' },
      });
      expect(mockPrismaService.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: createDto.content,
            contentType: createDto.contentType,
            contentId: createDto.contentId,
            userId,
            articleId: createDto.contentId,
          }),
        }),
      );
    });

    it('should throw NotFoundException if content does not exist', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(null);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(userId, createDto)).rejects.toThrow(
        `Content with ID "article-123" not found for type "ARTICLE"`,
      );
    });

    it('should create a reply comment with parentId', async () => {
      const replyDto = { ...createDto, parentId: 'parent-comment-123' };
      const parentComment = {
        ...mockComment,
        id: 'parent-comment-123',
        contentType: CommentableType.ARTICLE,
        contentId: 'article-123',
      };

      mockPrismaService.article.findUnique.mockResolvedValue({ id: 'article-123' });
      mockPrismaService.comment.findUnique.mockResolvedValue(parentComment);
      mockPrismaService.comment.create.mockResolvedValue({
        ...mockComment,
        parentId: 'parent-comment-123',
      });

      const result = await service.create(userId, replyDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 'parent-comment-123' },
      });
    });

    it('should throw NotFoundException if parent comment does not exist', async () => {
      const replyDto = { ...createDto, parentId: 'invalid-parent' };

      mockPrismaService.article.findUnique.mockResolvedValue({ id: 'article-123' });
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(service.create(userId, replyDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(userId, replyDto)).rejects.toThrow(
        'Parent comment with ID "invalid-parent" not found',
      );
    });

    it('should throw BadRequestException if parent comment is for different content', async () => {
      const replyDto = { ...createDto, parentId: 'parent-comment-123' };
      const differentParent = {
        ...mockComment,
        id: 'parent-comment-123',
        contentId: 'different-article',
      };

      mockPrismaService.article.findUnique.mockResolvedValue({ id: 'article-123' });
      mockPrismaService.comment.findUnique.mockResolvedValue(differentParent);

      await expect(service.create(userId, replyDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(userId, replyDto)).rejects.toThrow(
        'Parent comment must be for the same content',
      );
    });

    it('should work with different content types', async () => {
      const blogPostDto = {
        content: 'Blog comment',
        contentType: CommentableType.BLOG_POST,
        contentId: 'blog-123',
      };

      mockPrismaService.blogPost.findUnique.mockResolvedValue({ id: 'blog-123' });
      mockPrismaService.comment.create.mockResolvedValue({
        ...mockComment,
        contentType: CommentableType.BLOG_POST,
        blogPostId: 'blog-123',
      });

      await service.create(userId, blogPostDto);

      expect(mockPrismaService.blogPost.findUnique).toHaveBeenCalledWith({
        where: { id: 'blog-123' },
      });
      expect(mockPrismaService.comment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            blogPostId: 'blog-123',
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    const queryDto: QueryCommentDto = {
      page: 1,
      limit: 20,
    };

    it('should return paginated comments with metadata', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue([mockComment]);
      mockPrismaService.comment.count.mockResolvedValue(1);

      const result = await service.findAll(queryDto);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            parentId: null, // Only top-level comments
          }),
        }),
      );
    });

    it('should filter by contentType', async () => {
      const contentQuery = { ...queryDto, contentType: CommentableType.ARTICLE };
      mockPrismaService.comment.findMany.mockResolvedValue([mockComment]);
      mockPrismaService.comment.count.mockResolvedValue(1);

      await service.findAll(contentQuery);

      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contentType: CommentableType.ARTICLE,
          }),
        }),
      );
    });

    it('should filter by contentId', async () => {
      const contentQuery = { ...queryDto, contentId: 'article-123' };
      mockPrismaService.comment.findMany.mockResolvedValue([mockComment]);
      mockPrismaService.comment.count.mockResolvedValue(1);

      await service.findAll(contentQuery);

      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contentId: 'article-123',
          }),
        }),
      );
    });

    it('should filter by userId', async () => {
      const userQuery = { ...queryDto, userId: 'user-123' };
      mockPrismaService.comment.findMany.mockResolvedValue([mockComment]);
      mockPrismaService.comment.count.mockResolvedValue(1);

      await service.findAll(userQuery);

      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
          }),
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      const paginationQuery = { page: 2, limit: 10 };
      mockPrismaService.comment.findMany.mockResolvedValue([]);
      mockPrismaService.comment.count.mockResolvedValue(25);

      const result = await service.findAll(paginationQuery);

      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * limit 10
          take: 10,
        }),
      );
      expect(result.meta.totalPages).toBe(3); // 25 / 10 = 2.5 -> 3
    });

    it('should include nested replies', async () => {
      const commentWithReplies = {
        ...mockComment,
        replies: [
          {
            id: 'reply-1',
            content: 'Reply 1',
            user: mockUser,
            replies: [
              {
                id: 'reply-1-1',
                content: 'Nested reply',
                user: mockUser,
              },
            ],
          },
        ],
      };

      mockPrismaService.comment.findMany.mockResolvedValue([commentWithReplies]);
      mockPrismaService.comment.count.mockResolvedValue(1);

      const result = await service.findAll(queryDto);

      expect(result.data[0].repliesCount).toBe(1);
      expect(result.data[0].replies[0].repliesCount).toBe(1);
    });
  });

  describe('getContentComments', () => {
    it('should return comments for specific content', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue({ id: 'article-123' });
      mockPrismaService.comment.findMany.mockResolvedValue([mockComment]);

      const result = await service.getContentComments(
        CommentableType.ARTICLE,
        'article-123',
      );

      expect(result).toHaveLength(1);
      expect(mockPrismaService.article.findUnique).toHaveBeenCalledWith({
        where: { id: 'article-123' },
      });
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contentType: CommentableType.ARTICLE,
            contentId: 'article-123',
            parentId: null,
          }),
        }),
      );
    });

    it('should throw NotFoundException if content does not exist', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(null);

      await expect(
        service.getContentComments(CommentableType.ARTICLE, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return comment by ID', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);

      const result = await service.findOne('comment-123');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockComment.id);
      expect(mockPrismaService.comment.findUnique).toHaveBeenCalledWith({
        where: { id: 'comment-123' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if comment not found', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Comment with ID "invalid-id" not found',
      );
    });
  });

  describe('update', () => {
    const userId = 'user-123';
    const updateDto: UpdateCommentDto = {
      content: 'Updated comment content',
    };

    it('should successfully update a comment', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.comment.update.mockResolvedValue({
        ...mockComment,
        content: updateDto.content,
      });

      const result = await service.update('comment-123', userId, updateDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.comment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'comment-123' },
          data: { content: updateDto.content },
        }),
      );
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', userId, updateDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('invalid-id', userId, updateDto),
      ).rejects.toThrow('Comment with ID "invalid-id" not found');
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const otherUserComment = { ...mockComment, userId: 'other-user' };
      mockPrismaService.comment.findUnique.mockResolvedValue(otherUserComment);

      await expect(
        service.update('comment-123', userId, updateDto),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update('comment-123', userId, updateDto),
      ).rejects.toThrow('You can only edit your own comments');
    });
  });

  describe('remove', () => {
    const userId = 'user-123';

    it('should successfully delete a comment by owner', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.comment.delete.mockResolvedValue(mockComment);

      const result = await service.remove('comment-123', userId, false);

      expect(result).toEqual({ message: 'Comment deleted successfully' });
      expect(mockPrismaService.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-123' },
      });
    });

    it('should successfully delete a comment by admin', async () => {
      const otherUserComment = { ...mockComment, userId: 'other-user' };
      mockPrismaService.comment.findUnique.mockResolvedValue(otherUserComment);
      mockPrismaService.comment.delete.mockResolvedValue(otherUserComment);

      const result = await service.remove('comment-123', userId, true);

      expect(result).toEqual({ message: 'Comment deleted successfully' });
      expect(mockPrismaService.comment.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if comment does not exist', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id', userId, false)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('invalid-id', userId, false)).rejects.toThrow(
        'Comment with ID "invalid-id" not found',
      );
    });

    it('should throw ForbiddenException if user is not owner and not admin', async () => {
      const otherUserComment = { ...mockComment, userId: 'other-user' };
      mockPrismaService.comment.findUnique.mockResolvedValue(otherUserComment);

      await expect(
        service.remove('comment-123', userId, false),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.remove('comment-123', userId, false),
      ).rejects.toThrow('You can only delete your own comments');
    });
  });

  describe('getCommentCount', () => {
    it('should return comment count for specific content', async () => {
      mockPrismaService.comment.count.mockResolvedValue(5);

      const result = await service.getCommentCount(
        CommentableType.ARTICLE,
        'article-123',
      );

      expect(result).toEqual({ count: 5 });
      expect(mockPrismaService.comment.count).toHaveBeenCalledWith({
        where: {
          contentType: CommentableType.ARTICLE,
          contentId: 'article-123',
        },
      });
    });
  });

  describe('verifyContentExists', () => {
    it('should verify article exists', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue({ id: 'article-123' });

      const createDto: CreateCommentDto = {
        content: 'Test',
        contentType: CommentableType.ARTICLE,
        contentId: 'article-123',
      };

      await expect(
        service.create('user-123', createDto),
      ).resolves.toBeDefined();
    });

    it('should verify blog post exists', async () => {
      mockPrismaService.blogPost.findUnique.mockResolvedValue({ id: 'blog-123' });
      mockPrismaService.comment.create.mockResolvedValue(mockComment);

      const createDto: CreateCommentDto = {
        content: 'Test',
        contentType: CommentableType.BLOG_POST,
        contentId: 'blog-123',
      };

      await expect(
        service.create('user-123', createDto),
      ).resolves.toBeDefined();
    });

    it('should verify wiki page exists', async () => {
      mockPrismaService.wikiPage.findUnique.mockResolvedValue({ id: 'wiki-123' });
      mockPrismaService.comment.create.mockResolvedValue(mockComment);

      const createDto: CreateCommentDto = {
        content: 'Test',
        contentType: CommentableType.WIKI_PAGE,
        contentId: 'wiki-123',
      };

      await expect(
        service.create('user-123', createDto),
      ).resolves.toBeDefined();
    });

    it('should verify gallery item exists', async () => {
      mockPrismaService.galleryItem.findUnique.mockResolvedValue({
        id: 'gallery-123',
      });
      mockPrismaService.comment.create.mockResolvedValue(mockComment);

      const createDto: CreateCommentDto = {
        content: 'Test',
        contentType: CommentableType.GALLERY_ITEM,
        contentId: 'gallery-123',
      };

      await expect(
        service.create('user-123', createDto),
      ).resolves.toBeDefined();
    });

    it('should verify story exists', async () => {
      mockPrismaService.story.findUnique.mockResolvedValue({ id: 'story-123' });
      mockPrismaService.comment.create.mockResolvedValue(mockComment);

      const createDto: CreateCommentDto = {
        content: 'Test',
        contentType: CommentableType.STORY,
        contentId: 'story-123',
      };

      await expect(
        service.create('user-123', createDto),
      ).resolves.toBeDefined();
    });

    it('should throw BadRequestException for invalid content type', async () => {
      const createDto: any = {
        content: 'Test',
        contentType: 'INVALID_TYPE',
        contentId: 'some-id',
      };

      await expect(service.create('user-123', createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('formatCommentResponse', () => {
    it('should format comment with repliesCount', async () => {
      const commentWithReplies = {
        ...mockComment,
        replies: [
          { id: 'reply-1', content: 'Reply 1', user: mockUser, replies: [] },
          { id: 'reply-2', content: 'Reply 2', user: mockUser, replies: [] },
        ],
      };

      mockPrismaService.comment.findUnique.mockResolvedValue(commentWithReplies);

      const result = await service.findOne('comment-123');

      expect(result.repliesCount).toBe(2);
      expect(result.replies[0].repliesCount).toBe(0);
      expect(result.replies[1].repliesCount).toBe(0);
    });

    it('should handle missing replies array', async () => {
      const commentWithoutReplies = { ...mockComment, replies: undefined };
      mockPrismaService.comment.findUnique.mockResolvedValue(
        commentWithoutReplies,
      );

      const result = await service.findOne('comment-123');

      expect(result.repliesCount).toBe(0);
    });
  });
});
