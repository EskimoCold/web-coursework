// e2e/sidebar.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Left navigation', () => {
  test('login page loads correctly', async ({ page }) => {
    await page.goto('/login');

    // Проверяем что страница логина загрузилась
    await expect(page).toHaveTitle(/Web Coursework/);
    await expect(page.getByRole('heading', { name: /вход|login/i })).toBeVisible();

    // Проверяем форму
    await expect(page.getByLabel(/имя пользователя|username/i)).toBeVisible();
    await expect(page.getByLabel(/пароль|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /войти|login/i })).toBeVisible();
  });

  test('register page loads correctly', async ({ page }) => {
    await page.goto('/register');

    // Проверяем что страница регистрации загрузилась
    await expect(page).toHaveTitle(/Web Coursework/);
    await expect(page.getByRole('heading', { name: /регистрация|register/i })).toBeVisible();

    // Проверяем форму
    await expect(page.getByLabel(/имя пользователя|username/i)).toBeVisible();
    await expect(page.getByLabel(/пароль|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /зарегистрироваться|register/i })).toBeVisible();
  });

  test('redirects to login for protected routes', async ({ page }) => {
    // Пытаемся перейти на защищенный роут
    await page.goto('/');

    // Должны быть перенаправлены на логин
    await page.waitForURL('/login');
    await expect(page.getByRole('heading', { name: /вход|login/i })).toBeVisible();
  });
});
