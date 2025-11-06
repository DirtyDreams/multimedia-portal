# Multimedia Portal

A comprehensive multimedia content management platform built with **NestJS** backend and **Next.js** frontend, supporting multiple content types including Articles, Blog Posts, Wiki Pages, Galleries, Stories, and Author Profiles.

## 🎯 Features

### Content Management
- **Articles** - Long-form content with categories and tags
- **Blog Posts** - Time-based content with author attribution
- **Wiki Pages** - Hierarchical knowledge base with parent-child relationships
- **Gallery** - Media management with image and video support
- **Stories** - Series-based narrative content
- **Authors** - Creator profiles and information

### Cross-Content Features
- **Comments** - Nested comments on all content types
- **Ratings** - 5-star rating system for content
- **Tagging & Categorization** - Flexible content organization
- **Search & Filtering** - Advanced content discovery

### Admin & Moderation
- **Admin Dashboard** - Comprehensive CMS interface
- **User Management** - Role-based access control (User, Moderator, Admin)
- **Comment Moderation** - Review and manage user comments
- **Content Scheduling** - Publish content on specific dates
- **Analytics** - Content performance metrics

## 🏗️ Architecture

### Backend (NestJS + TypeORM)
```
backend/
├── src/
│   ├── modules/
│   │   ├── articles/
│   │   ├── blog/
│   │   ├── wiki/
│   │   ├── gallery/
│   │   ├── stories/
│   │   ├── authors/
│   │   ├── comments/
│   │   ├── ratings/
│   │   ├── auth/
│   │   └── admin/
│   ├── common/
│   ├── guards/
│   ├── pipes/
│   ├── entities/
│   └── main.ts
├── package.json
└── .env
```

### Frontend (Next.js 14)
```
frontend/
├── app/
│   ├── (public)/
│   │   ├── blog/
│   │   ├── articles/
│   │   ├── wiki/
│   │   ├── gallery/
│   │   ├── stories/
│   │   └── authors/
│   ├── dashboard/       # Admin panel
│   ├── components/
│   ├── lib/
│   └── layout.tsx
├── package.json
└── .env.local
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** 12+
- **npm** or **yarn**

### Backend Setup

```bash
cd backend
npm install

# Configure database
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Run migrations
npm run migration:run

# Start development server
npm run start:dev

# Start production
npm run start
```

### Frontend Setup

```bash
cd frontend
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your backend API URL

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

### Docker Setup

```bash
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop
docker-compose down
```

## 📚 API Documentation

### Authentication
```
POST /api/auth/register      - Register new user
POST /api/auth/login         - Login and get JWT token
POST /api/auth/refresh       - Refresh JWT token
GET  /api/auth/me            - Get current user info
```

### Content Endpoints
```
# Articles
GET    /api/articles
GET    /api/articles/:id
POST   /api/articles
PUT    /api/articles/:id
DELETE /api/articles/:id

# Blog Posts
GET    /api/blog
GET    /api/blog/:id
POST   /api/blog
PUT    /api/blog/:id
DELETE /api/blog/:id

# Wiki Pages
GET    /api/wiki
GET    /api/wiki/:id
POST   /api/wiki
PUT    /api/wiki/:id
DELETE /api/wiki/:id

# Gallery
GET    /api/gallery
GET    /api/gallery/:id
POST   /api/gallery
DELETE /api/gallery/:id

# Stories
GET    /api/stories
GET    /api/stories/:id
POST   /api/stories
PUT    /api/stories/:id
DELETE /api/stories/:id

# Authors
GET    /api/authors
GET    /api/authors/:id
POST   /api/authors
PUT    /api/authors/:id
DELETE /api/authors/:id
```

### Comments & Ratings
```
# Comments
GET    /api/comments
GET    /api/comments/:id
POST   /api/comments
DELETE /api/comments/:id

# Ratings
GET    /api/ratings
POST   /api/ratings
PUT    /api/ratings/:id
```

### Admin Endpoints
```
GET    /api/admin/dashboard  - Statistics and metrics
GET    /api/admin/users      - User management
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id

GET    /api/admin/comments   - Comment moderation
DELETE /api/admin/comments/:id

GET    /api/admin/settings   - Portal settings
PUT    /api/admin/settings
```

## 🔐 Security Features

- **JWT Authentication** - Stateless token-based authentication
- **Role-Based Access Control** - User, Moderator, Admin roles
- **CORS Configuration** - Controlled cross-origin requests
- **Input Validation** - Class-validator for request validation
- **SQL Injection Prevention** - TypeORM parameterized queries
- **XSS Prevention** - React sanitization and content security
- **Rate Limiting** - API endpoint protection
- **HTTPS Support** - Secure connections

## 📊 Database Schema

### Core Entities
- **Articles** - Title, content, categories, tags, author, timestamps
- **BlogPosts** - Published date, content, author, categories, tags
- **WikiPages** - Hierarchical structure, parent page references
- **GalleryItems** - Media files, descriptions, metadata
- **Stories** - Series information, chapters, story arc
- **Authors** - Profile information, bio, contact details

### Cross-Content
- **Comments** - Polymorphic comments on any content type
- **Ratings** - 1-5 star ratings for content
- **Categories** - Reusable content categorization
- **Tags** - Flexible content tagging

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test                      # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:cov            # Generate coverage report

# Frontend tests
cd frontend
npm test                      # Run all tests
npm run test:watch          # Run tests in watch mode
```

## 📦 Deployment

### Heroku/Railway

```bash
git push heroku main

# View logs
heroku logs --tail
```

### AWS/GCP/Azure

Configure environment variables and use Docker containers with docker-compose for deployment.

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m "feat: add amazing feature"`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

Please see [Contributing Guidelines](CONTRIBUTING.md) for more details.

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 👥 Authors

- **DirtyDreams** - Project Lead

## 📞 Support

For issues, questions, or suggestions:
- 📧 Email: support@multimedia-portal.dev
- 🐛 [Report Issues](https://github.com/DirtyDreams/multimedia-portal/issues)
- 💬 [Discussions](https://github.com/DirtyDreams/multimedia-portal/discussions)

## 🗺️ Project Roadmap

- [x] Project initialization and setup
- [ ] Backend API implementation
- [ ] Frontend UI/UX development
- [ ] Admin dashboard
- [ ] Search functionality
- [ ] Social sharing features
- [ ] Analytics and reporting
- [ ] Performance optimization
- [ ] Mobile app (React Native)

## 🙏 Acknowledgments

- NestJS team for the amazing backend framework
- Next.js team for the powerful frontend framework
- TypeORM for excellent database abstraction
- Tailwind CSS for utility-first styling
