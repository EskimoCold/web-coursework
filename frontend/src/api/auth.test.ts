import { http, HttpResponse } from 'msw';
import { describe, it, expect } from 'vitest';

import { server } from '../test/setup';

import { authApi } from './auth';

describe('authApi', () => {
  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        access_token: 'test_access_token',
        token_type: 'bearer',
      };

      server.use(
        http.post('http://localhost:8000/api/v1/auth/login', async ({ request }) => {
          const body = await request.json();
          if (
            typeof body === 'object' &&
            body &&
            'username' in body &&
            'password' in body &&
            body.username === 'testuser' &&
            body.password === 'password123'
          ) {
            return HttpResponse.json(mockResponse);
          }
          return HttpResponse.json({ detail: 'Login failed' }, { status: 400 });
        }),
      );

      const result = await authApi.login({
        username: 'testuser',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse);
    });

    it('should throw error on failed login', async () => {
      server.use(
        http.post('http://localhost:8000/api/v1/auth/login', () => {
          return HttpResponse.json({ detail: 'Invalid credentials' }, { status: 400 });
        }),
      );

      await expect(authApi.login({ username: 'wrong', password: 'wrong' })).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw generic error when detail is not provided', async () => {
      server.use(
        http.post('http://localhost:8000/api/v1/auth/login', () => {
          return HttpResponse.json({}, { status: 400 });
        }),
      );

      await expect(authApi.login({ username: 'wrong', password: 'wrong' })).rejects.toThrow();
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

      server.use(
        http.post('http://localhost:8000/api/v1/auth/register', () => {
          return HttpResponse.json(mockUser);
        }),
      );

      const result = await authApi.register({
        username: 'newuser',
        password: 'password123',
      });

      expect(result).toEqual(mockUser);
    });

    it('should throw error when registration fails', async () => {
      server.use(
        http.post('http://localhost:8000/api/v1/auth/register', () => {
          return HttpResponse.json({ detail: 'User already exists' }, { status: 400 });
        }),
      );

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

      server.use(
        http.get('http://localhost:8000/api/v1/users/me', ({ request }) => {
          const auth = request.headers.get('authorization');
          if (auth === 'Bearer valid_token') {
            return HttpResponse.json(mockUser);
          }
          return HttpResponse.json({}, { status: 401 });
        }),
      );

      const result = await authApi.getCurrentUser('valid_token');

      expect(result).toEqual(mockUser);
    });

    it('should throw error when token is invalid', async () => {
      server.use(
        http.get('http://localhost:8000/api/v1/users/me', () => {
          return HttpResponse.json({}, { status: 401 });
        }),
      );

      await expect(authApi.getCurrentUser('invalid_token')).rejects.toThrow(
        'Authentication required',
      );
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const mockResponse = {
        access_token: 'new_access_token',
        token_type: 'bearer',
      };

      server.use(
        http.post('http://localhost:8000/api/v1/auth/refresh', () => {
          return HttpResponse.json(mockResponse);
        }),
      );

      const result = await authApi.refreshToken();

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when refresh fails', async () => {
      server.use(
        http.post('http://localhost:8000/api/v1/auth/refresh', () => {
          return HttpResponse.json({}, { status: 401 });
        }),
      );

      await expect(authApi.refreshToken()).rejects.toThrow('Authentication required');
    });
  });

  describe('logout', () => {
    it('should successfully logout', async () => {
      server.use(
        http.post('http://localhost:8000/api/v1/auth/logout', () => {
          return HttpResponse.json({ ok: true });
        }),
      );

      await expect(authApi.logout()).resolves.toBeUndefined();
    });
  });
});
