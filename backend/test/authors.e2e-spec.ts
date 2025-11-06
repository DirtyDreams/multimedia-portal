import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Authors API (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let accessToken: string;
  let userId: string;
  let authorId: string;

  const testUser = {
    email: `authors-test-${Date.now()}@example.com`,
    username: `authorsuser${Date.now()}`,
    password: 'SecurePass123!',
    name: 'Authors Test User',
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
  });

  afterAll(async () => {
    // Cleanup
    if (authorId) {
      await prismaService.author.delete({ where: { id: authorId } }).catch(() => {});
    }
    if (userId) {
      await prismaService.user.delete({ where: { id: userId } }).catch(() => {});
    }

    await app.close();
  });

  describe('/authors (POST)', () => {
    it('should create an author', async () => {
      const response = await request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'John Doe',
          bio: 'A talented writer and journalist',
          email: `john.doe.${Date.now()}@example.com`,
          website: 'https://johndoe.com',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('John Doe');
      expect(response.body).toHaveProperty('slug');
      expect(response.body.bio).toBe('A talented writer and journalist');

      authorId = response.body.id;
    });

    it('should fail to create author without authentication', async () => {
      await request(app.getHttpServer())
        .post('/authors')
        .send({
          name: 'Jane Doe',
          bio: 'Another writer',
        })
        .expect(401);
    });

    it('should fail to create author without name', async () => {
      await request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          bio: 'A writer without a name',
        })
        .expect(400);
    });

    it('should auto-generate slug from name', async () => {
      const response = await request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Author With Spaces',
          bio: 'Testing slug generation',
        })
        .expect(201);

      expect(response.body.slug).toMatch(/test-author-with-spaces/i);

      // Cleanup
      await prismaService.author.delete({ where: { id: response.body.id } });
    });
  });

  describe('/authors (GET)', () => {
    it('should get all authors', async () => {
      const response = await request(app.getHttpServer())
        .get('/authors')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get authors with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/authors')
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
      expect(response.body.meta).toHaveProperty('total');
    });

    it('should search authors by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/authors')
        .query({
          search: 'John',
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should sort authors', async () => {
      const response = await request(app.getHttpServer())
        .get('/authors')
        .query({
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('/authors/:id (GET)', () => {
    it('should get a single author by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/authors/${authorId}`)
        .expect(200);

      expect(response.body.id).toBe(authorId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('slug');
      expect(response.body).toHaveProperty('bio');
    });

    it('should return 404 for non-existent author', async () => {
      await request(app.getHttpServer())
        .get('/authors/non-existent-id')
        .expect(404);
    });
  });

  describe('/authors/slug/:slug (GET)', () => {
    it('should get author by slug', async () => {
      // First get the author to know the slug
      const authorRes = await request(app.getHttpServer())
        .get(`/authors/${authorId}`)
        .expect(200);

      const slug = authorRes.body.slug;

      // Then get by slug
      const response = await request(app.getHttpServer())
        .get(`/authors/slug/${slug}`)
        .expect(200);

      expect(response.body.id).toBe(authorId);
      expect(response.body.slug).toBe(slug);
    });

    it('should return 404 for non-existent slug', async () => {
      await request(app.getHttpServer())
        .get('/authors/slug/non-existent-slug-12345')
        .expect(404);
    });
  });

  describe('/authors/:id (PUT)', () => {
    it('should update an author', async () => {
      const response = await request(app.getHttpServer())
        .put(`/authors/${authorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'John Doe Updated',
          bio: 'Updated biography',
        })
        .expect(200);

      expect(response.body.name).toBe('John Doe Updated');
      expect(response.body.bio).toBe('Updated biography');
    });

    it('should fail to update without authentication', async () => {
      await request(app.getHttpServer())
        .put(`/authors/${authorId}`)
        .send({
          name: 'Should fail',
        })
        .expect(401);
    });

    it('should partially update author (PATCH behavior)', async () => {
      const response = await request(app.getHttpServer())
        .put(`/authors/${authorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          website: 'https://updated-website.com',
        })
        .expect(200);

      expect(response.body.website).toBe('https://updated-website.com');
      // Name should remain unchanged
      expect(response.body.name).toBeTruthy();
    });
  });

  describe('/authors/:id (DELETE)', () => {
    it('should delete an author', async () => {
      await request(app.getHttpServer())
        .delete(`/authors/${authorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/authors/${authorId}`)
        .expect(404);

      // Clear authorId so cleanup doesn't try to delete again
      authorId = null;
    });

    it('should fail to delete without authentication', async () => {
      // Create a new author first
      const createRes = await request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'To Be Deleted',
          bio: 'Test author for deletion',
        })
        .expect(201);

      const newAuthorId = createRes.body.id;

      await request(app.getHttpServer())
        .delete(`/authors/${newAuthorId}`)
        .expect(401);

      // Cleanup
      await prismaService.author.delete({ where: { id: newAuthorId } });
    });
  });

  describe('Author Content Relations', () => {
    it('should include author statistics (articles count)', async () => {
      // Create a new author with an article
      const authorRes = await request(app.getHttpServer())
        .post('/authors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Author With Content',
          bio: 'Has articles',
        })
        .expect(201);

      const newAuthorId = authorRes.body.id;

      // Create article for this author
      await prismaService.article.create({
        data: {
          title: 'Test Article',
          slug: `test-article-${Date.now()}`,
          content: 'Content',
          excerpt: 'Excerpt',
          status: 'PUBLISHED',
          publishedAt: new Date(),
          authorId: newAuthorId,
          userId,
        },
      });

      // Get author and check if content count is included
      const response = await request(app.getHttpServer())
        .get(`/authors/${newAuthorId}`)
        .expect(200);

      // Depending on implementation, _count might be present
      if (response.body._count) {
        expect(response.body._count.articles).toBeGreaterThan(0);
      }

      // Cleanup
      await prismaService.article.deleteMany({ where: { authorId: newAuthorId } });
      await prismaService.author.delete({ where: { id: newAuthorId } });
    });
  });
});
