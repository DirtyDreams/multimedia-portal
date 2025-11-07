# Architektura Backend (NestJS)

## Wprowadzenie

Backend Multimedia Portal jest zbudowany w oparciu o framework NestJS 11, który dostarcza solidną strukturę dla budowy skalowalnych i łatwo utrzymywalnych aplikacji serwerowych.

## Struktura Katalogów

```
backend/
├── src/
│   ├── main.ts                    # Punkt wejścia aplikacji
│   ├── app.module.ts              # Root module
│   ├── app.controller.ts          # Root controller
│   ├── app.service.ts             # Root service
│   │
│   ├── common/                    # Wspólne komponenty
│   │   ├── decorators/            # Custom decoratory
│   │   │   ├── public.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/                # Guards autoryzacyjne
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── filters/               # Exception filters
│   │   ├── interceptors/          # Interceptory
│   │   └── pipes/                 # Validation pipes
│   │
│   ├── config/                    # Konfiguracja
│   │   ├── config.module.ts
│   │   └── config.service.ts
│   │
│   ├── prisma/                    # Prisma ORM
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── cache/                     # Redis Cache
│   │   ├── cache.module.ts
│   │   ├── cache.service.ts
│   │   └── cache.config.ts
│   │
│   ├── queues/                    # Bull Queues
│   │   ├── queues.module.ts
│   │   ├── queues.service.ts
│   │   └── processors/
│   │
│   ├── types/                     # TypeScript types
│   │   └── express.d.ts
│   │
│   └── modules/                   # Feature modules
│       ├── auth/                  # Autentykacja
│       ├── articles/              # Artykuły
│       ├── blog-posts/            # Blog
│       ├── wiki-pages/            # Wiki
│       ├── gallery-items/         # Galeria
│       ├── stories/               # Historie
│       ├── authors/               # Autorzy
│       ├── comments/              # Komentarze
│       ├── ratings/               # Oceny
│       ├── search/                # Wyszukiwanie
│       ├── notifications/         # Powiadomienia
│       ├── email/                 # Email
│       └── content-versions/      # Wersjonowanie
│
├── prisma/
│   ├── schema.prisma             # Schema bazy danych
│   ├── migrations/               # Migracje
│   └── seed.ts                   # Seed data
│
├── test/                         # Testy E2E
├── k6-tests/                     # Load tests
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Moduły Funkcjonalne

### 1. Auth Module

**Lokalizacja**: `src/modules/auth/`

**Struktura**:
```
auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.service.spec.ts
├── strategies/
│   └── jwt.strategy.ts
├── guards/
│   └── jwt-auth.guard.ts
└── dto/
    ├── register.dto.ts
    ├── login.dto.ts
    └── refresh-token.dto.ts
```

**Odpowiedzialności**:
- Rejestracja użytkowników
- Logowanie i wylogowanie
- Generowanie JWT tokens
- Odświeżanie tokenów
- Walidacja JWT
- Zarządzanie sesjami

**Endpointy**:
- `POST /auth/register` - Rejestracja
- `POST /auth/login` - Logowanie
- `GET /auth/me` - Profil użytkownika
- `POST /auth/logout` - Wylogowanie
- `POST /auth/refresh` - Odświeżanie tokenu

**Implementacja JWT Strategy**:
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

### 2. Articles Module

**Lokalizacja**: `src/modules/articles/`

**Struktura**:
```
articles/
├── articles.module.ts
├── articles.controller.ts
├── articles.service.ts
├── articles.service.spec.ts
└── dto/
    ├── create-article.dto.ts
    ├── update-article.dto.ts
    └── query-article.dto.ts
```

**Funkcje**:
- CRUD dla artykułów
- Generowanie slug'ów
- Zarządzanie statusem (DRAFT, PUBLISHED, SCHEDULED, ARCHIVED)
- Paginacja i filtrowanie
- Relacje z kategoriami, tagami, autorami
- Licznik wyświetleń

**Przykładowy Service**:
```typescript
@Injectable()
export class ArticlesService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  async findAll(query: QueryArticleDto) {
    const cacheKey = `articles:${JSON.stringify(query)}`;

    // Sprawdź cache
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const { page = 1, limit = 10, status, category } = query;

    const where: Prisma.ArticleWhereInput = {
      status: status || 'PUBLISHED',
      ...(category && {
        categories: {
          some: { category: { slug: category } }
        }
      }),
    };

