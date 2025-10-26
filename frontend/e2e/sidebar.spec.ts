// e2e/sidebar.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Left navigation', () => {
  test('loads with "Главная" active and header matches', async ({ page }) => {
    await page.goto('/');

    // Check sidebar structure
    await expect(page.getByLabel('sidebar')).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();

    // Header should show "Главная" (теперь это начальная страница)
    await expect(page.getByRole('heading', { name: 'Главная' })).toBeVisible();

    const home = page.getByRole('button', { name: 'Главная' });
    await expect(home).toHaveAttribute('aria-current', 'page');
  });

  test('clicking items switches active state and updates header', async ({ page }) => {
    await page.goto('/');

    // initially home is active
    const home = page.getByRole('button', { name: 'Главная' });
    await expect(home).toHaveAttribute('aria-current', 'page');

    // click categories
    const categories = page.getByRole('button', { name: 'Категории' });
    await categories.click();

    // header updated
    await expect(page.getByRole('heading', { name: 'Категории' })).toBeVisible();

    // aria-current moved
    await expect(categories).toHaveAttribute('aria-current', 'page');
    await expect(home).not.toHaveAttribute('aria-current', 'page');
  });

  test('exit button is visible and positioned below the nav list', async ({ page }) => {
    await page.goto('/');

    const exit = page.getByLabel('Выход');
    await expect(exit).toBeVisible();

    // check it's at the bottom visually (last in DOM order within sidebar)
    const sidebar = page.getByLabel('sidebar');
    const lastChild = sidebar.locator('*:last-child');
    await expect(lastChild).toHaveAttribute('aria-label', 'Выход');
  });

  test('layout content area exists with proper content', async ({ page }) => {
    await page.goto('/');

    // Check that main layout area exists
    await expect(page.getByLabel('main-layout')).toBeVisible();

    // For home page - check summary cards exist
    await expect(page.getByText('Общий баланс')).toBeVisible();
    await expect(page.getByText('Доходы')).toBeVisible();
    await expect(page.getByText('Расходы')).toBeVisible();
  });
});
