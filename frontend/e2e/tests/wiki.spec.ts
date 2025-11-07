import { test, expect } from '../fixtures/auth.fixture';
import { TestData } from '../fixtures/test-data';

test.describe('Wiki Pages Management', () => {
  test.beforeEach(async ({ loginPage, registerPage }) => {
    const userData = TestData.randomUser();
    await registerPage.register(userData.name, userData.email, userData.password);
    await loginPage.login(userData.email, userData.password);
  });

  test('should create a new wiki page', async ({ wikiPage }) => {
    const wikiData = TestData.randomWikiPage();

    await wikiPage.createWikiPage(wikiData);
    await wikiPage.verifyWikiPageCreated(wikiData.title);
  });

  test('should create child wiki page with parent', async ({ wikiPage }) => {
    // Create parent page first
    const parentData = TestData.randomWikiPage();
    await wikiPage.createWikiPage(parentData);

    // Create child page
    const childData = {
      title: `${parentData.title} - Child Page`,
      content: 'This is a child wiki page.',
      parentPage: parentData.title,
    };

    await wikiPage.createWikiPage(childData);
    await wikiPage.verifyWikiPageCreated(childData.title);
  });

  test('should show validation error for empty title', async ({ wikiPage }) => {
    await wikiPage.goToCreate();
    await wikiPage.contentEditor.fill('Content without title');
    await wikiPage.saveButton.click();

    await expect(wikiPage.page).toHaveURL(/\/(new|create)/);
  });

  test('should display wiki pages in list', async ({ wikiPage, page }) => {
    const wikiData = TestData.randomWikiPage();

    await wikiPage.createWikiPage(wikiData);

    await page.goto('/wiki');
    await expect(page.getByText(wikiData.title)).toBeVisible();
  });
});
