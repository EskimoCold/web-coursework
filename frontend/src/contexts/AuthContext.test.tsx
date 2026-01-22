import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import * as authApi from '../api/auth';
import { tokenStore } from '../api/tokenStore';

import { AuthProvider, useAuth, resetAuthStore } from './AuthContext';

vi.mock('../api/auth');

const TestComponent = () => {
  const { user, isAuthenticated, isLoading, accessToken, login, register, logout } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="username">{user?.username || 'none'}</div>
      <div data-testid="hasToken">{accessToken ? 'yes' : 'no'}</div>
      <button onClick={() => login({ username: 'test', password: 'pass' })}>Login</button>
      <button onClick={() => register({ username: 'new', password: 'pass' })}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

const AUTH_SESSION_KEY = 'fintrack_has_session';

describe('AuthContext', () => {
  beforeEach(() => {
    tokenStore.clearAccessToken();
    localStorage.removeItem(AUTH_SESSION_KEY);
    vi.clearAllMocks();
    resetAuthStore();
    vi.mocked(authApi.authApi.refreshToken).mockRejectedValue(new Error('No refresh token'));
  });

  it('should skip refresh and show loaded immediately when no session flag', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(authApi.authApi.refreshToken).not.toHaveBeenCalled();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
  });

  it('should start with loading state when session flag exists', async () => {
    localStorage.setItem(AUTH_SESSION_KEY, 'true');

    vi.mocked(authApi.authApi.refreshToken).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                access_token: 'test_token',
                token_type: 'bearer',
              }),
            100,
          ),
        ),
    );

    vi.mocked(authApi.authApi.getCurrentUser).mockResolvedValue({
      id: 1,
      username: 'testuser',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });
  });

  it('should restore session from HttpOnly cookie via refresh', async () => {
    localStorage.setItem(AUTH_SESSION_KEY, 'true');

    const mockUser = {
      id: 1,
      username: 'testuser',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    vi.mocked(authApi.authApi.refreshToken).mockResolvedValue({
      access_token: 'refreshed_token',
      token_type: 'bearer',
    });
    vi.mocked(authApi.authApi.getCurrentUser).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    expect(screen.getByTestId('username')).toHaveTextContent('testuser');
    expect(screen.getByTestId('hasToken')).toHaveTextContent('yes');
  });

  it('should clear token and session flag when refresh fails', async () => {
    localStorage.setItem(AUTH_SESSION_KEY, 'true');
    vi.mocked(authApi.authApi.refreshToken).mockRejectedValue(new Error('Invalid token'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(tokenStore.getAccessToken()).toBeNull();
    expect(localStorage.getItem(AUTH_SESSION_KEY)).toBeNull();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
  });

  it('should login successfully and set session flag', async () => {
    const mockAuthResponse = {
      access_token: 'new_access_token',
      token_type: 'bearer',
    };

    const mockUser = {
      id: 1,
      username: 'test',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    vi.mocked(authApi.authApi.login).mockResolvedValue(mockAuthResponse);
    vi.mocked(authApi.authApi.getCurrentUser).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    // Token stored in memory and session flag set
    expect(tokenStore.getAccessToken()).toBe('new_access_token');
    expect(localStorage.getItem(AUTH_SESSION_KEY)).toBe('true');
    expect(screen.getByTestId('username')).toHaveTextContent('test');
    expect(screen.getByTestId('hasToken')).toHaveTextContent('yes');
  });

  it('should register and auto-login', async () => {
    const mockUser = {
      id: 1,
      username: 'new',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    const mockAuthResponse = {
      access_token: 'access_token',
      token_type: 'bearer',
    };

    vi.mocked(authApi.authApi.register).mockResolvedValue(mockUser);
    vi.mocked(authApi.authApi.login).mockResolvedValue(mockAuthResponse);
    vi.mocked(authApi.authApi.getCurrentUser).mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Register'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    expect(authApi.authApi.register).toHaveBeenCalled();
    expect(authApi.authApi.login).toHaveBeenCalled();
  });

  it('should logout and clear session', async () => {
    localStorage.setItem(AUTH_SESSION_KEY, 'true');

    const mockUser = {
      id: 1,
      username: 'testuser',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    vi.mocked(authApi.authApi.refreshToken).mockResolvedValue({
      access_token: 'token',
      token_type: 'bearer',
    });
    vi.mocked(authApi.authApi.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(authApi.authApi.logout).mockResolvedValue();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    });

    // Token cleared from memory and session flag removed
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(localStorage.getItem(AUTH_SESSION_KEY)).toBeNull();
    expect(screen.getByTestId('hasToken')).toHaveTextContent('no');
  });

  it('should call logout API on logout', async () => {
    localStorage.setItem(AUTH_SESSION_KEY, 'true');

    const mockUser = {
      id: 1,
      username: 'testuser',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    vi.mocked(authApi.authApi.refreshToken).mockResolvedValue({
      access_token: 'token',
      token_type: 'bearer',
    });
    vi.mocked(authApi.authApi.getCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(authApi.authApi.logout).mockResolvedValue();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
    });

    expect(authApi.authApi.logout).toHaveBeenCalled();
  });

  it('should throw error when useAuth is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within AuthProvider');

    consoleError.mockRestore();
  });
});
