import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';

import { server } from '../test/setup';

import { api } from './client';
import { tokenStore } from './tokenStore';

describe('api.client', () => {
  beforeEach(() => {
    tokenStore.clearAccessToken();
  });

  it('should add authorization header when token exists in memory', async () => {
    tokenStore.setAccessToken('test-token');

    let authHeader: string | null = null;
    server.use(
      http.get('http://localhost:8000/api/v1/test', ({ request }) => {
        authHeader = request.headers.get('authorization');
        return HttpResponse.json({ data: 'test' });
      }),
    );

    await api.get('/test');

    expect(authHeader).toBe('Bearer test-token');
  });

  it('should not add authorization header when no token in memory', async () => {
    let authHeader: string | null = null;
    server.use(
      http.get('http://localhost:8000/api/v1/test', ({ request }) => {
        authHeader = request.headers.get('authorization');
        return HttpResponse.json({ data: 'test' });
      }),
    );

    await api.get('/test');

    expect(authHeader).toBeNull();
  });

  it('should throw on non-2xx response', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/todos', () => {
        return HttpResponse.text('Server error details', { status: 500 });
      }),
    );

    await expect(api.get('/todos')).rejects.toThrow('HTTP 500');
  });
});