    const articles = await this.prisma.article.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: true,
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        _count: {
          select: { comments: true, ratings: true }
        }
      },
      orderBy: { publishedAt: 'desc' },
    });

    const total = await this.prisma.article.count({ where });

    const result = {
      data: articles,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Cache na 60 sekund
    await this.cache.set(cacheKey, result, 60);

    return result;
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: {
        author: true,
        user: { select: { id: true, name: true } },
        categories: { include: { category: true } },
        tags: { include: { tag: true } },
        comments: {
          where: { parentId: null },
          include: {
            user: { select: { id: true, name: true } },
            replies: {
              include: {
                user: { select: { id: true, name: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        ratings: true,
      },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    // Zwiększ licznik wyświetleń
    await this.prisma.article.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    });

    return article;
  }
}
```

### 3. Blog Posts Module

**Podobna struktura do Articles Module**

Różnice:
- Oddzielna tabela `BlogPost`
- Możliwość schedulowania publikacji
- RSS feed support
- Draft preview functionality

### 4. Wiki Pages Module

**Lokalizacja**: `src/modules/wiki-pages/`

**Specjalne funkcje**:
- **Hierarchia**: Parent-child relationships
- **Breadcrumbs**: Ścieżka hierarchii
- **Navigation tree**: Drzewo nawigacji

**Self-referential relationship**:
```typescript
// W Prisma schema
model WikiPage {
  id       String     @id @default(uuid())
  title    String
  slug     String     @unique
  content  String     @db.Text
  parentId String?

  parent   WikiPage?  @relation("WikiHierarchy", fields: [parentId], references: [id])
  children WikiPage[] @relation("WikiHierarchy")
}
```

**Service method dla hierarchii**:
```typescript
async getPageWithHierarchy(slug: string) {
  const page = await this.prisma.wikiPage.findUnique({
    where: { slug },
    include: {
      parent: true,
      children: {
        where: { status: 'PUBLISHED' },
        select: { id: true, title: true, slug: true }
      },
      author: true,
    },
  });

  // Pobierz breadcrumbs
  const breadcrumbs = await this.getBreadcrumbs(page.id);

  return {
    ...page,
    breadcrumbs,
  };
}

private async getBreadcrumbs(pageId: string) {
  const breadcrumbs = [];
  let currentPage = await this.prisma.wikiPage.findUnique({
    where: { id: pageId },
    select: { id: true, title: true, slug: true, parentId: true }
  });

  while (currentPage) {
    breadcrumbs.unshift({
      title: currentPage.title,
      slug: currentPage.slug,
    });

    if (currentPage.parentId) {
      currentPage = await this.prisma.wikiPage.findUnique({
        where: { id: currentPage.parentId },
        select: { id: true, title: true, slug: true, parentId: true }
      });
    } else {
      break;
    }
  }

  return breadcrumbs;
}
```

### 5. Gallery Items Module

**Lokalizacja**: `src/modules/gallery-items/`

**Funkcje**:
- Upload plików (zdjęcia/wideo)
- Generowanie thumbnails
- Integracja z MinIO/S3
- Metadata extraction
- File type validation

**Przykład upload**:
```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
async uploadFile(
  @UploadedFile() file: Express.Multer.File,
  @Body() createDto: CreateGalleryItemDto,
  @CurrentUser('id') userId: string,
) {
  // Walidacja typu pliku
  if (!file.mimetype.startsWith('image/') &&
      !file.mimetype.startsWith('video/')) {
    throw new BadRequestException('Invalid file type');
  }

  // Upload do MinIO
  const fileUrl = await this.minioService.uploadFile(file);

  // Generuj thumbnail dla obrazów
  let thumbnailUrl: string;
  if (file.mimetype.startsWith('image/')) {
    thumbnailUrl = await this.imageService.generateThumbnail(file);
  }

  // Utwórz rekord w bazie
  const galleryItem = await this.prisma.galleryItem.create({
    data: {
      ...createDto,
      fileUrl,
      thumbnailUrl,
      fileType: file.mimetype.startsWith('image/') ? 'IMAGE' : 'VIDEO',
      userId,
    },
  });

  return galleryItem;
}
```

### 6. Stories Module

**Funkcje specjalne**:
- Series grouping - grupowanie historii w serie
- Chapter management - zarządzanie rozdziałami
- Reading progress tracking

### 7. Authors Module

**Funkcje**:
- Profile management
- Bio i contact info
- Profile images
- Author statistics (ilość treści)

### 8. Comments Module

**Lokalizacja**: `src/modules/comments/`

**Polimorficzne komentarze**:
```typescript
enum CommentableType {
  ARTICLE, BLOG_POST, WIKI_PAGE, GALLERY_ITEM, STORY
}

// DTO
export class CreateCommentDto {
  @IsString()
  content: string;

  @IsEnum(CommentableType)
  contentType: CommentableType;

  @IsString()
  contentId: string;

  @IsOptional()
  @IsString()
  parentId?: string; // Dla nested replies
}
```

**Service implementation**:
```typescript
async create(dto: CreateCommentDto, userId: string) {
  // Sprawdź czy content istnieje
  await this.validateContent(dto.contentType, dto.contentId);

  const comment = await this.prisma.comment.create({
    data: {
      content: dto.content,
      contentType: dto.contentType,
      contentId: dto.contentId,
      parentId: dto.parentId,
      userId,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  // Wyślij powiadomienie
  await this.notificationService.notifyNewComment(comment);

  return comment;
}

private async validateContent(type: CommentableType, id: string) {
  let exists = false;

  switch (type) {
    case 'ARTICLE':
      exists = !!(await this.prisma.article.findUnique({ where: { id } }));
      break;
    case 'BLOG_POST':
      exists = !!(await this.prisma.blogPost.findUnique({ where: { id } }));
      break;
    // ... inne typy
  }

  if (!exists) {
    throw new NotFoundException('Content not found');
  }
}
```

### 9. Ratings Module

**Polimorficzne oceny**:
```typescript
@Injectable()
export class RatingsService {
  async rateContent(
    contentType: RatableType,
    contentId: string,
    value: number,
    userId: string,
  ) {
    // Walidacja (1-5)
    if (value < 1 || value > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Upsert - jedna ocena per user per content
    const rating = await this.prisma.rating.upsert({
      where: {
        userId_contentType_contentId: {
          userId,
          contentType,
          contentId,
        },
      },
      update: { value },
      create: {
        value,
        contentType,
        contentId,
        userId,
      },
    });

    // Aktualizuj średnią ocenę
    await this.updateAverageRating(contentType, contentId);

    return rating;
  }

  private async updateAverageRating(
    contentType: RatableType,
    contentId: string,
  ) {
    const ratings = await this.prisma.rating.findMany({
      where: { contentType, contentId },
      select: { value: true },
    });

    const average = ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length;
    const count = ratings.length;

    // Update content average rating
    // Różne podejście w zależności od typu
    await this.updateContentRating(contentType, contentId, average, count);
  }
}
```

### 10. Search Module

**Integracja z Meilisearch**:
```typescript
@Injectable()
export class SearchService {
  private meiliClient: MeiliSearch;

  constructor(private configService: ConfigService) {
    this.meiliClient = new MeiliSearch({
      host: configService.get('MEILI_HOST'),
      apiKey: configService.get('MEILI_API_KEY'),
    });
  }

  async search(query: SearchQueryDto) {
    const { q, type, category, tag, page = 1, limit = 20 } = query;

    const filters = [];
    if (type) filters.push(`type = ${type}`);
    if (category) filters.push(`category = ${category}`);
    if (tag) filters.push(`tags = ${tag}`);

    const results = await this.meiliClient.index('content').search(q, {
      filter: filters.join(' AND '),
      limit,
      offset: (page - 1) * limit,
      attributesToHighlight: ['title', 'content'],
    });

    return {
      hits: results.hits,
      total: results.estimatedTotalHits,
      page,
      pages: Math.ceil(results.estimatedTotalHits / limit),
    };
  }

  async autocomplete(query: string) {
    const results = await this.meiliClient.index('content').search(query, {
      limit: 10,
      attributesToSearchOn: ['title'],
    });

    return results.hits.map(hit => ({
      title: hit.title,
      slug: hit.slug,
      type: hit.type,
    }));
  }

  // Indexowanie treści
  async indexContent(type: string, content: any) {
    await this.meiliClient.index('content').addDocuments([{
      id: `${type}_${content.id}`,
      type,
      title: content.title,
      content: content.content,
      slug: content.slug,
      category: content.categories?.[0]?.name,
      tags: content.tags?.map(t => t.name) || [],
      publishedAt: content.publishedAt,
    }]);
  }
}
```

### 11. Notifications Module

**WebSocket Gateway**:
```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  constructor(private notificationsService: NotificationsService) {}

  @SubscribeMessage('join')
  handleJoin(client: Socket, userId: string) {
    client.join(`user:${userId}`);
  }

  // Wysyłanie powiadomienia do użytkownika
  async sendToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);

    // Zapisz również w bazie
    await this.notificationsService.create({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
    });
  }
}
```

### 12. Email Module

**Kolejka email**:
```typescript
@Injectable()
export class EmailService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    private mailerService: MailerService,
  ) {}

  async sendEmail(to: string, subject: string, template: string, context: any) {
    // Dodaj do kolejki
    await this.emailQueue.add('send-email', {
      to,
      subject,
      template,
      context,
    });
  }
}

// Processor
@Processor('email')
export class EmailProcessor {
  constructor(private mailerService: MailerService) {}

  @Process('send-email')
  async handleSendEmail(job: Job) {
    const { to, subject, template, context } = job.data;

    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });

      // Oznacz jako wysłane
      await this.prisma.emailQueue.update({
        where: { id: job.data.queueId },
        data: { status: 'SENT', sentAt: new Date() },
      });
    } catch (error) {
      // Retry logic
      throw error;
    }
  }
}
```

## Guards i Decoratory

### Guards

#### 1. JwtAuthGuard

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Sprawdź czy route jest publiczny
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

#### 2. RolesGuard

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

### Decoratory

#### 1. @Public()

```typescript
export const Public = () => SetMetadata('isPublic', true);
```

#### 2. @Roles()

```typescript
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

