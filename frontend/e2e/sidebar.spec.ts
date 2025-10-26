// e2e/sidebar.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Left navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Переходим на страницу логина и логинимся
    await page.goto('/login');
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpass');
    await page.click('button[type="submit"]');
    // Ждем редирект на главную
    await page.waitForURL('/');
  });

  test('loads with "Главная" active and header matches', async ({ page }) => {
    // Check sidebar structure
    await expect(page.locator('.sb')).toBeVisible(); // Используем класс вместо aria-label
    await expect(page.locator('.layout-header')).toBeVisible();

    // Header should show "Главная" (теперь это начальная страница)
    await expect(page.locator('.layout-title')).toHaveText('Главная');

    const home = page.getByRole('button', { name: 'Главная' });
    await expect(home).toHaveClass(/is-active/);
  });

  test('clicking items switches active state and updates header', async ({ page }) => {
    // initially home is active
    const home = page.getByRole('button', { name: 'Главная' });
    await expect(home).toHaveClass(/is-active/);

    // click categories
    const categories = page.getByRole('button', { name: 'Категории' });
    await categories.click();

    // header updated
    await expect(page.locator('.layout-title')).toHaveText('Категории');

    // active class moved
    await expect(categories).toHaveClass(/is-active/);
    await expect(home).not.toHaveClass(/is-active/);
  });

  test('exit button is visible and positioned below the nav list', async ({ page }) => {
    const exit = page.locator('.sb-exit');
    await expect(exit).toBeVisible();

    // check it's at the bottom visually (last in DOM order within sidebar)
    const sidebar = page.locator('.sb');
    const lastChild = sidebar.locator('*:last-child');
    await expect(lastChild).toHaveClass('sb-exit');
  });

  test('layout content area exists with proper content', async ({ page }) => {
    // Check that main layout area exists
    await expect(page.locator('.layout')).toBeVisible();

    // For home page - check summary cards exist
    await expect(page.getByText('Общий баланс')).toBeVisible();
    await expect(page.getByText('Доходы')).toBeVisible();
    await expect(page.getByText('Расходы')).toBeVisible();
  });
});
