import { PrismaClient, UserRole, ContentStatus, AuditAction } from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Comprehensive seed script for Multimedia Portal
 * Generates realistic sample data for all entities
 */

// Configuration
const SALT_ROUNDS = 10;
const NUM_USERS = 20;
const NUM_AUTHORS = 5;
const NUM_CATEGORIES = 12;
const NUM_TAGS = 30;
const NUM_ARTICLES = 20;
const NUM_BLOG_POSTS = 15;
const NUM_WIKI_PAGES = 10;
const NUM_GALLERY_ITEMS = 25;
const NUM_STORIES = 10;
const NUM_COMMENTS_PER_CONTENT = 5;
const NUM_RATINGS_PER_CONTENT = 10;

/**
 * Helper: Generate random subset of array
 */
function randomSubset<T>(array: T[], min = 1, max = 3): T[] {
  const count = faker.number.int({ min, max: Math.min(max, array.length) });
  return faker.helpers.shuffle(array).slice(0, count);
}

/**
 * Helper: Generate slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Step 1: Create Users
 */
async function seedUsers() {
  console.log('🌱 Seeding users...');

  const users = [];

  // Create default admin account
  const adminPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@multimedia-portal.com',
      username: 'admin',
      password: adminPassword,
      name: 'System Administrator',
      role: UserRole.ADMIN,
    },
  });
  users.push(admin);
  console.log(`  ✓ Created admin user: ${admin.username}`);

  // Create moderator account
  const modPassword = await bcrypt.hash('moderator123', SALT_ROUNDS);
  const moderator = await prisma.user.create({
    data: {
      email: 'moderator@multimedia-portal.com',
      username: 'moderator',
      password: modPassword,
      name: 'Content Moderator',
      role: UserRole.MODERATOR,
    },
  });
  users.push(moderator);
  console.log(`  ✓ Created moderator user: ${moderator.username}`);

  // Create regular users
  for (let i = 0; i < NUM_USERS - 2; i++) {
    const password = await bcrypt.hash('password123', SALT_ROUNDS);
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    const user = await prisma.user.create({
      data: {
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        username: faker.internet.username({ firstName, lastName }).toLowerCase(),
        password,
        name: `${firstName} ${lastName}`,
        role: UserRole.USER,
      },
    });
    users.push(user);
  }

  console.log(`  ✓ Created ${NUM_USERS} users total`);
  return users;
}

/**
 * Step 2: Create Authors
 */
async function seedAuthors() {
  console.log('🌱 Seeding authors...');

  const authors = [];

  for (let i = 0; i < NUM_AUTHORS; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;

    const author = await prisma.author.create({
      data: {
        name: fullName,
        slug: generateSlug(fullName),
        bio: faker.lorem.paragraphs(2),
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        website: faker.internet.url(),
        profileImage: faker.image.avatar(),
      },
    });
    authors.push(author);
  }

  console.log(`  ✓ Created ${NUM_AUTHORS} authors`);
  return authors;
}

/**
 * Step 3: Create Categories
 */
async function seedCategories() {
  console.log('🌱 Seeding categories...');

  const categoryNames = [
    'Technology',
    'Science',
    'Arts & Culture',
    'Business',
    'Entertainment',
    'Health & Wellness',
    'Sports',
    'Travel',
    'Food & Cooking',
    'Education',
    'Lifestyle',
    'News',
  ];

  const categories = [];

  for (const name of categoryNames) {
    const category = await prisma.category.create({
      data: {
        name,
        slug: generateSlug(name),
        description: faker.lorem.sentence(),
      },
    });
    categories.push(category);
  }

  console.log(`  ✓ Created ${categoryNames.length} categories`);
  return categories;
}

/**
 * Step 4: Create Tags
 */
async function seedTags() {
  console.log('🌱 Seeding tags...');

  const tags = [];

  for (let i = 0; i < NUM_TAGS; i++) {
    const name = faker.word.noun();
    const tag = await prisma.tag.create({
      data: {
        name,
        slug: generateSlug(name),
      },
    });
    tags.push(tag);
  }

  console.log(`  ✓ Created ${NUM_TAGS} tags`);
  return tags;
}

/**
 * Step 5: Create Articles
 */
