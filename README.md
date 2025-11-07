# 🎬 Multimedia Portal

> A comprehensive, enterprise-grade multimedia content management platform built with **NestJS**, **Next.js 14**, and **Prisma ORM**.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11.0-red.svg)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black.svg)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192.svg)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Development](#-development)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 📝 Content Management
- **Articles** - Long-form content with rich text editing, categories, and tags
- **Blog Posts** - Time-stamped posts with author attribution and SEO optimization
- **Wiki Pages** - Hierarchical knowledge base with parent-child relationships
- **Gallery** - Image and video management with metadata and transformations
- **Stories** - Series-based narrative content with chapters
- **Authors** - Comprehensive creator profiles and portfolios

### 🎯 Cross-Content Features
- **Comments** - Nested, threaded comments on all content types
- **Ratings** - 5-star rating system with analytics
- **Tagging & Categorization** - Flexible content organization
- **Full-Text Search** - Powered by Meilisearch for fast, relevant results
- **Content Versioning** - Track changes and rollback capabilities
- **Notifications** - Real-time user notifications via WebSockets

### 👨‍💼 Admin & Moderation
- **Admin Dashboard** - Comprehensive CMS with analytics
- **User Management** - Role-based access control (User, Moderator, Admin)
- **Comment Moderation** - Review and manage user-generated content
- **Content Scheduling** - Publish content at specific dates/times
- **Audit Logging** - Track all admin actions for compliance
- **Analytics Dashboard** - Privacy-friendly content and user analytics

### 🔐 Security & Performance
- **JWT Authentication** - Stateless, secure token-based auth
- **Rate Limiting** - Protect against abuse and DDoS
- **CORS Configuration** - Controlled cross-origin requests
- **Input Validation** - Comprehensive request validation with class-validator
- **SQL Injection Prevention** - Prisma ORM with parameterized queries
- **XSS Prevention** - Content sanitization and CSP headers
- **Redis Caching** - Fast response times with intelligent caching
- **IP Hashing** - Privacy-friendly analytics (GDPR compliant)

## 🛠 Tech Stack

### Backend
- **Framework**: [NestJS 11](https://nestjs.com/) - Progressive Node.js framework
- **Database**: [PostgreSQL 15](https://www.postgresql.org/) - Reliable relational database
- **ORM**: [Prisma 6](https://www.prisma.io/) - Next-generation TypeScript ORM
- **Cache**: [Redis 7](https://redis.io/) - In-memory data store
- **Search**: [Meilisearch](https://www.meilisearch.com/) - Fast, relevant full-text search
- **Storage**: [MinIO](https://min.io/) - S3-compatible object storage
- **Authentication**: JWT with Passport
- **Validation**: class-validator, class-transformer
- **API Docs**: Swagger/OpenAPI 3.0

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) - React framework with App Router
- **UI Library**: React 18
- **Styling**: [Tailwind CSS 3](https://tailwindcss.com/) - Utility-first CSS
- **State Management**: React Query / SWR
- **Forms**: React Hook Form
- **TypeScript**: Full type safety

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Task Queue**: Bull with Redis
- **Email**: Nodemailer with templating
- **Monitoring**: Built-in health checks and metrics
- **Testing**: Jest, Supertest, k6, Playwright

## 🏗 Architecture

```
multimedia-portal/
├── backend/                    # NestJS backend application
│   ├── prisma/
│   │   ├── schema.prisma      # Database schema definition
│   │   ├── seed.ts            # Database seeding script
│   │   └── migrations/        # Database migrations
│   ├── src/
│   │   ├── modules/
│   │   │   ├── articles/      # Article management
│   │   │   ├── blog/          # Blog post management
│   │   │   ├── wiki/          # Wiki pages with hierarchy
│   │   │   ├── gallery/       # Media gallery
│   │   │   ├── stories/       # Story management
│   │   │   ├── authors/       # Author profiles
│   │   │   ├── comments/      # Cross-content comments
│   │   │   ├── ratings/       # Rating system
│   │   │   ├── analytics/     # Privacy-friendly analytics
│   │   │   ├── auth/          # Authentication & authorization
│   │   │   ├── users/         # User management
│   │   │   ├── notifications/ # Real-time notifications
│   │   │   ├── search/        # Meilisearch integration
│   │   │   └── storage/       # MinIO file storage
│   │   ├── common/            # Shared utilities
│   │   │   ├── guards/        # Auth guards, roles
│   │   │   ├── decorators/    # Custom decorators
│   │   │   ├── interceptors/  # Logging, transformation
│   │   │   └── pipes/         # Validation pipes
│   │   ├── config/            # Configuration management
│   │   ├── prisma/            # Prisma service
│   │   └── main.ts            # Application entry point
│   ├── test/                  # E2E and integration tests
│   └── package.json
│
├── frontend/                   # Next.js frontend application
│   ├── app/
│   │   ├── (public)/          # Public routes
│   │   │   ├── page.tsx       # Landing page
│   │   │   ├── blog/          # Blog listing & detail
│   │   │   ├── articles/      # Article pages
│   │   │   ├── wiki/          # Wiki with navigation
│   │   │   ├── gallery/       # Media gallery
│   │   │   ├── stories/       # Story reading
│   │   │   └── authors/       # Author profiles
│   │   ├── dashboard/         # Admin panel (protected)
│   │   │   ├── page.tsx       # Analytics dashboard
│   │   │   ├── articles/      # Article CRUD
│   │   │   ├── blog/          # Blog CRUD
│   │   │   ├── wiki/          # Wiki editor
│   │   │   ├── gallery/       # Media management
│   │   │   ├── stories/       # Story CRUD
│   │   │   ├── authors/       # Author management
│   │   │   ├── users/         # User management
│   │   │   └── settings/      # Portal settings
│   │   ├── components/        # Reusable components
│   │   ├── lib/               # Utilities and API clients
│   │   └── layout.tsx         # Root layout
│   ├── public/                # Static assets
│   └── package.json
│
├── docker-compose.yml          # Development environment
├── .env.example               # Environment variables template
└── README.md                  # This file
```

### Database Schema

The database uses **Prisma ORM** with the following main entities:

- **Users** - Authentication, roles, profiles
- **Articles** - Long-form content
- **BlogPosts** - Time-based posts
- **WikiPages** - Hierarchical pages
- **GalleryItems** - Media files
- **Stories** - Narrative content
- **Authors** - Creator profiles
- **Categories** - Content categorization
- **Tags** - Flexible tagging
- **Comments** - Polymorphic comments
- **Ratings** - Star ratings
- **Notifications** - User notifications
- **ContentVersions** - Version history
- **AuditLogs** - Admin action tracking

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Docker** & Docker Compose (recommended)
- **PostgreSQL** 15+ (if not using Docker)
- **Redis** 7+ (if not using Docker)

### Quick Start with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/DirtyDreams/multimedia-portal.git
cd multimedia-portal

# Copy environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001/api/v1
# API Docs: http://localhost:3001/api/docs
# MinIO Console: http://localhost:9001
```

### Manual Setup

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed the database with sample data
npm run seed

# Start development server
npm run start:dev

# Backend runs on http://localhost:3000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with backend API URL

# Start development server
npm run dev

# Frontend runs on http://localhost:3000
```

## 💻 Development

### Database Management

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (WARNING: destroys all data)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio

# Seed database with sample data
npm run seed
```

### Running Tests

```bash
# Backend tests
cd backend

# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e

# Integration tests
npm run test:integration

# Load testing with k6
k6 run test/load/api-load-test.js

# Frontend tests
cd frontend
npm test
npm run test:watch
```

### Code Quality

```bash
# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format

# Type checking
npm run type-check
```

## 📚 API Documentation

### Interactive API Documentation

The backend provides interactive Swagger documentation:

🔗 **http://localhost:3001/api/docs**

### Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Main Endpoints

#### Authentication
```
POST   /api/v1/auth/register      - Register new user
POST   /api/v1/auth/login         - Login and get JWT
POST   /api/v1/auth/refresh       - Refresh JWT token
GET    /api/v1/auth/me            - Get current user
POST   /api/v1/auth/logout        - Logout user
```

#### Content Management
```
# Articles
GET    /api/v1/articles           - List articles (pagination, filters)
GET    /api/v1/articles/:id       - Get article by ID
POST   /api/v1/articles           - Create article (admin)
PUT    /api/v1/articles/:id       - Update article (admin)
DELETE /api/v1/articles/:id       - Delete article (admin)

# Blog Posts
GET    /api/v1/blog               - List blog posts
GET    /api/v1/blog/:slug         - Get by slug
POST   /api/v1/blog               - Create post (admin)
PUT    /api/v1/blog/:id           - Update post (admin)
DELETE /api/v1/blog/:id           - Delete post (admin)

# Wiki Pages
GET    /api/v1/wiki               - List wiki pages
GET    /api/v1/wiki/tree          - Get hierarchical tree
GET    /api/v1/wiki/:id           - Get page with children
POST   /api/v1/wiki               - Create page (admin)
PUT    /api/v1/wiki/:id           - Update page (admin)
DELETE /api/v1/wiki/:id           - Delete page (admin)

# Gallery
GET    /api/v1/gallery            - List media items
GET    /api/v1/gallery/:id        - Get media details
POST   /api/v1/gallery            - Upload media (admin)
DELETE /api/v1/gallery/:id        - Delete media (admin)

# Stories
GET    /api/v1/stories            - List stories
GET    /api/v1/stories/:slug      - Get story
POST   /api/v1/stories            - Create story (admin)
PUT    /api/v1/stories/:id        - Update story (admin)
DELETE /api/v1/stories/:id        - Delete story (admin)

# Authors
GET    /api/v1/authors            - List authors
GET    /api/v1/authors/:id        - Get author profile
POST   /api/v1/authors            - Create author (admin)
PUT    /api/v1/authors/:id        - Update author (admin)
DELETE /api/v1/authors/:id        - Delete author (admin)
```

#### Comments & Ratings
```
GET    /api/v1/comments           - Get comments by content
POST   /api/v1/comments           - Post comment (authenticated)
DELETE /api/v1/comments/:id       - Delete comment (owner/admin)

GET    /api/v1/ratings            - Get ratings by content
POST   /api/v1/ratings            - Rate content (authenticated)
PUT    /api/v1/ratings/:id        - Update rating (owner)
```

#### Search
```
GET    /api/v1/search             - Full-text search
GET    /api/v1/search/suggestions - Search suggestions
```

#### Analytics (Admin/Moderator)
```
POST   /api/v1/analytics/track    - Track analytics event (public)
GET    /api/v1/analytics/dashboard - Dashboard statistics
GET    /api/v1/analytics/popular  - Popular content
GET    /api/v1/analytics/trends   - Trend data
```

#### Admin
```
GET    /api/v1/admin/dashboard    - Admin dashboard stats
GET    /api/v1/admin/users        - User management
POST   /api/v1/admin/users        - Create user
PUT    /api/v1/admin/users/:id    - Update user
DELETE /api/v1/admin/users/:id    - Delete user
GET    /api/v1/admin/audit-logs   - View audit logs
```

### Query Parameters

Most list endpoints support:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sortBy` - Sort field (e.g., createdAt, title)
- `order` - Sort order (asc, desc)
- `search` - Full-text search
- `category` - Filter by category ID
- `tag` - Filter by tag
- `status` - Filter by status (DRAFT, PUBLISHED, etc.)

## 🧪 Testing

### Testing Strategy

The project includes comprehensive testing:

1. **Unit Tests** - Individual function/service testing with Jest
2. **Integration Tests** - API endpoint testing with Supertest
3. **E2E Tests** - End-to-end user flows with Playwright
4. **Load Tests** - Performance testing with k6

### Sample Test Data

The `seed.ts` script generates realistic sample data:

- **7 Users** (1 Admin, 1 Moderator, 5 Users)
- **20 Articles** (15 published, 5 draft)
- **15 Blog Posts** (10 published, 5 draft)
- **10 Wiki Pages** (5 root, 5 children)
- **25 Gallery Items** (images and videos)
- **10 Stories** (with series)
- **5 Authors** with profiles
- **15 Categories**, **30 Tags**
- **100 Comments** (60 root, 40 replies)
- **85 Ratings** across content

**Default Credentials:**
- Admin: `admin@portal.com` / `admin123`
- Moderator: `moderator@portal.com` / `admin123`

See `backend/prisma/SEED_README.md` for detailed seeding documentation.

## 🚢 Deployment

### Environment Variables

#### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=86400

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Meilisearch
MEILI_HOST=localhost
MEILI_PORT=7700
MEILI_API_KEY=

# Security
HASH_SALT=random-salt-for-ip-hashing

# CORS
CORS_ORIGIN=http://localhost:3000

# API
PORT=3000
```

#### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Docker Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### VPS Deployment (Hetzner/Contabo)

1. **Provision VPS** with Ubuntu 22.04+
2. **Install Docker & Docker Compose**
3. **Configure firewall** (UFW)
4. **Setup domain** and DNS records
5. **Configure SSL** with Let's Encrypt
6. **Deploy application** with docker-compose
7. **Setup monitoring** with Prometheus/Grafana
8. **Configure backups** for PostgreSQL

See detailed deployment guide in `DEPLOYMENT.md` (Task 35).

## 🔒 Security

### Security Features

- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **Password Hashing** - bcrypt with salt rounds
- ✅ **Rate Limiting** - Throttling per IP/user
- ✅ **CORS Protection** - Controlled origins
- ✅ **Helmet.js** - Security headers
- ✅ **Input Validation** - class-validator DTOs
- ✅ **SQL Injection Prevention** - Prisma ORM
- ✅ **XSS Prevention** - Content sanitization
- ✅ **CSRF Protection** - Token-based
- ✅ **HTTPS Enforcement** - TLS/SSL
- ✅ **IP Hashing** - Privacy-friendly analytics
- ✅ **Audit Logging** - Track admin actions
- ✅ **Role-Based Access** - User/Moderator/Admin

### Security Best Practices

- Always use HTTPS in production
- Rotate JWT_SECRET regularly
- Use strong database passwords
- Enable PostgreSQL SSL connections
- Keep dependencies updated
- Monitor audit logs
- Configure proper CORS origins
- Use environment variables for secrets
- Enable database backups
- Implement IP whitelisting for admin panel

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'feat: add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons
refactor: code restructuring
test: adding tests
chore: updating dependencies
```

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **DirtyDreams** - Project Lead & Architecture
- **Contributors** - See [CONTRIBUTORS.md](CONTRIBUTORS.md)

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Meilisearch](https://www.meilisearch.com/) - Lightning-fast search
- [MinIO](https://min.io/) - High-performance object storage
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

## 📞 Support

- 📧 **Email**: support@multimedia-portal.dev
- 🐛 **Issues**: [GitHub Issues](https://github.com/DirtyDreams/multimedia-portal/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/DirtyDreams/multimedia-portal/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/DirtyDreams/multimedia-portal/wiki)

## 🗺️ Roadmap

- [x] Project initialization and architecture
- [x] Backend API with NestJS + Prisma
- [x] Authentication & Authorization (JWT)
- [x] Database schema and migrations
- [x] Content management modules
- [x] Comment and rating systems
- [x] Analytics and tracking
- [x] Security middleware
- [x] API documentation (Swagger)
- [x] Database seeding
- [x] Integration & E2E testing
- [ ] Frontend UI/UX (Next.js)
- [ ] Admin dashboard
- [ ] Full-text search (Meilisearch)
- [ ] File upload (MinIO)
- [ ] Email notifications
- [ ] Real-time features (WebSockets)
- [ ] Performance optimization
- [ ] Production deployment
- [ ] Monitoring & logging
- [ ] Mobile app (React Native)

---

**Built with ❤️ by the Multimedia Portal team**
