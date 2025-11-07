# Schema Bazy Danych

## Wprowadzenie

Multimedia Portal wykorzystuje PostgreSQL 15 jako główną bazę danych relacyjną. Dostęp do bazy realizowany jest przez Prisma ORM, które zapewnia type-safe queries i automatyczną migrację schematu.

## Przegląd Modeli

System zawiera **18 głównych modeli Prisma**:

1. **User** - Użytkownicy systemu
2. **Session** - Sesje użytkowników
3. **Author** - Autorzy treści
4. **Article** - Artykuły
5. **BlogPost** - Wpisy blogowe
6. **WikiPage** - Strony wiki
7. **GalleryItem** - Elementy galerii
8. **Story** - Historie/opowiadania
9. **Comment** - Komentarze (polimorficzne)
10. **Rating** - Oceny (polimorficzne)
11. **Category** - Kategorie
12. **Tag** - Tagi
13. **ContentVersion** - Wersje treści
14. **Notification** - Powiadomienia
15. **EmailQueue** - Kolejka email
16. **SearchHistory** - Historia wyszukiwań
17. **UserPreference** - Preferencje użytkowników
18. **SystemSetting** - Ustawienia systemowe

Plus **10 tabel junction** dla relacji Many-to-Many.

## Enums

### UserRole
```prisma
enum UserRole {
  USER        // Użytkownik zwykły
  MODERATOR   // Moderator
  ADMIN       // Administrator
}
```

### ContentStatus
```prisma
enum ContentStatus {
  DRAFT       // Szkic
  PUBLISHED   // Opublikowane
  SCHEDULED   // Zaplanowane
  ARCHIVED    // Zarchiwizowane
}
```

### CommentableType
```prisma
enum CommentableType {
  ARTICLE
  BLOG_POST
  WIKI_PAGE
  GALLERY_ITEM
  STORY
}
```

### RatableType
```prisma
enum RatableType {
  ARTICLE
  BLOG_POST
  WIKI_PAGE
  GALLERY_ITEM
  STORY
}
```

### VersionableType
```prisma
enum VersionableType {
  ARTICLE
  BLOG_POST
  WIKI_PAGE
  GALLERY_ITEM
  STORY
}
```

### NotificationType
```prisma
enum NotificationType {
  COMMENT     // Nowy komentarz
  RATING      // Nowa ocena
  MENTION     // Wzmianka
  SYSTEM      // Systemowe
}
```

### EmailStatus
```prisma
enum EmailStatus {
  PENDING     // Oczekujący
  SENT        // Wysłany
  FAILED      // Nieudany
}
```

### FileType
```prisma
enum FileType {
  IMAGE       // Obraz
  VIDEO       // Wideo
}
```

## Modele Szczegółowo