async function seedArticles(users: any[], authors: any[], categories: any[], tags: any[]) {
  console.log('🌱 Seeding articles...');

  const articles = [];

  for (let i = 0; i < NUM_ARTICLES; i++) {
    const title = faker.lorem.sentence();
    const status = faker.helpers.arrayElement([
      ContentStatus.PUBLISHED,
      ContentStatus.PUBLISHED,
      ContentStatus.PUBLISHED,
      ContentStatus.DRAFT,
    ]);

    const article = await prisma.article.create({
      data: {
        title,
        slug: generateSlug(title) + `-${i}`,
        content: faker.lorem.paragraphs(10),
        excerpt: faker.lorem.paragraph(),
        featuredImage: faker.image.url({ width: 1200, height: 630 }),
        status,
        publishedAt: status === ContentStatus.PUBLISHED ? faker.date.past() : null,
        authorId: faker.helpers.arrayElement(authors).id,
        userId: faker.helpers.arrayElement(users).id,
      },
    });

    // Add categories
    const selectedCategories = randomSubset(categories, 1, 3);
    for (const category of selectedCategories) {
      await prisma.articleCategory.create({
        data: {
          articleId: article.id,
          categoryId: category.id,
        },
      });
    }

    // Add tags
    const selectedTags = randomSubset(tags, 2, 5);
    for (const tag of selectedTags) {
      await prisma.articleTag.create({
        data: {
          articleId: article.id,
          tagId: tag.id,
        },
      });
    }

    articles.push(article);
  }

  console.log(`  ✓ Created ${NUM_ARTICLES} articles`);
  return articles;
}

/**
 * Step 6: Create Blog Posts
 */
async function seedBlogPosts(users: any[], authors: any[], categories: any[], tags: any[]) {
  console.log('🌱 Seeding blog posts...');

  const blogPosts = [];

  for (let i = 0; i < NUM_BLOG_POSTS; i++) {
    const title = faker.lorem.sentence();
    const status = faker.helpers.arrayElement([
      ContentStatus.PUBLISHED,
      ContentStatus.PUBLISHED,
      ContentStatus.DRAFT,
    ]);

    const blogPost = await prisma.blogPost.create({
      data: {
        title,
        slug: generateSlug(title) + `-${i}`,
        content: faker.lorem.paragraphs(8),
        excerpt: faker.lorem.paragraph(),
        featuredImage: faker.image.url({ width: 1200, height: 630 }),
        status,
        publishedAt: status === ContentStatus.PUBLISHED ? faker.date.past() : null,
        authorId: faker.helpers.arrayElement(authors).id,
        userId: faker.helpers.arrayElement(users).id,
      },
    });

    // Add categories and tags
    const selectedCategories = randomSubset(categories, 1, 2);
    for (const category of selectedCategories) {
      await prisma.blogPostCategory.create({
        data: {
          blogPostId: blogPost.id,
          categoryId: category.id,
        },
      });
    }

    const selectedTags = randomSubset(tags, 1, 4);
    for (const tag of selectedTags) {
      await prisma.blogPostTag.create({
        data: {
          blogPostId: blogPost.id,
          tagId: tag.id,
        },
      });
    }

    blogPosts.push(blogPost);
  }

  console.log(`  ✓ Created ${NUM_BLOG_POSTS} blog posts`);
  return blogPosts;
}

/**
 * Step 7: Create Wiki Pages
 */
