import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { server } from '../test/setup';

import { tokenStore } from './tokenStore';
import { usersApi } from './users';

vi.mock('./tokenStore', () => ({
  tokenStore: {
    getAccessToken: vi.fn(),
  },
}));

describe('usersApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (tokenStore.getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue('test-token');
  });

  it('should export data', async () => {
    const mockBlob = new Blob(['test data'], { type: 'application/json' });

    server.use(
      http.get('http://localhost:8000/api/v1/users/me/export', () => {
        return new HttpResponse(mockBlob, {
          headers: { 'Content-Type': 'application/json' },
        });
      }),
    );

    const result = await usersApi.exportData();

    expect(result).toBeDefined();
    expect(result).toHaveProperty('size');
    expect(result).toHaveProperty('type', 'application/json');
  });

  it('should throw error when no token for export', async () => {
    (tokenStore.getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue(null);

    await expect(usersApi.exportData()).rejects.toThrow('No authentication token found');
  });

  it('should throw error when export fails', async () => {
    server.use(
      http.get('http://localhost:8000/api/v1/users/me/export', () => {
        return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
      }),
    );

    await expect(usersApi.exportData()).rejects.toThrow('Server error');
  });

  it('should import data', async () => {
    const mockFile = new File(['test'], 'test.json', { type: 'application/json' });
    const mockResponse = {
      message: 'Data imported successfully',
      imported_categories: 5,
      imported_transactions: 10,
    };

    server.use(
      http.post('http://localhost:8000/api/v1/users/me/import', () => {
        return HttpResponse.json(mockResponse);
      }),
    );

    const result = await usersApi.importData(mockFile);

    expect(result).toEqual(mockResponse);
  });

  it('should throw error when no token for import', async () => {
    (tokenStore.getAccessToken as ReturnType<typeof vi.fn>).mockReturnValue(null);
    const mockFile = new File(['test'], 'test.json');

    await expect(usersApi.importData(mockFile)).rejects.toThrow('No authentication token found');
  });

  it('should throw error when import fails', async () => {
    const mockFile = new File(['test'], 'test.json');
    server.use(
      http.post('http://localhost:8000/api/v1/users/me/import', () => {
        return HttpResponse.json({ detail: 'Invalid file format' }, { status: 400 });
      }),
    );

    await expect(usersApi.importData(mockFile)).rejects.toThrow('Invalid file format');
  });
});
