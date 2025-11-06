import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto, QueryArticleDto } from './dto';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let prismaService: PrismaService;

  const mockArticle = {
    id: 'article-123',
    title: 'Test Article',
    slug: 'test-article',
    content: 'Test content',
    excerpt: 'Test excerpt',
    status: 'PUBLISHED',
    authorId: 'author-123',
    userId: 'user-123',
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      id: 'author-123',
      name: 'Test Author',
      slug: 'test-author',
    },
    user: {
      id: 'user-123',
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
    },
    categories: [
      {
        id: 'ac-1',
        articleId: 'article-123',
        categoryId: 'cat-1',
        category: {
          id: 'cat-1',
          name: 'Technology',
          slug: 'technology',
        },
      },
    ],
    tags: [
      {
        id: 'at-1',
        articleId: 'article-123',
        tagId: 'tag-1',
        tag: {
          id: 'tag-1',
          name: 'JavaScript',
          slug: 'javascript',
        },
      },
    ],
    _count: {
      comments: 5,
      ratings: 3,
    },
  };

  const mockPrismaService = {
    article: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    author: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-123';
    const createDto: CreateArticleDto = {
      title: 'New Article',
      content: 'Article content',
      excerpt: 'Article excerpt',
      status: 'DRAFT',
      authorId: 'author-123',
      categoryIds: ['cat-1'],
      tagIds: ['tag-1'],
    };

    it('should successfully create a new article', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(null);
      mockPrismaService.author.findUnique.mockResolvedValue({ id: 'author-123', name: 'Author' });
      mockPrismaService.article.create.mockResolvedValue({
        ...mockArticle,
        slug: 'new-article',
        title: 'New Article',
      });

      const result = await service.create(userId, createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockArticle.id);
      expect(result.slug).toBe('new-article');
      expect(mockPrismaService.article.findUnique).toHaveBeenCalledWith({
        where: { slug: 'new-article' },
      });
      expect(mockPrismaService.author.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.authorId },
      });
    });

    it('should set publishedAt when status is PUBLISHED', async () => {
      const publishedDto = { ...createDto, status: 'PUBLISHED' as const };
      mockPrismaService.article.findUnique.mockResolvedValue(null);
      mockPrismaService.author.findUnique.mockResolvedValue({ id: 'author-123' });
      mockPrismaService.article.create.mockResolvedValue(mockArticle);

      await service.create(userId, publishedDto);

      expect(mockPrismaService.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw ConflictException if slug already exists', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(mockArticle);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(userId, createDto)).rejects.toThrow(
        'Article with slug "new-article" already exists',
      );
    });

    it('should throw NotFoundException if author does not exist', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(null);
      mockPrismaService.author.findUnique.mockResolvedValue(null);

      await expect(service.create(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(userId, createDto)).rejects.toThrow(
        `Author with ID "${createDto.authorId}" not found`,
      );
    });

    it('should create article without categories and tags', async () => {
      const dtoWithoutRelations = {
        title: 'Simple Article',
        content: 'Content',
        excerpt: 'Excerpt',
        status: 'DRAFT' as const,
        authorId: 'author-123',
      };

      mockPrismaService.article.findUnique.mockResolvedValue(null);
      mockPrismaService.author.findUnique.mockResolvedValue({ id: 'author-123' });
      mockPrismaService.article.create.mockResolvedValue(mockArticle);

      await service.create(userId, dtoWithoutRelations);

      expect(mockPrismaService.article.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categories: undefined,
            tags: undefined,
          }),
        }),
      );
    });
  });

  describe('findAll', () => {
    const queryDto: QueryArticleDto = {
      page: 1,
      limit: 10,
    };

    it('should return paginated articles with metadata', async () => {
      mockPrismaService.article.findMany.mockResolvedValue([mockArticle]);
      mockPrismaService.article.count.mockResolvedValue(1);

      const result = await service.findAll(queryDto);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by search term', async () => {
      const searchQuery = { ...queryDto, search: 'test' };
      mockPrismaService.article.findMany.mockResolvedValue([mockArticle]);
      mockPrismaService.article.count.mockResolvedValue(1);

      await service.findAll(searchQuery);

      expect(mockPrismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'test', mode: 'insensitive' } },
              { content: { contains: 'test', mode: 'insensitive' } },
              { excerpt: { contains: 'test', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      const statusQuery = { ...queryDto, status: 'PUBLISHED' as const };
      mockPrismaService.article.findMany.mockResolvedValue([mockArticle]);
      mockPrismaService.article.count.mockResolvedValue(1);

      await service.findAll(statusQuery);

      expect(mockPrismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PUBLISHED',
          }),
        }),
      );
    });

    it('should filter by authorId', async () => {
      const authorQuery = { ...queryDto, authorId: 'author-123' };
      mockPrismaService.article.findMany.mockResolvedValue([mockArticle]);
      mockPrismaService.article.count.mockResolvedValue(1);

      await service.findAll(authorQuery);

      expect(mockPrismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authorId: 'author-123',
          }),
        }),
      );
    });

    it('should filter by category slug', async () => {
      const categoryQuery = { ...queryDto, category: 'technology' };
      mockPrismaService.article.findMany.mockResolvedValue([mockArticle]);
      mockPrismaService.article.count.mockResolvedValue(1);

      await service.findAll(categoryQuery);

      expect(mockPrismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categories: {
              some: {
                category: {
                  slug: 'technology',
                },
              },
            },
          }),
        }),
      );
    });

    it('should filter by tag slug', async () => {
      const tagQuery = { ...queryDto, tag: 'javascript' };
      mockPrismaService.article.findMany.mockResolvedValue([mockArticle]);
      mockPrismaService.article.count.mockResolvedValue(1);

      await service.findAll(tagQuery);

      expect(mockPrismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: {
              some: {
                tag: {
                  slug: 'javascript',
                },
              },
            },
          }),
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      const paginationQuery = { page: 2, limit: 5 };
      mockPrismaService.article.findMany.mockResolvedValue([]);
      mockPrismaService.article.count.mockResolvedValue(15);

      const result = await service.findAll(paginationQuery);

      expect(mockPrismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page 2 - 1) * limit 5
          take: 5,
        }),
      );
      expect(result.meta.totalPages).toBe(3); // 15 / 5
    });

    it('should sort by specified field and order', async () => {
      const sortQuery = { ...queryDto, sortBy: 'title', sortOrder: 'asc' as const };
      mockPrismaService.article.findMany.mockResolvedValue([mockArticle]);
      mockPrismaService.article.count.mockResolvedValue(1);

      await service.findAll(sortQuery);

      expect(mockPrismaService.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { title: 'asc' },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return article by ID', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(mockArticle);

      const result = await service.findOne('article-123');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockArticle.id);
      expect(mockPrismaService.article.findUnique).toHaveBeenCalledWith({
        where: { id: 'article-123' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if article not found', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Article with ID "invalid-id" not found',
      );
    });
  });

  describe('findBySlug', () => {
    it('should return article by slug', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(mockArticle);

      const result = await service.findBySlug('test-article');

      expect(result).toBeDefined();
      expect(result.slug).toBe(mockArticle.slug);
      expect(mockPrismaService.article.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-article' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if article not found', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('invalid-slug')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findBySlug('invalid-slug')).rejects.toThrow(
        'Article with slug "invalid-slug" not found',
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateArticleDto = {
      title: 'Updated Title',
      content: 'Updated content',
      status: 'PUBLISHED',
    };

    it('should successfully update an article', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(mockArticle);
      mockPrismaService.article.findFirst.mockResolvedValue(null);
      mockPrismaService.article.update.mockResolvedValue({
        ...mockArticle,
        ...updateDto,
      });

      const result = await service.update('article-123', updateDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'article-123' },
          data: expect.objectContaining({
            title: updateDto.title,
            content: updateDto.content,
            status: updateDto.status,
          }),
        }),
      );
    });

    it('should throw NotFoundException if article does not exist', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', updateDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.update('invalid-id', updateDto)).rejects.toThrow(
        'Article with ID "invalid-id" not found',
      );
    });

    it('should generate new slug when title changes', async () => {
      const articleWithDifferentTitle = { ...mockArticle, title: 'Old Title' };
      mockPrismaService.article.findUnique.mockResolvedValue(articleWithDifferentTitle);
      mockPrismaService.article.findFirst.mockResolvedValue(null);
      mockPrismaService.article.update.mockResolvedValue(mockArticle);

      await service.update('article-123', updateDto);

      expect(mockPrismaService.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'updated-title',
          }),
        }),
      );
    });

    it('should throw ConflictException if new slug conflicts', async () => {
      const articleWithDifferentTitle = { ...mockArticle, title: 'Old Title' };
      mockPrismaService.article.findUnique.mockResolvedValue(articleWithDifferentTitle);
      mockPrismaService.article.findFirst.mockResolvedValue({
        id: 'different-id',
        slug: 'updated-title',
      });

      await expect(service.update('article-123', updateDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.update('article-123', updateDto)).rejects.toThrow(
        'Article with slug "updated-title" already exists',
      );
    });

    it('should set publishedAt when status changes to PUBLISHED', async () => {
      const draftArticle = { ...mockArticle, status: 'DRAFT', publishedAt: null };
      mockPrismaService.article.findUnique.mockResolvedValue(draftArticle);
      mockPrismaService.article.findFirst.mockResolvedValue(null);
      mockPrismaService.article.update.mockResolvedValue(mockArticle);

      await service.update('article-123', { status: 'PUBLISHED' });

      expect(mockPrismaService.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should not change publishedAt if already published', async () => {
      const publishedDate = new Date('2024-01-01');
      const publishedArticle = { ...mockArticle, publishedAt: publishedDate };
      mockPrismaService.article.findUnique.mockResolvedValue(publishedArticle);
      mockPrismaService.article.update.mockResolvedValue(publishedArticle);

      await service.update('article-123', { content: 'New content' });

      expect(mockPrismaService.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            publishedAt: publishedDate,
          }),
        }),
      );
    });

    it('should update categories when provided', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(mockArticle);
      mockPrismaService.article.update.mockResolvedValue(mockArticle);

      await service.update('article-123', {
        categoryIds: ['cat-2', 'cat-3'],
      });

      expect(mockPrismaService.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            categories: {
              deleteMany: {},
              create: [
                { category: { connect: { id: 'cat-2' } } },
                { category: { connect: { id: 'cat-3' } } },
              ],
            },
          }),
        }),
      );
    });

    it('should update tags when provided', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(mockArticle);
      mockPrismaService.article.update.mockResolvedValue(mockArticle);

      await service.update('article-123', {
        tagIds: ['tag-2', 'tag-3'],
      });

      expect(mockPrismaService.article.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: {
              deleteMany: {},
              create: [
                { tag: { connect: { id: 'tag-2' } } },
                { tag: { connect: { id: 'tag-3' } } },
              ],
            },
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('should successfully delete an article', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(mockArticle);
      mockPrismaService.article.delete.mockResolvedValue(mockArticle);

      const result = await service.remove('article-123');

      expect(result).toEqual({ message: 'Article deleted successfully' });
      expect(mockPrismaService.article.delete).toHaveBeenCalledWith({
        where: { id: 'article-123' },
      });
    });

    it('should throw NotFoundException if article does not exist', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('invalid-id')).rejects.toThrow(
        'Article with ID "invalid-id" not found',
      );
    });
  });

  describe('formatArticleResponse', () => {
    it('should flatten categories and tags in response', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(mockArticle);

      const result = await service.findOne('article-123');

      expect(result.categories).toEqual([
        {
          id: 'cat-1',
          name: 'Technology',
          slug: 'technology',
        },
      ]);
      expect(result.tags).toEqual([
        {
          id: 'tag-1',
          name: 'JavaScript',
          slug: 'javascript',
        },
      ]);
      expect(result.commentsCount).toBe(5);
      expect(result.ratingsCount).toBe(3);
    });

    it('should handle missing relations gracefully', async () => {
      const articleWithoutRelations = {
        ...mockArticle,
        categories: undefined,
        tags: undefined,
        _count: undefined,
      };
      mockPrismaService.article.findUnique.mockResolvedValue(articleWithoutRelations);

      const result = await service.findOne('article-123');

      expect(result.categories).toEqual([]);
      expect(result.tags).toEqual([]);
      expect(result.commentsCount).toBe(0);
      expect(result.ratingsCount).toBe(0);
    });
  });
});