async function seedWikiPages(users: any[], authors: any[], categories: any[], tags: any[]) {
  console.log('🌱 Seeding wiki pages...');

  const wikiPages = [];

  // Create root pages
  for (let i = 0; i < Math.floor(NUM_WIKI_PAGES / 2); i++) {
    const title = faker.lorem.words(3);
    const status = ContentStatus.PUBLISHED;

    const wikiPage = await prisma.wikiPage.create({
      data: {
        title,
        slug: generateSlug(title) + `-${i}`,
        content: faker.lorem.paragraphs(6),
        status,
        publishedAt: faker.date.past(),
        authorId: faker.helpers.arrayElement(authors).id,
        userId: faker.helpers.arrayElement(users).id,
      },
    });

    const selectedCategories = randomSubset(categories, 1, 2);
    for (const category of selectedCategories) {
      await prisma.wikiPageCategory.create({
        data: {
          wikiPageId: wikiPage.id,
          categoryId: category.id,
        },
      });
    }

    const selectedTags = randomSubset(tags, 1, 3);
    for (const tag of selectedTags) {
      await prisma.wikiPageTag.create({
        data: {
          wikiPageId: wikiPage.id,
          tagId: tag.id,
        },
      });
    }

    wikiPages.push(wikiPage);
  }

  // Create child pages
  for (let i = Math.floor(NUM_WIKI_PAGES / 2); i < NUM_WIKI_PAGES; i++) {
    const title = faker.lorem.words(3);
    const parent = faker.helpers.arrayElement(wikiPages);

    const wikiPage = await prisma.wikiPage.create({
      data: {
        title,
        slug: generateSlug(title) + `-${i}`,
        content: faker.lorem.paragraphs(4),
        status: ContentStatus.PUBLISHED,
        publishedAt: faker.date.past(),
        parentId: parent.id,
        authorId: faker.helpers.arrayElement(authors).id,
        userId: faker.helpers.arrayElement(users).id,
      },
    });

    const selectedCategories = randomSubset(categories, 1, 2);
    for (const category of selectedCategories) {
      await prisma.wikiPageCategory.create({
        data: {
          wikiPageId: wikiPage.id,
          categoryId: category.id,
        },
      });
    }

    const selectedTags = randomSubset(tags, 1, 3);
    for (const tag of selectedTags) {
      await prisma.wikiPageTag.create({
        data: {
          wikiPageId: wikiPage.id,
          tagId: tag.id,
        },
      });
    }

    wikiPages.push(wikiPage);
  }

  console.log(`  ✓ Created ${NUM_WIKI_PAGES} wiki pages (with hierarchy)`);
  return wikiPages;
}

/**
 * Step 8: Create Gallery Items
 */
async function seedGalleryItems(users: any[], authors: any[], categories: any[], tags: any[]) {
  console.log('🌱 Seeding gallery items...');

  const galleryItems = [];

  for (let i = 0; i < NUM_GALLERY_ITEMS; i++) {
    const title = faker.lorem.words(2);
    const fileType = faker.helpers.arrayElement(['image', 'image', 'image', 'video']);
    const status = ContentStatus.PUBLISHED;

    const galleryItem = await prisma.galleryItem.create({
      data: {
        title,
        slug: generateSlug(title) + `-${i}`,
        description: faker.lorem.paragraph(),
        fileUrl: fileType === 'image'
          ? faker.image.url({ width: 1920, height: 1080 })
          : faker.internet.url(),
        fileType,
        thumbnail: faker.image.url({ width: 400, height: 300 }),
        status,
        publishedAt: faker.date.past(),
        authorId: faker.helpers.arrayElement(authors).id,
        userId: faker.helpers.arrayElement(users).id,
      },
    });

    const selectedCategories = randomSubset(categories, 1, 2);
    for (const category of selectedCategories) {
      await prisma.galleryItemCategory.create({
        data: {
          galleryItemId: galleryItem.id,
          categoryId: category.id,
        },
      });
    }

    const selectedTags = randomSubset(tags, 1, 4);
    for (const tag of selectedTags) {
      await prisma.galleryItemTag.create({
        data: {
          galleryItemId: galleryItem.id,
          tagId: tag.id,
        },
      });
    }

    galleryItems.push(galleryItem);
  }

  console.log(`  ✓ Created ${NUM_GALLERY_ITEMS} gallery items`);
  return galleryItems;
}

/**
 * Step 9: Create Stories
 */
