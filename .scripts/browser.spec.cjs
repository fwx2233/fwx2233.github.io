const { test, expect } = require('@playwright/test');
test('articles, navigation, author profile and math work after upgrading', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh-CN');
  await page.waitForFunction(() => window._pushState && window._drawer);
  await expect(page.locator('article')).toHaveCount(5);

  await page.evaluate(() => { window.__blogNavigationMarker = true; });
  await page.locator('article h1 a').first().click();
  await expect(page).toHaveURL(/\/2024\/10\/09\//);
  await expect(page.locator('#_main article img').first()).toBeVisible();
  expect(await page.evaluate(() => window.__blogNavigationMarker)).toBe(true);
  await page.goBack();
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
  await expect(page.locator('article')).toHaveCount(5);

  if (testInfo.project.name === 'mobile') {
    await page.locator('#_menu').click();
    await page.waitForFunction(() => window._drawer.opened);
  }
  await page.locator('a.sidebar-nav-item[href="/about/"]').click();
  await expect(page.locator('#_main')).toContainText('PhD student');
  await expect(page.locator('#_main')).toContainText('2019');
  await expect(page.locator('#_main article .message')).toHaveCount(0);
  await expect(page.locator('#_main article p').filter({ hasText: 'PhD student' })).toHaveCount(1);

  await page.goto('/tag/hyde/');
  await expect(page.locator('#_main .related-posts a')).toHaveCount(26);
  await page.goto('/page-8/');
  await expect(page.locator('article')).toHaveCount(4);

  // No current post has TeX markup; inject a formula into a fetched page only in
  // this browser test to exercise the real lazy loader without publishing a fixture.
  await page.route('**/about/?math-smoke', async route => {
    const response = await route.fetch();
    const body = (await response.text()) +
      '<div id="math-smoke"><script type="math/tex">x^2 + y^2</script></div>';
    await route.fulfill({ response, body });
  });
  await page.goto('/about/?math-smoke');
  await expect(page.locator('#math-smoke .katex')).toBeVisible();
  expect(errors).toEqual([]);
});
