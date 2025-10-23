import { test, expect } from '@playwright/test';

import { authenticateViaInitScript } from './utils/auth';

test.describe('Left navigation', () => {
  test.beforeEach(async ({ page }) => {
    await authenticateViaInitScript(page);
  });
  test.beforeEach(async ({ page }) => {
    // Set tokens before any app scripts run
    await page.addInitScript(() => {
      localStorage.setItem('access_token', 'e2e_access');
      localStorage.setItem('refresh_token', 'e2e_refresh');
    });

    // Mock current user endpoint the app calls after restoring tokens
    await page.route('**/api/v1/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          username: 'testuser',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }),
      });
    });

    // Mock logout to avoid network dependency
    await page.route('**/api/v1/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'ok' }),
      });
    });
  });
  test('loads with "Категории" active and header matches', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByLabel('sidebar')).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Категории');

    const categories = page.getByRole('button', { name: 'Категории' });
    await expect(categories).toHaveAttribute('aria-current', 'page');

    await expect(page.getByRole('button', { name: 'Главная' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('clicking items switches active state and updates header', async ({ page }) => {
    await page.goto('/');

    const home = page.getByRole('button', { name: 'Главная' });
    await home.click();

    // header updated
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Главная');

    // aria-current moved
    await expect(home).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('button', { name: 'Категории' })).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('exit button is visible and positioned below the nav list', async ({ page }) => {
    await page.goto('/');

    const exitBtn = page.getByRole('button', { name: 'Выход' });
    await expect(exitBtn).toBeVisible();

    // sanity: ensure it’s below the last nav item
    const lastNav = page.getByRole('button', { name: 'Настройки' });

    const exitBox = await exitBtn.boundingBox();
    const lastBox = await lastNav.boundingBox();

    expect(exitBox).not.toBeNull();
    expect(lastBox).not.toBeNull();

    if (exitBox && lastBox) {
      expect(exitBox.y).toBeGreaterThan(lastBox.y); // exit is visually below the last item
    }

    // click should not throw or navigate away
    await exitBtn.click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('layout content area exists (we only render placeholder inside)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('content-placeholder')).toBeVisible();
  });
});