#### 3. @CurrentUser()

```typescript
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
```

## Prisma Integration

### Prisma Service

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Soft delete middleware
  constructor() {
    super();

    this.$use(async (params, next) => {
      if (params.action === 'delete') {
        params.action = 'update';
        params.args['data'] = { deletedAt: new Date() };
      }

      if (params.action === 'deleteMany') {
        params.action = 'updateMany';
        if (params.args.data != undefined) {
          params.args.data['deletedAt'] = new Date();
        } else {
          params.args['data'] = { deletedAt: new Date() };
        }
      }

      return next(params);
    });
  }
}
```

## Cache Strategy

### Cache Service

```typescript
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    return await this.cacheManager.get<T>(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl || 60);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.reset();
  }

  // Wzorzec cache aside
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    let value = await this.get<T>(key);

    if (!value) {
      value = await factory();
      await this.set(key, value, ttl);
    }

    return value;
  }
}
```

## Error Handling

### Global Exception Filter

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message;
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

## Validation

### Global Validation Pipe

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

## Configuration

### ConfigModule Setup

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION: Joi.string().default('15m'),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
      }),
    }),
  ],
})
export class AppModule {}
```

## Testing Strategy

### Unit Tests

```typescript
describe('ArticlesService', () => {
  let service: ArticlesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: PrismaService,
          useValue: {
            article: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return paginated articles', async () => {
    const mockArticles = [/* mock data */];
    jest.spyOn(prisma.article, 'findMany').mockResolvedValue(mockArticles);

    const result = await service.findAll({ page: 1, limit: 10 });

    expect(result.data).toEqual(mockArticles);
  });
});
```

