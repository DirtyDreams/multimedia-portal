import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { RatingsService } from './ratings.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateRatingDto,
  UpdateRatingDto,
  QueryRatingDto,
  RatableType,
} from './dto';

describe('RatingsService', () => {
  let service: RatingsService;
  let prismaService: PrismaService;

  const mockUser = {
    id: 'user-123',
    username: 'testuser',
    name: 'Test User',
  };

  const mockRating = {
    id: 'rating-123',
    value: 4,
    contentType: RatableType.ARTICLE,
    contentId: 'article-123',
    articleId: 'article-123',
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser,
  };

  const mockPrismaService = {
    rating: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
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
        RatingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const userId = 'user-123';
    const createDto: CreateRatingDto = {
      value: 4,
      contentType: RatableType.ARTICLE,
      contentId: 'article-123',
    };

    it('should successfully create a new rating', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue({ id: 'article-123' });
      mockPrismaService.rating.findFirst.mockResolvedValue(null);
      mockPrismaService.rating.create.mockResolvedValue(mockRating);

      const result = await service.create(userId, createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockRating.id);
      expect(mockPrismaService.article.findUnique).toHaveBeenCalledWith({
        where: { id: 'article-123' },
      });
      expect(mockPrismaService.rating.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            value: createDto.value,
            contentType: createDto.contentType,
            contentId: createDto.contentId,
            userId,
            articleId: createDto.contentId,
          }),
        }),
      );
    });

    it('should update existing rating if user already rated', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue({ id: 'article-123' });
      mockPrismaService.rating.findFirst.mockResolvedValue(mockRating);
      mockPrismaService.rating.update.mockResolvedValue({
        ...mockRating,
        value: 5,
      });

      const updateDto = { ...createDto, value: 5 };
      const result = await service.create(userId, updateDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.rating.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockRating.id },
          data: { value: 5 },
        }),
      );
      expect(mockPrismaService.rating.create).not.toHaveBeenCalled();
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

    it('should work with different content types', async () => {
      const blogPostDto = {
        value: 5,
        contentType: RatableType.BLOG_POST,
        contentId: 'blog-123',
      };

      mockPrismaService.blogPost.findUnique.mockResolvedValue({ id: 'blog-123' });
      mockPrismaService.rating.findFirst.mockResolvedValue(null);
      mockPrismaService.rating.create.mockResolvedValue({
        ...mockRating,
        contentType: RatableType.BLOG_POST,
        blogPostId: 'blog-123',
      });

      await service.create(userId, blogPostDto);

      expect(mockPrismaService.blogPost.findUnique).toHaveBeenCalledWith({
        where: { id: 'blog-123' },
      });
      expect(mockPrismaService.rating.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            blogPostId: 'blog-123',
          }),
        }),
      );
    });

    it('should validate rating value is between 1 and 5', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue({ id: 'article-123' });
      mockPrismaService.rating.findFirst.mockResolvedValue(null);
      mockPrismaService.rating.create.mockResolvedValue(mockRating);

      // Test valid values 1-5
      for (let value = 1; value <= 5; value++) {
        await service.create(userId, { ...createDto, value });
      }

      expect(mockPrismaService.rating.create).toHaveBeenCalledTimes(5);
    });
  });

  describe('findAll', () => {
    const queryDto: QueryRatingDto = {
      page: 1,
      limit: 20,
    };

    it('should return paginated ratings with metadata', async () => {
      mockPrismaService.rating.findMany.mockResolvedValue([mockRating]);
      mockPrismaService.rating.count.mockResolvedValue(1);

      const result = await service.findAll(queryDto);

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should filter by contentType', async () => {
      const contentQuery = { ...queryDto, contentType: RatableType.ARTICLE };
      mockPrismaService.rating.findMany.mockResolvedValue([mockRating]);
      mockPrismaService.rating.count.mockResolvedValue(1);

      await service.findAll(contentQuery);

      expect(mockPrismaService.rating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contentType: RatableType.ARTICLE,
          }),
        }),
      );
    });

    it('should filter by contentId', async () => {
      const contentQuery = { ...queryDto, contentId: 'article-123' };
      mockPrismaService.rating.findMany.mockResolvedValue([mockRating]);
      mockPrismaService.rating.count.mockResolvedValue(1);

      await service.findAll(contentQuery);

      expect(mockPrismaService.rating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contentId: 'article-123',
          }),
        }),
      );
    });

    it('should filter by userId', async () => {
      const userQuery = { ...queryDto, userId: 'user-123' };
      mockPrismaService.rating.findMany.mockResolvedValue([mockRating]);
      mockPrismaService.rating.count.mockResolvedValue(1);

      await service.findAll(userQuery);

      expect(mockPrismaService.rating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'user-123',
          }),
        }),
      );
    });

    it('should handle pagination correctly', async () => {
      const paginationQuery = { page: 2, limit: 10 };
      mockPrismaService.rating.findMany.mockResolvedValue([]);
      mockPrismaService.rating.count.mockResolvedValue(25);

      const result = await service.findAll(paginationQuery);

      expect(mockPrismaService.rating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page 2 - 1) * limit 10
          take: 10,
        }),
      );
      expect(result.meta.totalPages).toBe(3); // 25 / 10 = 2.5 -> 3
    });

    it('should sort by specified field and order', async () => {
      const sortQuery = { ...queryDto, sortBy: 'value', sortOrder: 'asc' as const };
      mockPrismaService.rating.findMany.mockResolvedValue([mockRating]);
      mockPrismaService.rating.count.mockResolvedValue(1);

      await service.findAll(sortQuery);

      expect(mockPrismaService.rating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { value: 'asc' },
        }),
      );
    });
  });

  describe('getContentRatings', () => {
    it('should return ratings for specific content', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue({ id: 'article-123' });
      mockPrismaService.rating.findMany.mockResolvedValue([mockRating]);

      const result = await service.getContentRatings(
        RatableType.ARTICLE,
        'article-123',
      );

      expect(result).toHaveLength(1);
      expect(mockPrismaService.article.findUnique).toHaveBeenCalledWith({
        where: { id: 'article-123' },
      });
      expect(mockPrismaService.rating.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contentType: RatableType.ARTICLE,
            contentId: 'article-123',
          }),
        }),
      );
    });

    it('should throw NotFoundException if content does not exist', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(null);

      await expect(
        service.getContentRatings(RatableType.ARTICLE, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAverageRating', () => {
    it('should return average rating and count', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue({ id: 'article-123' });
      mockPrismaService.rating.aggregate.mockResolvedValue({
        _avg: { value: 4.5 },
        _count: { value: 10 },
      });

      const result = await service.getAverageRating(
        RatableType.ARTICLE,
        'article-123',
      );

      expect(result).toEqual({
        average: 4.5,
        count: 10,
      });
      expect(mockPrismaService.rating.aggregate).toHaveBeenCalledWith({
        where: {
          contentType: RatableType.ARTICLE,
          contentId: 'article-123',
        },
        _avg: { value: true },
        _count: { value: true },
      });
    });

    it('should return 0 average when no ratings exist', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue({ id: 'article-123' });
      mockPrismaService.rating.aggregate.mockResolvedValue({
        _avg: { value: null },
        _count: { value: 0 },
      });

      const result = await service.getAverageRating(
        RatableType.ARTICLE,
        'article-123',
      );

      expect(result).toEqual({
        average: 0,
        count: 0,
      });
    });

    it('should throw NotFoundException if content does not exist', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(null);

      await expect(
        service.getAverageRating(RatableType.ARTICLE, 'invalid-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUserRating', () => {
    const userId = 'user-123';

    it('should return user rating for specific content', async () => {
      mockPrismaService.rating.findFirst.mockResolvedValue(mockRating);

      const result = await service.getUserRating(
        userId,
        RatableType.ARTICLE,
        'article-123',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(mockRating.id);
      expect(mockPrismaService.rating.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          contentType: RatableType.ARTICLE,
          contentId: 'article-123',
        },
        include: expect.any(Object),
      });
    });

    it('should return null if user has not rated content', async () => {
      mockPrismaService.rating.findFirst.mockResolvedValue(null);

      const result = await service.getUserRating(
        userId,
        RatableType.ARTICLE,
        'article-123',
      );

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return rating by ID', async () => {
      mockPrismaService.rating.findUnique.mockResolvedValue(mockRating);

      const result = await service.findOne('rating-123');

      expect(result).toBeDefined();
      expect(result.id).toBe(mockRating.id);
      expect(mockPrismaService.rating.findUnique).toHaveBeenCalledWith({
        where: { id: 'rating-123' },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if rating not found', async () => {
      mockPrismaService.rating.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'Rating with ID "invalid-id" not found',
      );
    });
  });

  describe('update', () => {
    const userId = 'user-123';
    const updateDto: UpdateRatingDto = {
      value: 5,
    };

    it('should successfully update a rating', async () => {
      mockPrismaService.rating.findUnique.mockResolvedValue(mockRating);
      mockPrismaService.rating.update.mockResolvedValue({
        ...mockRating,
        value: updateDto.value,
      });

      const result = await service.update('rating-123', userId, updateDto);

      expect(result).toBeDefined();
      expect(mockPrismaService.rating.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'rating-123' },
          data: { value: updateDto.value },
        }),
      );
    });

    it('should throw NotFoundException if rating does not exist', async () => {
      mockPrismaService.rating.findUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', userId, updateDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('invalid-id', userId, updateDto),
      ).rejects.toThrow('Rating with ID "invalid-id" not found');
    });

    it('should throw ForbiddenException if user is not the owner', async () => {
      const otherUserRating = { ...mockRating, userId: 'other-user' };
      mockPrismaService.rating.findUnique.mockResolvedValue(otherUserRating);

      await expect(
        service.update('rating-123', userId, updateDto),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.update('rating-123', userId, updateDto),
      ).rejects.toThrow('You can only edit your own ratings');
    });
  });

  describe('remove', () => {
    const userId = 'user-123';

    it('should successfully delete a rating by owner', async () => {
      mockPrismaService.rating.findUnique.mockResolvedValue(mockRating);
      mockPrismaService.rating.delete.mockResolvedValue(mockRating);

      const result = await service.remove('rating-123', userId, false);

      expect(result).toEqual({ message: 'Rating deleted successfully' });
      expect(mockPrismaService.rating.delete).toHaveBeenCalledWith({
        where: { id: 'rating-123' },
      });
    });

    it('should successfully delete a rating by admin', async () => {
      const otherUserRating = { ...mockRating, userId: 'other-user' };
      mockPrismaService.rating.findUnique.mockResolvedValue(otherUserRating);
      mockPrismaService.rating.delete.mockResolvedValue(otherUserRating);

      const result = await service.remove('rating-123', userId, true);

      expect(result).toEqual({ message: 'Rating deleted successfully' });
      expect(mockPrismaService.rating.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundException if rating does not exist', async () => {
      mockPrismaService.rating.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id', userId, false)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove('invalid-id', userId, false)).rejects.toThrow(
        'Rating with ID "invalid-id" not found',
      );
    });

    it('should throw ForbiddenException if user is not owner and not admin', async () => {
      const otherUserRating = { ...mockRating, userId: 'other-user' };
      mockPrismaService.rating.findUnique.mockResolvedValue(otherUserRating);

      await expect(
        service.remove('rating-123', userId, false),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        service.remove('rating-123', userId, false),
      ).rejects.toThrow('You can only delete your own ratings');
    });
  });

  describe('verifyContentExists', () => {
    it('should verify article exists', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue({ id: 'article-123' });
      mockPrismaService.rating.findFirst.mockResolvedValue(null);
      mockPrismaService.rating.create.mockResolvedValue(mockRating);

      const createDto: CreateRatingDto = {
        value: 4,
        contentType: RatableType.ARTICLE,
        contentId: 'article-123',
      };

      await expect(
        service.create('user-123', createDto),
      ).resolves.toBeDefined();
    });

    it('should verify blog post exists', async () => {
      mockPrismaService.blogPost.findUnique.mockResolvedValue({ id: 'blog-123' });
      mockPrismaService.rating.findFirst.mockResolvedValue(null);
      mockPrismaService.rating.create.mockResolvedValue(mockRating);

      const createDto: CreateRatingDto = {
        value: 4,
        contentType: RatableType.BLOG_POST,
        contentId: 'blog-123',
      };

      await expect(
        service.create('user-123', createDto),
      ).resolves.toBeDefined();
    });

    it('should verify wiki page exists', async () => {
      mockPrismaService.wikiPage.findUnique.mockResolvedValue({ id: 'wiki-123' });
      mockPrismaService.rating.findFirst.mockResolvedValue(null);
      mockPrismaService.rating.create.mockResolvedValue(mockRating);

      const createDto: CreateRatingDto = {
        value: 4,
        contentType: RatableType.WIKI_PAGE,
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
      mockPrismaService.rating.findFirst.mockResolvedValue(null);
      mockPrismaService.rating.create.mockResolvedValue(mockRating);

      const createDto: CreateRatingDto = {
        value: 4,
        contentType: RatableType.GALLERY_ITEM,
        contentId: 'gallery-123',
      };

      await expect(
        service.create('user-123', createDto),
      ).resolves.toBeDefined();
    });

    it('should verify story exists', async () => {
      mockPrismaService.story.findUnique.mockResolvedValue({ id: 'story-123' });
      mockPrismaService.rating.findFirst.mockResolvedValue(null);
      mockPrismaService.rating.create.mockResolvedValue(mockRating);

      const createDto: CreateRatingDto = {
        value: 4,
        contentType: RatableType.STORY,
        contentId: 'story-123',
      };

      await expect(
        service.create('user-123', createDto),
      ).resolves.toBeDefined();
    });

    it('should throw BadRequestException for invalid content type', async () => {
      const createDto: any = {
        value: 4,
        contentType: 'INVALID_TYPE',
        contentId: 'some-id',
      };

      await expect(service.create('user-123', createDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
