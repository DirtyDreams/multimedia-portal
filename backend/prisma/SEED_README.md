# Database Seeding Guide

## Overview

The seed script (`prisma/seed.ts`) generates realistic sample data for development and testing purposes. It creates a complete dataset including users, authors, content (articles, blog posts, wiki pages, gallery items, stories), categories, tags, comments, and ratings.

## Prerequisites

1. **Running PostgreSQL database**
   - Either via Docker Compose: `docker-compose up -d postgres`
   - Or local PostgreSQL instance

2. **Environment variables configured**
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` to match your database connection

3. **Database schema applied**
   ```bash
   npx prisma migrate deploy
   # or
   npx prisma db push
   ```

## Running the Seed Script

### Method 1: Using npm script (Recommended)
```bash
npm run seed
```

### Method 2: Using Prisma CLI
```bash
npx prisma db seed
```

### Method 3: Direct execution
```bash
ts-node prisma/seed.ts
```

## Generated Data Summary

The seed script generates the following data:

### Users (7 total)
- **1 Admin User**
  - Email: `admin@portal.com`
  - Password: `admin123`
  - Role: `ADMIN`

- **1 Moderator User**
  - Email: `moderator@portal.com`
  - Password: `admin123`
  - Role: `MODERATOR`

- **5 Regular Users**
  - Randomly generated credentials
  - Role: `USER`
  - Password: `admin123` (all users)

### Authors (5)
- Realistic author profiles with:
  - Name, bio, email, website
  - Profile images (avatar URLs)
  - Unique slugs

### Categories (15)
- Technology, Lifestyle, Travel, Food & Cooking, Photography
- Art & Design, Business, Health & Fitness, Entertainment
- Education, Science, Sports, Music, Gaming, News

### Tags (30)
- Programming tags: JavaScript, TypeScript, React, Node.js, etc.
- Content tags: Tutorial, Guide, Tips, Review, News, Opinion
- Technical tags: Performance, Security, Design, UI/UX, API, Database
- Development tags: DevOps, Testing, Frontend, Backend, Full Stack
- General tags: Career, Productivity, Tools, Open Source, etc.

### Content

#### Articles (20)
- 15 Published, 5 Draft
- Each with:
  - Title, slug, content (10 paragraphs)
  - Excerpt, featured image
  - Author, categories (1-3), tags (2-5)
  - View count (0-5000)
  - Timestamps

#### Blog Posts (15)
- 10 Published, 5 Draft
- Similar structure to articles
- 8 paragraphs of content each
- View count (0-3000)

#### Wiki Pages (10)
- **5 Root pages** (no parent)
- **5 Child pages** (hierarchical structure)
- All published
- 6 paragraphs of content each
- View count (0-2000)

#### Gallery Items (25)
- 20 Published, 5 Draft
- Mix of images and videos (every 3rd item is video)
- Includes:
  - Title, description, file URL, thumbnail
  - Media type, file size, dimensions
  - MIME type, categories, tags
  - View count (0-4000)

#### Stories (10)
- 7 Published, 3 Draft
- Some grouped in series:
  - Fantasy Series
  - Sci-Fi Chronicles
  - Mystery Tales
- 15 paragraphs of content each
- View count (0-3500)

### Interactions

#### Comments (100 total)
- **60 Root comments** - distributed across all content types
- **40 Reply comments** - nested replies to root comments
- Realistic comment content
- Assigned to random users

#### Ratings (85 total)
- One rating per content item
- Values: 1-5 stars
- Assigned to random users
- Covers all content types

## Data Cleanup

The seed script automatically cleans existing data before seeding. It removes data in the correct order to handle foreign key constraints:

1. Content Versions
2. Notifications
3. Ratings
4. Comments
5. All content types (Stories, Gallery, Wiki, Blog, Articles)
6. Authors
7. Tags
8. Categories
9. Sessions
10. Users

## Custom Seeding

To modify the seed data:

1. Edit `prisma/seed.ts`
2. Adjust the numbers in `Array.from({ length: N })`
3. Modify faker.js calls for different data types
4. Run the seed script again

## Troubleshooting

### Error: "Prisma Client not initialized"
```bash
npx prisma generate
npm run seed
```

### Error: "Database connection failed"
- Check PostgreSQL is running
- Verify `DATABASE_URL` in `.env`
- Ensure database exists: `createdb multimedia_db`

### Error: "Foreign key constraint violation"
- The seed script handles this automatically
- If issues persist, try: `npx prisma migrate reset` (⚠️ destroys all data)

### TypeScript compilation errors
- Ensure all dependencies are installed: `npm install`
- Check TypeScript version: `npm list typescript`

## Testing the Seeded Data

After seeding, verify data was created:

```bash
# Using Prisma Studio (GUI)
npx prisma studio

# Using psql
psql -h localhost -U multimedia_user -d multimedia_db
\dt  # List tables
SELECT count(*) FROM users;
SELECT count(*) FROM articles;
SELECT count(*) FROM comments;
```

## Production Considerations

⚠️ **Never run seed scripts in production!**

This seed script is designed for:
- Local development environments
- Testing environments
- Demo/staging environments

For production:
- Use migrations for schema changes
- Import real data carefully
- Never use the default passwords
- Always backup before data operations

## Related Files

- `prisma/schema.prisma` - Database schema definition
- `prisma/seed.ts` - Seed script source code
- `package.json` - Contains seed script configuration
- `.env.example` - Environment variable template

## Dependencies

- `@faker-js/faker` - Realistic fake data generation
- `@prisma/client` - Prisma database client
- `bcrypt` - Password hashing
- `ts-node` - TypeScript execution

## Additional Resources

- [Prisma Seeding Documentation](https://www.prisma.io/docs/guides/database/seed-database)
- [Faker.js Documentation](https://fakerjs.dev/)
- [Multimedia Portal Documentation](../README.md)
