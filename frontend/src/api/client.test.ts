import { describe, it, expect, beforeEach, vi } from 'vitest';

import { api } from './client';
import { tokenStore } from './tokenStore';

describe('api.client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    tokenStore.clearAccessToken();
  });

  it('should add authorization header when token exists in memory', async () => {
    tokenStore.setAccessToken('test-token');

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: 'test' }),
    } as Response);

    await api.get('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        credentials: 'include',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('should not add authorization header when no token in memory', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: 'test' }),
    } as Response);

    await api.get('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        credentials: 'include',
        headers: expect.not.objectContaining({
          Authorization: expect.any(String),
        }),
      }),
    );
  });

  it('should throw on non-2xx response', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Server error details',
    } as Response);

    await expect(api.get('/todos')).rejects.toThrow('HTTP 500');
  });
});