### E2E Tests

```typescript
describe('ArticlesController (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login to get JWT
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    jwtToken = response.body.accessToken;
  });

  it('/articles (GET) should return articles', () => {
    return request(app.getHttpServer())
      .get('/articles')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('data');
        expect(res.body).toHaveProperty('pagination');
      });
  });

  it('/articles (POST) should create article with auth', () => {
    return request(app.getHttpServer())
      .post('/articles')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        title: 'Test Article',
        content: 'Test content',
      })
      .expect(201);
  });
});
```

## Performance Optimization

### Database Indexes

```prisma
model Article {
  // ... fields

  @@index([slug])
  @@index([publishedAt, status])
  @@index([authorId])
  @@index([userId])
}
```

### Query Optimization

```typescript
// Zamiast N+1 queries
const articles = await this.prisma.article.findMany({
  include: {
    author: true,        // Join z author
    categories: {        // Join z categories
      include: {
        category: true
      }
    },
    _count: {           // Count comments i ratings
      select: {
        comments: true,
        ratings: true
      }
    }
  }
});
```

## Podsumowanie

Backend Multimedia Portal wykorzystuje najlepsze praktyki NestJS:
- **Modularność**: Każda funkcja w osobnym module
- **Dependency Injection**: Łatwe testowanie i wymiana implementacji
- **Guards & Decorators**: Elegancka autoryzacja
- **Prisma ORM**: Type-safe database access
- **Caching**: Redis dla wydajności
- **Queues**: Async processing z Bull
- **Testing**: Kompletne pokrycie testami

---

**Wersja**: 1.0.0
**Data**: 2025-11-07
