# Prisma Database Schema

This directory contains the Prisma schema for the Multimedia Portal backend.

## Schema Overview

The schema includes the following models:

### Authentication
- **User**: User accounts with roles (USER, MODERATOR, ADMIN)
- **Session**: JWT session management

### Authors
- **Author**: Content creators with profiles

### Content Entities
- **Article**: In-depth articles
- **BlogPost**: Blog posts
- **WikiPage**: Wiki pages with hierarchical structure (parent-child)
- **GalleryItem**: Images and videos
- **Story**: Creative stories with optional series

### Engagement
- **Comment**: Polymorphic comments for all content types with nested replies
- **Rating**: 1-5 star ratings for all content types

### Organization
- **Category**: Content categories (with junction tables for each content type)
- **Tag**: Content tags (with junction tables for each content type)

### System
- **Notification**: User notifications
- **EmailQueue**: Email queue system

## Database Setup

### Prerequisites
- PostgreSQL database running
- Database credentials configured in `.env`

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

## Running Migrations

### First Time Setup

1. **Generate Prisma Client**:
   ```bash
   npm run prisma:generate
   # or
   npx prisma generate
   ```

2. **Create initial migration**:
   ```bash
   npm run prisma:migrate
   # or
   npx prisma migrate dev --name init
   ```

3. **Seed database (optional)**:
   ```bash
   npm run prisma:seed
   ```

### Development

```bash
# Create a new migration
npx prisma migrate dev --name <migration_name>

# Reset database (WARNING: destroys all data)
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy
```

## Prisma Studio

To explore and manage your database visually:

```bash
npm run prisma:studio
# or
npx prisma studio
```

This will open Prisma Studio at http://localhost:5555

## Schema Features

### Polymorphic Relations
Comments and Ratings use polymorphic relations to work with all content types:
- Uses `contentType` enum and `contentId` string
- Separate foreign keys for each content type for referential integrity
- Indexed for performance

### Hierarchical Data
WikiPages support parent-child relationships for nested documentation structure.

### Soft Deletes
Content entities use `status` enum (DRAFT, PUBLISHED, ARCHIVED) instead of hard deletes.

### Timestamps
All models include `createdAt` and `updatedAt` timestamps.

### Indexes
Strategic indexes on:
- Unique fields (email, username, slug)
- Foreign keys
- Frequently queried fields (status, publishedAt)
- Polymorphic relation fields

## Notes

- All UUIDs are used as primary keys
- Cascade deletes are configured for related entities
- All text content uses `@db.Text` for large content support
- Enums are used for type safety (UserRole, ContentStatus, etc.)
