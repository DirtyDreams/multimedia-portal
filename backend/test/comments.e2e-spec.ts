import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Comments API (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let accessToken: string;
  let userId: string;
  let articleId: string;
  let authorId: string;
  let commentId: string;

  const testUser = {
    email: `comments-test-${Date.now()}@example.com`,
    username: `commentsuser${Date.now()}`,
    password: 'SecurePass123!',
    name: 'Comments Test User',
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

    // Create test article for comments
    const article = await prismaService.article.create({
      data: {
        title: 'Test Article for Comments',
        slug: `test-article-comments-${Date.now()}`,
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
    if (commentId) {
      await prismaService.comment.delete({ where: { id: commentId } }).catch(() => {});
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

  describe('/comments (POST)', () => {
    it('should create a comment', async () => {
      const response = await request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          contentType: 'ARTICLE',
          contentId: articleId,
          content: 'This is a test comment',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.content).toBe('This is a test comment');
      expect(response.body.contentType).toBe('ARTICLE');
      expect(response.body.contentId).toBe(articleId);

      commentId = response.body.id;
    });

    it('should fail to create comment without authentication', async () => {
      await request(app.getHttpServer())
        .post('/comments')
        .send({
          contentType: 'ARTICLE',
          contentId: articleId,
          content: 'This should fail',
        })
        .expect(401);
    });

    it('should fail to create comment with invalid content type', async () => {
      await request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          contentType: 'INVALID_TYPE',
          contentId: articleId,
          content: 'This should fail',
        })
        .expect(400);
    });

    it('should fail to create comment with empty content', async () => {
      await request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          contentType: 'ARTICLE',
          contentId: articleId,
          content: '',
        })
        .expect(400);
    });
  });

  describe('/comments (GET)', () => {
    it('should get all comments for content', async () => {
      const response = await request(app.getHttpServer())
        .get('/comments')
        .query({
          contentType: 'ARTICLE',
          contentId: articleId,
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get comments with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/comments')
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
      expect(response.body.meta).toHaveProperty('total');
    });
  });

  describe('/comments/:id (GET)', () => {
    it('should get a single comment by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/comments/${commentId}`)
        .expect(200);

      expect(response.body.id).toBe(commentId);
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('user');
    });

    it('should return 404 for non-existent comment', async () => {
      await request(app.getHttpServer())
        .get('/comments/non-existent-id')
        .expect(404);
    });
  });

  describe('/comments/:id (PUT)', () => {
    it('should update own comment', async () => {
      const response = await request(app.getHttpServer())
        .put(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Updated comment content',
        })
        .expect(200);

      expect(response.body.content).toBe('Updated comment content');
    });

    it('should fail to update without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/comments/${commentId}`)
        .send({
          content: 'This should fail',
        })
        .expect(401);
    });

    it('should fail to update with empty content', async () => {
      await request(app.getHttpServer())
        .put(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: '',
        })
        .expect(400);
    });
  });

  describe('/comments/:id (DELETE)', () => {
    it('should delete own comment', async () => {
      await request(app.getHttpServer())
        .delete(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/comments/${commentId}`)
        .expect(404);

      // Clear commentId so cleanup doesn't try to delete again
      commentId = null;
    });

    it('should fail to delete without authentication', async () => {
      // Create a new comment first
      const createRes = await request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          contentType: 'ARTICLE',
          contentId: articleId,
          content: 'Comment to test auth on delete',
        })
        .expect(201);

      const newCommentId = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/comments/${newCommentId}`)
        .expect(401);

      // Cleanup
      await prismaService.comment.delete({ where: { id: newCommentId } });
    });
  });

  describe('Nested Comments', () => {
    it('should create a reply to a comment', async () => {
      // Create parent comment
      const parentRes = await request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          contentType: 'ARTICLE',
          contentId: articleId,
          content: 'Parent comment',
        })
        .expect(201);

      const parentId = parentRes.body.id;

      // Create reply
      const replyRes = await request(app.getHttpServer())
        .post('/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          contentType: 'ARTICLE',
          contentId: articleId,
          content: 'Reply to parent',
          parentId,
        })
        .expect(201);

      expect(replyRes.body.parentId).toBe(parentId);

      // Cleanup
      await prismaService.comment.delete({ where: { id: replyRes.body.id } });
      await prismaService.comment.delete({ where: { id: parentId } });
    });
  });
});
