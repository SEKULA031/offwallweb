import { test, expect } from '@playwright/test';
test('homepage, responsive navigation and original artwork', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /TVOJ ZID/ })).toBeVisible();
  await expect(page.locator('.hero-art img')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('link', { name: 'Pronađi svoj poster', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(6);
});
test('filter, configure, persist cart and remove item', async ({ page }) => {
  await page.goto('/posteri');
  await page.getByRole('searchbox').fill('Negroni');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.getByRole('link', { name: 'Detalji', exact: true }).click();
  await page.getByRole('button', { name: '50 × 70', exact: true }).click();
  await page.getByRole('button', { name: 'Crni', exact: true }).click();
  await page.getByRole('button', { name: 'Dodaj u korpu', exact: true }).click();
  await page.getByRole('link', { name: 'Pogledaj korpu i nastavi', exact: true }).click();
  await expect(page.locator('.cart-row')).toContainText('50 × 70 / Crni');
  await page.reload();
  await expect(page.locator('.cart-row')).toHaveCount(1);
  await page.getByRole('spinbutton').fill('2');
  await expect(page.locator('.cart-link')).toContainText('(2)');
  await page.getByRole('button', { name: 'Ukloni', exact: true }).click();
  await expect(page.getByText('Korpa je trenutno prazna.', { exact: false })).toBeVisible();
});
test('closed store never fabricates successful orders', async ({ page, request }) => {
  await page.goto('/checkout');
  await expect(page.getByText('Prodavnica još ne prima porudžbine.')).toBeVisible();
  const response = await request.post('/api/checkout', { data: {} });
  expect(response.status()).toBe(503);
  expect((await request.get('/api/jobs/emails')).status()).toBe(401);
});
test('FAQ and admin configuration screen', async ({ page }) => {
  await page.goto('/');
  await page.locator('summary').filter({ hasText: 'Kako biram format?' }).click();
  await expect(page.getByText('Izmeri prostor na zidu', { exact: false })).toBeVisible();
  await page.goto('/admin');
  await expect(
    page.getByRole('heading', { name: 'ADMIN JE SPREMAN ZA POVEZIVANJE.' }),
  ).toBeVisible();
});