async function seedStories(users: any[], authors: any[], categories: any[], tags: any[]) {
  console.log('🌱 Seeding stories...');

  const stories = [];
  const series = ['The Chronicles', 'Adventures', 'Legends', null, null];

  for (let i = 0; i < NUM_STORIES; i++) {
    const title = faker.lorem.sentence({ min: 3, max: 6 });
    const status = faker.helpers.arrayElement([ContentStatus.PUBLISHED, ContentStatus.DRAFT]);

    const story = await prisma.story.create({
      data: {
        title,
        slug: generateSlug(title) + `-${i}`,
        content: faker.lorem.paragraphs(15),
        excerpt: faker.lorem.paragraph(),
        featuredImage: faker.image.url({ width: 1200, height: 630 }),
        series: faker.helpers.arrayElement(series),
        status,
        publishedAt: status === ContentStatus.PUBLISHED ? faker.date.past() : null,
        authorId: faker.helpers.arrayElement(authors).id,
        userId: faker.helpers.arrayElement(users).id,
      },
    });

    const selectedCategories = randomSubset(categories, 1, 2);
    for (const category of selectedCategories) {
      await prisma.storyCategory.create({
        data: {
          storyId: story.id,
          categoryId: category.id,
        },
      });
    }

    const selectedTags = randomSubset(tags, 1, 3);
    for (const tag of selectedTags) {
      await prisma.storyTag.create({
        data: {
          storyId: story.id,
          tagId: tag.id,
        },
      });
    }

    stories.push(story);
  }

  console.log(`  ✓ Created ${NUM_STORIES} stories`);
  return stories;
}

/**
 * Step 10: Create Comments
 */
async function seedComments(
  users: any[],
  articles: any[],
  blogPosts: any[],
  wikiPages: any[],
  galleryItems: any[],
  stories: any[],
) {
  console.log('🌱 Seeding comments...');

  let totalComments = 0;

  // Comments for articles
  for (const article of articles.slice(0, 10)) {
    for (let i = 0; i < NUM_COMMENTS_PER_CONTENT; i++) {
      await prisma.comment.create({
        data: {
          content: faker.lorem.paragraph(),
          contentType: 'ARTICLE',
          contentId: article.id,
          userId: faker.helpers.arrayElement(users).id,
          articleId: article.id,
        },
      });
      totalComments++;
    }
  }

  // Comments for blog posts
  for (const blogPost of blogPosts.slice(0, 8)) {
    for (let i = 0; i < NUM_COMMENTS_PER_CONTENT; i++) {
      await prisma.comment.create({
        data: {
          content: faker.lorem.paragraph(),
          contentType: 'BLOG_POST',
          contentId: blogPost.id,
          userId: faker.helpers.arrayElement(users).id,
          blogPostId: blogPost.id,
        },
      });
      totalComments++;
    }
  }

  // Comments for stories
  for (const story of stories.slice(0, 5)) {
    for (let i = 0; i < NUM_COMMENTS_PER_CONTENT; i++) {
      await prisma.comment.create({
        data: {
          content: faker.lorem.paragraph(),
          contentType: 'STORY',
          contentId: story.id,
          userId: faker.helpers.arrayElement(users).id,
          storyId: story.id,
        },
      });
      totalComments++;
    }
  }

  console.log(`  ✓ Created ${totalComments} comments`);
}

/**
 * Step 11: Create Ratings
 */
async function seedRatings(
  users: any[],
  articles: any[],
  blogPosts: any[],
  wikiPages: any[],
  galleryItems: any[],
  stories: any[],
) {
  console.log('🌱 Seeding ratings...');

  let totalRatings = 0;

  // Ratings for articles
  for (const article of articles) {
    const ratingUsers = randomSubset(users, 5, NUM_RATINGS_PER_CONTENT);
    for (const user of ratingUsers) {
      try {
        await prisma.rating.create({
          data: {
            value: faker.number.int({ min: 1, max: 5 }),
            contentType: 'ARTICLE',
            contentId: article.id,
            userId: user.id,
            articleId: article.id,
          },
        });
        totalRatings++;
      } catch (error) {
        // Skip duplicate ratings (unique constraint)
      }
    }
  }

  // Ratings for blog posts
  for (const blogPost of blogPosts) {
    const ratingUsers = randomSubset(users, 3, 8);
    for (const user of ratingUsers) {
      try {
        await prisma.rating.create({
          data: {
            value: faker.number.int({ min: 1, max: 5 }),
            contentType: 'BLOG_POST',
            contentId: blogPost.id,
            userId: user.id,
            blogPostId: blogPost.id,
          },
        });
        totalRatings++;
      } catch (error) {
        // Skip duplicate
      }
    }
  }

  // Ratings for gallery items
  for (const item of galleryItems) {
    const ratingUsers = randomSubset(users, 3, 8);
    for (const user of ratingUsers) {
      try {
        await prisma.rating.create({
          data: {
            value: faker.number.int({ min: 1, max: 5 }),
            contentType: 'GALLERY_ITEM',
            contentId: item.id,
            userId: user.id,
            galleryItemId: item.id,
          },
        });
        totalRatings++;
      } catch (error) {
        // Skip duplicate
      }
    }
  }

  console.log(`  ✓ Created ${totalRatings} ratings`);
}

