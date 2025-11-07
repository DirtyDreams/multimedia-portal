# Database Seed Data

Comprehensive seed script for generating realistic sample data for the Multimedia Portal.

---

## Overview

The seed script (`prisma/seed.ts`) generates a complete dataset including:

- **Users**: 20 users (1 admin, 1 moderator, 18 regular users)
- **Authors**: 5 content authors with profiles
- **Categories**: 12 content categories
- **Tags**: 30 tags for content organization
- **Articles**: 20 articles with varying statuses
- **Blog Posts**: 15 blog posts
- **Wiki Pages**: 10 hierarchical wiki pages
- **Gallery Items**: 25 images and videos
- **Stories**: 10 stories (some in series)
- **Comments**: 100+ comments across content
- **Ratings**: 200+ ratings (1-5 stars)
- **Audit Logs**: Sample admin action logs

---

## Prerequisites

1. **Database connection** configured in `.env`:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/multimedia_db"
   ```

2. **Prisma migrations** applied:
   ```bash
   npx prisma migrate dev
   ```

3. **Dependencies** installed:
   ```bash
   npm install
   ```

---

## Usage

### Running the Seed Script

**Option 1: Using npm script (recommended)**
```bash
npm run db:seed
```

**Option 2: Using Prisma CLI**
```bash
npx prisma db seed
```

**Option 3: Direct execution**
```bash
npm run prisma:seed
```

### Expected Output

```
🌱 Starting database seeding...

🗑️  Clearing existing data...
  ✓ Existing data cleared

🌱 Seeding users...
  ✓ Created admin user: admin
  ✓ Created moderator user: moderator
  ✓ Created 20 users total

🌱 Seeding authors...
  ✓ Created 5 authors

🌱 Seeding categories...
  ✓ Created 12 categories

🌱 Seeding tags...
  ✓ Created 30 tags

🌱 Seeding articles...
  ✓ Created 20 articles

🌱 Seeding blog posts...
  ✓ Created 15 blog posts

🌱 Seeding wiki pages...
  ✓ Created 10 wiki pages (with hierarchy)

🌱 Seeding gallery items...
  ✓ Created 25 gallery items

🌱 Seeding stories...
  ✓ Created 10 stories

🌱 Seeding comments...
  ✓ Created 115 comments

🌱 Seeding ratings...
  ✓ Created 280 ratings

🌱 Seeding audit logs...
  ✓ Created sample audit logs

✅ Database seeding completed successfully!

📊 Summary:
   - Users: 20 (including 1 admin, 1 moderator)
   - Authors: 5
   - Categories: 12
   - Tags: 30
   - Articles: 20
   - Blog Posts: 15
   - Wiki Pages: 10
   - Gallery Items: 25
   - Stories: 10
   - Comments: ~57
   - Ratings: ~160

🔑 Default Credentials:
   Admin: admin@multimedia-portal.com / admin123
   Moderator: moderator@multimedia-portal.com / moderator123
   Users: password123
```

---

## Default Credentials

After seeding, you can log in with:

### Admin Account
- **Email**: `admin@multimedia-portal.com`
- **Password**: `admin123`
- **Role**: ADMIN
- **Permissions**: Full system access

### Moderator Account
- **Email**: `moderator@multimedia-portal.com`
- **Password**: `moderator123`
- **Role**: MODERATOR
- **Permissions**: Content moderation

### Regular Users
- **Usernames**: Various (check database)
- **Password**: `password123` (all users)
- **Role**: USER

---

## Generated Data Details

### Users (20)
- 1 Admin user
- 1 Moderator user
- 18 Regular users
- Realistic names using faker.js
- Bcrypt hashed passwords (10 rounds)

### Authors (5)
- Full profiles with bio
- Profile images (avatars)
- Contact information (email, website)
- Unique slugs for URLs

### Categories (12)
- Technology
- Science
- Arts & Culture
- Business
- Entertainment
- Health & Wellness
- Sports
- Travel
- Food & Cooking
- Education
- Lifestyle
- News

### Content Distribution
- **Articles**: 20 (75% published, 25% draft)
- **Blog Posts**: 15 (66% published, 33% draft)
- **Wiki Pages**: 10 (100% published, hierarchical structure)
- **Gallery Items**: 25 (100% published, mix of images/videos)
- **Stories**: 10 (50% published, some in series)

### Relationships
- Each content item has **1-3 categories**
- Each content item has **1-5 tags**
- Published content has **publish dates** in the past
- Wiki pages have **parent-child relationships**
- Stories can belong to **series**

### Engagement
- **Comments**: ~5 per popular content item
- **Ratings**: ~10 per content item (1-5 stars)
- Realistic comment text using faker.js
- Random rating distributions

### Audit Logs
- Sample admin actions (CREATE, UPDATE, PUBLISH)
- IP addresses and user agents
- Linked to admin/moderator users

---

## Customization

### Adjusting Quantities

Edit constants in `prisma/seed.ts`:

```typescript
const NUM_USERS = 20;           // Total users
const NUM_AUTHORS = 5;          // Content authors
const NUM_CATEGORIES = 12;      // Categories
const NUM_TAGS = 30;            // Tags
const NUM_ARTICLES = 20;        // Articles
const NUM_BLOG_POSTS = 15;      // Blog posts
const NUM_WIKI_PAGES = 10;      // Wiki pages
const NUM_GALLERY_ITEMS = 25;   // Gallery items
const NUM_STORIES = 10;         // Stories
const NUM_COMMENTS_PER_CONTENT = 5;  // Comments per item
const NUM_RATINGS_PER_CONTENT = 10;  // Ratings per item
```

### Preserving Existing Data

To **not** clear existing data, comment out the deletion section:

```typescript
// Comment out this entire block to preserve data
// console.log('🗑️  Clearing existing data...');
// await prisma.auditLog.deleteMany();
// await prisma.rating.deleteMany();
// ...
```

### Custom Content

Add your own data generation logic:

```typescript
// Example: Add custom article
const customArticle = await prisma.article.create({
  data: {
    title: 'My Custom Article',
    slug: 'my-custom-article',
    content: 'Custom content here...',
    status: ContentStatus.PUBLISHED,
    publishedAt: new Date(),
    authorId: authors[0].id,
    userId: users[0].id,
  },
});
```

---

## Testing with Seed Data

After seeding, test the application:

### 1. Login and Authentication
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@multimedia-portal.com",
    "password": "admin123"
  }'
```