### 1. User (Użytkownicy)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String   // Bcrypt hash
  name      String?
  role      UserRole @default(USER)
  avatar    String?
  bio       String?  @db.Text

  emailVerified     Boolean   @default(false)
  emailVerifiedAt   DateTime?
  lastLoginAt       DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime? // Soft delete

  // Relations
  sessions          Session[]
  articles          Article[]
  blogPosts         BlogPost[]
  wikiPages         WikiPage[]
  galleryItems      GalleryItem[]
  stories           Story[]
  comments          Comment[]
  ratings           Rating[]
  notifications     Notification[]
  contentVersions   ContentVersion[]
  searchHistory     SearchHistory[]
  preferences       UserPreference?

  @@index([email])
  @@index([username])
  @@index([role])
  @@map("users")
}
```

**Pola**:
- `id` - UUID, primary key
- `email` - Unikalny email użytkownika
- `username` - Unikalna nazwa użytkownika
- `password` - Hash hasła (bcrypt)
- `name` - Imię i nazwisko (opcjonalne)
- `role` - Rola: USER, MODERATOR, ADMIN
- `avatar` - URL do avatara
- `bio` - Biografia użytkownika

**Relacje**:
- One-to-Many z Session, Article, BlogPost, Comment, Rating, etc.
- One-to-One z UserPreference

### 2. Session (Sesje)

```prisma
model Session {
  id           String   @id @default(uuid())
  userId       String
  token        String   @unique
  refreshToken String?  @unique
  ipAddress    String?
  userAgent    String?  @db.Text
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("sessions")
}
```

**Funkcje**:
- Zarządzanie JWT tokens
- Refresh tokens
- Tracking IP i User Agent
- Automatyczne usuwanie po wygaśnięciu

### 3. Author (Autorzy)

```prisma
model Author {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  bio         String?  @db.Text
  email       String?
  website     String?
  socialMedia Json?    // Twitter, LinkedIn, etc.
  profileImage String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  articles     Article[]
  blogPosts    BlogPost[]
  wikiPages    WikiPage[]
  galleryItems GalleryItem[]
  stories      Story[]

  @@index([slug])
  @@map("authors")
}
```

**Funkcje**:
- Profile autorów treści
- Social media links
- Może być powiązany z User lub być niezależny

### 4. Article (Artykuły)

```prisma
model Article {
  id             String        @id @default(uuid())
  title          String
  slug           String        @unique
  excerpt        String?       @db.Text
  content        String        @db.Text
  featuredImage  String?
  status         ContentStatus @default(DRAFT)
  publishedAt    DateTime?
  viewCount      Int           @default(0)
  readingTime    Int?          // W minutach

  authorId       String?
  userId         String        // Twórca

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?     // Soft delete

  // Relations
  author         Author?       @relation(fields: [authorId], references: [id], onDelete: SetNull)
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  categories     ArticleCategory[]
  tags           ArticleTag[]
  comments       Comment[]     @relation("ArticleComments")
  ratings        Rating[]      @relation("ArticleRatings")
  versions       ContentVersion[] @relation("ArticleVersions")

  @@index([slug])
  @@index([status])
  @@index([publishedAt])
  @@index([authorId])
  @@index([userId])
  @@index([createdAt])
  @@fulltext([title, content]) // PostgreSQL full-text search
  @@map("articles")
}
```

**Funkcje**:
- Status: DRAFT, PUBLISHED, SCHEDULED, ARCHIVED
- SEO-friendly slugs
- Featured images
- View counter
- Reading time estimation
- Soft delete

### 5. BlogPost (Wpisy Blogowe)

```prisma
model BlogPost {
  id             String        @id @default(uuid())
  title          String
  slug           String        @unique
  excerpt        String?       @db.Text
  content        String        @db.Text
  featuredImage  String?
  status         ContentStatus @default(DRAFT)
  publishedAt    DateTime?
  viewCount      Int           @default(0)

  authorId       String?
  userId         String

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?

  // Relations
  author         Author?       @relation(fields: [authorId], references: [id], onDelete: SetNull)
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  categories     BlogPostCategory[]
  tags           BlogPostTag[]
  comments       Comment[]     @relation("BlogPostComments")
  ratings        Rating[]      @relation("BlogPostRatings")
  versions       ContentVersion[] @relation("BlogPostVersions")

  @@index([slug])
  @@index([status])
  @@index([publishedAt])
  @@fulltext([title, content])
  @@map("blog_posts")
}
```

### 6. WikiPage (Strony Wiki)

```prisma
model WikiPage {
  id             String        @id @default(uuid())
  title          String
  slug           String        @unique
  content        String        @db.Text
  status         ContentStatus @default(DRAFT)
  publishedAt    DateTime?
  viewCount      Int           @default(0)

  // Hierarchia
  parentId       String?
  orderIndex     Int           @default(0) // Kolejność w menu

  authorId       String?
  userId         String

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?

  // Relations
  author         Author?       @relation(fields: [authorId], references: [id], onDelete: SetNull)
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Self-referential hierarchy
  parent         WikiPage?     @relation("WikiHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children       WikiPage[]    @relation("WikiHierarchy")

  categories     WikiPageCategory[]
  tags           WikiPageTag[]
  comments       Comment[]     @relation("WikiPageComments")
  ratings        Rating[]      @relation("WikiPageRatings")
  versions       ContentVersion[] @relation("WikiPageVersions")

  @@index([slug])
  @@index([status])
  @@index([parentId])
  @@index([orderIndex])
  @@fulltext([title, content])
  @@map("wiki_pages")
}
```

**Funkcje Specjalne**:
- **Hierarchia Parent-Child**: Strony mogą mieć podstrony
- **OrderIndex**: Sortowanie w menu
- **Breadcrumbs**: Automatyczne generowanie ścieżki

### 7. GalleryItem (Elementy Galerii)

```prisma
model GalleryItem {
  id             String        @id @default(uuid())
  title          String
  slug           String        @unique
  description    String?       @db.Text

  fileUrl        String        // Główny plik
  thumbnailUrl   String?       // Miniatura
  fileType       FileType      // IMAGE lub VIDEO
  fileSize       Int?          // W bajtach
  mimeType       String?
  dimensions     Json?         // { width, height }

  status         ContentStatus @default(DRAFT)
  publishedAt    DateTime?
  viewCount      Int           @default(0)

  authorId       String?
  userId         String

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?

  // Relations
  author         Author?       @relation(fields: [authorId], references: [id], onDelete: SetNull)
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  categories     GalleryItemCategory[]
  tags           GalleryItemTag[]
  comments       Comment[]     @relation("GalleryItemComments")
  ratings        Rating[]      @relation("GalleryItemRatings")
  versions       ContentVersion[] @relation("GalleryItemVersions")

  @@index([slug])
  @@index([fileType])
  @@index([status])
  @@map("gallery_items")
}
```

**Funkcje**:
- Obsługa obrazów i wideo
- Automatyczne generowanie miniatur
- Metadata plików (rozmiar, wymiary, typ MIME)
- Integracja z MinIO/S3

### 8. Story (Historie)

```prisma
model Story {
  id             String        @id @default(uuid())
  title          String
  slug           String        @unique
  excerpt        String?       @db.Text
  content        String        @db.Text
  featuredImage  String?

  series         String?       // Nazwa serii
  seriesOrder    Int?          // Kolejność w serii

  status         ContentStatus @default(DRAFT)
  publishedAt    DateTime?
  viewCount      Int           @default(0)
  wordCount      Int?

  authorId       String?
  userId         String

  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  deletedAt      DateTime?

  // Relations
  author         Author?       @relation(fields: [authorId], references: [id], onDelete: SetNull)
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  categories     StoryCategory[]
  tags           StoryTag[]
  comments       Comment[]     @relation("StoryComments")
  ratings        Rating[]      @relation("StoryRatings")
  versions       ContentVersion[] @relation("StoryVersions")

  @@index([slug])
  @@index([series])
  @@index([status])
  @@fulltext([title, content])
  @@map("stories")
}
```

**Funkcje Specjalne**:
- **Series**: Grupowanie historii w serie
- **SeriesOrder**: Kolejność w serii
- **WordCount**: Liczba słów

### 9. Comment (Komentarze) - POLIMORFICZNE

```prisma
model Comment {
  id          String          @id @default(uuid())
  content     String          @db.Text

  // Polimorficzna relacja
  contentType CommentableType
  contentId   String

  // Nested comments (replies)
  parentId    String?

  userId      String

  isApproved  Boolean         @default(true)
  isEdited    Boolean         @default(false)

  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  deletedAt   DateTime?

  // Relations
  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Self-referential for replies
  parent      Comment?        @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies     Comment[]       @relation("CommentReplies")

  // Content relations (tylko dla query, nie foreign keys)
  article     Article?        @relation("ArticleComments", fields: [contentId], references: [id], onDelete: Cascade)
  blogPost    BlogPost?       @relation("BlogPostComments", fields: [contentId], references: [id], onDelete: Cascade)
  wikiPage    WikiPage?       @relation("WikiPageComments", fields: [contentId], references: [id], onDelete: Cascade)
  galleryItem GalleryItem?    @relation("GalleryItemComments", fields: [contentId], references: [id], onDelete: Cascade)
  story       Story?          @relation("StoryComments", fields: [contentId], references: [id], onDelete: Cascade)

  @@index([contentType, contentId])
  @@index([userId])
  @@index([parentId])
  @@index([createdAt])
  @@map("comments")
}
```

**Funkcje**:
- **Polimorficzne**: Jeden model dla wszystkich typów treści
- **Nested Replies**: Komentarze mogą mieć odpowiedzi
- **Moderation**: isApproved flag

### 10. Rating (Oceny) - POLIMORFICZNE

```prisma
model Rating {
  id          String      @id @default(uuid())
  value       Int         // 1-5 gwiazdek

  // Polimorficzna relacja
  contentType RatableType
  contentId   String

  userId      String

  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relations
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Content relations
  article     Article?     @relation("ArticleRatings", fields: [contentId], references: [id], onDelete: Cascade)
  blogPost    BlogPost?    @relation("BlogPostRatings", fields: [contentId], references: [id], onDelete: Cascade)
  wikiPage    WikiPage?    @relation("WikiPageRatings", fields: [contentId], references: [id], onDelete: Cascade)
  galleryItem GalleryItem? @relation("GalleryItemRatings", fields: [contentId], references: [id], onDelete: Cascade)
  story       Story?       @relation("StoryRatings", fields: [contentId], references: [id], onDelete: Cascade)

  // Constraint: jedna ocena per user per content
  @@unique([userId, contentType, contentId])
  @@index([contentType, contentId])
  @@map("ratings")
}
```

**Funkcje**:
- System 1-5 gwiazdek
- Jedna ocena per użytkownik per treść
- Automatyczne obliczanie średniej

### 11. Category (Kategorie)

```prisma
model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?  @db.Text
  color       String?  // Hex color dla UI
  icon        String?  // Icon name

  parentId    String?  // Dla hierarchii kategorii
  orderIndex  Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Self-referential hierarchy
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")

  // Relations to junction tables
  articles    ArticleCategory[]
  blogPosts   BlogPostCategory[]
  wikiPages   WikiPageCategory[]
  galleryItems GalleryItemCategory[]
  stories     StoryCategory[]

  @@index([slug])
  @@index([parentId])
  @@map("categories")
}
```

### 12. Tag (Tagi)

```prisma
model Tag {
  id        String   @id @default(uuid())
  name      String   @unique
  slug      String   @unique
  color     String?

  usageCount Int     @default(0) // Licznik użyć

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations to junction tables
  articles  ArticleTag[]
  blogPosts BlogPostTag[]
  wikiPages WikiPageTag[]
  galleryItems GalleryItemTag[]
  stories   StoryTag[]

  @@index([slug])
  @@index([usageCount])
  @@map("tags")
}
```

### 13. ContentVersion (Wersjonowanie)

```prisma
model ContentVersion {
  id            String          @id @default(uuid())

  contentType   VersionableType
  contentId     String

  versionNumber Int
  title         String
  content       String          @db.Text
  excerpt       String?         @db.Text
  metadata      Json?           // Dodatkowe dane
  changeNote    String?         @db.Text

  userId        String
  createdAt     DateTime        @default(now())

  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Content relations
  article       Article?        @relation("ArticleVersions", fields: [contentId], references: [id], onDelete: Cascade)
  blogPost      BlogPost?       @relation("BlogPostVersions", fields: [contentId], references: [id], onDelete: Cascade)
  wikiPage      WikiPage?       @relation("WikiPageVersions", fields: [contentId], references: [id], onDelete: Cascade)
  galleryItem   GalleryItem?    @relation("GalleryItemVersions", fields: [contentId], references: [id], onDelete: Cascade)
  story         Story?          @relation("StoryVersions", fields: [contentId], references: [id], onDelete: Cascade)

  @@unique([contentType, contentId, versionNumber])
  @@index([contentType, contentId])
  @@map("content_versions")
}
```

**Funkcje**:
- Historia zmian treści
- Rollback do poprzednich wersji
- Change notes

### 14. Notification (Powiadomienia)

```prisma
model Notification {
  id        String           @id @default(uuid())
  type      NotificationType
  title     String
  message   String           @db.Text
  isRead    Boolean          @default(false)
  data      Json?            // Dodatkowe dane

  userId    String
  createdAt DateTime         @default(now())

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead])
  @@index([createdAt])
  @@map("notifications")
}
```

### 15. EmailQueue (Kolejka Email)

```prisma
model EmailQueue {
  id        String      @id @default(uuid())
  to        String
  subject   String
  body      String      @db.Text
  template  String?
  context   Json?

  status    EmailStatus @default(PENDING)
  attempts  Int         @default(0)
  error     String?     @db.Text

  createdAt DateTime    @default(now())
  sentAt    DateTime?

  @@index([status])
  @@index([createdAt])
  @@map("email_queue")
}
```

## Tabele Junction (Many-to-Many)

### ArticleCategory
```prisma
model ArticleCategory {
  articleId  String
  categoryId String

  article    Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([articleId, categoryId])
  @@map("article_categories")
}
```

### ArticleTag
```prisma
model ArticleTag {
  articleId String
  tagId     String

  article   Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([articleId, tagId])
  @@map("article_tags")
}
```

*Podobne tabele junction dla: BlogPost, WikiPage, GalleryItem, Story*

## Indeksy i Optymalizacja

### Indeksy Główne

1. **Unique Indexes**:
   - `users.email`
   - `users.username`
   - `authors.slug`
   - `articles.slug`
   - `categories.slug`
   - `tags.slug`

2. **Performance Indexes**:
   - `articles(status, publishedAt)` - dla queries published articles
   - `comments(contentType, contentId)` - dla polimorficznych queries
   - `ratings(userId, contentType, contentId)` - dla unique constraint
   - `sessions(expiresAt)` - dla cleanup job

3. **Full-Text Search**:
   - `articles(title, content)`
   - `blog_posts(title, content)`
   - `wiki_pages(title, content)`
   - `stories(title, content)`

### Cascade Delete Strategy

- **User deletion**: CASCADE do wszystkich powiązanych danych (comments, ratings, sessions)
- **Content deletion**: CASCADE do komentarzy, ocen, wersji
- **Author deletion**: SET NULL w treściach
- **Category/Tag deletion**: CASCADE w junction tables

## Migracje

### Tworzenie Migracji

```bash
# Wygeneruj migrację z obecnego schema
npx prisma migrate dev --name add_user_preferences

