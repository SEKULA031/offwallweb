import { test, expect } from '@playwright/test';
test('category links, product content and canonical are available without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/posteri/kategorija/sport');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sportski posteri');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.theoffwall.com/posteri/kategorija/sport',
  );
  await page.getByRole('link', { name: 'Mohamed Salah', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mohamed Salah');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://www.theoffwall.com/posteri/mohamed-salah',
  );
  await expect(page.getByRole('navigation', { name: 'Putanja stranice' })).toBeVisible();
  expect(await page.locator('script[type="application/ld+json"]').count()).toBe(1); // Demo prices must never produce Product markup.
  await context.close();
});
test('missing categories return 404; private pages expose noindex', async ({ request }) => {
  expect((await request.get('/posteri/kategorija/nepostojeca')).status()).toBe(404);
  for (const path of ['/korpa', '/checkout', '/admin/login']) {
    const html = await (await request.get(path)).text();
    expect(html).toMatch(/name="robots" content="noindex/);
  }
});
