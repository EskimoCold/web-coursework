import { describe, it, expect, beforeEach, vi } from 'vitest';

import { api } from './client';

describe('api.client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
    localStorage.clear();
  });

  it('should add authorization header when token exists', async () => {
    localStorage.setItem('access_token', 'test-token');

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: 'test' }),
    } as Response);

    await api.get('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });

  it('should not add authorization header when no token', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: 'test' }),
    } as Response);

    await api.get('/test');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
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

    await expect(api.get('/todos')).rejects.toThrow('HTTP 500: Server error details');
  });

  it('should handle POST requests with data', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 1, name: 'test' }),
    } as Response);

    const testData = { name: 'test', value: 123 };
    await api.post('/test', testData);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(testData),
      }),
    );
  });

  it('should handle PUT requests with data', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, name: 'updated' }),
    } as Response);

    const updateData = { name: 'updated', value: 456 };
    await api.put('/test/1', updateData);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test/1'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updateData),
      }),
    );
  });

  it('should handle DELETE requests', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 204,
    } as Response);

    await api.delete('/test/1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test/1'),
      expect.objectContaining({
        method: 'DELETE',
      }),
    );
  });

  it('should handle PATCH requests with data', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: 1, name: 'patched' }),
    } as Response);

    const patchData = { name: 'patched' };
    await api.patch('/test/1', patchData);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test/1'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify(patchData),
      }),
    );
  });

  it('should handle network errors', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

    await expect(api.get('/test')).rejects.toThrow('Network error');
  });

  it('should handle 404 responses', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      text: async () => 'Resource not found',
    } as Response);

    await expect(api.get('/nonexistent')).rejects.toThrow('HTTP 404: Resource not found');
  });

  it('should handle 401 unauthorized responses', async () => {
    localStorage.setItem('access_token', 'expired-token');

    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Invalid token',
    } as Response);

    await expect(api.get('/protected')).rejects.toThrow('Authentication required');
  });

  it('should handle empty response body on 204 No Content', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 204,
    } as Response);

    const result = await api.delete('/test/1');
    expect(result).toBeUndefined();
  });

  it('should handle different response types', async () => {
    const mockData = { id: 1, items: ['a', 'b', 'c'] };
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData,
    } as Response);

    const result = await api.get('/test');
    expect(result).toEqual(mockData);
  });

  it('should include custom headers when provided', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: 'test' }),
    } as Response);

    await api.get('/test', {
      headers: {
        'X-Custom-Header': 'custom-value',
      },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Custom-Header': 'custom-value',
        }),
      }),
    );
  });

  it('should override content-type when specified', async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: 'test' }),
    } as Response);

    await api.post(
      '/test',
      { data: 'test' },
      {
        headers: {
          'Content-Type': 'application/xml',
        },
      },
    );

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/xml',
        }),
      }),
    );
  });
});
