import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Articles API (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let accessToken: string;
  let userId: string;
  let articleId: string;
  let authorId: string;
  let categoryId: string;
  let tagId: string;

  const testUser = {
    email: `articles-test-${Date.now()}@example.com`,
    username: `articlesuser${Date.now()}`,
    password: 'SecurePass123!',
    name: 'Articles Test User',
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
        bio: 'Test bio',
        userId,
      },
    });
    authorId = author.id;

    // Create test category
    const category = await prismaService.category.create({
      data: {
        name: 'Test Category',
        slug: `test-category-${Date.now()}`,
        description: 'Test category description',
      },
    });
    categoryId = category.id;

    // Create test tag
    const tag = await prismaService.tag.create({
      data: {
        name: 'Test Tag',
        slug: `test-tag-${Date.now()}`,
      },
    });
    tagId = tag.id;
  });

  afterAll(async () => {
    // Cleanup
    if (articleId) {
      await prismaService.article.delete({ where: { id: articleId } }).catch(() => {});
    }
    if (authorId) {
      await prismaService.author.delete({ where: { id: authorId } }).catch(() => {});
    }
    if (categoryId) {
      await prismaService.category.delete({ where: { id: categoryId } }).catch(() => {});
    }
    if (tagId) {
      await prismaService.tag.delete({ where: { id: tagId } }).catch(() => {});
    }
    if (userId) {
      await prismaService.user.delete({ where: { id: userId } }).catch(() => {});
    }

    await app.close();
  });

  describe('/articles (POST)', () => {
    it('should create a new article with authentication', () => {
      const newArticle = {
        title: 'Test Article',
        content: 'This is test article content',
        excerpt: 'Test excerpt',
        status: 'DRAFT',
        authorId,
        categoryIds: [categoryId],
        tagIds: [tagId],
      };

      return request(app.getHttpServer())
        .post('/articles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newArticle)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title', newArticle.title);
          expect(res.body).toHaveProperty('slug', 'test-article');
          expect(res.body).toHaveProperty('status', 'DRAFT');
          expect(res.body.author).toHaveProperty('id', authorId);
          expect(res.body.categories).toHaveLength(1);
          expect(res.body.tags).toHaveLength(1);

          articleId = res.body.id;
        });
    });

    it('should fail to create article without authentication', () => {
      return request(app.getHttpServer())
        .post('/articles')
        .send({
          title: 'Unauthorized Article',
          content: 'Content',
          excerpt: 'Excerpt',
          status: 'DRAFT',
          authorId,
        })
        .expect(401);
    });

    it('should fail with duplicate slug', () => {
      return request(app.getHttpServer())
        .post('/articles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Article', // Same title = same slug
          content: 'Content',
          excerpt: 'Excerpt',
          status: 'DRAFT',
          authorId,
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should fail with non-existent author', () => {
      return request(app.getHttpServer())
        .post('/articles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Article with invalid author',
          content: 'Content',
          excerpt: 'Excerpt',
          status: 'DRAFT',
          authorId: 'non-existent-author-id',
        })
        .expect(404);
    });

    it('should fail with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/articles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Incomplete Article',
          // missing content, excerpt, status, authorId
        })
        .expect(400);
    });
  });

  describe('/articles (GET)', () => {
    it('should get all articles with pagination', () => {
      return request(app.getHttpServer())
        .get('/articles')
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('page', 1);
          expect(res.body.meta).toHaveProperty('limit', 10);
          expect(res.body.meta).toHaveProperty('totalPages');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should filter articles by search term', () => {
      return request(app.getHttpServer())
        .get('/articles')
        .query({ search: 'Test Article' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
        });
    });

    it('should filter articles by status', () => {
      return request(app.getHttpServer())
        .get('/articles')
        .query({ status: 'DRAFT' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
        });
    });

    it('should filter articles by author', () => {
      return request(app.getHttpServer())
        .get('/articles')
        .query({ authorId })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
        });
    });

    it('should sort articles by field and order', () => {
      return request(app.getHttpServer())
        .get('/articles')
        .query({ sortBy: 'createdAt', sortOrder: 'asc' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeDefined();
        });
    });
  });

  describe('/articles/:id (GET)', () => {
    it('should get article by ID', () => {
      return request(app.getHttpServer())
        .get(`/articles/${articleId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', articleId);
          expect(res.body).toHaveProperty('title', 'Test Article');
          expect(res.body).toHaveProperty('author');
          expect(res.body).toHaveProperty('categories');
          expect(res.body).toHaveProperty('tags');
        });
    });

    it('should fail with non-existent article ID', () => {
      return request(app.getHttpServer())
        .get('/articles/non-existent-id')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });
  });

  describe('/articles/slug/:slug (GET)', () => {
    it('should get article by slug', () => {
      return request(app.getHttpServer())
        .get('/articles/slug/test-article')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('slug', 'test-article');
          expect(res.body).toHaveProperty('title', 'Test Article');
        });
    });

    it('should fail with non-existent slug', () => {
      return request(app.getHttpServer())
        .get('/articles/slug/non-existent-slug')
        .expect(404);
    });
  });

  describe('/articles/:id (PUT)', () => {
    it('should update article with authentication', () => {
      const updates = {
        title: 'Updated Test Article',
        content: 'Updated content',
        status: 'PUBLISHED',
      };

      return request(app.getHttpServer())
        .put(`/articles/${articleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updates)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', articleId);
          expect(res.body).toHaveProperty('title', updates.title);
          expect(res.body).toHaveProperty('slug', 'updated-test-article');
          expect(res.body).toHaveProperty('status', 'PUBLISHED');
          expect(res.body).toHaveProperty('publishedAt');
        });
    });

    it('should fail to update without authentication', () => {
      return request(app.getHttpServer())
        .put(`/articles/${articleId}`)
        .send({ title: 'Unauthorized Update' })
        .expect(401);
    });

    it('should fail with non-existent article ID', () => {
      return request(app.getHttpServer())
        .put('/articles/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Update' })
        .expect(404);
    });

    it('should update categories and tags', () => {
      return request(app.getHttpServer())
        .put(`/articles/${articleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          categoryIds: [categoryId],
          tagIds: [tagId],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.categories).toHaveLength(1);
          expect(res.body.tags).toHaveLength(1);
        });
    });
  });

  describe('/articles/:id (DELETE)', () => {
    let articleToDelete: string;

    beforeAll(async () => {
      // Create an article to delete
      const article = await prismaService.article.create({
        data: {
          title: 'Article to Delete',
          slug: `article-to-delete-${Date.now()}`,
          content: 'Content',
          excerpt: 'Excerpt',
          status: 'DRAFT',
          authorId,
          userId,
        },
      });
      articleToDelete = article.id;
    });

    it('should delete article with authentication', () => {
      return request(app.getHttpServer())
        .delete(`/articles/${articleToDelete}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('deleted successfully');
        });
    });

    it('should fail to delete without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/articles/${articleId}`)
        .expect(401);
    });

    it('should fail with non-existent article ID', () => {
      return request(app.getHttpServer())
        .delete('/articles/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should fail when trying to delete already deleted article', () => {
      return request(app.getHttpServer())
        .delete(`/articles/${articleToDelete}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Article CRUD Lifecycle', () => {
    it('should complete full article lifecycle: create -> read -> update -> delete', async () => {
      // 1. Create
      const createRes = await request(app.getHttpServer())
        .post('/articles')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Lifecycle Article',
          content: 'Lifecycle content',
          excerpt: 'Lifecycle excerpt',
          status: 'DRAFT',
          authorId,
          categoryIds: [categoryId],
          tagIds: [tagId],
        })
        .expect(201);

      const lifecycleId = createRes.body.id;

      // 2. Read
      await request(app.getHttpServer())
        .get(`/articles/${lifecycleId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Lifecycle Article');
        });

      // 3. Update
      await request(app.getHttpServer())
        .put(`/articles/${lifecycleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Lifecycle Article',
          status: 'PUBLISHED',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated Lifecycle Article');
          expect(res.body.status).toBe('PUBLISHED');
        });

      // 4. Delete
      await request(app.getHttpServer())
        .delete(`/articles/${lifecycleId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 5. Verify deletion
      await request(app.getHttpServer())
        .get(`/articles/${lifecycleId}`)
        .expect(404);
    });
  });
});
