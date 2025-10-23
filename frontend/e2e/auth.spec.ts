import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses for successful login
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
          token_type: 'bearer',
        }),
      });
    });

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

    await page.route('**/api/v1/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Logged out successfully' }),
      });
    });
  });

  test('should show error on invalid login credentials', async ({ page }) => {
    await page.goto('/login');

    // Override login route to return error
    await page.unroute('**/api/v1/auth/login');
    await page.route('**/api/v1/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Incorrect username or password' }),
      });
    });

    // Verify we're on login page
    await expect(page.getByRole('heading', { name: 'FinTrack' })).toBeVisible();

    // Fill in wrong credentials
    await page.getByPlaceholder('Логин').fill('wronguser');
    await page.getByPlaceholder('Пароль').fill('wrongpass');
    await page.getByRole('button', { name: 'Войти' }).click();

    // Should show error message
    await expect(page.getByText('Incorrect username or password')).toBeVisible();

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });
});
