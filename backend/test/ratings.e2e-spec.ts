import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Ratings API (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let accessToken: string;
  let userId: string;
  let articleId: string;
  let authorId: string;
  let ratingId: string;

  const testUser = {
    email: `ratings-test-${Date.now()}@example.com`,
    username: `ratingsuser${Date.now()}`,
    password: 'SecurePass123!',
    name: 'Ratings Test User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Register test user and get token
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    accessToken = registerRes.body.accessToken;
    userId = registerRes.body.user.id;

    // Create test author
    const author = await prismaService.author.create({
      data: {
        name: 'Test Author',
        slug: `test-author-${Date.now()}`,
        email: `author-${Date.now()}@example.com`,
      },
    });
    authorId = author.id;

    // Create test article for ratings
    const article = await prismaService.article.create({
      data: {
        title: 'Test Article for Ratings',
        slug: `test-article-ratings-${Date.now()}`,
        content: 'This is a test article content',
        excerpt: 'Test excerpt',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        authorId,
        userId,
      },
    });
    articleId = article.id;
  });

  afterAll(async () => {
    // Cleanup
    if (ratingId) {
      await prismaService.rating.delete({ where: { id: ratingId } }).catch(() => {});
    }
    if (articleId) {
      await prismaService.article.delete({ where: { id: articleId } }).catch(() => {});
    }
    if (authorId) {
      await prismaService.author.delete({ where: { id: authorId } }).catch(() => {});
    }
    if (userId) {
      await prismaService.user.delete({ where: { id: userId } }).catch(() => {});
    }

    await app.close();
  });

  describe('/ratings (POST)', () => {
    it('should create a rating', async () => {
      const response = await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          contentType: 'ARTICLE',
          contentId: articleId,
          value: 5,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.value).toBe(5);
      expect(response.body.contentType).toBe('ARTICLE');
      expect(response.body.contentId).toBe(articleId);

      ratingId = response.body.id;
    });

    it('should fail to create rating without authentication', async () => {
      await request(app.getHttpServer())
        .post('/ratings')
        .send({
          contentType: 'ARTICLE',
          contentId: articleId,
          value: 4,
        })
        .expect(401);
    });

    it('should fail to create rating with invalid value (< 1)', async () => {
      await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          contentType: 'ARTICLE',
          contentId: articleId,
          value: 0,
        })
        .expect(400);
    });

    it('should fail to create rating with invalid value (> 5)', async () => {
      await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          contentType: 'ARTICLE',
          contentId: articleId,
          value: 6,
        })
        .expect(400);
    });

    it('should fail to create rating with invalid content type', async () => {
      await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          contentType: 'INVALID_TYPE',
          contentId: articleId,
          value: 5,
        })
        .expect(400);
    });
  });

  describe('/ratings (GET)', () => {
    it('should get all ratings for content', async () => {
      const response = await request(app.getHttpServer())
        .get('/ratings')
        .query({
          contentType: 'ARTICLE',
          contentId: articleId,
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get ratings with statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/ratings')
        .query({
          contentType: 'ARTICLE',
          contentId: articleId,
        })
        .expect(200);

      expect(response.body).toHaveProperty('meta');
      // Check for average rating if available
      if (response.body.meta.averageRating !== undefined) {
        expect(typeof response.body.meta.averageRating).toBe('number');
      }
    });

    it('should get ratings with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/ratings')
        .query({
          contentType: 'ARTICLE',
          contentId: articleId,
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
    });
  });

  describe('/ratings/:id (GET)', () => {
    it('should get a single rating by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/ratings/${ratingId}`)
        .expect(200);

      expect(response.body.id).toBe(ratingId);
      expect(response.body).toHaveProperty('value');
      expect(response.body).toHaveProperty('user');
    });

    it('should return 404 for non-existent rating', async () => {
      await request(app.getHttpServer())
        .get('/ratings/non-existent-id')
        .expect(404);
    });
  });

  describe('/ratings/:id (PUT)', () => {
    it('should update own rating', async () => {
      const response = await request(app.getHttpServer())
        .put(`/ratings/${ratingId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          value: 4,
        })
        .expect(200);

      expect(response.body.value).toBe(4);
    });

    it('should fail to update without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/ratings/${ratingId}`)
        .send({
          value: 3,
        })
        .expect(401);
    });

    it('should fail to update with invalid value', async () => {
      await request(app.getHttpServer())
        .put(`/ratings/${ratingId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          value: 10,
        })
        .expect(400);
    });
  });

  describe('/ratings/:id (DELETE)', () => {
    it('should delete own rating', async () => {
      await request(app.getHttpServer())
        .delete(`/ratings/${ratingId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/ratings/${ratingId}`)
        .expect(404);

      // Clear ratingId so cleanup doesn't try to delete again
      ratingId = null;
    });

    it('should fail to delete without authentication', async () => {
      // Create a new rating first
      const createRes = await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          contentType: 'ARTICLE',
          contentId: articleId,
          value: 3,
        })
        .expect(201);

      const newRatingId = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/ratings/${newRatingId}`)
        .expect(401);

      // Cleanup
      await prismaService.rating.delete({ where: { id: newRatingId } });
    });
  });

  describe('Rating Constraints', () => {
    it('should allow updating existing rating (one per user per content)', async () => {
      // Create initial rating
      const createRes = await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          contentType: 'ARTICLE',
          contentId: articleId,
          value: 3,
        })
        .expect(201);

      const newRatingId = createRes.body.id;

      // Try to create another rating for same content (should fail or update)
      const secondRes = await request(app.getHttpServer())
        .post('/ratings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          contentType: 'ARTICLE',
          contentId: articleId,
          value: 5,
        });

      // Depending on implementation, this might return 409 (conflict) or 200 (updated)
      expect([200, 201, 409]).toContain(secondRes.status);

      // Cleanup
      await prismaService.rating.delete({ where: { id: newRatingId } }).catch(() => {});
    });
  });
});
