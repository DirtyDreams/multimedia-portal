import { test, expect } from './fixtures/base';
import { WikiPage } from './page-objects/WikiPage';
import { TEST_WIKI_PAGE, TEST_WIKI_CHILD_PAGE, generateUniqueTitle } from './fixtures/test-data';

test.describe('Wiki Management', () => {
  test('should create a new wiki page', async ({ adminPage }) => {
    const wikiPage = new WikiPage(adminPage);
    const wikiData = {
      title: generateUniqueTitle(TEST_WIKI_PAGE.title),
      content: TEST_WIKI_PAGE.content,
    };

    await wikiPage.goToCreateWiki();
    await wikiPage.createWikiPage(wikiData);

    await expect(adminPage).toHaveURL(/\/wiki/);
  });

  test('should edit existing wiki page', async ({ adminPage }) => {
    const wikiPage = new WikiPage(adminPage);
    const wikiData = {
      title: generateUniqueTitle(TEST_WIKI_PAGE.title),
      content: TEST_WIKI_PAGE.content,
    };

    await wikiPage.goToCreateWiki();
    await wikiPage.createWikiPage(wikiData);

    await wikiPage.goToWikiList();
    const editButton = adminPage
      .locator('.wiki-card, .wiki-item', { hasText: wikiData.title })
      .locator('a[href*="/edit"], button', { hasText: /edit/i })
      .first();

    await editButton.click();

    const updatedContent = 'Updated wiki content';
    await wikiPage.editWikiPage({ content: updatedContent });

    await expect(adminPage).toHaveURL(/\/wiki/);
  });

  test('should view published wiki page', async ({ page, adminPage }) => {
    const wikiPage = new WikiPage(adminPage);
    const wikiData = {
      title: generateUniqueTitle(TEST_WIKI_PAGE.title),
      content: TEST_WIKI_PAGE.content,
    };

    await wikiPage.goToCreateWiki();
    await wikiPage.createWikiPage(wikiData);

    const slug = wikiData.title.toLowerCase().replace(/\s+/g, '-');

    const viewPage = new WikiPage(page);
    await viewPage.goToViewWiki(slug);

    await viewPage.expectWikiPageVisible(wikiData.title);
  });

  test('should delete wiki page', async ({ adminPage }) => {
    const wikiPage = new WikiPage(adminPage);
    const wikiData = {
      title: generateUniqueTitle(TEST_WIKI_PAGE.title),
      content: TEST_WIKI_PAGE.content,
    };

    await wikiPage.goToCreateWiki();
    await wikiPage.createWikiPage(wikiData);

    await wikiPage.goToWikiList();
    const wikiCard = adminPage.locator('.wiki-card, .wiki-item', {
      hasText: wikiData.title,
    });

    await wikiCard.hover();
    const deleteButton = wikiCard.locator('button', { hasText: /delete/i });
    await deleteButton.click();

    adminPage.on('dialog', (dialog) => dialog.accept());
    await adminPage.waitForLoadState('networkidle');

    await expect(
      adminPage.locator('.wiki-card, .wiki-item', { hasText: wikiData.title })
    ).not.toBeVisible();
  });

  test.describe('Wiki Hierarchy', () => {
    test('should create child wiki page', async ({ adminPage }) => {
      const wikiPage = new WikiPage(adminPage);
      const parentData = {
        title: generateUniqueTitle('Parent Wiki'),
        content: 'Parent page content',
      };

      // Create parent page first
      await wikiPage.goToCreateWiki();
      await wikiPage.createWikiPage(parentData);

      await wikiPage.goToWikiList();

      // Get parent page ID (implementation depends on UI)
      const parentCard = adminPage.locator('.wiki-card, .wiki-item', {
        hasText: parentData.title,
      });
      const parentId = await parentCard.getAttribute('data-id');

      // Create child page
      const childData = {
        title: generateUniqueTitle(TEST_WIKI_CHILD_PAGE.title),
        content: TEST_WIKI_CHILD_PAGE.content,
        parentId: parentId || undefined,
      };

      await wikiPage.goToCreateWiki();
      await wikiPage.createWikiPage(childData);

      // View parent page and check for child
      const slug = parentData.title.toLowerCase().replace(/\s+/g, '-');
      await wikiPage.goToViewWiki(slug);

      // Child page should be visible in the list
      if (parentId) {
        await wikiPage.expectChildPageVisible(childData.title);
      }
    });

    test('should display breadcrumb navigation', async ({ page, adminPage }) => {
      const wikiPage = new WikiPage(adminPage);
      const parentData = {
        title: generateUniqueTitle('Parent Wiki Breadcrumb'),
        content: 'Parent content',
      };

      await wikiPage.goToCreateWiki();
      await wikiPage.createWikiPage(parentData);

      const slug = parentData.title.toLowerCase().replace(/\s+/g, '-');
      await wikiPage.goToViewWiki(slug);

      // Breadcrumb should be visible
      await expect(wikiPage.hierarchyNav).toBeVisible();
    });
  });

  test('should display wiki pages list', async ({ page }) => {
    const wikiPage = new WikiPage(page);
    await wikiPage.goto('/wiki');

    const wikiList = page.locator('.wiki-list, .wiki-grid');
    await expect(wikiList).toBeVisible();
  });
});
