import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Enums matching Prisma schema
enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

enum ContentStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

/**
 * Seed script for Multimedia Portal
 * Generates realistic sample data for development and testing
 */

// Helper function to create a slug from title
function createSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

// Helper function to get random items from array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.contentVersion.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.story.deleteMany();
  await prisma.galleryItem.deleteMany();
  await prisma.wikiPage.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.article.deleteMany();
  await prisma.author.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Database cleaned\n');

  // 1. Create Users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@portal.com',
      username: 'admin',
      password: hashedPassword,
      name: 'Admin User',
      role: UserRole.ADMIN,
    },
  });

  const moderatorUser = await prisma.user.create({
    data: {
      email: 'moderator@portal.com',
      username: 'moderator',
      password: hashedPassword,
      name: 'Moderator User',
      role: UserRole.MODERATOR,
    },
  });

  const regularUsers = await Promise.all(
    Array.from({ length: 5 }).map(async () => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      return prisma.user.create({
        data: {
          email: faker.internet.email({ firstName, lastName }),
          username: faker.internet.username({ firstName, lastName }),
          password: hashedPassword,
          name: `${firstName} ${lastName}`,
          role: UserRole.USER,
        },
      });
    }),
  );

  const allUsers = [adminUser, moderatorUser, ...regularUsers];
  console.log(`✅ Created ${allUsers.length} users\n`);

  // 2. Create Authors
  console.log('✍️  Creating authors...');
  const authors = await Promise.all(
    Array.from({ length: 5 }).map(async () => {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const fullName = `${firstName} ${lastName}`;

      return prisma.author.create({
        data: {
          name: fullName,
          slug: createSlug(fullName),
          bio: faker.lorem.paragraphs(2),
          email: faker.internet.email({ firstName, lastName }),
          website: faker.internet.url(),
          profileImage: faker.image.avatar(),
        },
      });
    }),
  );
  console.log(`✅ Created ${authors.length} authors\n`);

  // 3. Create Categories
  console.log('📁 Creating categories...');
  const categoryNames = [
    'Technology',
    'Lifestyle',
    'Travel',
    'Food & Cooking',
    'Photography',
    'Art & Design',
    'Business',
    'Health & Fitness',
    'Entertainment',
    'Education',
    'Science',
    'Sports',
    'Music',
    'Gaming',
    'News',
  ];

  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.create({
        data: {
          name,
          slug: createSlug(name),
          description: faker.lorem.sentence(),
        },
      }),
    ),
  );
  console.log(`✅ Created ${categories.length} categories\n`);

  // 4. Create Tags
  console.log('🏷️  Creating tags...');
  const tagNames = [
    'JavaScript',
    'TypeScript',
    'React',
    'Node.js',
    'Tutorial',
    'Guide',
    'Tips',
    'Review',
    'News',
    'Opinion',
    'How-to',
    'Best Practices',
    'Performance',
    'Security',
    'Design',
    'UI/UX',
    'API',
    'Database',
    'DevOps',
    'Testing',
    'Frontend',
    'Backend',
    'Full Stack',
    'Mobile',
    'Cloud',
    'AI/ML',
    'Open Source',
    'Career',
    'Productivity',
    'Tools',
  ];

  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.create({
        data: {
          name,
          slug: createSlug(name),
        },
      }),
    ),
  );
  console.log(`✅ Created ${tags.length} tags\n`);

  // 5. Create Articles
  console.log('📝 Creating articles...');
  const articles = await Promise.all(
    Array.from({ length: 20 }).map(async (_, index) => {
      const title = faker.lorem.sentence({ min: 5, max: 10 });
      const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const randomCategories = getRandomItems(categories, faker.number.int({ min: 1, max: 3 }));
      const randomTags = getRandomItems(tags, faker.number.int({ min: 2, max: 5 }));

      return prisma.article.create({
        data: {
          title,
          slug: `${createSlug(title)}-${index}`,
          content: faker.lorem.paragraphs(10, '\n\n'),
          excerpt: faker.lorem.paragraph(),
          featuredImage: faker.image.url(),
          status: index < 15 ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
          publishedAt: index < 15 ? faker.date.past() : null,
          authorId: randomAuthor.id,
          userId: randomUser.id,
          categories: {
            connect: randomCategories.map((cat) => ({ id: cat.id })),
          },
          tags: {
            connect: randomTags.map((tag) => ({ id: tag.id })),
          },
          viewCount: faker.number.int({ min: 0, max: 5000 }),
        },
      });
    }),
  );
  console.log(`✅ Created ${articles.length} articles\n`);

  // 6. Create Blog Posts
  console.log('📰 Creating blog posts...');
  const blogPosts = await Promise.all(
    Array.from({ length: 15 }).map(async (_, index) => {
      const title = faker.lorem.sentence({ min: 5, max: 10 });
      const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const randomCategories = getRandomItems(categories, faker.number.int({ min: 1, max: 3 }));
      const randomTags = getRandomItems(tags, faker.number.int({ min: 2, max: 5 }));

      return prisma.blogPost.create({
        data: {
          title,
          slug: `${createSlug(title)}-${index}`,
          content: faker.lorem.paragraphs(8, '\n\n'),
          excerpt: faker.lorem.paragraph(),
          featuredImage: faker.image.url(),
          status: index < 10 ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
          publishedAt: index < 10 ? faker.date.past() : null,
          authorId: randomAuthor.id,
          userId: randomUser.id,
          categories: {
            connect: randomCategories.map((cat) => ({ id: cat.id })),
          },
          tags: {
            connect: randomTags.map((tag) => ({ id: tag.id })),
          },
          viewCount: faker.number.int({ min: 0, max: 3000 }),
        },
      });
    }),
  );
  console.log(`✅ Created ${blogPosts.length} blog posts\n`);

  // 7. Create Wiki Pages (with hierarchy)
  console.log('📚 Creating wiki pages...');
  // First, create root pages
  const rootWikiPages = await Promise.all(
    Array.from({ length: 5 }).map(async (_, index) => {
      const title = faker.lorem.words(3);
      const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const randomCategories = getRandomItems(categories, faker.number.int({ min: 1, max: 2 }));
      const randomTags = getRandomItems(tags, faker.number.int({ min: 2, max: 4 }));

      return prisma.wikiPage.create({
        data: {
          title,
          slug: `${createSlug(title)}-${index}`,
          content: faker.lorem.paragraphs(6, '\n\n'),
          status: ContentStatus.PUBLISHED,
          publishedAt: faker.date.past(),
          authorId: randomAuthor.id,
          userId: randomUser.id,
          categories: {
            connect: randomCategories.map((cat) => ({ id: cat.id })),
          },
          tags: {
            connect: randomTags.map((tag) => ({ id: tag.id })),
          },
          viewCount: faker.number.int({ min: 0, max: 2000 }),
        },
      });
    }),
  );

  // Then, create child pages
  const childWikiPages = await Promise.all(
    Array.from({ length: 5 }).map(async (_, index) => {
      const title = faker.lorem.words(3);
      const randomParent = rootWikiPages[Math.floor(Math.random() * rootWikiPages.length)];
      const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const randomCategories = getRandomItems(categories, faker.number.int({ min: 1, max: 2 }));
      const randomTags = getRandomItems(tags, faker.number.int({ min: 2, max: 4 }));

      return prisma.wikiPage.create({
        data: {
          title,
          slug: `${createSlug(title)}-child-${index}`,
          content: faker.lorem.paragraphs(6, '\n\n'),
          status: ContentStatus.PUBLISHED,
          publishedAt: faker.date.past(),
          parentId: randomParent.id,
          authorId: randomAuthor.id,
          userId: randomUser.id,
          categories: {
            connect: randomCategories.map((cat) => ({ id: cat.id })),
          },
          tags: {
            connect: randomTags.map((tag) => ({ id: tag.id })),
          },
          viewCount: faker.number.int({ min: 0, max: 1000 }),
        },
      });
    }),
  );

  const allWikiPages = [...rootWikiPages, ...childWikiPages];
  console.log(`✅ Created ${allWikiPages.length} wiki pages (${rootWikiPages.length} root, ${childWikiPages.length} children)\n`);

  // 8. Create Gallery Items
  console.log('🖼️  Creating gallery items...');
  const galleryItems = await Promise.all(
    Array.from({ length: 25 }).map(async (_, index) => {
      const title = faker.lorem.words(4);
      const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const randomCategories = getRandomItems(categories, faker.number.int({ min: 1, max: 2 }));
      const randomTags = getRandomItems(tags, faker.number.int({ min: 1, max: 4 }));
      const mediaType = index % 3 === 0 ? 'video' : 'image';

      return prisma.galleryItem.create({
        data: {
          title,
          slug: `${createSlug(title)}-${index}`,
          description: faker.lorem.paragraph(),
          fileUrl: mediaType === 'video' ? faker.image.url() : faker.image.url(),
          thumbnailUrl: faker.image.url(),
          mediaType,
          fileSize: faker.number.int({ min: 100000, max: 10000000 }),
          width: faker.number.int({ min: 800, max: 4000 }),
          height: faker.number.int({ min: 600, max: 3000 }),
          mimeType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
          status: index < 20 ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
          publishedAt: index < 20 ? faker.date.past() : null,
          authorId: randomAuthor.id,
          userId: randomUser.id,
          categories: {
            connect: randomCategories.map((cat) => ({ id: cat.id })),
          },
          tags: {
            connect: randomTags.map((tag) => ({ id: tag.id })),
          },
          viewCount: faker.number.int({ min: 0, max: 4000 }),
        },
      });
    }),
  );
  console.log(`✅ Created ${galleryItems.length} gallery items\n`);

  // 9. Create Stories
  console.log('📖 Creating stories...');
  const stories = await Promise.all(
    Array.from({ length: 10 }).map(async (_, index) => {
      const title = faker.lorem.sentence({ min: 3, max: 8 });
      const randomAuthor = authors[Math.floor(Math.random() * authors.length)];
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const randomCategories = getRandomItems(categories, faker.number.int({ min: 1, max: 2 }));
      const randomTags = getRandomItems(tags, faker.number.int({ min: 2, max: 4 }));
      const series = index < 6 ? ['Fantasy Series', 'Sci-Fi Chronicles', 'Mystery Tales'][index % 3] : null;

      return prisma.story.create({
        data: {
          title,
          slug: `${createSlug(title)}-${index}`,
          content: faker.lorem.paragraphs(15, '\n\n'),
          excerpt: faker.lorem.paragraph(),
          featuredImage: faker.image.url(),
          series,
          status: index < 7 ? ContentStatus.PUBLISHED : ContentStatus.DRAFT,
          publishedAt: index < 7 ? faker.date.past() : null,
          authorId: randomAuthor.id,
          userId: randomUser.id,
          categories: {
            connect: randomCategories.map((cat) => ({ id: cat.id })),
          },
          tags: {
            connect: randomTags.map((tag) => ({ id: tag.id })),
          },
          viewCount: faker.number.int({ min: 0, max: 3500 }),
        },
      });
    }),
  );
  console.log(`✅ Created ${stories.length} stories\n`);

  // 10. Create Comments
  console.log('💬 Creating comments...');
  const allContent = [
    ...articles.map((a) => ({ id: a.id, type: 'ARTICLE' as const })),
    ...blogPosts.map((b) => ({ id: b.id, type: 'BLOG_POST' as const })),
    ...allWikiPages.map((w) => ({ id: w.id, type: 'WIKI_PAGE' as const })),
    ...galleryItems.map((g) => ({ id: g.id, type: 'GALLERY_ITEM' as const })),
    ...stories.map((s) => ({ id: s.id, type: 'STORY' as const })),
  ];

  const rootComments = await Promise.all(
    Array.from({ length: 60 }).map(async () => {
      const randomContent = allContent[Math.floor(Math.random() * allContent.length)];
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];

      return prisma.comment.create({
        data: {
          content: faker.lorem.paragraph(),
          contentType: randomContent.type,
          contentId: randomContent.id,
          userId: randomUser.id,
        },
      });
    }),
  );

  // Create reply comments (nested)
  const replyComments = await Promise.all(
    Array.from({ length: 40 }).map(async () => {
      const randomParent = rootComments[Math.floor(Math.random() * rootComments.length)];
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];

      return prisma.comment.create({
        data: {
          content: faker.lorem.paragraph(),
          contentType: randomParent.contentType,
          contentId: randomParent.contentId,
          parentId: randomParent.id,
          userId: randomUser.id,
        },
      });
    }),
  );

  const allComments = [...rootComments, ...replyComments];
  console.log(`✅ Created ${allComments.length} comments (${rootComments.length} root, ${replyComments.length} replies)\n`);

  // 11. Create Ratings
  console.log('⭐ Creating ratings...');
  const ratings = await Promise.all(
    allContent.map(async (content) => {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      const value = faker.number.int({ min: 1, max: 5 });

      return prisma.rating.create({
        data: {
          value,
          contentType: content.type,
          contentId: content.id,
          userId: randomUser.id,
        },
      });
    }),
  );
  console.log(`✅ Created ${ratings.length} ratings\n`);

  console.log('✅ Database seeding completed successfully! 🎉\n');
  console.log('📊 Summary:');
  console.log(`   - Users: ${allUsers.length} (1 admin, 1 moderator, ${regularUsers.length} regular)`);
  console.log(`   - Authors: ${authors.length}`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Tags: ${tags.length}`);
  console.log(`   - Articles: ${articles.length}`);
  console.log(`   - Blog Posts: ${blogPosts.length}`);
  console.log(`   - Wiki Pages: ${allWikiPages.length}`);
  console.log(`   - Gallery Items: ${galleryItems.length}`);
  console.log(`   - Stories: ${stories.length}`);
  console.log(`   - Comments: ${allComments.length}`);
  console.log(`   - Ratings: ${ratings.length}`);
  console.log('\n🔑 Admin Credentials:');
  console.log('   Email: admin@portal.com');
  console.log('   Password: admin123');
  console.log('\n🔑 Moderator Credentials:');
  console.log('   Email: moderator@portal.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
