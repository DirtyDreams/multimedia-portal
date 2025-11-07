# Multimedia Portal - Comprehensive Repository Analysis

**Repository**: `/home/user/multimedia-portal`
**Analysis Date**: November 7, 2025
**Thorough Level**: Very Thorough

---

## TABLE OF CONTENTS
1. [Overall Structure](#overall-structure)
2. [Backend Architecture](#backend-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Endpoints](#api-endpoints)
7. [Configuration Files](#configuration-files)
8. [Testing Setup](#testing-setup)

---

## OVERALL STRUCTURE

### Directory Layout
```
multimedia-portal/
├── backend/                          # NestJS backend application
│   ├── src/                         # Source code
│   │   ├── main.ts                 # Application entry point
│   │   ├── app.module.ts           # Root module
│   │   ├── app.controller.ts       # Root controller
│   │   ├── app.service.ts          # Root service
│   │   ├── cache/                  # Caching module (Redis integration)
│   │   ├── common/                 # Shared utilities, guards, decorators
│   │   ├── config/                 # Configuration service
│   │   ├── prisma/                 # Prisma ORM setup
│   │   ├── types/                  # TypeScript type definitions
│   │   ├── modules/                # Feature modules (14 modules)
│   │   └── queues/                 # Bull queue management
│   ├── prisma/
│   │   └── schema.prisma           # Database schema definition
│   ├── test/                        # E2E and unit tests
│   ├── k6-tests/                    # Load testing scripts
│   ├── Dockerfile                   # Docker configuration
│   ├── package.json                 # Dependencies (NestJS, Prisma, etc.)
│   └── tsconfig.json                # TypeScript configuration
│
├── frontend/                         # Next.js 14 frontend application
│   ├── src/
│   │   ├── app/                    # Next.js 14 App Router pages
│   │   ├── components/             # React components (17 categories)
│   │   ├── hooks/                  # Custom React hooks (7 hooks)
│   │   ├── lib/                    # Utility libraries and API integration
│   │   ├── providers/              # Context providers (Query, Auth)
│   │   ├── stores/                 # Zustand state management (4 stores)
│   │   ├── types/                  # TypeScript type definitions
│   │   └── utils/                  # Utility functions
│   ├── public/                      # Static assets
│   ├── Dockerfile                   # Docker configuration
│   ├── next.config.ts              # Next.js configuration
│   ├── jest.config.ts              # Jest test configuration
│   ├── package.json                 # Dependencies (React, Next.js, etc.)
│   └── tsconfig.json                # TypeScript configuration
│
├── .docker/                         # Docker-related configurations
├── docker-compose.yml               # Docker Compose orchestration
├── CLAUDE.md                        # Project guidelines and documentation
├── .env.example                     # Environment variables template
├── .env.docker                      # Docker environment configuration
├── prd.txt                          # Product Requirements Document
└── README.md                        # Project README

```

### Tech Stack Summary
- **Backend**: NestJS 11.0.1, Node.js 18+
- **Frontend**: Next.js 16, React 19.2.0
- **Database**: PostgreSQL 15 + Prisma ORM
- **Cache**: Redis 7
- **Search**: Meilisearch (latest)
- **File Storage**: MinIO (S3-compatible)
- **Reverse Proxy**: Nginx
- **Container**: Docker & Docker Compose

---

## BACKEND ARCHITECTURE

### Core Framework
- **NestJS**: Version 11.0.1 - Modern TypeScript-based backend framework
- **Entry Point**: `/home/user/multimedia-portal/backend/src/main.ts`
- **Root Module**: `/home/user/multimedia-portal/backend/src/app.module.ts`

### Module Structure (14 Feature Modules)

#### 1. **Authentication Module** (`/modules/auth/`)
- **Location**: `/home/user/multimedia-portal/backend/src/modules/auth/`
- **Files**:
  - `auth.controller.ts` - Handles register, login, logout, refresh token, profile endpoints
  - `auth.service.ts` - Business logic for authentication
  - `auth.module.ts` - Module definition with JWT and Passport imports
  - `strategies/jwt.strategy.ts` - JWT validation strategy
  - `guards/jwt-auth.guard.ts` - Guard for protected routes
  - `dto/` - Data transfer objects for auth operations
- **Endpoints**:
  - `POST /auth/register` - Register new user (public)
  - `POST /auth/login` - Login user (public)
  - `GET /auth/me` - Get current user profile (protected)
  - `POST /auth/logout` - Logout (protected)
  - `POST /auth/refresh` - Refresh access token (public)
- **Features**:
  - JWT-based stateless authentication
  - Bcrypt password hashing
  - Token refresh mechanism
  - User role assignment (USER, MODERATOR, ADMIN)
  - Session management

#### 2. **Articles Module** (`/modules/articles/`)
- **Location**: `/home/user/multimedia-portal/backend/src/modules/articles/`
- **Files**:
  - `articles.controller.ts` - HTTP endpoints for articles
  - `articles.service.ts` - Business logic for article management
  - `articles.module.ts` - Module imports and configuration
  - `dto/` - Data transfer objects for create/update/query
- **Endpoints**:
  - `GET /articles` - Get all articles with pagination (public)
  - `POST /articles` - Create article (admin/moderator)
  - `GET /articles/:identifier` - Get article by ID or slug (public)
  - `PUT /articles/:id` - Update article (admin/moderator)
  - `DELETE /articles/:id` - Delete article (admin)
- **Features**:
  - Slug generation from title
  - Status management (DRAFT, PUBLISHED, SCHEDULED, ARCHIVED)
  - Category and tag relationships
  - Featured images
  - Content versioning support
  - Pagination and filtering

#### 3. **Blog Posts Module** (`/modules/blog-posts/`)
- **Location**: `/home/user/multimedia-portal/backend/src/modules/blog-posts/`
- **Features**:
  - Similar structure to Articles
  - Additional blog-specific features
  - `POST /blog` - Create blog post
  - `GET /blog` - Get all blog posts
  - `PUT /blog/:id` - Update blog post
  - `DELETE /blog/:id` - Delete blog post

#### 4. **Wiki Pages Module** (`/modules/wiki-pages/`)
- **Location**: `/home/user/multimedia-portal/backend/src/modules/wiki-pages/`
- **Special Features**:
  - Hierarchical parent-child relationships
  - Nested structure support
  - `POST /wiki` - Create wiki page
  - `GET /wiki` - Get all wiki pages
  - `GET /wiki/:identifier` - Get page by ID or slug
  - `PUT /wiki/:id` - Update wiki page
  - `DELETE /wiki/:id` - Delete wiki page
  - Parent-child page queries

#### 5. **Gallery Items Module** (`/modules/gallery-items/`)
- **Location**: `/home/user/multimedia-portal/backend/src/modules/gallery-items/`
- **Features**:
  - File upload support (images/videos)
  - Thumbnail generation
  - File type detection
  - `POST /gallery` - Create gallery item
  - `GET /gallery` - Get all gallery items
  - `DELETE /gallery/:id` - Delete gallery item

#### 6. **Stories Module** (`/modules/stories/`)
- **Location**: `/home/user/multimedia-portal/backend/src/modules/stories/`
- **Features**:
  - Series grouping for stories
  - `POST /stories` - Create story
  - `GET /stories` - Get all stories
  - `PUT /stories/:id` - Update story
  - `DELETE /stories/:id` - Delete story

#### 7. **Authors Module** (`/modules/authors/`)
- **Location**: `/home/user/multimedia-portal/backend/src/modules/authors/`
- **Features**:
  - Author profiles
  - Author bio and contact information
  - Profile images
  - `POST /authors` - Create author
  - `GET /authors` - Get all authors
  - `GET /authors/:identifier` - Get author by ID or slug
  - `PUT /authors/:id` - Update author
  - `DELETE /authors/:id` - Delete author

#### 8. **Comments Module** (`/modules/comments/`)
- **Location**: `/home/user/multimedia-portal/backend/src/modules/comments/`
- **Files**:
  - `comments.controller.ts` - HTTP endpoints
  - `comments.service.ts` - Comment logic
  - `comments.service.spec.ts` - Unit tests
  - `dto/` - Data transfer objects
- **Features**:
  - Polymorphic comments on multiple content types
  - Nested replies (parent-child comments)
  - `POST /comments` - Create comment (authenticated)
  - `GET /comments` - Get comments with filtering
  - `PUT /comments/:id` - Update comment
  - `DELETE /comments/:id` - Delete comment

#### 9. **Ratings Module** (`/modules/ratings/`)
- **Location**: `/home/user/multimedia-portal/backend/src/modules/ratings/`
- **Features**:
  - 1-5 star rating system
  - Polymorphic ratings on multiple content types
  - One rating per user per content
  - `POST /ratings` - Create/update rating (authenticated)
  - `GET /ratings` - Get ratings with filtering
  - `PUT /ratings/:id` - Update rating
  - `DELETE /ratings/:id` - Delete rating

#### 10. **Search Module** (`/modules/search/`)
- **Location**: `/home/user/multimedia-portal/backend/src/modules/search/`
- **Files**:
  - `search.controller.ts` - Search endpoints
  - `search.service.ts` - Search logic
  - `search-enhanced.controller.ts` - Enhanced search features
  - `search-enhanced.service.ts` - Advanced search logic
  - `search-analytics.service.ts` - Search analytics
- **Features**:
  - Full-text search across all content types
  - Autocomplete suggestions
  - Search analytics
  - Filter and faceting support
  - `GET /search` - Search with query parameters (public)
  - `GET /search/autocomplete` - Get suggestions (public)

#### 11. **Notifications Module** (`/modules/notifications/`)
- **Location**: `/home/user/multimedia-portal/backend/src/modules/notifications/`
- **Files**:
  - `notifications.gateway.ts` - WebSocket gateway for real-time notifications
  - `notifications.module.ts` - Module definition
- **Features**:
  - Real-time notifications via WebSocket
  - Notification types (COMMENT, RATING, MENTION, SYSTEM)
  - Socket.IO integration

#### 12. **Email Module** (`/modules/email/`)
- **Location**: `/home/user/multimedia-portal/backend/src/modules/email/`
- **Files**:
  - `email.service.ts` - Email sending logic
  - `email.module.ts` - Module definition
  - `templates/` - Email templates
- **Features**:
  - Nodemailer integration
  - Email template support
  - Queue-based email delivery

#### 13. **Content Versions Module** (`/modules/content-versions/`)
- **Location**: `/home/user/multimedia-portal/backend/src/modules/content-versions/`
- **Features**:
  - Version history tracking
  - Polymorphic versioning for all content types
  - Change notes
  - User tracking

#### 14. **Search Enhanced Module** (`/modules/search/`)
- **Enhanced search features**
- Meilisearch integration
- Advanced analytics

### Common/Shared Components

#### Guards (`/common/guards/`)
1. **JwtAuthGuard** (`jwt-auth.guard.ts`)
   - Extends `AuthGuard('jwt')`
   - Validates JWT tokens
   - Applied to protected routes

2. **RolesGuard** (`roles.guard.ts`)
   - Implements `CanActivate`
   - Checks user roles using Reflector
   - Throws `ForbiddenException` if role not found
   - Used for role-based access control

#### Decorators (`/common/decorators/`)
1. **@Public()** (`public.decorator.ts`)
   - Marks routes as public (no auth required)
   - Set using Reflector metadata

2. **@Roles()** (`roles.decorator.ts`)
   - Specifies required roles
   - Works with RolesGuard
   - Usage: `@Roles('admin', 'moderator')`

3. **@CurrentUser()** (`current-user.decorator.ts`)
   - Extracts user from JWT payload
   - Retrieves specific user properties
   - Usage: `@CurrentUser('id') userId: string`

### Supporting Services/Modules

#### 1. **Prisma Module** (`/prisma/`)
- **Location**: `/home/user/multimedia-portal/backend/src/prisma/`
- **Files**:
  - `prisma.module.ts` - Module definition
  - `prisma.service.ts` - Prisma client management
- **Purpose**: ORM integration and database management

#### 2. **Cache Module** (`/cache/`)
- **Location**: `/home/user/multimedia-portal/backend/src/cache/`
- **Files**:
  - `cache.module.ts` - Global cache module
  - `cache.service.ts` - Cache operations
  - `cache.config.ts` - Redis configuration
- **Features**:
  - Redis-based caching
  - Global cache provider
  - `cache-manager` integration

#### 3. **Config Module** (`/config/`)
- **Location**: `/home/user/multimedia-portal/backend/src/config/`
- **Files**:
  - `config.service.ts` - Configuration service
  - `config.module.ts` - Module definition
- **Responsibilities**:
  - Database URL handling
  - JWT secret management
  - Environment variable validation
  - Service configuration

#### 4. **Queues Module** (`/queues/`)
- **Location**: `/home/user/multimedia-portal/backend/src/queues/`
- **Files**:
  - `queues.module.ts` - Queue configuration
  - `queues.service.ts` - Queue management
  - `processors/` - Job processors
- **Features**:
  - Bull/Redis queue integration
  - Async job processing
  - Background task management

### Dependencies (Backend)
**Key Packages**:
- `@nestjs/core` (11.0.1) - NestJS framework
- `@nestjs/common` (11.0.1) - Common utilities
- `@nestjs/jwt` (11.0.1) - JWT authentication
- `@nestjs/passport` (11.0.5) - Passport integration
- `@nestjs/platform-socket.io` (11.1.8) - WebSocket support
- `@nestjs/swagger` (11.2.1) - OpenAPI documentation
- `@nestjs/bull` (11.0.4) - Queue integration
- `@nestjs/cache-manager` (3.0.1) - Caching
- `@nestjs/mailer` (2.0.2) - Email service
- `@nestjs/throttler` (6.4.0) - Rate limiting
- `@prisma/client` (6.19.0) - Prisma ORM
- `prisma` (6.19.0) - Prisma CLI
- `bcrypt` (6.0.0) - Password hashing
- `passport-jwt` (4.0.1) - JWT strategy
- `meilisearch` (0.54.0) - Search engine
- `redis` (5.9.0) - Redis client
- `socket.io` (4.8.1) - WebSocket library
- `typeorm` (0.3.27) - Alternative ORM (legacy)

---

## FRONTEND ARCHITECTURE

### Framework & Setup
- **Framework**: Next.js 16 with App Router (React 19.2.0)
- **Styling**: Tailwind CSS 4
- **Package Manager**: npm
- **Root Layout**: `/home/user/multimedia-portal/frontend/src/app/layout.tsx`

### Page Structure (App Router)

#### Public Routes
```
/                                  # Landing page (page.tsx)
/login                            # Login page
/register                         # Registration page
/articles                         # Articles list
/articles/[slug]                 # Article detail page
/blog                            # Blog list
/blog/[slug]                     # Blog post detail
/wiki                            # Wiki pages list
/wiki/[slug]                     # Wiki page detail (hierarchical)
/gallery                         # Gallery items list
/stories                         # Stories list
/search                          # Search results page
```

#### Protected Routes (Admin Dashboard)
```
/dashboard                        # Dashboard overview (page.tsx)
/dashboard/articles              # Articles CRUD management
/dashboard/blog                  # Blog posts CRUD management
/dashboard/wiki                  # Wiki hierarchical editor
/dashboard/gallery               # Gallery management
/dashboard/stories               # Stories CRUD management
/dashboard/authors               # Authors management
/dashboard/users                 # User management
/dashboard/settings              # Portal settings
/dashboard/notifications/settings # Notification preferences
```

### Components Directory (`/components/`)

#### Admin Components (`/admin/`)
- `sidebar.tsx` - Dashboard navigation sidebar
- `dashboard-header.tsx` - Dashboard header with user info
- `articles/` - Article form modal and CRUD components
- `blog/` - Blog post form modal
- `wiki/` - Wiki editor with hierarchy support
- `gallery/` - Gallery item form
- `stories/` - Story form modal
- `authors/` - Author form modal
- `users/` - User management components

#### Layout Components (`/layout/`)
- `header.tsx` - Main navigation header
- `footer.tsx` - Footer component
- Navigation elements

#### Content Components (`/content/`)
- Content display components
- Rich text rendering

#### Comments System (`/comments/`)
- Comments section component
- Nested comments display
- Comment form with validation

#### Rating System (`/rating/`)
- Rating widget (star rating)
- Rating display
- User rating submission

#### Editor (`/editor/`)
- `rich-text-editor-lazy.tsx` - Rich text editor (with Tiptap)
- Content editing interface

#### Search Components (`/search/`)
- `search-history.tsx` - Search history display
- `search-suggestions.tsx` - Autocomplete suggestions
- `filter-panel.tsx` - Search filters

#### UI Components (`/ui/`)
- Generic UI components (buttons, modals, forms)
- `error-boundary.tsx` - Error boundary for error handling
- Toast components
- Navigation components

#### Gallery Components (`/gallery/`)
- Image/video gallery display
- Item grid layout

#### Notifications (`/notifications/`)
- Notification display
- Real-time notification handling

#### Error Components (`/error/`)
- Error handling and display

#### Landing Page (`/landing/`)
- Hero section
- Feature cards
- Call-to-action sections

#### Dashboard (`/dashboard/`)
- Dashboard layout components
- Statistics display

#### Table Components (`/table/`)
- Data table with sorting/filtering
- Pagination

### Hooks (`/hooks/`)

#### 1. **use-auth.ts**
- User authentication state
- Login/logout status

#### 2. **use-content.ts**
- Fetch content lists
- Fetch single content items
- Rate content
- Handle comments
- Provide mutations for CRUD operations

#### 3. **use-socket.tsx**
- WebSocket connection management
- Real-time event handling
- Provides socket context

#### 4. **use-toast.tsx**
- Toast notifications
- Toast provider

#### 5. **use-search-history.ts**
- Manage search history
- Store/retrieve searches

#### 6. **use-push-notifications.tsx**
- Push notification management
- Browser notification handling

### State Management (`/stores/`)
**Zustand Stores**:

1. **auth-store.ts**
   - `useAuthStore` - User authentication state
   - User object (id, email, name, role)
   - Login/logout/register actions
   - Authentication error handling

2. **notification-store.ts**
   - Notification state management
   - Real-time notification updates

3. **theme-store.ts**
   - Theme preference (light/dark)
   - Theme toggle functionality

4. **index.ts**
   - Store exports

### API Integration (`/lib/api/`)

#### Main API Client (`api.ts`)
- Axios instance configuration
- Base URL: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'`
- Request interceptor - adds JWT Bearer token
- Response interceptor - handles token refresh
- Queue for failed requests during token refresh

#### Content API (`api/content.ts`)
Functions:
- `fetchContentList(contentType, filters)` - Get paginated content
- `fetchContentBySlug(contentType, slug)` - Get single content
- `rateContent(contentType, contentId, rating)` - Submit rating
- `fetchComments(contentType, contentId)` - Get comments
- `addComment()` - Create comment
- `deleteComment()` - Delete comment
- `incrementViewCount()` - Track views

Supported Content Types:
- article, blogPost, wikiPage, galleryItem, story

### Providers (`/providers/`)

1. **query-provider.tsx**
   - TanStack React Query setup
   - QueryClient configuration
   - Default stale time: 60 seconds
   - Default GC time: 5 minutes
   - React Query DevTools enabled in development

2. **auth-provider.tsx**
   - Authentication context
   - User session management

### Utilities (`/lib/`)

#### Auth Utilities (`auth.ts`)
- `getToken()` - Retrieve JWT from localStorage
- `setToken()` - Store JWT
- `getRefreshToken()` - Retrieve refresh token
- `setRefreshToken()` - Store refresh token
- `removeToken()` - Clear tokens
- `getUserFromToken()` - Decode JWT payload

#### Error Handler (`api-error-handler.ts`)
- Centralized error handling
- Error type detection
- User-friendly error messages

#### Error Logger (`error-logger.ts`)
- Log errors to console/service
- Error context tracking

#### Utilities (`utils.ts`)
- Common utility functions
- String manipulation
- Date formatting

### Types (`/types/`)

1. **content.ts**
   - `Content` interface
   - `ContentType` union type
   - `ContentFilters` interface
   - `PaginatedResponse<T>` interface

2. **comment.ts**
   - Comment and reply structures
   - Comment metadata

3. **rating.ts**
   - Rating interface
   - Rating statistics

4. **search.ts**
   - Search query interface
   - Search result interface
   - Facet interface

### Dependencies (Frontend)
**Key Packages**:
- `next` (16.0.1) - Next.js framework
- `react` (19.2.0) - React library
- `react-dom` (19.2.0) - React DOM
- `axios` (1.13.2) - HTTP client
- `@tanstack/react-query` (5.90.7) - Data fetching & caching
- `@tanstack/react-table` (8.21.3) - Table component library
- `zustand` (5.0.8) - State management
- `react-hook-form` (7.66.0) - Form management
- `zod` (4.1.12) - Schema validation
- `@hookform/resolvers` (5.2.2) - Form resolvers
- `@tiptap/react` (3.10.2) - Rich text editor
- `tailwindcss` (4) - CSS framework
- `lucide-react` (0.552.0) - Icon library
- `framer-motion` (12.23.24) - Animation library
- `socket.io-client` (4.8.1) - WebSocket client
- `recharts` (3.3.0) - Charting library
- `jwt-decode` (4.0.0) - JWT decoding

---

## DATABASE SCHEMA

### Database: PostgreSQL 15

### Core Entities

#### User & Authentication
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  username  String   @unique
  password  String
  name      String?
  role      UserRole @default(USER)  // USER, MODERATOR, ADMIN
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  sessions      Session[]
  articles      Article[]
  blogPosts     BlogPost[]
  wikiPages     WikiPage[]
  galleryItems  GalleryItem[]
  stories       Story[]
  comments      Comment[]
  ratings       Rating[]
  notifications Notification[]
  contentVersions ContentVersion[]
}

model Session {
  id           String   @id @default(uuid())
  userId       String
  token        String   @unique
  refreshToken String?  @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### Authors
```prisma
model Author {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  bio         String?  @db.Text
  email       String?
  website     String?
  profileImage String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  articles     Article[]
  blogPosts    BlogPost[]
  wikiPages    WikiPage[]
  galleryItems GalleryItem[]
  stories      Story[]
}
```

#### Content Models (5 Types)

1. **Article**
   - Fields: title, slug, content, excerpt, featuredImage, status
   - Relations: author, user (creator), comments, ratings, categories, tags
   - Indexes: slug, publishedAt, status, authorId

2. **BlogPost**
   - Fields: Same as Article
   - Relations: author, user, comments, ratings, categories, tags

3. **WikiPage**
   - Fields: title, slug, content, status, parentId (hierarchy)
   - Relations: author, user, parent/children (hierarchy), comments, ratings, categories, tags
   - Special: Self-referential parent-child relationships

4. **GalleryItem**
   - Fields: title, slug, description, fileUrl, fileType (image/video), thumbnail, status
   - Relations: author, user, comments, ratings, categories, tags

5. **Story**
   - Fields: title, slug, content, excerpt, featuredImage, series, status
   - Relations: author, user, comments, ratings, categories, tags
   - Special: Series grouping for related stories

#### Comments (Polymorphic)
```prisma
enum CommentableType {
  ARTICLE, BLOG_POST, WIKI_PAGE, GALLERY_ITEM, STORY
}

model Comment {
  id        String          @id @default(uuid())
  content   String          @db.Text
  contentType CommentableType
  contentId   String
  parentId  String?         // For nested replies
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  userId    String
  
  // Relations
  user      User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent    Comment?        @relation("CommentReplies", fields: [parentId], references: [id])
  replies   Comment[]       @relation("CommentReplies")
  article   Article?
  blogPost  BlogPost?
  wikiPage  WikiPage?
  galleryItem GalleryItem?
  story     Story?
}
```

#### Ratings (Polymorphic)
```prisma
enum RatableType {
  ARTICLE, BLOG_POST, WIKI_PAGE, GALLERY_ITEM, STORY
}

model Rating {
  id        String      @id @default(uuid())
  value     Int         // 1-5 stars
  contentType RatableType
  contentId   String
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  userId    String
  
  // Relations
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Unique constraint: one rating per user per content
  @@unique([userId, contentType, contentId])
}
```

#### Categories & Tags
```prisma
model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations to junction tables
  articles    ArticleCategory[]
  blogPosts   BlogPostCategory[]
  wikiPages   WikiPageCategory[]
  galleryItems GalleryItemCategory[]
  stories     StoryCategory[]
}

model Tag {
  id        String   @id @default(uuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations to junction tables
  articles  ArticleTag[]
  blogPosts BlogPostTag[]
  wikiPages WikiPageTag[]
  galleryItems GalleryItemTag[]
  stories   StoryTag[]
}
```

#### Junction Tables (Many-to-Many)
- ArticleCategory, ArticleTag
- BlogPostCategory, BlogPostTag
- WikiPageCategory, WikiPageTag
- GalleryItemCategory, GalleryItemTag
- StoryCategory, StoryTag

#### Content Versioning
```prisma
enum VersionableType {
  ARTICLE, BLOG_POST, WIKI_PAGE, GALLERY_ITEM, STORY
}

model ContentVersion {
  id        String         @id @default(uuid())
  contentType VersionableType
  contentId   String
  versionNumber Int
  title       String
  content     String        @db.Text
  excerpt     String?
  metadata    Json?
  changeNote  String?
  createdAt   DateTime      @default(now())
  userId      String
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([contentType, contentId, versionNumber])
}
```

#### Notifications
```prisma
enum NotificationType {
  COMMENT, RATING, MENTION, SYSTEM
}

model Notification {
  id        String           @id @default(uuid())
  type      NotificationType
  title     String
  message   String
  isRead    Boolean          @default(false)
  data      Json?
  createdAt DateTime         @default(now())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### Email Queue
```prisma
enum EmailStatus {
  PENDING, SENT, FAILED
}

model EmailQueue {
  id        String      @id @default(uuid())
  to        String
  subject   String
  body      String      @db.Text
  status    EmailStatus @default(PENDING)
  attempts  Int         @default(0)
  error     String?
  createdAt DateTime    @default(now())
  sentAt    DateTime?
}
```

### Database Relationships Summary
- **Users**: One-to-Many with Sessions, Articles, BlogPosts, WikiPages, GalleryItems, Stories, Comments, Ratings, Notifications, ContentVersions
- **Authors**: One-to-Many with Articles, BlogPosts, WikiPages, GalleryItems, Stories
- **Content Items**: One-to-Many with Comments, Ratings, Versions
- **Comments**: Polymorphic relations to all content types, self-referential for replies
- **Ratings**: Polymorphic relations to all content types
- **Categories/Tags**: Many-to-Many with content types via junction tables

---

## AUTHENTICATION & AUTHORIZATION

### JWT Authentication

#### JWT Configuration
- **Location**: `/home/user/multimedia-portal/backend/src/modules/auth/`
- **Secret**: `JWT_SECRET` environment variable
- **Expiration**: Configurable via environment

#### Token Generation & Validation
```typescript
// Tokens generated on:
1. User registration
2. User login
3. Token refresh

// Token payload includes:
- userId
- email
- role (USER, MODERATOR, ADMIN)
- iat (issued at)
- exp (expiration)
```

#### JWT Strategy (`jwt.strategy.ts`)
- Validates JWT from Authorization header
- Extracts user information
- Attaches user to request object

#### Flow
1. User logs in with email/password
2. Backend verifies credentials with bcrypt
3. JWT access token generated (15 minutes default)
4. Refresh token generated for long-term access
5. Tokens returned to frontend
6. Frontend stores tokens in localStorage
7. Frontend includes JWT in Authorization header for subsequent requests

### Role-Based Access Control (RBAC)

#### User Roles
```typescript
enum UserRole {
  USER        // Regular user - can comment, rate
  MODERATOR   // Can create/edit content
  ADMIN       // Full administrative access
}
```

#### Guards Implementation

1. **JwtAuthGuard** - Validates JWT token presence and validity
   ```typescript
   @UseGuards(JwtAuthGuard)
   ```

2. **RolesGuard** - Checks if user has required roles
   ```typescript
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles('ADMIN', 'MODERATOR')
   ```

#### Decorators for Authorization

1. **@Public()** - Marks route as public (no auth required)
   ```typescript
   @Public()
   @Get('articles')
   ```

2. **@Roles()** - Specifies required roles
   ```typescript
   @Roles(UserRole.ADMIN)
   @Delete(':id')
   ```

3. **@CurrentUser()** - Injects current user info
   ```typescript
   @Get('profile')
   async getProfile(@CurrentUser('userId') userId: string)
   ```

### Protected Routes

#### Fully Protected
- POST /articles (admin/moderator)
- PUT /articles/:id (admin/moderator)
- DELETE /articles/:id (admin)
- POST /blog (admin/moderator)
- POST /wiki (admin/moderator)
- POST /gallery (admin/moderator)
- POST /comments (authenticated users)
- POST /ratings (authenticated users)

#### Partially Protected
- GET /articles (public)
- GET /articles/:id (public)

#### Admin Only
- User management
- Content moderation
- System settings
- User deletion

### Security Implementation

#### Password Security
- Bcrypt hashing with salt rounds
- `bcrypt` library integration
- Password comparison on login

#### Token Management
- JWT validation middleware
- Token refresh mechanism
- Token expiration enforcement
- Secure token storage (httpOnly recommended for production)

---

## API ENDPOINTS

### Base URL
- **Development**: `http://localhost:3001/api`
- **Production**: Configured via `NEXT_PUBLIC_API_URL`

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login user |
| GET | `/auth/me` | JWT | Get current user |
| POST | `/auth/logout` | JWT | Logout user |
| POST | `/auth/refresh` | Public | Refresh access token |

### Content Management Endpoints

#### Articles
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/articles` | Public | Get all articles (paginated) |
| POST | `/articles` | JWT (Admin/Mod) | Create article |
| GET | `/articles/:identifier` | Public | Get article by ID/slug |
| PUT | `/articles/:id` | JWT (Admin/Mod) | Update article |
| DELETE | `/articles/:id` | JWT (Admin) | Delete article |

#### Blog Posts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/blog` | Public | Get all blog posts |
| POST | `/blog` | JWT (Admin/Mod) | Create blog post |
| GET | `/blog/:identifier` | Public | Get blog post |
| PUT | `/blog/:id` | JWT (Admin/Mod) | Update blog post |
| DELETE | `/blog/:id` | JWT (Admin) | Delete blog post |

#### Wiki Pages
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/wiki` | Public | Get all wiki pages |
| POST | `/wiki` | JWT (Admin/Mod) | Create wiki page |
| GET | `/wiki/:identifier` | Public | Get wiki page (with hierarchy) |
| PUT | `/wiki/:id` | JWT (Admin/Mod) | Update wiki page |
| DELETE | `/wiki/:id` | JWT (Admin) | Delete wiki page |

#### Gallery Items
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/gallery` | Public | Get gallery items |
| POST | `/gallery` | JWT (Admin/Mod) | Create gallery item |
| DELETE | `/gallery/:id` | JWT (Admin) | Delete gallery item |

#### Stories
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stories` | Public | Get stories |
| POST | `/stories` | JWT (Admin/Mod) | Create story |
| GET | `/stories/:identifier` | Public | Get story |
| PUT | `/stories/:id` | JWT (Admin/Mod) | Update story |
| DELETE | `/stories/:id` | JWT (Admin) | Delete story |

#### Authors
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/authors` | Public | Get all authors |
| POST | `/authors` | JWT (Admin) | Create author |
| GET | `/authors/:identifier` | Public | Get author by ID/slug |
| PUT | `/authors/:id` | JWT (Admin) | Update author |
| DELETE | `/authors/:id` | JWT (Admin) | Delete author |

### Comments Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/comments` | Public | Get comments (filtered) |
| POST | `/comments` | JWT (Auth) | Create comment |
| PUT | `/comments/:id` | JWT (Auth) | Update comment |
| DELETE | `/comments/:id` | JWT (Auth) | Delete comment |

Query Parameters:
- `contentType` - Type of content (article, blog_post, wiki_page, gallery_item, story)
- `contentId` - ID of content
- `page` - Page number
- `limit` - Items per page
- `sort` - Sort by field

### Ratings Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/ratings` | Public | Get ratings (filtered) |
| POST | `/ratings` | JWT (Auth) | Create/update rating |
| PUT | `/ratings/:id` | JWT (Auth) | Update rating |
| DELETE | `/ratings/:id` | JWT (Auth) | Delete rating |

### Search Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/search` | Public | Search all content |
| GET | `/search/autocomplete` | Public | Get autocomplete suggestions |
| POST | `/search/analytics` | Admin | Track search analytics |

Query Parameters for `/search`:
- `q` - Search query
- `type` - Content type filter
- `category` - Category filter
- `tag` - Tag filter
- `author` - Author filter
- `page` - Page number
- `limit` - Results per page

### Content Versions Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/content-versions` | Public | Get version history |
| GET | `/content-versions/:id` | Public | Get specific version |
| POST | `/content-versions` | JWT (Auth) | Create version |

### Response Format

#### Success Response (200, 201)
```json
{
  "data": {
    "id": "uuid",
    "title": "string",
    "slug": "string",
    "content": "string",
    "status": "PUBLISHED|DRAFT|SCHEDULED|ARCHIVED",
    "author": {
      "id": "uuid",
      "name": "string",
      "slug": "string"
    },
    "categories": [],
    "tags": [],
    "ratings": {
      "average": 4.5,
      "count": 10,
      "userRating": 5
    },
    "comments": {
      "count": 5,
      "items": []
    },
    "createdAt": "ISO8601",
    "updatedAt": "ISO8601"
  }
}
```

#### Paginated Response (200)
```json
{
  "data": [
    { /* content item */ }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

#### Error Response (400, 401, 403, 404, 409)
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## CONFIGURATION FILES

### Environment Variables

#### Backend (`backend/.env` or `docker-compose.yml`)
```
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=multimedia_user
DB_PASSWORD=multimedia_password
DB_NAME=multimedia_db
DATABASE_URL=postgresql://user:password@host:5432/db

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=86400

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Meilisearch
MEILI_HOST=meilisearch
MEILI_PORT=7700

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=password

# Environment
NODE_ENV=development|production
PORT=3000
```

#### Frontend (`frontend/.env` or Docker)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### Docker Compose Configuration
**File**: `/docker-compose.yml`

Services:
1. **PostgreSQL** (Port 5432) - Main database
2. **Redis** (Port 6379) - Cache and queues
3. **Meilisearch** (Port 7700) - Full-text search
4. **MinIO** (Port 9000/9001) - S3-compatible object storage
5. **NestJS Backend** (Port 3001)
6. **Next.js Frontend** (Port 3000)
7. **Nginx** (Port 80/443) - Reverse proxy

### Build Configuration

#### Backend (`backend/tsconfig.json`)
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "strict": true,
    "lib": ["es2020"],
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

#### Frontend (`frontend/tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2015",
    "lib": ["ES2015", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### Next.js Configuration (`frontend/next.config.ts`)
- Turbopack optimizations enabled
- Production source maps disabled
- Image format optimization (AVIF, WebP)
- Experimental package import optimization
- Bundle analyzer available (`ANALYZE=true`)

#### Prisma Configuration (`backend/prisma/schema.prisma`)
- Provider: PostgreSQL
- Uses environment variable: `DATABASE_URL`
- Prisma Client generated automatically

### Package.json Scripts

#### Backend
```bash
npm run build              # Build application
npm run start              # Start production server
npm run start:dev          # Start with watch mode
npm run start:debug        # Start with debugger
npm test                   # Run unit tests
npm test:watch             # Watch mode for tests
npm test:cov               # Coverage report
npm test:e2e               # Run E2E tests
npm run lint               # ESLint with auto-fix
npm run format             # Prettier formatting
```

#### Frontend
```bash
npm run dev                # Start development server
npm run build              # Build for production
npm run start              # Start production server
npm test                   # Run tests
npm test:watch             # Watch mode
npm test:coverage          # Coverage report
npm run analyze            # Bundle analysis
npm run lint               # ESLint
```

### Docker Setup

#### Dockerfiles
- **Backend**: `backend/Dockerfile` - Multi-stage Node.js build
- **Frontend**: `frontend/Dockerfile` - Next.js optimized build

#### Health Checks
- Backend: `curl -f http://localhost:3000/health`
- Frontend: `curl -f http://localhost:3000`
- PostgreSQL: `pg_isready`
- Redis: `redis-cli ping`
- Meilisearch: `curl -f http://localhost:7700/health`
- MinIO: `curl -f http://localhost:9000/minio/health/live`

---

## TESTING SETUP

### Backend Testing

#### Test Framework
- **Jest** 30.0.0 - JavaScript testing framework
- **Supertest** 7.0.0 - HTTP assertions
- **@nestjs/testing** 11.0.1 - NestJS testing utilities

#### Test Files Location
```
backend/test/                          # E2E tests
backend/src/**/*.spec.ts              # Unit tests
```

#### Available Test Files
1. `/home/user/multimedia-portal/backend/test/app.e2e-spec.ts`
   - Basic application tests

2. `/home/user/multimedia-portal/backend/test/articles.e2e-spec.ts`
   - Article CRUD operations
   - Authentication checks
   - Authorization tests

3. `/home/user/multimedia-portal/backend/test/auth.e2e-spec.ts`
   - Registration endpoint
   - Login endpoint
   - Token refresh
   - Profile endpoint
   - JWT validation

4. `/home/user/multimedia-portal/backend/test/authors.e2e-spec.ts`
   - Author CRUD operations
   - Relationship tests

5. `/home/user/multimedia-portal/backend/test/comments.e2e-spec.ts`
   - Comment creation
   - Nested replies
   - Polymorphic comments

6. `/home/user/multimedia-portal/backend/test/ratings.e2e-spec.ts`
   - Rating submission
   - Rating updates
   - Constraints (one per user/content)

#### Unit Tests
- `modules/auth/guards/jwt-auth.guard.spec.ts`
- `modules/auth/guards/roles.guard.spec.ts`
- `modules/auth/strategies/jwt.strategy.spec.ts`
- `modules/auth/auth.service.spec.ts`
- `modules/articles/articles.service.spec.ts`
- `modules/comments/comments.service.spec.ts`
- `modules/ratings/ratings.service.spec.ts`

#### Jest Configuration (`backend/jest.config.js`)
```javascript
{
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node"
}
```

#### E2E Test Configuration
- File: `backend/test/jest-e2e.json`
- Uses separate jest configuration
- Runs against running backend

#### Test Patterns
- Module creation tests
- Controller endpoint tests
- Service logic tests
- Guard authorization tests
- Error handling tests
- Validation tests

### Frontend Testing

#### Test Framework
- **Jest** 30.2.0 - JavaScript testing framework
- **@testing-library/react** 16.3.0 - React component testing
- **@testing-library/jest-dom** 6.9.1 - DOM matchers
- **@playwright/test** 1.56.1 - E2E testing

#### Jest Configuration (`frontend/jest.config.ts`)
```typescript
{
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
}
```

#### Jest Setup (`frontend/jest.setup.ts`)
- DOM testing library setup
- Custom matchers configuration

#### Playwright Configuration
- File: `frontend/playwright.config.ts`
- Browser: Chrome
- Base URL: http://localhost:3000
- Multiple device testing support

### Load Testing

#### K6 Load Tests
- Location: `/home/user/multimedia-portal/backend/k6-tests/`
- Protocol: HTTP/1.1
- Scenarios for:
  - Article CRUD
  - Search functionality
  - Comment operations
  - Rating submissions

### Code Coverage
- Backend: `npm run test:cov` - Coverage report in `coverage/`
- Frontend: `npm run test:coverage` - Coverage report

### CI/CD Integration
- GitHub Actions configuration (`.github/workflows/`)
- Automated testing on pull requests
- Code quality checks

---

## KEY ARCHITECTURAL PATTERNS

### 1. Modular Architecture
- Feature-based module organization
- Each module contains: controller, service, DTOs, module definition
- Loose coupling, high cohesion

### 2. Service Layer Pattern
- Controllers handle HTTP concerns
- Services contain business logic
- Repositories access data via Prisma

### 3. Dependency Injection
- NestJS built-in DI system
- Service injection in controllers
- Guard injection in providers

### 4. Guard-based Authorization
- Authentication via JwtAuthGuard
- Authorization via RolesGuard
- Metadata-driven (@Roles, @Public)

### 5. DTO Pattern
- Data validation at API layer
- `class-validator` for validation rules
- `class-transformer` for transformation

### 6. Polymorphic Relations
- Comments and Ratings support multiple content types
- Discriminator field (contentType)
- Flexible design for cross-content features

### 7. React Query on Frontend
- Server state management via TanStack React Query
- Client state via Zustand
- Automatic caching and refetching

### 8. WebSocket for Real-time
- Socket.IO integration for real-time notifications
- Gateway pattern for WebSocket handling
- Server-to-client push notifications

---

## DEPLOYMENT ARCHITECTURE

### Docker Compose Stack
```
Internet
    |
   [Nginx Reverse Proxy]
    |          |
    |          └─> Static Assets (Frontend)
    |
  [Backend Load Balancer]
    |
  [NestJS Application]
    |
  [Database Layer]
  ├─ PostgreSQL
  ├─ Redis
  ├─ Meilisearch
  └─ MinIO
```

### Service Dependencies
- Backend depends on: PostgreSQL, Redis, Meilisearch, MinIO
- Frontend depends on: Backend
- Nginx depends on: Backend, Frontend

### Health Checks
- All services configured with health checks
- Automatic restart on failure
- Service startup ordering via `depends_on` with `condition: service_healthy`

---

## SECURITY FEATURES

### Authentication
- JWT-based stateless authentication
- Refresh token mechanism
- Bcrypt password hashing

### Authorization
- Role-based access control (USER, MODERATOR, ADMIN)
- Route-level authorization via decorators
- Resource-level authorization in services

### API Security
- Input validation via class-validator
- SQL injection prevention (Prisma ORM)
- CORS configuration (NestJS)
- Rate limiting via @nestjs/throttler
- Error message sanitization

### Data Protection
- Unique constraints on ratings (one per user per content)
- Cascade delete for data integrity
- Transaction support via Prisma

---

## PERFORMANCE CONSIDERATIONS

### Caching
- Redis integration for frequently accessed data
- Cache invalidation strategies
- Configurable TTLs

### Search
- Meilisearch for full-text search
- Search analytics tracking
- Autocomplete suggestions

### Image Optimization
- Next.js built-in image optimization
- Multiple format support (AVIF, WebP)
- Lazy loading in frontend

### Pagination
- Cursor-based pagination support
- Configurable page size
- Total count in responses

### Database
- Indexes on frequently queried fields
- Efficient Prisma queries
- Join optimization

---

## SUMMARY STATISTICS

### Backend
- **14 Feature Modules**
- **12 Controllers** (content + auth + search)
- **12+ Services**
- **6 Guards/Decorators**
- **Prisma Entities**: 18 models
- **API Endpoints**: 50+
- **Test Files**: 8 test suites

### Frontend
- **21 Routes** (public + admin dashboard)
- **17+ Component Categories**
- **7 Custom Hooks**
- **4 Zustand Stores**
- **5 Content Types**
- **2 Main Providers** (Query, Auth)

### Database
- **PostgreSQL 15**
- **18 Prisma Models**
- **Multiple Junction Tables** (Many-to-Many)
- **Polymorphic Support** (Comments, Ratings, Versions)
- **Hierarchical Support** (Wiki Pages)

### Docker
- **6 Core Services**
- **3 Application Containers** (Backend, Frontend, Nginx)
- **3 Infrastructure Containers** (PostgreSQL, Redis, Meilisearch)

