import { test, expect } from './fixtures/base';
import { BlogPage } from './page-objects/BlogPage';
import { generateTestContent } from './fixtures/test-data';

test.describe('Blog Management', () => {
  test('should create a new blog post', async ({ adminPage }) => {
    const blogPage = new BlogPage(adminPage);
    const blogData = generateTestContent('blog');

    await blogPage.goToCreateBlog();
    await blogPage.createBlogPost(blogData);

    await expect(adminPage).toHaveURL(/\/blog/);
  });

  test('should edit existing blog post', async ({ adminPage }) => {
    const blogPage = new BlogPage(adminPage);
    const blogData = generateTestContent('blog');

    await blogPage.goToCreateBlog();
    await blogPage.createBlogPost(blogData);

    await blogPage.goToBlogList();
    const editButton = adminPage
      .locator('.blog-card, .blog-item', { hasText: blogData.title })
      .locator('a[href*="/edit"], button', { hasText: /edit/i })
      .first();

    await editButton.click();

    const updatedTitle = `${blogData.title} - Updated`;
    await blogPage.editBlogPost({ title: updatedTitle });

    await blogPage.goToBlogList();
    await blogPage.expectBlogPostInList(updatedTitle);
  });

  test('should view published blog post', async ({ page, adminPage }) => {
    const blogPage = new BlogPage(adminPage);
    const blogData = generateTestContent('blog');

    await blogPage.goToCreateBlog();
    await blogPage.createBlogPost(blogData);

    const slug = blogData.slug || blogData.title.toLowerCase().replace(/\s+/g, '-');

    const viewPage = new BlogPage(page);
    await viewPage.goToViewBlog(slug);

    await viewPage.expectBlogPostVisible(blogData.title);
  });

  test('should delete blog post', async ({ adminPage }) => {
    const blogPage = new BlogPage(adminPage);
    const blogData = generateTestContent('blog');

    await blogPage.goToCreateBlog();
    await blogPage.createBlogPost(blogData);

    await blogPage.goToBlogList();
    const blogCard = adminPage.locator('.blog-card, .blog-item', {
      hasText: blogData.title,
    });

    await blogCard.hover();
    const deleteButton = blogCard.locator('button', { hasText: /delete/i });
    await deleteButton.click();

    adminPage.on('dialog', (dialog) => dialog.accept());
    await adminPage.waitForLoadState('networkidle');

    await expect(
      adminPage.locator('.blog-card, .blog-item', { hasText: blogData.title })
    ).not.toBeVisible();
  });

  test('should save blog post as draft', async ({ adminPage }) => {
    const blogPage = new BlogPage(adminPage);
    const blogData = generateTestContent('blog');

    await blogPage.goToCreateBlog();
    await blogPage.saveAsDraft({
      title: blogData.title,
      content: blogData.content,
    });

    await blogPage.goToBlogList();
    await blogPage.expectBlogPostInList(blogData.title);
  });

  test('should display blog posts list', async ({ page }) => {
    const blogPage = new BlogPage(page);
    await blogPage.goto('/blog');

    const blogList = page.locator('.blog-list, .blog-grid');
    await expect(blogList).toBeVisible();
  });
});
