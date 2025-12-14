import { describe, it, expect, beforeEach, vi } from 'vitest';

import { authApi } from './auth';

import type { Mock } from 'vitest';

describe('authApi', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        access_token: 'test_access_token',
        token_type: 'bearer',
      };

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await authApi.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'testuser', password: 'password123' }),
        }),
      );
    });

    it('should throw error on failed login', async () => {
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: false,
        json: async (): Promise<{ detail: string }> => ({ detail: 'Invalid credentials' }),
      });

      await expect(authApi.login({ username: 'wrong', password: 'wrong' })).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw generic error when detail is not provided', async () => {
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: false,
        json: async (): Promise<Record<string, never>> => ({}),
      });

      await expect(authApi.login({ username: 'wrong', password: 'wrong' })).rejects.toThrow(
        'Login failed',
      );
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 1,
        username: 'newuser',
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async (): Promise<typeof mockUser> => mockUser,
      });

      const result = await authApi.register({
        username: 'newuser',
        password: 'password123',
      });

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should throw error when registration fails', async () => {
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'User already exists' }),
      });

      await expect(
        authApi.register({ username: 'existing', password: 'password123' }),
      ).rejects.toThrow('User already exists');
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user with valid token', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        is_active: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });

      const result = await authApi.getCurrentUser('valid_token');

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/me'),
        expect.objectContaining({
          headers: { Authorization: 'Bearer valid_token' },
        }),
      );
    });

    it('should throw error when token is invalid', async () => {
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(authApi.getCurrentUser('invalid_token')).rejects.toThrow('Failed to get user');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const mockResponse = {
        access_token: 'new_access_token',
        token_type: 'bearer',
      };

      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
        json: async (): Promise<typeof mockResponse> => mockResponse,
      });

      const result = await authApi.refreshToken();

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );
    });

    it('should throw error when refresh fails', async () => {
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: false,
      });

      await expect(authApi.refreshToken()).rejects.toThrow('Token refresh failed');
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      (global.fetch as unknown as Mock).mockResolvedValueOnce({
        ok: true,
      });

      await expect(authApi.logout()).resolves.toBeUndefined();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );
    });
  });
});
