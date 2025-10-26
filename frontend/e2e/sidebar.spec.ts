// e2e/sidebar.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Basic navigation', () => {
  test('login page has form elements', async ({ page }) => {
    await page.goto('/login');

    // Простые проверки что форма есть
    await expect(page.locator('input')).toHaveCount(2); // username и password
    await expect(page.getByRole('button')).toBeVisible(); // какая-то кнопка
  });

  test('register page has form elements', async ({ page }) => {
    await page.goto('/register');

    // Простые проверки что форма есть
    await expect(page.locator('input')).toHaveCount(2); // username и password
    await expect(page.getByRole('button')).toBeVisible(); // какая-то кнопка
  });

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/');
    await page.waitForURL('/login');

    // Просто проверяем что мы не на главной
    await expect(page).not.toHaveURL('/');
  });
});