/**
 * Step 12: Create Sample Audit Logs
 */
async function seedAuditLogs(users: any[], articles: any[]) {
  console.log('🌱 Seeding audit logs...');

  const admin = users.find((u) => u.role === UserRole.ADMIN);
  const moderator = users.find((u) => u.role === UserRole.MODERATOR);

  // Sample admin actions
  for (let i = 0; i < 10; i++) {
    const article = faker.helpers.arrayElement(articles);
    await prisma.auditLog.create({
      data: {
        action: faker.helpers.arrayElement([
          AuditAction.CREATE,
          AuditAction.UPDATE,
          AuditAction.PUBLISH,
        ]),
        resource: 'Article',
        resourceId: article.id,
        newValues: { title: article.title, status: article.status },
        ipAddress: faker.internet.ipv4(),
        userAgent: faker.internet.userAgent(),
        userId: faker.helpers.arrayElement([admin?.id, moderator?.id]),
      },
    });
  }

  console.log(`  ✓ Created sample audit logs`);
}

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Clear existing data (optional - comment out to preserve data)
    console.log('🗑️  Clearing existing data...');
    await prisma.auditLog.deleteMany();
    await prisma.rating.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.contentVersion.deleteMany();
    await prisma.articleCategory.deleteMany();
    await prisma.articleTag.deleteMany();
    await prisma.blogPostCategory.deleteMany();
    await prisma.blogPostTag.deleteMany();
    await prisma.wikiPageCategory.deleteMany();
    await prisma.wikiPageTag.deleteMany();
    await prisma.galleryItemCategory.deleteMany();
    await prisma.galleryItemTag.deleteMany();
    await prisma.storyCategory.deleteMany();
    await prisma.storyTag.deleteMany();
    await prisma.article.deleteMany();
    await prisma.blogPost.deleteMany();
    await prisma.wikiPage.deleteMany();
    await prisma.galleryItem.deleteMany();
    await prisma.story.deleteMany();
    await prisma.author.deleteMany();
    await prisma.category.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.emailQueue.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    console.log('  ✓ Existing data cleared\n');

    // Seed data
    const users = await seedUsers();
    const authors = await seedAuthors();
    const categories = await seedCategories();
    const tags = await seedTags();
    const articles = await seedArticles(users, authors, categories, tags);
    const blogPosts = await seedBlogPosts(users, authors, categories, tags);
    const wikiPages = await seedWikiPages(users, authors, categories, tags);
    const galleryItems = await seedGalleryItems(users, authors, categories, tags);
    const stories = await seedStories(users, authors, categories, tags);
    await seedComments(users, articles, blogPosts, wikiPages, galleryItems, stories);
    await seedRatings(users, articles, blogPosts, wikiPages, galleryItems, stories);
    await seedAuditLogs(users, articles);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${users.length} (including 1 admin, 1 moderator)`);
    console.log(`   - Authors: ${authors.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Tags: ${tags.length}`);
    console.log(`   - Articles: ${articles.length}`);
    console.log(`   - Blog Posts: ${blogPosts.length}`);
    console.log(`   - Wiki Pages: ${wikiPages.length}`);
    console.log(`   - Gallery Items: ${galleryItems.length}`);
    console.log(`   - Stories: ${stories.length}`);
    console.log(`   - Comments: ~${((articles.length * NUM_COMMENTS_PER_CONTENT) / 2)}`);
    console.log(`   - Ratings: ~${articles.length * 8}`);
    console.log('\n🔑 Default Credentials:');
    console.log('   Admin: admin@multimedia-portal.com / admin123');
    console.log('   Moderator: moderator@multimedia-portal.com / moderator123');
    console.log('   Users: password123');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
