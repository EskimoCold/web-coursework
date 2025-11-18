import type { Page } from '@playwright/test';

/**
 * Injects tokens before app scripts run and mocks fetch for auth endpoints.
 * Navigates to '/' and waits for the sidebar, meaning the session is restored.
 */
export async function authenticateViaInitScript(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Set tokens so the app attempts to restore the session
    localStorage.setItem('access_token', 'e2e_access');
    localStorage.setItem('refresh_token', 'e2e_refresh');

    // Patch fetch to mock required auth endpoints
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input as URL).toString();

      if (url.endsWith('/api/v1/users/me')) {
        return new Response(
          JSON.stringify({
            id: 1,
            username: 'testuser',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (url.endsWith('/api/v1/auth/logout')) {
        return new Response(JSON.stringify({ message: 'ok' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (url.endsWith('/api/v1/auth/login')) {
        return new Response(
          JSON.stringify({
            access_token: 'mock_access',
            refresh_token: 'mock_refresh',
            token_type: 'bearer',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return originalFetch(input as RequestInfo, init);
    };
  });

  await page.goto('/');
  await page.getByLabel('sidebar').waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Mocks network routes and performs login on /login.
 * Ends on '/' with the sidebar visible.
 */
export async function loginViaUI(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'mock_access',
        refresh_token: 'mock_refresh',
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
      body: JSON.stringify({ message: 'ok' }),
    });
  });

  await page.goto('/login');
  await page.getByPlaceholder('Логин').fill('testuser');
  await page.getByPlaceholder('Пароль').fill('password123');
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.getByLabel('sidebar').waitFor({ state: 'visible', timeout: 10000 });
}