### 2. Fetch Articles
```bash
curl http://localhost:4000/api/articles
```

### 3. Search Content
```bash
curl http://localhost:4000/api/search?q=technology
```

### 4. View Comments
```bash
curl http://localhost:4000/api/comments?contentType=ARTICLE&contentId=<article-id>
```

---

## Troubleshooting

### Error: Database connection failed
**Solution**: Check `DATABASE_URL` in `.env` and ensure database is running

### Error: Unique constraint failed
**Solution**: Database already has data. Run seed again (it clears data first) or modify script to preserve existing data

### Error: Prisma Client not found
**Solution**: Run `npx prisma generate` to generate Prisma Client

### Error: bcrypt not found
**Solution**: Install bcrypt: `npm install bcrypt @types/bcrypt`

### Error: @faker-js/faker not found
**Solution**: Install faker: `npm install --save-dev @faker-js/faker`

### Slow execution
**Solution**: Reduce the quantity constants in `seed.ts` for faster seeding

---

## Development Workflow

### 1. During Development
```bash
# Reset database and reseed
npx prisma migrate reset
# This automatically runs seed script

# Or manually:
npx prisma migrate reset --skip-seed
npm run db:seed
```

### 2. Before Testing
```bash
# Fresh seed data
npm run db:seed
```

### 3. CI/CD Pipeline
```yaml
# Example GitHub Actions
- name: Seed Database
  run: |
    npm run db:seed
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

---

## Data Quality

### Realistic Data
- **Faker.js** generates realistic:
  - Names (first + last)
  - Emails
  - Usernames
  - Paragraphs and sentences
  - Dates
  - URLs and images

### Data Relationships
- All foreign keys properly linked
- Many-to-many relationships created
- Hierarchical structures (wiki pages)
- Polymorphic relationships (comments, ratings)

### Content Variety
- Mix of published and draft content
- Various content lengths
- Different publication dates
- Diverse categories and tags

---

## Security Notes

### Passwords
- Default passwords are **weak** (`admin123`, `password123`)
- **Change immediately** in production
- Use strong passwords for real accounts

### Admin Account
- Default admin has **full access**
- Secure the admin account in production
- Consider two-factor authentication

### Seed Data in Production
- **DO NOT** run seed script in production
- Use for development/staging only
- Production data should come from real users

---

## Related Documentation

- [Prisma Schema](./schema.prisma)
- [Database Migrations](../docs/DATABASE.md)
- [API Documentation](../docs/API_DOCUMENTATION.md)
- [Security Configuration](../docs/SECURITY_CONFIGURATION.md)

---

## Maintenance

### Updating Seed Script
1. Modify `prisma/seed.ts`
2. Test locally: `npm run db:seed`
3. Commit changes
4. Document changes in this README

### Schema Changes
When Prisma schema changes:
1. Update seed script to match new schema
2. Run migration: `npx prisma migrate dev`
3. Test seed script: `npm run db:seed`

---

**Last Updated**: 2025-11-07
**Version**: 1.0.0
**Maintainer**: Backend Team
