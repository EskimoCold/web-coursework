import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import * as authApi from '../api/auth';

import { AuthProvider, useAuth } from './AuthContext';

vi.mock('../api/auth');

const TestComponent = () => {
  const { user, isAuthenticated, isLoading, login, register, logout } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'yes' : 'no'}</div>
      <div data-testid="username">{user?.username || 'none'}</div>
      <button onClick={() => login({ username: 'test', password: 'pass' })}>Login</button>
      <button onClick={() => register({ username: 'new', password: 'pass' })}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should start with loading state', async () => {
    vi.mocked(authApi.authApi.getCurrentUser).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                id: 1,
                username: 'testuser',
                is_active: true,
                created_at: '2025-01-01T00:00:00Z',
                updated_at: '2025-01-01T00:00:00Z',
              }),
            100,
          ),
        ),
    );

    localStorage.setItem('access_token', 'test_token');

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

  it('should restore session from localStorage', async () => {
    localStorage.setItem('access_token', 'stored_token');

    const mockUser = {
      id: 1,
      username: 'testuser',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

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
  });

  it('should clear tokens when getCurrentUser fails', async () => {
    localStorage.setItem('access_token', 'invalid_token');
    localStorage.setItem('refresh_token', 'invalid_refresh');

    vi.mocked(authApi.authApi.getCurrentUser).mockRejectedValue(new Error('Invalid token'));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    });

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
  });

  it('should login successfully', async () => {
    const mockAuthResponse = {
      access_token: 'new_access_token',
      refresh_token: 'new_refresh_token',
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

    expect(localStorage.getItem('access_token')).toBe('new_access_token');
    expect(localStorage.getItem('refresh_token')).toBe('new_refresh_token');
    expect(screen.getByTestId('username')).toHaveTextContent('test');
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
      refresh_token: 'refresh_token',
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
    localStorage.setItem('access_token', 'token');
    localStorage.setItem('refresh_token', 'refresh');

    const mockUser = {
      id: 1,
      username: 'testuser',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

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

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('should handle logout when refresh token is missing', async () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      is_active: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    localStorage.setItem('access_token', 'token');

    vi.mocked(authApi.authApi.getCurrentUser).mockResolvedValue(mockUser);

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

    expect(authApi.authApi.logout).not.toHaveBeenCalled();
  });

  it('should throw error when useAuth is used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within AuthProvider');

    consoleError.mockRestore();
  });
});