# Apply migracje na produkcji
npx prisma migrate deploy

# Reset bazy (DEV ONLY!)
npx prisma migrate reset
```

### Seeding Bazy

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Utwórz admin usera
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
    },
  });

  // Utwórz przykładowe kategorie
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Technology',
        slug: 'technology',
        description: 'Tech articles and news',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Science',
        slug: 'science',
        description: 'Scientific discoveries',
      },
    }),
  ]);

  console.log({ admin, categories });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Queries Przykładowe

### Pobierz artykuły z relacjami
```typescript
const articles = await prisma.article.findMany({
  where: {
    status: 'PUBLISHED',
    publishedAt: {
      lte: new Date(),
    },
  },
  include: {
    author: true,
    user: {
      select: {
        id: true,
        name: true,
        avatar: true,
      },
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
        comments: true,
        ratings: true,
      },
    },
  },
  orderBy: {
    publishedAt: 'desc',
  },
  take: 10,
});
```

### Pobierz komentarze z nested replies
```typescript
const comments = await prisma.comment.findMany({
  where: {
    contentType: 'ARTICLE',
    contentId: articleId,
    parentId: null, // Tylko top-level comments
  },
  include: {
    user: {
      select: {
        id: true,
        name: true,
        avatar: true,
      },
    },
    replies: {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
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
```

### Oblicz średnią ocenę
```typescript
const ratings = await prisma.rating.aggregate({
  where: {
    contentType: 'ARTICLE',
    contentId: articleId,
  },
  _avg: {
    value: true,
  },
  _count: {
    value: true,
  },
});

const averageRating = ratings._avg.value;
const ratingCount = ratings._count.value;
```

## Podsumowanie

Schema bazy danych Multimedia Portal jest zaprojektowana z myślą o:

- **Elastyczności**: Polimorficzne relacje dla comments i ratings
- **Hierarchii**: Wiki pages i categories z parent-child
- **Wydajności**: Odpowiednie indeksy i full-text search
- **Bezpieczeństwie**: Cascade deletes i soft deletes
- **Skalowalności**: Normalizacja i junction tables
- **Audytowalności**: Timestamps i wersjonowanie

---

**Wersja**: 1.0.0
**Data**: 2025-11-07
